import React, { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../api.js';
import OrderCard from '../components/OrderCard.jsx';
import { ORDER_STATUSES } from '../utils.js';

const FILTERS = ['All', ...ORDER_STATUSES];

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const params = filter === 'All' ? {} : { status: filter };
        const { data } = await api.get('/orders', { params });
        setOrders(data.orders);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load orders'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter]);

  const counts = orders.length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>All orders</h1>
          <p className="muted">
            {loading ? 'Loading…' : `${counts} order${counts === 1 ? '' : 's'} shown`}
          </p>
        </div>
      </div>

      <div className="filter-row" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {loading ? (
        <p className="muted">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="card empty-state">
          <h2>Nothing here</h2>
          <p className="muted">No orders match this filter yet.</p>
        </div>
      ) : (
        <div className="order-grid">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
