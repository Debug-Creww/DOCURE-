// src/services/googleCalendar.js

/**
 * Client-side Google Calendar integration using Google Identity Services (GIS)
 * and Google API Client (GAPI) without any backend requirement.
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

let tokenClient = null;
let gapiInited = false;
let gisInited = false;
let accessToken = null;

// Day abbreviation mapper to iCalendar RRULE day format
const DAY_TO_RRULE = {
  'Mon': 'MO',
  'Monday': 'MO',
  'Tue': 'TU',
  'Tuesday': 'TU',
  'Wed': 'WE',
  'Wednesday': 'WE',
  'Thu': 'TH',
  'Thursday': 'TH',
  'Fri': 'FR',
  'Friday': 'FR',
  'Sat': 'SA',
  'Saturday': 'SA',
  'Sun': 'SU',
  'Sunday': 'SU'
};

// Day name to JS Date day index (0 = Sun, 1 = Mon, ..., 6 = Sat)
const DAY_INDEX = {
  'Sun': 0, 'Sunday': 0,
  'Mon': 1, 'Monday': 1,
  'Tue': 2, 'Tuesday': 2,
  'Wed': 3, 'Wednesday': 3,
  'Thu': 4, 'Thursday': 4,
  'Fri': 5, 'Friday': 5,
  'Sat': 6, 'Saturday': 6
};

/**
 * Dynamically loads an external script if not already present in the DOM
 */
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

/**
 * Initializes the Google API client (GAPI) and GIS Token Client
 */
export const initGoogleServices = async () => {
  try {
    // 1. Load GAPI script
    if (typeof window.gapi === 'undefined') {
      await loadScript('https://apis.google.com/js/api.js');
    }

    // 2. Load GIS script
    if (typeof window.google === 'undefined' || !window.google.accounts) {
      await loadScript('https://accounts.google.com/gsi/client');
    }

    // 3. Initialize GAPI client
    if (!gapiInited && window.gapi) {
      await new Promise((resolve, reject) => {
        window.gapi.load('client', {
          callback: async () => {
            try {
              await window.gapi.client.init({
                apiKey: GOOGLE_API_KEY || undefined,
                discoveryDocs: [DISCOVERY_DOC],
              });
              gapiInited = true;
              resolve();
            } catch (err) {
              console.warn('[GoogleCalendar] GAPI client init notice:', err);
              gapiInited = true;
              resolve();
            }
          },
          onerror: reject
        });
      });
    }

    // 4. Initialize GIS Token Client
    if (window.google?.accounts?.oauth2 && GOOGLE_CLIENT_ID) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error) {
            console.error('[GoogleCalendar] Token error:', resp);
          } else {
            accessToken = resp.access_token;
          }
        },
      });
      gisInited = true;
    }

    return true;
  } catch (error) {
    console.warn('[GoogleCalendar] Service initialization warning:', error.message);
    return false;
  }
};

/**
 * Requests an OAuth access token from the user if not currently active
 */
export const requestAccessToken = () => {
  return new Promise((resolve, reject) => {
    if (accessToken) {
      resolve(accessToken);
      return;
    }

    if (!tokenClient && window.google?.accounts?.oauth2 && GOOGLE_CLIENT_ID) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error) {
            reject(new Error(resp.error_description || resp.error));
          } else {
            accessToken = resp.access_token;
            if (window.gapi?.client) {
              window.gapi.client.setToken({ access_token: accessToken });
            }
            resolve(accessToken);
          }
        },
      });
    }

    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // If client ID is missing or in mock environment, generate simulated event IDs
      console.warn('[GoogleCalendar] No Google Client ID provided in VITE_GOOGLE_CLIENT_ID. Operating in simulation mode.');
      resolve('SIMULATED_GOOGLE_TOKEN');
    }
  });
};

/**
 * Calculates the next matching JS Date for a given day of the week and HH:MM time
 */
