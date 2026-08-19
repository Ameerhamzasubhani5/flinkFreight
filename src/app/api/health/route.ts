import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";

// Never cached — this must hit the database on every call to be useful both as
// a keep-alive and as a health check.
export const dynamic = "force-dynamic";

/**
 * Health check + Atlas keep-alive.
 *
 * Vercel Cron calls this daily (see vercel.json). Atlas pauses M0 free-tier
 * clusters after 60 days without a connection; a daily ping resets that timer
 * so the cluster is never paused and never needs a manual resume.
 *
 * Also useful for uptime monitors — returns 200 only when the database is
 * actually reachable.
 */
export async function GET() {
  const startedAt = Date.now();

  try {
    await connectToDatabase();
    // A real round-trip to the server, not just a cached connection object.
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database handle unavailable after connect.");
    await db.admin().ping();

    return NextResponse.json({
      status: "ok",
      database: "connected",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Health check failed:", err);
    return NextResponse.json(
      {
        status: "error",
        database: "unreachable",
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
