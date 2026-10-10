const crypto = require('crypto');

const PRODUCTION = process.env.NODE_ENV === 'production';

function parseOrigins(value) {
  const origins = (value || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  for (const origin of origins) {
    const url = new URL(origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
      throw new Error(`Invalid CLIENT_URL origin: ${origin}`);
    }
  }
  return origins;
}

function validateEnvironment() {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32 || /change-this|replace-with|secret|password/i.test(secret)) {
    throw new Error('JWT_SECRET must be a unique random value of at least 32 characters');
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
  if (PRODUCTION && !process.env.CLIENT_URL) throw new Error('CLIENT_URL is required in production');
  parseOrigins(process.env.CLIENT_URL);
}

function cookieOptions(httpOnly = true) {
  const sameSite = (process.env.AUTH_COOKIE_SAMESITE || (PRODUCTION ? 'none' : 'lax')).toLowerCase();
  if (!['strict', 'lax', 'none'].includes(sameSite)) {
    throw new Error('AUTH_COOKIE_SAMESITE must be strict, lax, or none');
  }
  return {
    httpOnly,
    secure: PRODUCTION || sameSite === 'none',
    sameSite,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function newCsrfToken() {
  return crypto.randomBytes(32).toString('base64url');
}

module.exports = { PRODUCTION, cookieOptions, newCsrfToken, parseOrigins, validateEnvironment };
