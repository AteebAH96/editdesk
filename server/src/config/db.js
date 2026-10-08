const mongoose = require('mongoose');

// Cache the connection across serverless invocations so a new MongoDB
// connection isn't opened on every request (Atlas M0 allows max 500).
let cached = global.__editdesk_mongoose;
if (!cached) {
  cached = global.__editdesk_mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set. Copy .env.example to .env and set it.');
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((m) => {
      console.log('MongoDB connected');
      return m;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
