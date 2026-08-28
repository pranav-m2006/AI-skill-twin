import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../shared/api';
import { useAuth } from './AuthContext';
import usePushPermission from '../hooks/usePushPermission';

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 60_000; // poll unread count every 60s

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { permission, request: requestPermission, sendBrowserNotif } = usePushPermission();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const prevCountRef = useRef(0);

  // ── Poll unread count ────────────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.get('/notifications/unread-count');
      const newCount = data.count ?? 0;

      // If count grew, fire a browser OS notification for the latest unread
      if (newCount > prevCountRef.current && permission === 'granted') {
        const latest = await api.get('/notifications?limit=1');
        const notif = latest.data?.notifications?.[0];
        if (notif && !notif.isRead) {
          sendBrowserNotif(notif.title, { body: notif.body, data: { link: notif.link } });
        }
      }

      prevCountRef.current = newCount;
      setUnreadCount(newCount);
    } catch {
      // silently ignore — don't break any existing UI
    }
  }, [isAuthenticated, permission, sendBrowserNotif]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isAuthenticated, fetchUnreadCount]);

  // ── Fetch full list ──────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async ({ type = null, page = 1 } = {}) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (type) params.append('type', type);
      const { data } = await api.get(`/notifications?${params}`);
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      prevCountRef.current = data.unreadCount ?? 0;
      return data;
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // ── Mark one read ────────────────────────────────────────────────────────
  const markRead = useCallback(async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(c => Math.max(0, c - 1));
      prevCountRef.current = Math.max(0, prevCountRef.current - 1);
    } catch { /* silent */ }
  }, []);

  // ── Mark all read ────────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      prevCountRef.current = 0;
    } catch { /* silent */ }
  }, []);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      notifications,
      loading,
      fetchNotifications,
      markRead,
      markAllRead,
      permission,
      requestPermission,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
