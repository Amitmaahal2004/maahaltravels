import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

/**
 * Safely masks username and password from a MongoDB URI for logging.
 */
export function maskMongoUri(uri: string): string {
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
  } catch {
    return "[MASKED_URI]";
  }
}

/**
 * Normalizes and validates the MongoDB URI.
 * Handles unencoded special characters (e.g., raw @ in passwords) if present.
 */
export function validateAndNormalizeMongoUri(rawUri: string): string {
  if (!rawUri || typeof rawUri !== "string") {
    throw new Error(
      "Missing MONGODB_URI environment variable. Please configure MONGODB_URI in .env or .env.local."
    );
  }

  const trimmed = rawUri.trim();

  if (!trimmed.startsWith("mongodb://") && !trimmed.startsWith("mongodb+srv://")) {
    throw new Error(
      "Invalid MONGODB_URI: Connection string must start with 'mongodb://' or 'mongodb+srv://'."
    );
  }

  // Check for unencoded '@' characters in the userinfo section
  // Example pattern: mongodb+srv://username:pass@word@cluster.mongodb.net/...
  const protocolEnd = trimmed.indexOf("://");
  const protocol = trimmed.substring(0, protocolEnd + 3);
  const remainder = trimmed.substring(protocolEnd + 3);

  const queryStart = remainder.indexOf("?");
  const basePart = queryStart === -1 ? remainder : remainder.substring(0, queryStart);
  const queryPart = queryStart === -1 ? "" : remainder.substring(queryStart);

  // Find all '@' characters in basePart
  const atIndices: number[] = [];
  for (let i = 0; i < basePart.length; i++) {
    if (basePart[i] === "@") atIndices.push(i);
  }

  // If there are multiple '@' characters, the last '@' separates userinfo from hostname
  if (atIndices.length > 1) {
    const lastAtIndex = atIndices[atIndices.length - 1];
    const userInfo = basePart.substring(0, lastAtIndex);
    const hostAndDb = basePart.substring(lastAtIndex + 1);

    const colonIndex = userInfo.indexOf(":");
    if (colonIndex !== -1) {
      const username = userInfo.substring(0, colonIndex);
      const rawPassword = userInfo.substring(colonIndex + 1);
      const encodedPassword = encodeURIComponent(decodeURIComponent(rawPassword));
      const normalized = `${protocol}${username}:${encodedPassword}@${hostAndDb}${queryPart}`;
      return normalized;
    }
  }

  return trimmed;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    throw new Error(
      "Missing MONGODB_URI environment variable. Please define MONGODB_URI in your environment (.env / .env.local)."
    );
  }

  const uri = validateAndNormalizeMongoUri(rawUri);

  if (cached!.conn && cached!.conn.connection.readyState === 1) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const dbName = process.env.MONGODB_DB || undefined;
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      dbName,
    };

    const masked = maskMongoUri(uri);
    if (process.env.NODE_ENV !== "production") {
      console.info(`[MongoDB] Connecting to ${masked}${dbName ? ` (database: ${dbName})` : ""}...`);
    }

    cached!.promise = mongoose
      .connect(uri, opts)
      .then((mongooseInstance) => {
        if (process.env.NODE_ENV !== "production") {
          console.info("[MongoDB] Connected successfully to database.");
        }
        return mongooseInstance;
      })
      .catch((err) => {
        console.error(`[MongoDB] Connection error to ${masked}:`, err.message);
        throw err;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export async function disconnectDatabase(): Promise<void> {
  if (cached?.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

export default connectToDatabase;
