import axios from 'axios';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const BASE_URL = import.meta.env.VITE_API_URL || (isLocal ? 'http://127.0.0.1:8000/api/v1' : 'https://cloudpilot-backendd.onrender.com/api/v1');

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// ── Request interceptor: attach JWT token from localStorage on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cloudpilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: auto-logout on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cloudpilot_token');
      localStorage.removeItem('cloudpilot_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
