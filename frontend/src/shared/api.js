import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 45000,
});

// Attach JWT token to every request — reads from sessionStorage
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('placemate_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle response & errors globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('placemate_token');
      sessionStorage.removeItem('placemate_user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    // Enhance Network / Timeout Error messages for UI
    if (!err.response) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        err.message = 'Connection timed out. Render backend may be waking up from sleep. Please retry in a few seconds.';
      } else {
        err.message = 'Unable to connect to PlaceMate AI backend server. Please verify backend URL and environment configuration.';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
