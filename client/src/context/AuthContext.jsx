import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setCsrfToken } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Restore the session on first load if a token was saved.
  useEffect(() => {
    async function restore() {
      try {
        const { data } = await api.get('/auth/me');
        setCsrfToken(data.csrfToken);
        setUser(data.user);
      } catch {
        setCsrfToken(null);
      } finally {
        setInitializing(false);
      }
    }
    restore();
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    setCsrfToken(data.csrfToken);
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password });
    setCsrfToken(data.csrfToken);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try { await api.post('/auth/logout'); } finally { setCsrfToken(null); }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, initializing, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
