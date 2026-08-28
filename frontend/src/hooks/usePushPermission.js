import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'placemate_push_permission';

/**
 * usePushPermission — manages browser Web Notification permission.
 * Purely additive — no existing code modified.
 *
 * Returns:
 *   permission  — 'default' | 'granted' | 'denied'
 *   supported   — boolean: browser supports Notifications API
 *   request     — async fn: triggers the browser permission prompt
 *   sendBrowserNotif — fn(title, opts): fires an OS notification if granted
 */
export default function usePushPermission() {
  const supported = typeof window !== 'undefined' && 'Notification' in window;

  const [permission, setPermission] = useState(() => {
    if (!supported) return 'denied';
    return localStorage.getItem(STORAGE_KEY) || Notification.permission;
  });

  // Keep in sync with real browser state
  useEffect(() => {
    if (!supported) return;
    const current = Notification.permission;
    setPermission(current);
    localStorage.setItem(STORAGE_KEY, current);
  }, [supported]);

  const request = useCallback(async () => {
    if (!supported) return 'denied';
    if (Notification.permission === 'granted') {
      setPermission('granted');
      return 'granted';
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    localStorage.setItem(STORAGE_KEY, result);
    return result;
  }, [supported]);

  const sendBrowserNotif = useCallback((title, { body = '', icon = '/favicon.ico', tag, data } = {}) => {
    if (!supported || Notification.permission !== 'granted') return;
    try {
      const notif = new Notification(title, { body, icon, tag, data });
      notif.onclick = () => {
        window.focus();
        if (data?.link) window.location.href = data.link;
        notif.close();
      };
    } catch {
      // Silently fail — some contexts (e.g. Firefox private) block even after grant
    }
  }, [supported]);

  return { permission, supported, request, sendBrowserNotif };
}
