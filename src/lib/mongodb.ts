/* ─────────────────────────────────────────────────────────────────────────────
 * DISABLED — MongoDB was removed from the site on 2026-08-19.
 *
 * Submissions now go straight to Microsoft 365 (OneDrive) and are emailed to
 * the team, so no database is involved. This file is kept, commented out, in
 * case the database is reintroduced later.
 *
 * To restore: uncomment everything below, reinstate the `mongoose` import in
 * the API route that used it, and set MONGODB_URI in the environment.
 * ───────────────────────────────────────────────────────────────────────── */

/*
import mongoose from "mongoose";

/**
 * Serverless-safe MongoDB connection.
 *
 * On Vercel every request can land on a cold lambda, so we cache the connection
 * on `global` to survive hot reloads and warm invocations instead of opening a
 * new one per request (Atlas M0 caps out at 500 connections).
 *
 * Atlas free-tier (M0) notes:
 *  - M0 clusters are auto-paused after 60 days with zero connections. The cron
 *    job in vercel.json pings /api/health daily, which resets that timer and
 *    keeps the cluster from ever being paused.
 *  - A cluster that has been idle still answers, but the first connection after
 *    a long gap is slow. The timeouts below fail fast rather than hanging the
 *    request for the driver's 30s default, and `connectWithRetry` gives a
 *    waking cluster a second chance before surfacing an error.
 *\/

const MONGODB_URI = process.env.MONGODB_URI;

// Tuned for serverless: a small pool per lambda (many lambdas × large pools
// exhausts M0's connection cap), and short timeouts so a bad connection
// surfaces quickly instead of holding the request open.
const CONNECT_OPTIONS: mongoose.ConnectOptions = {
  bufferCommands: false,
  maxPoolSize: 10,
  minPoolSize: 0,
  // Fail fast. A healthy Atlas cluster selects a server in well under a
  // second; anything past this is an outage, and the form routes need to fall
  // back to email delivery rather than hold the visitor's request open.
  serverSelectionTimeoutMS: 5_000,
  socketTimeoutMS: 15_000,
  // Drop idle sockets so a paused lambda isn't holding a slot on the cluster.
  maxIdleTimeMS: 60_000,
  retryWrites: true,
};

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongoose ?? { conn: null, promise: null };
global._mongoose = cached;

async function connectWithRetry(attempts = 2): Promise<typeof mongoose> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await mongoose.connect(MONGODB_URI as string, CONNECT_OPTIONS);
    } catch (err) {
      lastError = err;
      // A cluster waking from idle often refuses the first attempt. Pause
      // briefly, then try once more before giving up.
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }
  throw lastError;
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your .env.local (see .env.local.example)."
    );
  }

  // Reuse a live connection. readyState 1 = connected.
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = connectWithRetry();
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Critical: clear the rejected promise. Without this the same failed
    // promise is re-awaited on every later request and the app can never
    // recover from a transient outage without a redeploy.
    cached.promise = null;
    cached.conn = null;
    throw err;
  }

  return cached.conn;
}

*/