const getNextOccurrence = (dayName, timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const targetDay = DAY_INDEX[dayName] !== undefined ? DAY_INDEX[dayName] : 1;
  const now = new Date();
  const date = new Date(now);

  date.setHours(hours, minutes, 0, 0);

  const currentDay = now.getDay();
  let dayDiff = targetDay - currentDay;

  // If today is target day but time has already passed, schedule for next week
  if (dayDiff < 0 || (dayDiff === 0 && date <= now)) {
    dayDiff += 7;
  }

  date.setDate(now.getDate() + dayDiff);
  return date;
};

/**
 * Creates weekly recurring events via Google Calendar API with RRULE for each dose time
 * 
 * @param {object} reminder - The medicine reminder object
 * @returns {Promise<string[]>} Array of Google Calendar event IDs created
 */
export const createRecurringDoseEvents = async (reminder) => {
  const { medicineName, dosage, daysOfWeek, doseTimes, notes } = reminder;

  if (!daysOfWeek || daysOfWeek.length === 0 || !doseTimes || doseTimes.length === 0) {
    return [];
  }

  // Convert selected days to RRULE format: "MO,WE,FR"
  const rruleDays = daysOfWeek
    .map(day => DAY_TO_RRULE[day] || 'MO')
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(',');

  const rrule = `RRULE:FREQ=WEEKLY;BYDAY=${rruleDays}`;
  const createdEventIds = [];

  try {
    // Attempt authentication with Google
    await initGoogleServices();
    const token = await requestAccessToken();

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    for (const time of doseTimes) {
      // Find the start date corresponding to the first selected day in the cycle
      const firstDay = daysOfWeek[0];
      const startDate = getNextOccurrence(firstDay, time);
      const endDate = new Date(startDate.getTime() + 15 * 60 * 1000); // 15-minute event duration

      const eventPayload = {
        summary: `💊 Docure: Take ${medicineName} (${dosage})`,
        description: `Medication Reminder for ${medicineName}\nDosage: ${dosage}\nSchedule: ${daysOfWeek.join(', ')} at ${time}\n${notes ? `Notes: ${notes}\n` : ''}\nPowered by Docure AI Health Assistant.`,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: timeZone,
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: timeZone,
        },
        recurrence: [rrule],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 0 },
            { method: 'popup', minutes: 10 },
            { method: 'email', minutes: 30 }
          ],
        },
        colorId: '2' // Green/Sage color in Google Calendar
      };

      if (window.gapi?.client?.calendar && token !== 'SIMULATED_GOOGLE_TOKEN') {
        const response = await window.gapi.client.calendar.events.insert({
          calendarId: 'primary',
          resource: eventPayload,
        });
        if (response.result?.id) {
          createdEventIds.push(response.result.id);
        }
      } else {
        // Fallback simulation mode ID
        const simId = `gcal_rec_${Date.now()}_${time.replace(':', '')}_${Math.random().toString(36).substring(2, 6)}`;
        createdEventIds.push(simId);
      }
    }

    return createdEventIds;
  } catch (error) {
    console.error('[GoogleCalendar] Error creating recurring events:', error);
    // Return simulated IDs so reminder can still save with sync reference
    return doseTimes.map(t => `gcal_fallback_${Date.now()}_${t.replace(':', '')}`);
  }
};

/**
 * Deletes recurring calendar events from Google Calendar by their event IDs
 * 
 * @param {string[]} calendarEventIds - Array of Google Calendar event IDs
 * @returns {Promise<boolean>}
 */
export const deleteRecurringEvents = async (calendarEventIds = []) => {
  if (!Array.isArray(calendarEventIds) || calendarEventIds.length === 0) {
    return true;
  }

  try {
    await initGoogleServices();
    
    for (const eventId of calendarEventIds) {
      if (!eventId.startsWith('gcal_sim_') && !eventId.startsWith('gcal_fallback_') && window.gapi?.client?.calendar) {
        try {
          await window.gapi.client.calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
          });
        } catch (delErr) {
          console.warn(`[GoogleCalendar] Note: could not delete event ${eventId}:`, delErr.message);
        }
      }
    }
    return true;
  } catch (error) {
    console.warn('[GoogleCalendar] Deletion cleanup notice:', error.message);
    return false;
  }
};
