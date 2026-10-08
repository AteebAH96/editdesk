import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import { TYPE_LABELS, formatDate } from '../utils.js';

export default function OrderCard({ order }) {
  const overdue =
    order.deadline && order.status !== 'Delivered' && new Date(order.deadline) < new Date();

  return (
    <Link to={`/orders/${order._id}`} className="card order-card">
      <div className="order-card-top">
        <h3>{order.title}</h3>
        <StatusBadge status={order.status} />
      </div>
      <div className="order-card-meta">
        <span className="chip">{TYPE_LABELS[order.type] || order.type}</span>
        {order.deadline && (
          <span className={overdue ? 'deadline overdue' : 'deadline'}>
            Due {formatDate(order.deadline)}
            {overdue ? ' — overdue' : ''}
          </span>
        )}
      </div>
      {order.client && order.client.name && (
        <p className="muted small">Client: {order.client.name}</p>
      )}
    </Link>
  );
}
