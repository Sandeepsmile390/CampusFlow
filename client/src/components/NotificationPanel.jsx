import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  BellOff
} from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';


// ── Icon + color per type ─────────────────────────────────────────────────────
const typeConfig = {
  INFO:    { Icon: Info,          color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  SUCCESS: { Icon: CheckCircle2,  color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20' },
  WARNING: { Icon: AlertTriangle, color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  DANGER:  { Icon: AlertCircle,   color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20' }
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// NotificationPanel — self-contained bell button + dropdown
// The bell trigger is INSIDE the ref so outside-click detection works correctly
// ─────────────────────────────────────────────────────────────────────────────
export default function NotificationPanel() {
  const navigate  = useNavigate();
  const wrapperRef = useRef(null); // wraps BOTH the bell button and the dropdown
  const {
    notifications,
    unreadCount,
    isLoading,
    panelOpen,
    closePanel,
    togglePanel,
    markAsRead,
    markAllRead,
    deleteNotification,
    fetchNotifications
  } = useNotificationStore();

  // Re-fetch when panel opens
  useEffect(() => {
    if (panelOpen) fetchNotifications();
  }, [panelOpen]);

  // Close when clicking outside the entire wrapper (bell + dropdown)
  useEffect(() => {
    function onOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        closePanel();
      }
    }
    if (panelOpen) {
      // Use setTimeout to avoid catching the same click that opened the panel
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', onOutside);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', onOutside);
      };
    }
    return () => document.removeEventListener('mousedown', onOutside);
  }, [panelOpen]);

  function handleClick(n) {
    if (!n.isRead) markAsRead(n.id);
    if (n.link) {
      closePanel();
      navigate(n.link);
    }
  }

  return (
    // wrapperRef covers BOTH the bell trigger and the dropdown panel
    <div ref={wrapperRef} className="relative">

      {/* ── Bell trigger button ── */}
      <button
        onClick={togglePanel}
        className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900/60 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-[#14B8A6] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-1rem)] z-[200] rounded-2xl shadow-2xl border overflow-hidden"

            style={{
              background: '#0f172a',
              borderColor: 'rgba(255,255,255,0.08)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#14B8A6]" />
                <span className="font-semibold text-sm text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-[#14B8A6] text-white rounded-full px-1.5 py-0.5 font-bold leading-none">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    title="Mark all as read"
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-[#14B8A6] transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>All read</span>
                  </button>
                )}
                <button
                  onClick={closePanel}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[420px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-500">
                  <BellOff className="h-8 w-8 opacity-40" />
                  <span className="text-sm">No notifications yet</span>
                </div>
              ) : (
                <div>
                  {notifications.map((n) => {
                    const cfg = typeConfig[n.type] || typeConfig.INFO;
                    return (
                      <div
                        key={n.id}
                        className={`group relative flex gap-3 px-4 py-3 border-b border-white/5 cursor-pointer transition-colors ${
                          !n.isRead ? 'bg-white/[0.03] hover:bg-white/[0.05]' : 'hover:bg-white/[0.02]'
                        }`}
                        onClick={() => handleClick(n)}
                      >
                        {/* Type icon */}
                        <div className={`shrink-0 mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center border ${cfg.bg} ${cfg.border}`}>
                          <cfg.Icon className={`h-4 w-4 ${cfg.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-5">
                          <p className={`text-sm font-medium leading-snug ${!n.isRead ? 'text-white' : 'text-slate-300'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>

                        {/* Unread dot */}
                        {!n.isRead && (
                          <span className="shrink-0 mt-1.5 h-2 w-2 bg-[#14B8A6] rounded-full" />
                        )}

                        {/* Delete button (shows on hover) */}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                          className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-white/5">
                <p className="text-[11px] text-slate-600 text-center">
                  Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
