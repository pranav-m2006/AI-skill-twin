import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Maximize2, Settings, Bell, User, ChevronDown, Sun, Moon, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import NotificationPanel from './NotificationPanel';

const PAGE_TITLES = {
  '/dashboard':   'Dashboard',
  '/roadmap':     'My Roadmap',
  '/streak':      'Streak & Activity',
  '/progress':    'Progress Analytics',
  '/skill-twin':  'Skill Twin',
  '/aptitude':    'Aptitude Practice',
  '/jobs':        'Jobs',
  '/companies':   'Companies',
  '/internships': 'Internships',
  '/interview':   'Interview Prep',
  '/profile':     'Profile',
  '/resume':      'Resume Analyzer',
};

function AvatarDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        id="topbar-avatar"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-card transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-accent-blue/20 flex items-center justify-center">
          <User size={14} className="text-accent-blue" />
        </div>
        <ChevronDown size={13} className="text-muted" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-card z-50 py-1.5 animate-fade-in">
          <div className="px-4 py-2 border-b border-border">
            <p className="text-[12px] font-semibold text-text truncate">{user?.name}</p>
            <p className="text-[11px] text-muted truncate">{user?.email}</p>
          </div>

          <a href="/profile" className="flex items-center gap-2 px-4 py-2 text-[12px] text-text hover:bg-surface transition-colors">
            <User size={13} /> Profile
          </a>

          {/* Theme Switching Options */}
          <div className="border-t border-b border-border my-1 py-1">
            <p className="px-4 py-1 text-[10px] font-bold text-muted uppercase tracking-wider">UI Theme</p>
            <button
              onClick={() => toggleTheme('light')}
              className={`w-full flex items-center justify-between px-4 py-1.5 text-[12px] transition-colors ${
                theme === 'light' ? 'bg-accent-blue/10 text-accent-blue font-semibold' : 'text-text hover:bg-surface'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sun size={13} className="text-accent-amber" /> Light Theme
              </span>
              {theme === 'light' && <Check size={13} className="text-accent-blue" />}
            </button>

            <button
              onClick={() => toggleTheme('dark')}
              className={`w-full flex items-center justify-between px-4 py-1.5 text-[12px] transition-colors ${
                theme === 'dark' ? 'bg-accent-blue/10 text-accent-blue font-semibold' : 'text-text hover:bg-surface'
              }`}
            >
              <span className="flex items-center gap-2">
                <Moon size={13} className="text-accent-purple" /> Dark Theme
              </span>
              {theme === 'dark' && <Check size={13} className="text-accent-blue" />}
            </button>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-accent-red hover:bg-surface transition-colors"
            id="topbar-logout"
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default function TopBar({ sidebarWidth = 220 }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? 'PlaceMate AI';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const handleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 h-14 bg-surface border-b border-border flex items-center justify-between px-6 transition-all duration-300"
      style={{ left: sidebarWidth }}
    >
      {/* Left: Page title + date */}
      <div>
        <h1 className="text-[15px] font-semibold text-text leading-none">{title}</h1>
        <p className="text-[11px] text-muted mt-0.5">{dateStr}</p>
      </div>

      {/* Right: Icon cluster */}
      <div className="flex items-center gap-1 relative">
        <button
          id="topbar-fullscreen"
          onClick={handleFullscreen}
          className="p-2 rounded-lg text-muted hover:text-text hover:bg-card transition-colors"
          title="Fullscreen"
        >
          <Maximize2 size={15} />
        </button>
        <button
          id="topbar-settings"
          className="p-2 rounded-lg text-muted hover:text-text hover:bg-card transition-colors"
          title="Settings"
        >
          <Settings size={15} />
        </button>
        <button
          id="topbar-notifications"
          onClick={() => setNotifOpen(o => !o)}
          className="p-2 rounded-lg text-muted hover:text-text hover:bg-card transition-colors relative"
          title="Notifications"
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent-blue text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          {unreadCount === 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent-blue/40" />
          )}
        </button>

        {/* Notification panel dropdown */}
        {notifOpen && (
          <div className="absolute top-full right-14 mt-0">
            <NotificationPanel onClose={() => setNotifOpen(false)} />
          </div>
        )}
        <div className="w-px h-5 bg-border mx-1" />
        <AvatarDropdown user={user} onLogout={logout} />
      </div>
    </header>
  );
}
