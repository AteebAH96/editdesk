const crypto = require('crypto');

function securityHeaders(req, res, next) {
  res.set({
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site',
    'Origin-Agent-Cluster': '?1',
    'Referrer-Policy': 'no-referrer',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-Permitted-Cross-Domain-Policies': 'none',
  });
  res.removeHeader('X-Powered-By');
  next();
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
      const separator = part.indexOf('=');
      if (separator < 0) return [part, ''];
      const key = part.slice(0, separator);
      try { return [key, decodeURIComponent(part.slice(separator + 1))]; } catch { return [key, '']; }
    })
  );
}

function csrfProtection(req, res, next) {
  const sessionBootstrap = req.method === 'POST' &&
    ['/api/auth/login', '/api/auth/register'].includes(req.path);
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.headers.authorization || sessionBootstrap) return next();
  const cookies = parseCookies(req.headers.cookie);
  const headerToken = req.get('x-csrf-token') || '';
  const cookieToken = cookies.editdesk_csrf || '';
  const valid = headerToken.length === cookieToken.length && headerToken.length >= 32 &&
    crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(cookieToken));
  if (!valid) return res.status(403).json({ error: 'Invalid CSRF token' });
  return next();
}

function rejectUnsafeKeys(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(rejectUnsafeKeys);
  return Object.entries(value).some(([key, child]) =>
    key.startsWith('$') || key.includes('.') || rejectUnsafeKeys(child));
}

function requestSanitizer(req, res, next) {
  if (rejectUnsafeKeys(req.body) || rejectUnsafeKeys(req.query) || rejectUnsafeKeys(req.params)) {
    return res.status(400).json({ error: 'Invalid request fields' });
  }
  return next();
}

function rateLimit({ windowMs, limit, key = (req) => req.ip }) {
  const hits = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of hits) if (entry.resetAt <= now) hits.delete(id);
  }, Math.min(windowMs, 60_000));
  timer.unref();

  return (req, res, next) => {
    const id = key(req);
    const now = Date.now();
    let entry = hits.get(id);
    if (!entry || entry.resetAt <= now) entry = { count: 0, resetAt: now + windowMs };
    entry.count += 1;
    hits.set(id, entry);
    res.set('RateLimit-Limit', String(limit));
    res.set('RateLimit-Remaining', String(Math.max(0, limit - entry.count)));
    res.set('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
    if (entry.count > limit) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    return next();
  };
}

module.exports = { csrfProtection, parseCookies, rateLimit, requestSanitizer, securityHeaders };
