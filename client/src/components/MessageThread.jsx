import React, { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

function formatTime(value) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function MessageThread({ orderId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/orders/${orderId}/messages`);
      setMessages(data.messages);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load messages'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function send(e) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const { data } = await api.post(`/orders/${orderId}/messages`, { text: draft });
      setMessages((prev) => [...prev, data.message]);
      setDraft('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send message'));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="thread">
      <div className="thread-head">
        <h2>Messages</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {loading ? (
        <p className="muted">Loading messages…</p>
      ) : messages.length === 0 ? (
        <p className="muted">No messages yet — start the conversation below.</p>
      ) : (
        <ul className="message-list">
          {messages.map((m) => {
            const mine = user && m.author && m.author._id === user.id;
            return (
              <li key={m._id} className={`message ${mine ? 'mine' : ''}`}>
                <div className="message-meta">
                  <strong>{m.author ? m.author.name : 'Unknown'}</strong>
                  {m.author && m.author.role === 'admin' && (
                    <span className="chip chip-admin">editor</span>
                  )}
                  <span className="muted small">{formatTime(m.createdAt)}</span>
                </div>
                <p className="message-text">{m.text}</p>
              </li>
            );
          })}
        </ul>
      )}

      <form className="message-form" onSubmit={send}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          rows={3}
          maxLength={2000}
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !draft.trim()}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </section>
  );
}
