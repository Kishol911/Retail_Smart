import axios from 'axios';

// Central axios instance for all API calls.
// Set VITE_API_URL in client/.env, e.g. VITE_API_URL=http://localhost:5000/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach the JWT token (if present) to every outgoing request
api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('smartpos_user');
  if (storedUser) {
    const { token } = JSON.parse(storedUser);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
