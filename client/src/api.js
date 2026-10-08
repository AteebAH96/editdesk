import axios from 'axios';

const TOKEN_KEY = 'editdesk_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is rejected, drop it and send the user back to login.
// (Skipped on the auth pages themselves to avoid redirect loops.)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const path = window.location.pathname;
    if (
      err.response &&
      err.response.status === 401 &&
      !path.startsWith('/login') &&
      !path.startsWith('/register')
    ) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function apiErrorMessage(err, fallback) {
  return err?.response?.data?.error || fallback || 'Something went wrong';
}

export default api;
