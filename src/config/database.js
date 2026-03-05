// ─────────────────────────────────────────────────────────────
//  config/database.js  – MongoDB connection via Mongoose
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp-bot';

// Connection options
const options = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGO_URI, options);
    console.log(`[MongoDB] Connected → ${conn.connection.host} / ${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected. Attempting to reconnect...');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB] Reconnected successfully.');
    });
    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err.message);
    });

  } catch (err) {
    console.error('[MongoDB] Initial connection failed:', err.message);
    console.error('  Make sure MongoDB is running or your MONGO_URI is correct in .env');
    process.exit(1);
  }
}

async function disconnectDB() {
  await mongoose.connection.close();
  console.log('[MongoDB] Connection closed.');
}

module.exports = { connectDB, disconnectDB };
