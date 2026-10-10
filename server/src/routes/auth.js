const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authRequired, loadUser } = require('../middleware/auth');
const { cookieOptions, newCsrfToken } = require('../config/env');
const { rateLimit } = require('../middleware/security');

const router = express.Router();
const DUMMY_PASSWORD_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxQZ/hNf8bDnjbK1SaAJhZ7cQ2K';

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      audience: 'editdesk-web',
      issuer: 'editdesk-api',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
}

function establishSession(res, user) {
  const csrfToken = newCsrfToken();
  res.cookie('editdesk_session', signToken(user), cookieOptions(true));
  res.cookie('editdesk_csrf', csrfToken, cookieOptions(false));
  return csrfToken;
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  key: (req) => `${req.ip}:${String(req.body?.email || '').trim().toLowerCase()}`,
});

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// POST /api/auth/register — public. New accounts are always clients;
// admin accounts are created via the seed script.
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be 12 to 128 characters' });
    }

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'client',
    });

    return res.status(201).json({ csrfToken: establishSession(res, user), user: user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/login — public.
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!isValidEmail(email) || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
    if (!user) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.json({ csrfToken: establishSession(res, user), user: user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
});

// GET /api/auth/me — who am I? Used by the client to restore sessions.
router.get('/me', authRequired, loadUser, (req, res) => {
  const csrfToken = newCsrfToken();
  res.cookie('editdesk_csrf', csrfToken, cookieOptions(false));
  return res.json({ csrfToken, user: req.user.toSafeJSON() });
});

router.post('/logout', (req, res) => {
  const { maxAge, ...options } = cookieOptions(true);
  res.clearCookie('editdesk_session', options);
  const { maxAge: csrfMaxAge, ...csrfOptions } = cookieOptions(false);
  res.clearCookie('editdesk_csrf', csrfOptions);
  return res.status(204).end();
});

module.exports = router;
