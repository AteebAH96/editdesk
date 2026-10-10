const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const messageRoutes = require('./routes/messages');
const { parseOrigins, validateEnvironment } = require('./config/env');
const { csrfProtection, rateLimit, requestSanitizer, securityHeaders } = require('./middleware/security');

validateEnvironment();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(cors({
  origin(origin, callback) {
    const allowed = parseOrigins(process.env.CLIENT_URL);
    if (!origin || allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 600,
}));
app.use(express.json({ limit: '32kb', strict: true }));
app.use(requestSanitizer);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.use(csrfProtection);

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'editdesk-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/orders', messageRoutes);

app.use((err, req, res, next) => {
  if (err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid identifier' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body too large' });
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  if (process.env.NODE_ENV !== 'production') console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

module.exports = app;
