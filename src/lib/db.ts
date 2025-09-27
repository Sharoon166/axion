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
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // Increased from 5s to 10s
      socketTimeoutMS: 30000, // Reduced from 45s to 30s
      connectTimeoutMS: 10000, // Added connection timeout
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

export default dbConnect;