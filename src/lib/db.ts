import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const MONGODB_URI = process.env.MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) {
    // Check if connection is still alive
    try {
      if (cached.conn.connection.readyState === 1) {
        // Additional ping test to ensure connection is truly alive
        await cached.conn.connection.db?.admin().ping();
        return cached.conn;
      }
    } catch (error) {
      // Connection check failed, reset cache
      console.warn('Database connection check failed, reconnecting...', error);
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true, // Changed to true for better reliability
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000, // Increased timeout
      socketTimeoutMS: 45000, // Increased socket timeout
      connectTimeoutMS: 15000, // Increased connection timeout
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      retryReads: true,
      heartbeatFrequencyMS: 10000, // Added heartbeat
      maxIdleTimeMS: 30000, // Added max idle time
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('Database connection failed:', e);
    throw e;
  }

  return cached.conn;
}

// Health check function
export async function checkConnection() {
  try {
    const conn = await dbConnect();
    const state = conn.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return {
      status: states[state as keyof typeof states] || 'unknown',
      readyState: state
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default dbConnect;