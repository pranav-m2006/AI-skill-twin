import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
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
        err.message = 'Connection timed out. Please check your network and backend server status.';
      } else {
        err.message = 'Unable to connect to PlaceMate AI server. Please make sure backend is running on http://localhost:5000.';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
