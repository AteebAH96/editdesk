import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiErrorMessage } from '../api.js';
import OrderCard from '../components/OrderCard.jsx';

export default function ClientDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/orders');
        setOrders(data.orders);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load your orders'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>My orders</h1>
          <p className="muted">Every edit you have requested, from brief to delivery.</p>
        </div>
        <Link to="/orders/new" className="btn btn-primary">
          New order
        </Link>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {loading ? (
        <p className="muted">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <div className="card empty-state">
          <h2>No orders yet</h2>
          <p className="muted">
            Tell your editor what you need — a reel, a promo, a full cinematic cut.
          </p>
          <Link to="/orders/new" className="btn btn-primary">
            Place your first order
          </Link>
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
