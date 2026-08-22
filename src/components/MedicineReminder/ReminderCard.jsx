// src/components/MedicineReminder/ReminderCard.jsx
import React, { useState } from 'react';
import { 
  Pill, 
  Clock, 
  Calendar, 
  PauseCircle, 
  PlayCircle, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  BellRing,
  ExternalLink
} from 'lucide-react';
import { triggerTestNotification } from '../../services/notificationScheduler';

export default function ReminderCard({ 
  reminder, 
  onToggleStatus, 
  onDelete, 
  userId 
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isActive = reminder.status === 'active';

  const handleToggle = async () => {
    const nextStatus = isActive ? 'paused' : 'active';
    await onToggleStatus(reminder.id, nextStatus, reminder);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(reminder.id, reminder);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleTestAlert = () => {
    triggerTestNotification(reminder);
  };

  // Helper to format days nicely
  const formattedDays = Array.isArray(reminder.daysOfWeek) 
    ? (reminder.daysOfWeek.length === 7 ? 'Everyday' : reminder.daysOfWeek.join(', '))
    : 'No days set';

  return (
    <div className={`bg-white border rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-brand-accent/40 relative overflow-hidden ${isActive ? 'border-brand-border shadow-sm' : 'border-slate-200/80 bg-slate-50/50 opacity-85'}`}>
      
      {/* Top Banner & Status Indicator */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-brand-textDark font-sans tracking-tight">
                {reminder.medicineName}
              </h3>
              {reminder.syncGoogleCalendar && (
                <span 
                  title="Synced with Google Calendar via RRULE"
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-100/70 border border-emerald-300/80 px-2 py-0.5 rounded-full font-bold"
                >
                  <Calendar className="w-3 h-3 text-emerald-600" />
                  G-Cal Synced
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-brand-accent mt-0.5">
              {reminder.dosage}
            </p>
          </div>
        </div>

        {/* Active/Paused Status Pill */}
        <button
          onClick={handleToggle}
          title={`Click to ${isActive ? 'Pause' : 'Resume'} reminder`}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold transition-all border ${
            isActive 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
          <span>{isActive ? 'Active' : 'Paused'}</span>
        </button>
      </div>

      {/* Schedule Badges: Days of Week */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs text-brand-textMuted font-medium">
          <Calendar className="w-3.5 h-3.5 text-brand-accent" />
          <span className="font-semibold text-brand-textDark">Days:</span>
          <span className="text-slate-600 text-[11px]">{formattedDays}</span>
        </div>

        {/* Dose Times Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Clock className="w-3.5 h-3.5 text-brand-accent shrink-0" />
          <span className="text-xs font-semibold text-brand-textDark mr-1">Times:</span>
          {Array.isArray(reminder.doseTimes) && reminder.doseTimes.length > 0 ? (
            reminder.doseTimes.map((time, idx) => (
              <span
                key={idx}
                className="bg-brand-sand border border-brand-border/80 text-brand-textDark font-mono font-bold text-[11px] px-2.5 py-1 rounded-xl shadow-xs"
              >
                {time}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-slate-400 italic">No dose times</span>
          )}
        </div>

        {/* Optional Notes */}
        {reminder.notes && (
          <div className="text-[11px] text-slate-500 bg-brand-sand/40 border border-brand-border/40 rounded-xl px-3 py-1.5 mt-1">
            <span className="font-semibold text-slate-700">Note: </span>
            {reminder.notes}
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="mt-5 pt-3 border-t border-brand-border/60 flex items-center justify-between gap-2">
        {/* Test Alert Button */}
        <button
          onClick={handleTestAlert}
          title="Simulate / Trigger instant alert test"
          className="flex items-center gap-1 text-[11px] font-semibold text-brand-accent hover:text-teal-800 bg-brand-accent/10 hover:bg-brand-accent/20 border border-brand-accent/20 px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
        >
          <BellRing className="w-3.5 h-3.5 text-brand-accent" />
          <span>Test Alert</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Pause / Resume Button */}
          <button
            onClick={handleToggle}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all border ${
              isActive 
                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200' 
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
            }`}
            title={isActive ? "Pause Reminder" : "Resume Reminder"}
          >
            {isActive ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
            <span className="hidden sm:inline">{isActive ? "Pause" : "Resume"}</span>
          </button>

          {/* Delete Button / Confirmation */}
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1 animate-in fade-in">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-sm"
              >
                {isDeleting ? "..." : "Confirm"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete Reminder"
              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
