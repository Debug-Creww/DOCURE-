// src/services/notificationScheduler.js

/**
 * Background notification scheduler for Docure Medicine Reminders.
 * Runs on a ~20-second interval, checks active reminders against the current day and time,
 * deduplicates triggers per minute, and dispatches Browser Notifications or fallback in-app toasts.
 */

// In-memory set for deduplicating notifications per minute
// Key format: `${reminderId}_${dayName}_${HH:MM}_${minuteKey}`
const triggeredDedupeSet = new Set();

let intervalId = null;
let currentActiveReminders = [];
const toastSubscribers = new Set();

// Day mapping from JS Date.getDay() (0 = Sun, 1 = Mon, ..., 6 = Sat)
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Plays a gentle clinical chime sound when a reminder fires
 */
const playReminderSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    
    // First chime note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Second higher pleasant chime note
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.15); // A5
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.65);
  } catch (e) {
    // AudioContext may be blocked before first user gesture
    console.debug('[NotificationScheduler] Audio chime note:', e.message);
  }
};

/**
 * Normalizes time string to standard "HH:MM" (24-hour format)
 * Handles both "14:30" and "02:30 PM" / "2:30 PM" formats.
 */
export const normalizeTime = (timeStr) => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  
  // Check if formatted with AM/PM
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return trimmed;

  let [_, hours, minutes, modifier] = match;
  let h = parseInt(hours, 10);
  const m = minutes.padStart(2, '0');

  if (modifier) {
    const isPM = modifier.toUpperCase() === 'PM';
    if (isPM && h < 12) h += 12;
    if (!isPM && h === 12) h = 0;
  }

  return `${h.toString().padStart(2, '0')}:${m}`;
};

/**
 * Checks if a given reminder matches today's day of week
 */
const matchesDay = (daysOfWeek, dayIndex) => {
  if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) return true;
  
  const shortName = DAY_NAMES[dayIndex];
  const fullName = FULL_DAY_NAMES[dayIndex];

  return daysOfWeek.some(day => 
    day === shortName || 
    day === fullName || 
    day.toLowerCase() === shortName.toLowerCase() ||
    day.toLowerCase() === fullName.toLowerCase()
  );
};

/**
 * Dispatches notification to browser or in-app toast subscribers
 */
const triggerAlert = (reminder, triggerTime) => {
  playReminderSound();

  const title = `💊 Docure Reminder: ${reminder.medicineName}`;
  const bodyText = `Time to take ${reminder.medicineName} (${reminder.dosage})\nScheduled for ${triggerTime}${reminder.notes ? ` • Note: ${reminder.notes}` : ''}`;

  let browserNotifFired = false;

  // 1. Try Browser Notification API
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body: bodyText,
        icon: '/assets/logo_original.png',
        badge: '/assets/logo_original.png',
        tag: `med_${reminder.id}_${triggerTime}`,
        renotify: true,
        requireInteraction: false
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      browserNotifFired = true;
    } catch (err) {
      console.warn('[NotificationScheduler] Browser notification failed:', err);
    }
  }

  // 2. Always notify in-app toast subscribers (fallback or live companion)
  const toastPayload = {
    id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    reminderId: reminder.id,
    medicineName: reminder.medicineName,
    dosage: reminder.dosage,
    time: triggerTime,
    notes: reminder.notes,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    browserNotifFired
  };

  toastSubscribers.forEach(callback => {
    try {
      callback(toastPayload);
    } catch (e) {
      console.error('[NotificationScheduler] Error notifying toast subscriber:', e);
    }
  });
};

/**
 * Main background check algorithm running every ~20s
 */
const performScheduleCheck = () => {
  const now = new Date();
  const currentDayIndex = now.getDay();
  const currentHours = now.getHours().toString().padStart(2, '0');
  const currentMinutes = now.getMinutes().toString().padStart(2, '0');
  const currentHHMM = `${currentHours}:${currentMinutes}`;
  const minuteKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${currentHHMM}`;

  // Purge old keys in dedupe cache older than 10 minutes to prevent memory leaks
  if (triggeredDedupeSet.size > 200) {
    triggeredDedupeSet.clear();
  }

  currentActiveReminders.forEach((reminder) => {
    // Only check active reminders
    if (reminder.status === 'paused') return;

    // Check day matching
    if (!matchesDay(reminder.daysOfWeek, currentDayIndex)) return;

    // Check dose times matching
    const doseTimes = Array.isArray(reminder.doseTimes) ? reminder.doseTimes : [];
    
    doseTimes.forEach((doseTime) => {
      const normalizedDose = normalizeTime(doseTime);
      if (normalizedDose === currentHHMM) {
        const dedupeKey = `${reminder.id}_${DAY_NAMES[currentDayIndex]}_${currentHHMM}_${minuteKey}`;
        
        if (!triggeredDedupeSet.has(dedupeKey)) {
          triggeredDedupeSet.add(dedupeKey);
          triggerAlert(reminder, doseTime);
        }
      }
    });
  });
};

/**
 * Initializes the background reminder checker (runs every 20 seconds)
 * 
 * @param {Array} initialReminders - Array of reminder objects
 * @returns {Function} Teardown function to clear the interval
 */
export const startNotificationScheduler = (initialReminders = []) => {
  currentActiveReminders = initialReminders;

  if (!intervalId) {
    // Run an initial immediate check
    performScheduleCheck();
    
    // Set 20-second interval check (~20s as requested)
    intervalId = setInterval(performScheduleCheck, 20000);
  }

  return () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
};

/**
 * Updates the active reminders list tracked by the background scheduler
 * 
 * @param {Array} reminders - New array of reminders
 */
export const updateScheduledReminders = (reminders = []) => {
  currentActiveReminders = Array.isArray(reminders) ? reminders : [];
};

/**
 * Subscribes to in-app toast alerts
 * 
 * @param {Function} callback - Callback function receiving toast alert objects
 * @returns {Function} Unsubscribe function
 */
export const subscribeToToasts = (callback) => {
  toastSubscribers.add(callback);
  return () => {
    toastSubscribers.delete(callback);
  };
};

/**
 * Requests browser notification permission from the user
 * 
 * @returns {Promise<'granted'|'denied'|'default'>}
 */
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (e) {
    console.warn('[NotificationScheduler] Permission request error:', e);
    return Notification.permission;
  }
};

/**
 * Triggers a manual test alert for an immediate verification check
 * 
 * @param {object} reminder - Test reminder object
 */
export const triggerTestNotification = (reminder) => {
  const sample = reminder || {
    id: 'test_sample',
    medicineName: 'Amoxicillin (Demo Test)',
    dosage: '500mg - 1 capsule',
    notes: 'Take with full glass of water after meal',
  };
  const testTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  triggerAlert(sample, testTime);
};
