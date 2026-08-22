// src/components/MedicineReminder/AuditLogModal.jsx
import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Clock, Terminal, Laptop, RefreshCw } from 'lucide-react';
import { subscribeAuditLogs } from '../../services/auditService';

export default function AuditLogModal({ isOpen, onClose, userId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const unsubscribe = subscribeAuditLogs(userId, (auditData) => {
      setLogs(auditData);
      setLoading(false);
    });

    return unsubscribe;
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE_REMINDER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            CREATE
          </span>
        );
      case 'DELETE_REMINDER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
            DELETE
          </span>
        );
      case 'PAUSE_REMINDER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
            PAUSE
          </span>
        );
      case 'RESUME_REMINDER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100 text-teal-800 border border-teal-300">
            RESUME
          </span>
        );
      case 'VIEW_REMINDERS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
            VIEW
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-[#04060c]/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in">
      <div className="bg-brand-sand border border-brand-border/60 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative flex flex-col gap-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-brand-textDark">Firestore Audit Trail</h3>
                <span className="text-[10px] font-mono bg-brand-accent/15 text-brand-accent px-2 py-0.5 rounded-full font-bold">
                  Collection: audit_logs
                </span>
              </div>
              <p className="text-xs text-brand-textMuted mt-0.5">
                Immutable compliance records for reminder actions & views
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-brand-textMuted hover:text-brand-textDark p-1.5 rounded-xl hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <hr className="border-brand-border/60" />

        {/* Audit Log Content */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-brand-textMuted gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-accent" />
              <span className="text-xs font-mono">Fetching audit trail...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-brand-textMuted flex flex-col items-center gap-2">
              <Terminal className="w-8 h-8 text-slate-300" />
              <span className="text-xs font-semibold">No audit records recorded yet.</span>
              <span className="text-[11px] text-slate-400">Actions like adding, pausing, or deleting will appear here live.</span>
            </div>
          ) : (
            logs.map((entry) => (
              <div
                key={entry.id}
                className="bg-white border border-brand-border/80 rounded-2xl p-4 flex flex-col gap-2 hover:border-brand-accent/40 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {getActionBadge(entry.action)}
                    <span className="text-xs font-bold text-brand-textDark">
                      {entry.details?.medicineName ? entry.details.medicineName : entry.action.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-brand-textMuted font-mono">
                    <Clock className="w-3.5 h-3.5 text-brand-accent" />
                    <span>
                      {entry.dateFormatted || (entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleString() : entry.localTimestamp || 'Just now')}
                    </span>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="bg-brand-sand/50 border border-brand-border/40 rounded-xl p-2.5 text-xs text-brand-textMuted font-mono flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-brand-textDark font-semibold">User ID:</span>
                    <span className="text-slate-600 truncate max-w-[280px]">{entry.userId}</span>
                  </div>
                  {entry.details && Object.keys(entry.details).length > 0 && (
                    <div className="flex flex-col gap-0.5 pt-1 border-t border-brand-border/30 text-[11px]">
                      <span className="text-brand-textDark font-semibold">Payload Metadata:</span>
                      <pre className="text-[10px] text-slate-700 whitespace-pre-wrap bg-white/70 p-1.5 rounded border border-brand-border/30 overflow-x-auto">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1">
                    <Laptop className="w-3 h-3 shrink-0" />
                    <span className="truncate">{entry.userAgent}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-brand-border/60">
          <span className="text-[11px] font-mono text-brand-textMuted">
            Total records: <strong className="text-brand-textDark">{logs.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-brand-textDark hover:bg-brand-accent text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            Close Trail
          </button>
        </div>
      </div>
    </div>
  );
}
