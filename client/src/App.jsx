import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ClientDashboard from './pages/ClientDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import NewOrder from './pages/NewOrder.jsx';

function RoleHome() {
  const { user, initializing } = useAuth();
  if (initializing) return <div className="page"><p className="muted">Loading…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

function NotFound() {
  return (
    <div className="page">
      <div className="card empty-state">
        <h1>Page not found</h1>
        <p className="muted">This cut ended up on the editing room floor.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="client">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/new"
            element={
              <ProtectedRoute role="client">
                <NewOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="footer">
        <span className="muted small">EditDesk — from brief to final cut.</span>
      </footer>
    </div>
  );
}
