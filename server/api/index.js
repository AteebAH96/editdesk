// Vercel serverless entry point. `vercel.json` rewrites every /api/* request here,
// and the Express app below handles the routing.
const connectDB = require('../src/config/db');
const app = require('../src/app');

let ready = null;
function ensureDB() {
  if (!ready) ready = connectDB().catch((err) => {
    ready = null; // allow a retry on the next request
    throw err;
  });
  return ready;
}

module.exports = async (req, res) => {
  try {
    await ensureDB();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('DB connection failed:', err.message);
    res.status(500).json({ error: 'Database unavailable' });
    return;
  }
  return app(req, res);
};
