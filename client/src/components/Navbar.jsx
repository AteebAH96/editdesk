import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark">ED</span>
        <span className="brand-name">EditDesk</span>
      </Link>
      <nav className="nav-links">
        <ThemeToggle />
        {user ? (
          <>
            {user.role === 'admin' ? (
              <Link to="/admin">All orders</Link>
            ) : (
              <>
                <Link to="/dashboard">My orders</Link>
                <Link to="/orders/new" className="btn btn-primary btn-sm">
                  New order
                </Link>
              </>
            )}
            <span className="nav-user">
              {user.name} <em>({user.role})</em>
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
