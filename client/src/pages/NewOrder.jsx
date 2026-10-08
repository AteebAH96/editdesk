import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiErrorMessage } from '../api.js';
import { TYPE_LABELS } from '../utils.js';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewOrder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('reel');
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const referenceLinks = links
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const { data } = await api.post('/orders', {
        title: title.trim(),
        type,
        description: description.trim(),
        referenceLinks,
        deadline: deadline || undefined,
      });
      navigate(`/orders/${data.order._id}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not place the order'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>New order</h1>
          <p className="muted">Describe the edit you need — the more detail, the better the cut.</p>
        </div>
      </div>

      <form className="card form-card" onSubmit={handleSubmit}>
        {error && <p className="alert alert-error">{error}</p>}

        <label className="field">
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
            placeholder="e.g. Product launch reel — 30s"
          />
        </label>

        <label className="field">
          <span>Type of edit</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={3000}
            placeholder="Style, mood, music direction, must-include shots, things to avoid…"
          />
        </label>

        <label className="field">
          <span>Reference links (one per line)</span>
          <textarea
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            rows={3}
            placeholder="https://drive.google.com/…&#10;https://youtube.com/…"
          />
        </label>

        <label className="field">
          <span>Deadline</span>
          <input
            type="date"
            value={deadline}
            min={todayISO()}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Placing order…' : 'Place order'}
          </button>
        </div>
      </form>
    </div>
  );
}
