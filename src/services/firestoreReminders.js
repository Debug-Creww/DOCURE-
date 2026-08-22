// src/services/firestoreReminders.js
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { logAudit } from './auditService';
import { createRecurringDoseEvents, deleteRecurringEvents } from './googleCalendar';

const REMINDERS_COLLECTION = 'reminders';

// In-memory runtime state for offline/fallback mode (no localStorage)
let memoryReminders = [];
const memorySubscribers = new Set();

const notifyMemorySubscribers = (userId) => {
  const filtered = memoryReminders.filter(r => r.userId === userId);
  memorySubscribers.forEach(cb => {
    try { cb(filtered); } catch (e) { console.error(e); }
  });
};

/**
 * Subscribes in real-time to active reminders for the given userId from Firestore.
 * 
 * @param {string} userId - User identifier
 * @param {Function} onUpdate - Callback invoked with the updated list of reminders
 * @param {Function} onError - Optional error handler
 * @returns {Function} Unsubscribe function
 */
export const subscribeReminders = (userId, onUpdate, onError) => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  let unsubscribeFirestore = null;

  try {
    const q = query(
      collection(db, REMINDERS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const reminders = [];
        snapshot.forEach((docSnap) => {
          reminders.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });
        
        // Synchronize in-memory fallback list
        memoryReminders = reminders;
        onUpdate(reminders);
      },
      (error) => {
        console.warn('[FirestoreReminders] Query warning, fallback to live memory pool:', error.message);
        memorySubscribers.add(onUpdate);
        onUpdate(memoryReminders.filter(r => r.userId === userId));
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('[FirestoreReminders] Firestore connection warning, using memory state:', err.message);
    memorySubscribers.add(onUpdate);
    onUpdate(memoryReminders.filter(r => r.userId === userId));
    if (onError) onError(err);
  }

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
    memorySubscribers.delete(onUpdate);
  };
};

/**
 * Adds a new medicine reminder to Firestore, creates Google Calendar recurring events
 * if requested, and logs an audit record.
 * 
 * @param {string} userId - Authenticated user's ID
 * @param {object} reminderData - Reminder details
 * @returns {Promise<object>} Created reminder object with ID
 */
export const addReminder = async (userId, reminderData) => {
  const {
    medicineName,
    dosage,
    daysOfWeek = [],
    doseTimes = [],
    syncGoogleCalendar = false,
    notes = ''
  } = reminderData;

  if (!medicineName || !dosage) {
    throw new Error('Medicine name and dosage are required.');
  }

  let calendarEventIds = [];
  if (syncGoogleCalendar) {
    try {
      calendarEventIds = await createRecurringDoseEvents({
        medicineName,
        dosage,
        daysOfWeek,
        doseTimes,
        notes
      });
    } catch (gcalErr) {
      console.warn('[FirestoreReminders] Google Calendar sync warning:', gcalErr);
    }
  }

  const newDoc = {
    userId,
    medicineName: medicineName.trim(),
    dosage: dosage.trim(),
    daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : [],
    doseTimes: Array.isArray(doseTimes) ? doseTimes : [],
    syncGoogleCalendar: Boolean(syncGoogleCalendar),
    calendarEventIds: calendarEventIds,
    status: 'active', // 'active' | 'paused'
    notes: notes.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  let reminderId;
  try {
    const docRef = await addDoc(collection(db, REMINDERS_COLLECTION), newDoc);
    reminderId = docRef.id;
  } catch (err) {
    console.warn('[FirestoreReminders] Firestore add fallback to memory:', err.message);
    reminderId = `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    memoryReminders.unshift({
      id: reminderId,
      ...newDoc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    notifyMemorySubscribers(userId);
  }

  // Audit Logging
  await logAudit(userId, 'CREATE_REMINDER', {
    reminderId,
    medicineName,
    dosage,
    daysCount: daysOfWeek.length,
    timesCount: doseTimes.length,
    syncGoogleCalendar,
    calendarEventsCount: calendarEventIds.length
  });

  return { id: reminderId, ...newDoc };
};

/**
 * Updates a reminder's status ('active' or 'paused') and logs the audit event.
 * 
 * @param {string} reminderId - The Firestore document ID
 * @param {'active'|'paused'} status - New status
 * @param {string} userId - The user ID
 * @param {object} reminderMeta - Additional reminder metadata for audit logging
 */
export const updateReminderStatus = async (reminderId, status, userId, reminderMeta = {}) => {
  const isPaused = status === 'paused';
  const actionName = isPaused ? 'PAUSE_REMINDER' : 'RESUME_REMINDER';

  try {
    const docRef = doc(db, REMINDERS_COLLECTION, reminderId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('[FirestoreReminders] Update in memory fallback:', err.message);
    const item = memoryReminders.find(r => r.id === reminderId);
    if (item) {
      item.status = status;
      item.updatedAt = new Date().toISOString();
      notifyMemorySubscribers(userId);
    }
  }

  // Audit Logging
  await logAudit(userId, actionName, {
    reminderId,
    newStatus: status,
    medicineName: reminderMeta.medicineName || 'Unknown',
    dosage: reminderMeta.dosage || ''
  });
};

/**
 * Deletes a reminder from Firestore, removes associated Google Calendar events,
 * and logs the audit trail.
 * 
 * @param {string} reminderId - Document ID to delete
 * @param {string} userId - The user ID
 * @param {object} reminder - Full reminder data for cleanup and audit logging
 */
export const deleteReminder = async (reminderId, userId, reminder = {}) => {
  // 1. Delete associated Google Calendar recurring events if any exist
  if (reminder.calendarEventIds && reminder.calendarEventIds.length > 0) {
    try {
      await deleteRecurringEvents(reminder.calendarEventIds);
    } catch (gcalErr) {
      console.warn('[FirestoreReminders] Calendar deletion cleanup warning:', gcalErr);
    }
  }

  // 2. Delete Firestore document
  try {
    const docRef = doc(db, REMINDERS_COLLECTION, reminderId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[FirestoreReminders] Delete from memory fallback:', err.message);
    memoryReminders = memoryReminders.filter(r => r.id !== reminderId);
    notifyMemorySubscribers(userId);
  }

  // 3. Audit Logging
  await logAudit(userId, 'DELETE_REMINDER', {
    reminderId,
    medicineName: reminder.medicineName || 'Unknown',
    dosage: reminder.dosage || '',
    deletedCalendarEvents: reminder.calendarEventIds?.length || 0
  });
};

/**
 * Logs a view event when the user opens or views the Medicine Reminders dashboard.
 * 
 * @param {string} userId - The user ID
 * @param {number} totalReminders - Total active reminders count
 */
export const logReminderView = async (userId, totalReminders = 0) => {
  await logAudit(userId, 'VIEW_REMINDERS', {
    totalReminders,
    viewedAt: new Date().toISOString()
  });
};
