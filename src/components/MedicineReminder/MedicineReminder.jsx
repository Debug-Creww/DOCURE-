import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Bell, 
  Check, 
  Trash2, 
  X, 
  CalendarCheck, 
  AlertCircle,
  RefreshCw,
  Volume2,
  Utensils,
  Sun,
  Sunrise,
  Sunset,
  Moon
} from 'lucide-react';
import { 
  subscribeReminders, 
  addReminder, 
  updateReminderStatus, 
  deleteReminder, 
  logReminderView 
} from '../../services/firestoreReminders';
import { 
  updateScheduledReminders, 
  requestNotificationPermission, 
  triggerTestNotification 
} from '../../services/notificationScheduler';

// Days of week config with full names
const DAYS_OF_WEEK = [
  { short: 'Sun', full: 'Sunday', letter: 'S' },
  { short: 'Mon', full: 'Monday', letter: 'M' },
  { short: 'Tue', full: 'Tuesday', letter: 'T' },
  { short: 'Wed', full: 'Wednesday', letter: 'W' },
  { short: 'Thu', full: 'Thursday', letter: 'T' },
  { short: 'Fri', full: 'Friday', letter: 'F' },
  { short: 'Sat', full: 'Saturday', letter: 'S' }
];

// Popular medicine quick suggestions
const COMMON_MEDS = [
  'Paracetamol (500mg)',
  'Vitamin D3 (60k IU)',
  'Metformin (500mg)',
  'Omeprazole (20mg)',
  'Amoxicillin (500mg)',
  'Cetirizine (10mg)',
  'Pantoprazole (40mg)',
  'Multivitamin Daily',
  'Aspirin (75mg)',
  'Thyroxine (50mcg)'
];

// Medicine types
const MED_TYPES = [
  { id: 'tablet', label: 'Tablet / Capsule', icon: '💊' },
  { id: 'syrup', label: 'Syrup / Liquid', icon: '🧪' },
  { id: 'drops', label: 'Eye / Ear Drops', icon: '💧' },
  { id: 'inhaler', label: 'Inhaler / Spray', icon: '💨' },
  { id: 'injection', label: 'Injection', icon: '💉' }
];

// Daily routine time slots
const ROUTINE_SLOTS = [
  { id: 'morning', label: 'Morning', time: '08:00', icon: Sunrise, desc: 'Breakfast (08:00 AM)' },
  { id: 'noon', label: 'Afternoon', time: '13:00', icon: Sun, desc: 'Lunch (01:00 PM)' },
  { id: 'evening', label: 'Evening', time: '18:30', icon: Sunset, desc: 'Snacks (06:30 PM)' },
  { id: 'night', label: 'Night', time: '21:30', icon: Moon, desc: 'Dinner (09:30 PM)' }
];

// Meal timing options
const FOOD_TIMINGS = [
  { id: 'after', label: 'After Food (Post-Meal)', icon: '🥗' },
  { id: 'before', label: 'Before Food (Empty Stomach)', icon: '☕' },
  { id: 'with', label: 'With Food', icon: '🍽️' },
  { id: 'anytime', label: 'Anytime / As Needed', icon: '⏰' }
];

