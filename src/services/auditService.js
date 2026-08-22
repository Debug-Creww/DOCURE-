// src/services/auditService.js
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

const AUDIT_COLLECTION = 'audit_logs';

// In-memory fallback log storage in case Firestore is connecting or in demo mode
let localAuditLogs = [];
const localSubscribers = new Set();

const notifyLocalSubscribers = () => {
  localSubscribers.forEach(cb => {
    try {
      cb([...localAuditLogs]);
    } catch (e) {
      console.error('Error notifying local audit subscriber:', e);
    }
  });
};

/**
 * Writes an audit record to the `audit_logs` collection.
 * 
 * @param {string} userId - The authenticated user's ID
 * @param {string} action - The action performed (e.g., 'CREATE_REMINDER', 'DELETE_REMINDER', 'PAUSE_REMINDER', 'RESUME_REMINDER', 'VIEW_REMINDERS')
 * @param {object} details - Additional metadata or payload description
 * @returns {Promise<string|null>} The created audit document ID or null
 */
export const logAudit = async (userId, action, details = {}) => {
  if (!userId) {
    userId = 'anonymous_user';
  }

  const logEntry = {
    userId,
    action,
    details: typeof details === 'object' ? details : { message: String(details) },
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server/Unknown',
    timestamp: serverTimestamp()
  };

  // Add to local fallback list for immediate UI reactivity
  const localEntry = {
    ...logEntry,
    id: `local_audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    localTimestamp: new Date().toISOString()
  };
  localAuditLogs.unshift(localEntry);
  if (localAuditLogs.length > 50) localAuditLogs.pop();
  notifyLocalSubscribers();

  try {
    const docRef = await addDoc(collection(db, AUDIT_COLLECTION), logEntry);
    return docRef.id;
  } catch (error) {
    console.warn(`[AuditService] Firestore write note (operating with local buffer):`, error.message);
    return localEntry.id;
  }
};

/**
 * Subscribes to real-time updates of the user's audit logs.
 * 
 * @param {string} userId - The authenticated user's ID
 * @param {Function} callback - Callback receiving the array of audit log objects
 * @returns {Function} Unsubscribe function
 */
export const subscribeAuditLogs = (userId, callback) => {
  if (!userId) {
    callback(localAuditLogs);
    return () => {};
  }

  let unsubscribeFirestore = null;

  try {
    const q = query(
      collection(db, AUDIT_COLLECTION),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const logs = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          logs.push({
            id: doc.id,
            ...data,
            // Format timestamp nicely if available
            dateFormatted: data.timestamp?.toDate 
              ? data.timestamp.toDate().toLocaleString() 
              : new Date().toLocaleString()
          });
        });
        
        // Merge with any uncommitted local logs
        if (logs.length > 0) {
          callback(logs);
        } else {
          callback(localAuditLogs.filter(l => l.userId === userId));
        }
      },
      (error) => {
        console.warn('[AuditService] Using local fallback subscriber:', error.message);
        localSubscribers.add(callback);
        callback(localAuditLogs.filter(l => l.userId === userId));
      }
    );
  } catch (err) {
    console.warn('[AuditService] Failed to establish onSnapshot query, using local buffer:', err.message);
    localSubscribers.add(callback);
    callback(localAuditLogs.filter(l => l.userId === userId));
  }

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
    localSubscribers.delete(callback);
  };
};
