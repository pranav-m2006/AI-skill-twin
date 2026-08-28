import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Flame, Briefcase, BookOpen, Award, Zap, CheckCheck,
  BellOff, X, ExternalLink, Clock
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

// ── Type config ───────────────────────────────────────────────────────────
const TYPE_META = {
  STREAK:     { icon: Flame,     color: 'text-accent-amber',  bg: 'bg-accent-amber/10',  label: 'Streak' },
  JOB:        { icon: Briefcase, color: 'text-accent-blue',   bg: 'bg-accent-blue/10',   label: 'Job' },
  INTERNSHIP: { icon: Briefcase, color: 'text-accent-purple', bg: 'bg-accent-purple/10', label: 'Internship' },
  GOAL:       { icon: BookOpen,  color: 'text-accent-green',  bg: 'bg-accent-green/10',  label: 'Goal' },
  BADGE:      { icon: Award,     color: 'text-accent-amber',  bg: 'bg-accent-amber/10',  label: 'Badge' },
  XP:         { icon: Zap,       color: 'text-accent-blue',   bg: 'bg-accent-blue/10',   label: 'XP' },
};

const TABS = [
  { key: null,         label: 'All' },
  { key: 'STREAK',     label: '🔥 Streak' },
  { key: 'JOB',        label: '💼 Jobs' },
  { key: 'INTERNSHIP', label: '🎓 Intern' },
  { key: 'GOAL',       label: '📈 Goals' },
  { key: 'BADGE',      label: '🏅 Badges' },
];

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ── Notification Card ─────────────────────────────────────────────────────
function NotifCard({ notif, onRead, onNavigate }) {
  const meta = TYPE_META[notif.type] || TYPE_META.XP;
  const Icon = meta.icon;

  return (
    <div
      className={`relative flex gap-3 p-3 rounded-xl border transition-all cursor-pointer group
        ${notif.isRead
          ? 'border-border/50 bg-surface/50 opacity-75'
          : 'border-border bg-surface hover:border-accent-blue/40 hover:bg-surface/80'
        }`}
      onClick={() => {
        if (!notif.isRead) onRead(notif.id);
        if (notif.link) onNavigate(notif.link);
      }}
    >
      {/* Unread indicator */}
      {!notif.isRead && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
      )}

      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
        <Icon size={15} className={meta.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-4">
        <p className={`text-[12px] font-semibold leading-tight truncate ${notif.isRead ? 'text-muted' : 'text-text'}`}>
          {notif.title}
        </p>
        <p className="text-[11px] text-muted leading-relaxed mt-0.5 line-clamp-2">
          {notif.body}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <Clock size={9} className="text-muted/60" />
          <span className="text-[10px] text-muted/70">{relativeTime(notif.createdAt)}</span>
          {notif.link && (
            <span className="text-[10px] text-accent-blue/60 flex items-center gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink size={9} /> View
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────
export default function NotificationPanel({ onClose }) {
  const navigate = useNavigate();
  const {
    notifications, loading, unreadCount,
    fetchNotifications, markRead, markAllRead,
    permission, requestPermission,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState(null);
  const panelRef = useRef(null);

  // Load notifications when panel opens
  useEffect(() => {
    fetchNotifications({ type: activeTab });
  }, [activeTab]); // eslint-disable-line

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleNavigate = (link) => {
    navigate(link);
    onClose();
  };

  const filtered = activeTab
    ? notifications.filter(n => n.type === activeTab)
    : notifications;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[360px] bg-card border border-border rounded-2xl shadow-card z-50 flex flex-col overflow-hidden animate-fade-in"
      style={{ maxHeight: '80vh' }}
      id="notification-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-accent-blue" />
          <h2 className="text-[13px] font-bold text-text">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-accent-blue text-white text-[10px] font-bold leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              id="notif-mark-all-read"
              onClick={markAllRead}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-muted hover:text-text hover:bg-surface transition-colors"
              title="Mark all as read"
            >
              <CheckCheck size={13} /> All read
            </button>
          )}
          <button
            id="notif-close"
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Browser permission banner */}
      {permission === 'default' && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-accent-blue/5 border-b border-accent-blue/20 flex-shrink-0">
          <Bell size={13} className="text-accent-blue flex-shrink-0" />
          <p className="text-[11px] text-muted flex-1">Enable browser notifications for real-time alerts</p>
          <button
            id="notif-enable-push"
            onClick={requestPermission}
            className="px-2.5 py-1 rounded-lg bg-accent-blue text-white text-[10px] font-semibold hover:bg-accent-blue/90 transition-colors flex-shrink-0"
          >
            Enable
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-border flex-shrink-0 overflow-x-auto scrollbar-none">
        {TABS.map(tab => (
          <button
            key={String(tab.key)}
            id={`notif-tab-${tab.key || 'all'}`}
            onClick={() => setActiveTab(tab.key)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors
              ${activeTab === tab.key
                ? 'bg-accent-blue text-white'
                : 'text-muted hover:text-text hover:bg-surface'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
              <BellOff size={18} className="text-muted" />
            </div>
            <p className="text-[12px] text-muted">No notifications yet</p>
            <p className="text-[11px] text-muted/60">Complete tasks to see updates here</p>
          </div>
        )}

        {!loading && filtered.map(notif => (
          <NotifCard
            key={notif.id}
            notif={notif}
            onRead={markRead}
            onNavigate={handleNavigate}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2.5 flex-shrink-0">
        <p className="text-[10px] text-muted/50 text-center">
          Updates every 60 seconds · Streak reminders check daily
        </p>
      </div>
    </div>
  );
}
