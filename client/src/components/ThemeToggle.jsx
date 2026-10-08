import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'editdesk-theme';

function getInitialTheme() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage unavailable — fall back to light */
  }
  return 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  }, [theme]);

  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className={`theme-switch${theme === 'dark' ? ' is-dark' : ''}`}
      onClick={() => setTheme(next)}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
    >
      <span className="theme-switch-icon theme-switch-icon-sun" aria-hidden="true">☀️</span>
      <span className="theme-switch-icon theme-switch-icon-moon" aria-hidden="true">🌙</span>
      <span className="theme-switch-knob" aria-hidden="true" />
    </button>
  );
}
