const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { parseCookies } = require('./security');

function getTokenFromHeader(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return parseCookies(req.headers.cookie).editdesk_session || null;
}

// Verifies the JWT and attaches req.userId / req.userRole. 401 on any problem.
function authRequired(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      audience: 'editdesk-web',
      issuer: 'editdesk-api',
    });
    req.userId = payload.sub;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Loads the full user document. Use after authRequired when you need more
// than the id/role from the token.
async function loadUser(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('+passwordChangedAt');
    if (!user) {
      return res.status(401).json({ error: 'Account no longer exists' });
    }
    req.user = user;
    req.userRole = user.role;
    return next();
  } catch (err) {
    return next(err);
  }
}

// Restricts a route to specific roles, e.g. requireRole('admin').
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    return next();
  };
}

module.exports = { authRequired, loadUser, requireRole };
