import api from './api';

/**
 * Auth Service — connects Login & Signup to FastAPI backend
 * POST /api/v1/auth/signup  → { token, user }
 * POST /api/v1/auth/login   → { token, user }
 * GET  /api/v1/auth/me      → current user profile
 */

export const signup = async ({ fullName, email, password }) => {
  const response = await api.post('/auth/signup', {
    fullName,
    email,
    password,
  });
  const { token, user } = response.data;
  localStorage.setItem('cloudpilot_token', token);
  localStorage.setItem('cloudpilot_user', JSON.stringify(user));
  return { token, user };
};

export const login = async ({ email, password }) => {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data;
  localStorage.setItem('cloudpilot_token', token);
  localStorage.setItem('cloudpilot_user', JSON.stringify(user));
  return { token, user };
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('cloudpilot_token');
  localStorage.removeItem('cloudpilot_user');
  localStorage.removeItem('isAuthenticated');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('cloudpilot_token');
};

export const getStoredUser = () => {
  const raw = localStorage.getItem('cloudpilot_user');
  return raw ? JSON.parse(raw) : null;
};
