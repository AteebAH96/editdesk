import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

let csrfToken = null;

// Attach the anti-CSRF token to writes. The session itself stays in an HttpOnly cookie.
api.interceptors.request.use((config) => {
  if (csrfToken && !['get', 'head', 'options'].includes(config.method?.toLowerCase()))
    config.headers['X-CSRF-Token'] = csrfToken;
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
      csrfToken = null;
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export function setCsrfToken(token) {
  csrfToken = token || null;
}

export function apiErrorMessage(err, fallback) {
  return err?.response?.data?.error || fallback || 'Something went wrong';
}

export default api;
