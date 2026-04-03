const mongoose = require('mongoose');
const dns = require('dns');

// Use Google public DNS for local dev
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}

// Global cached connection for Serverless
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in .env');

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('🔄 Creating new MongoDB connection...');
    const opts = {
      bufferCommands: false, // Fail fast in serverless if not connected
      serverSelectionTimeoutMS: 5000,
      family: 4
    };

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      console.log('✅ Connected to MongoDB Atlas');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', e.message);
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;
