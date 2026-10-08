import React from 'react';

const STATUS_CLASSES = {
  Pending: 'badge-pending',
  'In Progress': 'badge-progress',
  'In Review': 'badge-review',
  Delivered: 'badge-delivered',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_CLASSES[status] || 'badge-pending';
  return <span className={`badge ${cls}`}>{status}</span>;
}
