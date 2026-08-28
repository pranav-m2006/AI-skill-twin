import { createContext, useContext, useState, useCallback } from 'react';
import api from '../shared/api';

const AuthContext = createContext(null);

/**
 * AuthProvider — uses sessionStorage instead of localStorage.
 *
 * This means:
 *  - Closing the browser tab / window = session ends → login required again.
 *  - Opening a fresh tab → login required (no auto-login from previous sessions).
 *  - Refreshing the page in the SAME tab → session is preserved (expected behaviour).
 *  - Multiple users on the same device never bleed into each other's sessions.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('placemate_user')); }
    catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    sessionStorage.setItem('placemate_token', data.token);
    sessionStorage.setItem('placemate_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    sessionStorage.setItem('placemate_token', data.token);
    sessionStorage.setItem('placemate_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('placemate_token');
    sessionStorage.removeItem('placemate_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    sessionStorage.setItem('placemate_user', JSON.stringify(data));
    setUser(data);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
