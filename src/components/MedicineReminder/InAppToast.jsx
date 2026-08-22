import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock, X, Volume2 } from 'lucide-react';
import { subscribeToToasts } from '../../services/notificationScheduler';
import { recordNotificationDoseTaken } from '../../services/healthAnalyticsService';

export default function InAppToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((newToast) => {
      setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
    });
    return unsubscribe;
  }, []);

  const handleMarkTaken = (toast) => {
    recordNotificationDoseTaken(toast.medicineName, toast.time);
    dismissToast(toast.id);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <aside aria-label="Notifications" className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white/95 backdrop-blur-md border-2 border-brand-accent/40 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 transition-all hover:shadow-emerald-500/20"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent shrink-0">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full">
                    Dose Alert • {toast.time}
                  </span>
                  {toast.browserNotifFired && (
                    <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Browser Sent
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-brand-textDark mt-0.5">
                  {toast.medicineName}
                </h4>
              </div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-brand-textMuted hover:text-brand-textDark p-1 rounded-lg hover:bg-black/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-brand-textMuted bg-brand-sand/60 border border-brand-border/60 rounded-xl p-2.5 flex flex-col gap-1">
            <div>
              <span className="font-semibold text-brand-textDark">Prescription Dosage: </span>
              {toast.dosage}
            </div>
            {toast.notes && (
              <div className="text-[11px] text-slate-500 italic">
                📝 Note: {toast.notes}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => handleMarkTaken(toast)}
              className="flex-1 py-2 bg-brand-accent hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark as Taken (On Time)
            </button>
            <button
              onClick={() => dismissToast(toast.id)}
              className="px-3 py-2 bg-brand-sand hover:bg-brand-border/20 text-brand-textDark text-xs font-semibold rounded-xl transition-all border border-brand-border"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </aside>
  );
}