export default function MedicineReminder({ userId = 'docure_patient_anushka' }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Form State
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('1 Tablet');
  const [medType, setMedType] = useState('tablet');
  const [foodTiming, setFoodTiming] = useState('after');
  const [selectedDays, setSelectedDays] = useState(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [doseTimes, setDoseTimes] = useState(['08:00']);
  const [customTime, setCustomTime] = useState('14:00');
  const [syncGoogleCalendar, setSyncGoogleCalendar] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirm tracking for cards
  const [deletingId, setDeletingId] = useState(null);
  const modalScrollRef = useRef(null);

  // Real-time Firestore subscription
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeReminders(
      userId,
      (liveReminders) => {
        setReminders(liveReminders);
        setLoading(false);
        updateScheduledReminders(liveReminders);
      },
      (err) => {
        console.warn('Firestore subscription status:', err);
        setLoading(false);
      }
    );

    logReminderView(userId, reminders.length);
    return unsubscribe;
  }, [userId]);

  // Ensure scroll is at top when opening modal
  useEffect(() => {
    if (showAddModal && modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
    }
  }, [showAddModal]);

  // Request browser notification permission
  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
  };

  // Day selection routines
  const toggleDay = (dayShort) => {
    if (selectedDays.includes(dayShort)) {
      if (selectedDays.length === 1) return; // Keep at least one day
      setSelectedDays(selectedDays.filter(d => d !== dayShort));
    } else {
      setSelectedDays([...selectedDays, dayShort]);
    }
  };

  const applyDayPreset = (preset) => {
    if (preset === 'daily') {
      setSelectedDays(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    } else if (preset === 'weekdays') {
      setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    } else if (preset === 'weekends') {
      setSelectedDays(['Sat', 'Sun']);
    } else if (preset === 'alternate') {
      setSelectedDays(['Mon', 'Wed', 'Fri', 'Sun']);
    }
  };

  // Dose times routines
  const toggleRoutineSlot = (timeStr) => {
    if (doseTimes.includes(timeStr)) {
      if (doseTimes.length === 1) return;
      setDoseTimes(doseTimes.filter(t => t !== timeStr));
    } else {
      setDoseTimes([...doseTimes, timeStr].sort());
    }
  };

  const addCustomTime = () => {
    if (!customTime) return;
    if (!doseTimes.includes(customTime)) {
      setDoseTimes([...doseTimes, customTime].sort());
    }
  };

  const removeDoseTime = (timeToRemove) => {
    if (doseTimes.length === 1) return;
    setDoseTimes(doseTimes.filter(t => t !== timeToRemove));
  };

  // Reset form
  const resetForm = () => {
    setMedicineName('');
    setDosage('1 Tablet');
    setMedType('tablet');
    setFoodTiming('after');
    setSelectedDays(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    setDoseTimes(['08:00']);
    setSyncGoogleCalendar(false);
    setNotes('');
    setFormError('');
    setIsSubmitting(false);
  };

  // Submit Handler
  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!medicineName.trim()) {
      setFormError('Please enter the medicine or pill name');
      return;
    }
    if (!dosage.trim()) {
      setFormError('Please specify dosage (e.g. 500mg, 1 tablet)');
      return;
    }
    if (selectedDays.length === 0) {
      setFormError('Please select at least one day for your routine');
      return;
    }
    if (doseTimes.length === 0) {
      setFormError('Please select at least one dose time');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const typeObj = MED_TYPES.find(t => t.id === medType);
      const foodObj = FOOD_TIMINGS.find(f => f.id === foodTiming);

      const reminderData = {
        medicineName: medicineName.trim(),
        dosage: dosage.trim(),
        medType: medType,
        medIcon: typeObj?.icon || '💊',
        foodTiming: foodTiming,
        foodLabel: foodObj?.label || 'After Food',
        daysOfWeek: selectedDays,
        doseTimes: doseTimes,
        syncGoogleCalendar: syncGoogleCalendar,
        notes: notes.trim()
      };

      // Close modal & reset immediately — save runs in background
      resetForm();
      setTimeout(() => setShowAddModal(false), 800);

      await addReminder(userId, reminderData);
    } catch (err) {
      console.error('Failed to create reminder:', err);
      setFormError(err.message || 'Failed to save medicine reminder');
      setShowAddModal(true); // re-open if error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active / paused
  const handleToggleStatus = async (reminder) => {
    const nextStatus = reminder.status === 'active' ? 'paused' : 'active';
    await updateReminderStatus(reminder.id, nextStatus, userId, reminder);
  };

  // Delete reminder
  const handleDelete = async (reminder) => {
    try {
      await deleteReminder(reminder.id, userId, reminder);
    } finally {
      setDeletingId(null);
    }
  };

  // Format 24h time to 12h AM/PM
  const formatTime12h = (time24) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${ampm}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-brand-bg relative overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-600/10 border border-teal-600/20 flex items-center justify-center text-teal-700 shadow-sm text-2xl">
            💊
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-textDark font-sans">
              Weekly Medicine Routine & Reminders
            </h1>
            <p className="text-xs text-brand-textMuted mt-0.5">
              Set your pills schedule, daily dose times & automatic alarms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Notification Permission Toggle */}
          {notifPermission === 'granted' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Alarms ON
            </span>
          ) : (
            <button
              onClick={handleEnableNotifications}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-all active:scale-95 shadow-xs"
            >
              <Bell className="w-3.5 h-3.5" />
              Enable Alarms
            </button>
          )}

          {/* Add Medicine CTA */}
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Medicine Schedule
          </button>
        </div>
      </div>

      {/* Routine Cards Grid */}
      <div className="mt-6 flex flex-col gap-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-brand-textMuted gap-2">
            <RefreshCw className="w-7 h-7 animate-spin text-teal-600" />
            <span className="text-xs font-mono">Syncing your weekly medication routine...</span>
          </div>
        ) : reminders.length === 0 ? (
          /* Empty State */
          <div className="bg-white border-2 border-dashed border-teal-200/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm my-4">
            <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center text-3xl shadow-inner">
              💊
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-textDark">No medicines added to your routine yet</h3>
              <p className="text-xs text-brand-textMuted mt-1 max-w-md mx-auto leading-relaxed">
                Add your daily or weekly medicines, specify days (Sunday to Saturday), set your meal timings, and DOCURE will notify you on time!
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="mt-2 px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Your First Medicine Now
            </button>
          </div>
        ) : (
          /* Routine Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-8">
            {reminders.map((reminder) => {
              const isActive = reminder.status === 'active';
              return (
                <div
                  key={reminder.id}
                  className={`bg-white border rounded-3xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-lg ${
                    isActive 
                      ? 'border-teal-100 shadow-sm' 
                      : 'border-slate-200 bg-slate-50/70 opacity-85'
                  }`}
                >
                  {/* Card Top: Name, Type, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl border ${
                        isActive ? 'bg-teal-50 border-teal-200/80 shadow-xs' : 'bg-slate-100 border-slate-200'
                      }`}>
                        {reminder.medIcon || '💊'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-brand-textDark">
                            {reminder.medicineName}
                          </h3>
                          {reminder.syncGoogleCalendar && (
                            <span 
                              title="Synced to Google Calendar as weekly recurring event"
                              className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full font-bold"
                            >
                              <CalendarCheck className="w-3 h-3 text-emerald-600" />
                              G-Cal
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs">
                          <span className="font-bold text-teal-700">{reminder.dosage}</span>
                          {reminder.foodLabel && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-600 text-[11px] font-medium">{reminder.foodLabel}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Active/Paused Switch */}
                    <button
                      onClick={() => handleToggleStatus(reminder)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                      title={isActive ? 'Click to Pause' : 'Click to Resume'}
                    >
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                      <span>{isActive ? 'Active' : 'Paused'}</span>
                    </button>
                  </div>

                  {/* Weekly Days Indicator: S M T W T F S */}
                  <div className="bg-brand-sand/60 border border-brand-border/70 rounded-2xl p-3.5 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-brand-textMuted font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-teal-600" />
                        Weekly Schedule:
                      </span>
                      <span className="text-[11px] font-bold text-teal-800">
                        {reminder.daysOfWeek?.length === 7 ? 'Every Day (Daily)' : `${reminder.daysOfWeek?.length} Days/Week`}
                      </span>
                    </div>

                    {/* 7 Days Row */}
                    <div className="grid grid-cols-7 gap-1.5 text-center">
                      {DAYS_OF_WEEK.map((d) => {
                        const isScheduled = Array.isArray(reminder.daysOfWeek) && reminder.daysOfWeek.includes(d.short);
                        return (
                          <div
                            key={d.short}
                            className={`py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                              isScheduled
                                ? 'bg-teal-700 text-white shadow-xs'
                                : 'bg-white/80 text-slate-400 border border-brand-border/40'
                            }`}
                            title={`${d.full}: ${isScheduled ? 'Scheduled' : 'Off'}`}
                          >
                            <div>{d.short}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dose Times Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-brand-textDark flex items-center gap-1 mr-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      Dose Times:
                    </span>
                    {Array.isArray(reminder.doseTimes) && reminder.doseTimes.map((timeStr, idx) => (
                      <span
                        key={idx}
                        className="bg-brand-sand border border-brand-border text-brand-textDark font-mono font-bold text-xs px-2.5 py-1 rounded-xl shadow-2xs"
                      >
                        {formatTime12h(timeStr)}
                      </span>
                    ))}
                  </div>

                  {/* Card Bottom: Actions */}
                  <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between">
                    {/* Test Alert Button */}
                    <button
                      onClick={() => triggerTestNotification(reminder)}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
                      title="Test alarm sound and notification for this medicine"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Test Alarm</span>
                    </button>

                    {/* Delete with Confirm */}
                    {deletingId === reminder.id ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <button
                          onClick={() => handleDelete(reminder)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(reminder.id)}
                        className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-all"
                        title="Delete this medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==========================================
           MODAL: ADD MEDICINE WEEKLY ROUTINE
           (Mounted directly on body via Portal for guaranteed center position)
           ========================================== */}
      {showAddModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] overflow-y-auto bg-[#04060c]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-brand-sand border border-brand-border/90 rounded-3xl shadow-2xl flex flex-col my-auto max-h-[82vh] overflow-hidden">
            
            {/* 1. Pinned Header at the Top */}
            <div className="flex items-center justify-between p-4 sm:px-6 sm:py-3.5 border-b border-brand-border bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600/10 border border-teal-600/20 text-teal-700 flex items-center justify-center text-xl shadow-xs">
                  💊
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-textDark">Add Medication to Routine</h3>
                  <p className="text-[11px] text-brand-textMuted">Fill medicine details, days, and alarm times</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-brand-textDark p-2 rounded-xl hover:bg-black/5 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Scrollable Form Body */}
            <form onSubmit={handleCreateReminder} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div ref={modalScrollRef} className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-3.5">
                
                {formError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. Medicine Name & Quick Suggestions */}
                <div className="flex flex-col gap-1.5 bg-white p-3.5 rounded-2xl border border-brand-border/80 shadow-xs">
                  <label className="text-xs font-bold text-brand-textDark flex items-center justify-between">
                    <span>1. Medicine / Pill Name *</span>
                    <span className="text-[10px] text-teal-700 font-semibold font-mono">Required</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Enter pill or medicine name (e.g. Paracetamol, Metformin)"
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    className="border border-brand-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-teal-600 bg-brand-sand/40 font-medium"
                  />

                  {/* Quick Suggestion Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold self-center mr-0.5">Quick picks:</span>
                    {COMMON_MEDS.slice(0, 6).map((med) => (
                      <button
                        key={med}
                        type="button"
                        onClick={() => {
                          const nameOnly = med.split(' (')[0];
                          setMedicineName(nameOnly);
                          if (med.includes('(')) {
                            const doseOnly = med.split('(')[1].replace(')', '');
                            setDosage(doseOnly);
                          }
                        }}
                        className="text-[10px] bg-white border border-brand-border hover:border-teal-500 hover:text-teal-800 text-brand-textMuted px-2 py-0.5 rounded-lg transition-all"
                      >
                        {med.split(' (')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Dosage & Medicine Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-brand-border/80 shadow-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-textDark">
                      2. Dosage / Quantity *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 500mg (1 tablet), 2 drops"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      className="border border-brand-border rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-600 bg-brand-sand/40"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-textDark">
                      Medicine Form
                    </label>
                    <select
                      value={medType}
                      onChange={(e) => setMedType(e.target.value)}
                      className="border border-brand-border rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-600 bg-brand-sand/40 cursor-pointer"
                    >
                      {MED_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Meal Timing / Food Instructions */}
                <div className="flex flex-col gap-2 bg-white p-3.5 rounded-2xl border border-brand-border/80 shadow-xs">
                  <label className="text-xs font-bold text-brand-textDark flex items-center gap-1">
                    <Utensils className="w-3.5 h-3.5 text-teal-600" />
                    3. Meal / Food Timing
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {FOOD_TIMINGS.map((f) => {
                      const isSelected = foodTiming === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFoodTiming(f.id)}
                          className={`p-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border transition-all ${
                            isSelected
                              ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-xs'
                              : 'bg-brand-sand/40 border-brand-border text-slate-600 hover:border-teal-300'
                          }`}
                        >
                          <span>{f.icon}</span>
                          <span>{f.label.split(' (')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Weekly Days Selector */}
                <div className="flex flex-col gap-2 bg-white p-3.5 rounded-2xl border border-brand-border/80 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-brand-textDark flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      4. Days of Week Routine *
                    </label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => applyDayPreset('daily')}
                        className="text-teal-700 font-bold hover:underline"
                      >
                        Every Day
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => applyDayPreset('weekdays')}
                        className="text-teal-700 font-semibold hover:underline"
                      >
                        Weekdays
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => applyDayPreset('weekends')}
                        className="text-teal-700 font-semibold hover:underline"
                      >
                        Weekends
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = selectedDays.includes(d.short);
                      return (
                        <button
                          key={d.short}
                          type="button"
                          onClick={() => toggleDay(d.short)}
                          className={`py-2 rounded-xl flex flex-col items-center justify-center transition-all border ${
                            isSelected
                              ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                              : 'bg-brand-sand/40 text-slate-600 border-brand-border hover:border-teal-400'
                          }`}
                        >
                          <span className="text-xs font-extrabold">{d.short}</span>
                          <span className="text-[9px] opacity-75 font-mono">{d.letter}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Routine Dose Times Slots */}
                <div className="flex flex-col gap-2 bg-white p-3.5 rounded-2xl border border-brand-border/80 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-brand-textDark flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      5. Daily Dose Times *
                    </label>
                    <span className="text-[11px] text-teal-800 font-semibold">
                      {doseTimes.length} time{doseTimes.length > 1 ? 's' : ''} set
                    </span>
                  </div>

                  {/* Quick Routine Slot Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {ROUTINE_SLOTS.map((slot) => {
                      const Icon = slot.icon;
                      const isSelected = doseTimes.includes(slot.time);
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => toggleRoutineSlot(slot.time)}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 text-center transition-all ${
                            isSelected
                              ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                              : 'bg-brand-sand/40 border-brand-border text-slate-700 hover:border-teal-400'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold">{slot.label}</span>
                          <span className="text-[9px] font-mono opacity-80">{slot.time}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Times Badges & Custom Time Picker */}
                  <div className="bg-brand-sand/30 rounded-xl p-2.5 border border-brand-border/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between flex-wrap gap-1 text-xs">
                      <span className="font-semibold text-brand-textDark text-[11px]">Selected Alarms:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {doseTimes.map((timeStr) => (
                          <span
                            key={timeStr}
                            className="inline-flex items-center gap-1 bg-white border border-brand-border px-2 py-0.5 rounded-lg text-xs font-mono font-bold"
                          >
                            {formatTime12h(timeStr)}
                            <button
                              type="button"
                              onClick={() => removeDoseTime(timeStr)}
                              className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Add Custom Specific Time */}
                    <div className="flex items-center gap-2 pt-1.5 border-t border-brand-border/40">
                      <span className="text-[11px] text-slate-500 font-medium">Add custom time:</span>
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="border border-brand-border rounded-lg px-2 py-1 text-xs outline-none focus:border-teal-600 bg-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={addCustomTime}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-lg transition-all"
                      >
                        + Add Time
                      </button>
                    </div>
                  </div>
                </div>

                {/* 6. Google Calendar Sync Checkbox */}
                <div className="bg-white border border-brand-border/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
                  <input
                    type="checkbox"
                    id="syncGcal"
                    checked={syncGoogleCalendar}
                    onChange={(e) => setSyncGoogleCalendar(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="syncGcal" className="cursor-pointer text-xs text-brand-textDark font-medium">
                    <span className="font-bold text-teal-900">Sync to Google Calendar</span>
                    <p className="text-[11px] text-brand-textMuted mt-0.5">
                      Creates weekly recurring events on Google Calendar for each selected dose time with reminders.
                    </p>
                  </label>
                </div>
              </div>

              {/* 3. Pinned Sticky Modal Footer at the Bottom */}
              <div className="flex justify-end items-center gap-2.5 p-3.5 sm:px-6 sm:py-3 border-t border-brand-border bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white border border-brand-border text-brand-textDark text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Routine...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Medicine Routine</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
