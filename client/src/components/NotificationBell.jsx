import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../utils.js';

const SEEN_KEY = 'editdesk-notif-seen';
const POLL_MS = 30000; // check for new orders every 30 seconds

function getSeenAt() {
  try {
    return Number(window.localStorage.getItem(SEEN_KEY) || 0);
  } catch {
    return 0;
  }
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fresh, setFresh] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Poll for orders newer than the last-seen timestamp.
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    let alive = true;
    async function poll() {
      try {
        const { data } = await api.get('/orders', { params: { limit: 25 } });
        if (!alive) return;
        const seen = getSeenAt();
        const orders = data.orders || [];
        setFresh(orders.filter((o) => new Date(o.createdAt).getTime() > seen));
      } catch {
        /* silent — bell just stays quiet on network errors */
      }
    }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [user]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (!user || user.role !== 'admin') return null;

  function openDropdown() {
    setOpen(true);
    // Mark as seen once the admin has looked — badge clears, list stays visible.
    try {
      window.localStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setTimeout(() => setFresh([]), 1200);
  }

  function goToOrder(id) {
    setOpen(false);
    navigate(`/orders/${id}`);
  }

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-bell"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        aria-label={fresh.length ? `${fresh.length} new orders` : 'Notifications'}
        title="Notifications"
      >
        <span aria-hidden="true">🔔</span>
        {fresh.length > 0 && (
          <span className="notif-badge" aria-hidden="true">
            {fresh.length > 9 ? '9+' : fresh.length}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown" role="menu">
          <div className="notif-dropdown-head">
            <strong>New orders</strong>
            <Link to="/admin" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
          {fresh.length === 0 ? (
            <p className="notif-empty muted">No new orders. You're all caught up! 🎉</p>
          ) : (
            <ul className="notif-list">
              {fresh.map((o) => (
                <li key={o._id}>
                  <button
                    type="button"
                    className="notif-item"
                    onClick={() => goToOrder(o._id)}
                  >
                    <span className="notif-item-title">{o.title}</span>
                    <span className="notif-item-meta muted">
                      {o.client?.name ? `${o.client.name} · ` : ''}
                      {formatDate(o.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
