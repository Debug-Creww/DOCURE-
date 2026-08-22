// src/services/healthAnalyticsService.js
import { logAudit } from './auditService';

const STORAGE_KEY = 'docure_health_analytics_v2';
const subscribers = new Set();

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to format date YYYY-MM-DD
export const formatDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate default 7-day initial dataset
const generateInitialWeekData = () => {
  const data = {};
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = formatDateKey(d);
    const dayName = DAYS_SHORT[d.getDay()];
    const isToday = i === 0;

    // Realistic baseline historical adherence
    const sampleDoses = [
      {
        id: `dose_1_${key}`,
        medicineName: 'Metformin Hydrochloride',
        dosage: '500mg',
        time: '08:00 AM',
        status: i === 0 ? 'taken' : (i === 2 ? 'missed' : 'taken'),
        takenAt: i === 2 ? null : '08:05 AM',
        onTime: true
      },
      {
        id: `dose_2_${key}`,
        medicineName: 'Vitamin D3 & Calcium',
        dosage: '1000 IU',
        time: '01:00 PM',
        status: i === 0 ? 'pending' : (i === 4 ? 'taken' : 'taken'),
        takenAt: i === 0 ? null : '01:10 PM',
        onTime: true
      },
      {
        id: `dose_3_${key}`,
        medicineName: 'Omega-3 Fish Oil',
        dosage: '1000mg',
        time: '08:00 PM',
        status: i === 0 ? 'pending' : 'taken',
        takenAt: i === 0 ? null : '08:15 PM',
        onTime: true
      }
    ];

    const takenCount = sampleDoses.filter(s => s.status === 'taken').length;
    const adherence = Math.round((takenCount / sampleDoses.length) * 100);

    // Realistic day-wise clinical biomarkers
    const sugarOffsets = [95, 102, 98, 105, 94, 99, 98];
    const rbcOffsets = [4.7, 4.8, 4.85, 4.75, 4.9, 4.82, 4.85];
    const hbOffsets = [13.6, 13.7, 13.8, 13.5, 13.9, 13.8, 13.8];
    const bpOffsets = ['118/78', '120/80', '122/82', '120/80', '119/79', '121/80', '120/80'];
    const weightOffsets = [64.8, 64.7, 64.6, 64.6, 64.5, 64.5, 64.5];

    const sugarVal = sugarOffsets[i % 7];
    const rbcVal = rbcOffsets[i % 7];
    const hbVal = hbOffsets[i % 7];
    const bpVal = bpOffsets[i % 7];
    const weightVal = weightOffsets[i % 7];

    // Calculate composite health score
    const healthScore = Math.min(100, Math.round(
      (adherence * 0.4) + 
      (sugarVal <= 105 && sugarVal >= 70 ? 25 : 15) + 
      (hbVal >= 12.5 && hbVal <= 16.0 ? 20 : 10) + 
      (rbcVal >= 4.5 && rbcVal <= 5.5 ? 15 : 10)
    ));

    data[key] = {
      dateKey: key,
      dayShort: dayName,
      dayFull: DAYS_FULL[d.getDay()],
      dateNumber: d.getDate(),
      monthShort: d.toLocaleString('default', { month: 'short' }),
      isToday,
      sugarLevel: sugarVal,
      sugarTarget: '70 - 110 mg/dL',
      rbcLevel: rbcVal,
      rbcTarget: '4.2 - 5.4 M/µL',
      haemoglobin: hbVal,
      haemoglobinTarget: '12.0 - 16.0 g/dL',
      bloodPressure: bpVal,
      bpTarget: '< 120/80 mmHg',
      weight: weightVal,
      weightTarget: '64.0 kg',
      pulse: 70 + (i % 5),
      healthScore,
      doses: sampleDoses
    };
  }

  return data;
};

// Load saved data or initialize
export const loadAnalyticsData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const todayKey = formatDateKey(new Date());
      if (!parsed[todayKey] || parsed[todayKey].sugarLevel === undefined) {
        const initial = generateInitialWeekData();
        return { ...initial, ...parsed };
      }
      return parsed;
    }
  } catch (e) {
    console.warn('[HealthAnalytics] Failed to parse stored analytics:', e);
  }
  const initial = generateInitialWeekData();
  saveAnalyticsData(initial);
  return initial;
};

// Save data to localStorage and notify subscribers
export const saveAnalyticsData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[HealthAnalytics] Storage error:', e);
  }
  notifySubscribers(data);
};

const notifySubscribers = (data) => {
  subscribers.forEach(cb => {
    try {
      cb(data);
    } catch (err) {
      console.error('[HealthAnalytics] Subscriber notification error:', err);
    }
  });
};

export const subscribeAnalytics = (callback) => {
  subscribers.add(callback);
  callback(loadAnalyticsData());
  return () => subscribers.delete(callback);
};

/**
 * Marks a dose as approved/taken on time for a specific date and dose item
 */
