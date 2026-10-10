import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import MessageThread from '../components/MessageThread.jsx';
import { TYPE_LABELS, ALLOWED_TRANSITIONS, formatDate } from '../utils.js';

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyStatus, setBusyStatus] = useState(false);

  const [deliveryDraft, setDeliveryDraft] = useState('');
  const [busyDelivery, setBusyDelivery] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.order);
      setDeliveryDraft(data.order.deliveryUrl || '');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load this order'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function changeStatus(next) {
    setActionError('');
    setBusyStatus(true);
    try {
      const { data } = await api.patch(`/orders/${id}/status`, { status: next });
      setOrder(data.order);
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Could not update status'));
    } finally {
      setBusyStatus(false);
    }
  }

  async function saveDelivery(e) {
    e.preventDefault();
    setActionError('');
    setBusyDelivery(true);
    try {
      const { data } = await api.patch(`/orders/${id}/delivery`, {
        deliveryUrl: deliveryDraft,
      });
      setOrder(data.order);
      setEditingDelivery(false);
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Could not save delivery link'));
    } finally {
      setBusyDelivery(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page">
        <p className="alert alert-error">{error || 'Order not found'}</p>
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="btn btn-ghost">
          Back to orders
        </Link>
      </div>
    );
  }

  const nextStatuses = ALLOWED_TRANSITIONS[order.status] || [];
  const overdue =
    order.deadline && order.status !== 'Delivered' && new Date(order.deadline) < new Date();

  return (
    <div className="page">
      <Link to={isAdmin ? '/admin' : '/dashboard'} className="back-link">
        ← Back to orders
      </Link>

      <div className="detail-grid">
        <div className="card detail-main">
          <div className="order-card-top">
            <h1>{order.title}</h1>
            <StatusBadge status={order.status} />
          </div>

          <dl className="detail-list">
            <div>
              <dt>Type</dt>
              <dd>{TYPE_LABELS[order.type] || order.type}</dd>
            </div>
            <div>
              <dt>Deadline</dt>
              <dd className={overdue ? 'overdue' : ''}>
                {formatDate(order.deadline)}
                {overdue ? ' — overdue' : ''}
              </dd>
            </div>
            {order.client && (
              <div>
                <dt>Client</dt>
                <dd>
                  {order.client.name} ({order.client.email})
                </dd>
              </div>
            )}
            <div>
              <dt>Placed</dt>
              <dd>{formatDate(order.createdAt)}</dd>
            </div>
          </dl>

          {order.description && (
            <>
              <h2>Brief</h2>
              <p className="preserve">{order.description}</p>
            </>
          )}

          {order.referenceLinks && order.referenceLinks.length > 0 && (
            <>
              <h2>Reference links</h2>
              <ul className="link-list">
                {order.referenceLinks.map((link) => (
                  <li key={link}>
                    <a href={link} target="_blank" rel="noopener noreferrer nofollow">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2>Delivery</h2>
          {order.deliveryUrl ? (
            <p>
              <a
                href={order.deliveryUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="btn btn-primary"
              >
                Open delivered files
              </a>
            </p>
          ) : (
            <p className="muted">No delivery yet — you will find the download link here.</p>
          )}

          {isAdmin && (
            <div className="admin-box">
              <h2>Editor controls</h2>
              {actionError && <p className="alert alert-error">{actionError}</p>}

              <p className="muted small">Move status</p>
              <div className="button-row">
                {nextStatuses.length === 0 ? (
                  <span className="muted small">This order is complete.</span>
                ) : (
                  nextStatuses.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="btn btn-sm btn-primary"
                      disabled={busyStatus}
                      onClick={() => changeStatus(s)}
                    >
                      Mark: {s}
                    </button>
                  ))
                )}
              </div>

              <p className="muted small">Delivery link</p>
              {editingDelivery || !order.deliveryUrl ? (
                <form className="inline-form" onSubmit={saveDelivery}>
                  <input
                    type="url"
                    value={deliveryDraft}
                    onChange={(e) => setDeliveryDraft(e.target.value)}
                    placeholder="https://drive.google.com/…"
                  />
                  <button type="submit" className="btn btn-sm btn-primary" disabled={busyDelivery}>
                    {busyDelivery ? 'Saving…' : 'Save'}
                  </button>
                  {order.deliveryUrl && (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => {
                        setEditingDelivery(false);
                        setDeliveryDraft(order.deliveryUrl);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </form>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setEditingDelivery(true)}
                >
                  Change delivery link
                </button>
              )}
            </div>
          )}
        </div>

        <div className="detail-side">
          <MessageThread orderId={order._id} />
        </div>
      </div>
    </div>
  );
}