export const approveDoseOnTime = (dateKey, doseId, userId = 'user_active') => {
  const data = loadAnalyticsData();
  const targetDay = data[dateKey];
  if (!targetDay) return;

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const updatedDoses = targetDay.doses.map(dose => {
    if (dose.id === doseId || dose.time === doseId) {
      return {
        ...dose,
        status: 'taken',
        takenAt: nowTime,
        onTime: true
      };
    }
    return dose;
  });

  const takenCount = updatedDoses.filter(d => d.status === 'taken').length;
  const newAdherence = Math.round((takenCount / updatedDoses.length) * 100);
  const newHealthScore = Math.min(100, Math.round(
    (newAdherence * 0.4) + 
    (targetDay.sugarLevel <= 105 && targetDay.sugarLevel >= 70 ? 25 : 15) + 
    (targetDay.haemoglobin >= 12.5 && targetDay.haemoglobin <= 16.0 ? 20 : 10) + 
    (targetDay.rbcLevel >= 4.5 && targetDay.rbcLevel <= 5.5 ? 15 : 10)
  ));

  data[dateKey] = {
    ...targetDay,
    doses: updatedDoses,
    healthScore: newHealthScore
  };

  saveAnalyticsData(data);
  logAudit(userId, 'DOSE_TAKEN_ON_TIME', { dateKey, doseId, time: nowTime });
};

/**
 * Records a dose taken from Alarm / Notification popup directly
 */
export const recordNotificationDoseTaken = (medicineName, doseTime, userId = 'user_active') => {
  const todayKey = formatDateKey(new Date());
  const data = loadAnalyticsData();
  const targetDay = data[todayKey] || generateInitialWeekData()[todayKey];
  if (!targetDay) return;

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let matched = false;
  const updatedDoses = targetDay.doses.map(dose => {
    if (dose.medicineName.toLowerCase() === (medicineName || '').toLowerCase() || dose.time === doseTime) {
      matched = true;
      return {
        ...dose,
        status: 'taken',
        takenAt: nowTime,
        onTime: true
      };
    }
    return dose;
  });

  if (!matched) {
    updatedDoses.push({
      id: `dose_notif_${Date.now()}`,
      medicineName: medicineName || 'Prescription Pill',
      dosage: 'Standard dose',
      time: doseTime || nowTime,
      status: 'taken',
      takenAt: nowTime,
      onTime: true
    });
  }

  const takenCount = updatedDoses.filter(d => d.status === 'taken').length;
  const newAdherence = Math.round((takenCount / updatedDoses.length) * 100);
  const newHealthScore = Math.min(100, Math.round(
    (newAdherence * 0.4) + 
    (targetDay.sugarLevel <= 105 && targetDay.sugarLevel >= 70 ? 25 : 15) + 
    (targetDay.haemoglobin >= 12.5 && targetDay.haemoglobin <= 16.0 ? 20 : 10) + 
    (targetDay.rbcLevel >= 4.5 && targetDay.rbcLevel <= 5.5 ? 15 : 10)
  ));

  data[todayKey] = {
    ...targetDay,
    doses: updatedDoses,
    healthScore: newHealthScore
  };

  saveAnalyticsData(data);
  logAudit(userId, 'ALARM_DOSE_CONFIRMED', { medicineName, doseTime, takenAt: nowTime });
};

/**
 * Updates medical biomarkers (Sugar, RBC, Haemoglobin, BP, Weight) for a given date
 */
export const updateDailyVitals = (dateKey, { sugarLevel, rbcLevel, haemoglobin, bloodPressure, weight }) => {
  const data = loadAnalyticsData();
  const targetDay = data[dateKey];
  if (!targetDay) return;

  const updatedSugar = sugarLevel !== undefined ? Number(sugarLevel) : targetDay.sugarLevel;
  const updatedRbc = rbcLevel !== undefined ? Number(rbcLevel) : targetDay.rbcLevel;
  const updatedHb = haemoglobin !== undefined ? Number(haemoglobin) : targetDay.haemoglobin;
  const updatedBp = bloodPressure !== undefined ? String(bloodPressure) : targetDay.bloodPressure;
  const updatedWeight = weight !== undefined ? Number(weight) : targetDay.weight;

  const takenCount = targetDay.doses.filter(d => d.status === 'taken').length;
  const adherence = Math.round((takenCount / (targetDay.doses.length || 1)) * 100);
  const healthScore = Math.min(100, Math.round(
    (adherence * 0.4) + 
    (updatedSugar <= 105 && updatedSugar >= 70 ? 25 : 15) + 
    (updatedHb >= 12.5 && updatedHb <= 16.0 ? 20 : 10) + 
    (updatedRbc >= 4.5 && updatedRbc <= 5.5 ? 15 : 10)
  ));

  data[dateKey] = {
    ...targetDay,
    sugarLevel: updatedSugar,
    rbcLevel: updatedRbc,
    haemoglobin: updatedHb,
    bloodPressure: updatedBp,
    weight: updatedWeight,
    healthScore
  };

  saveAnalyticsData(data);
};
