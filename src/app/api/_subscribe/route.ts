/* ─────────────────────────────────────────────────────────────────────────────
 * DISABLED — 2026-08-19.
 *
 * The newsletter sign-up wrote subscribers straight to MongoDB and had no
 * other destination, so it is switched off along with the database. The
 * footer form that called it is commented out in src/components/Footer.tsx.
 *
 * Kept commented out in case it is needed again. To restore: uncomment
 * everything below and re-enable src/lib/mongodb.ts and the models.
 * ───────────────────────────────────────────────────────────────────────── */

/*
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? ""));
    if (!emailOk) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    try {
      await Subscriber.create({ email });
    } catch (e: any) {
      // Duplicate key => already subscribed. Treat as success.
      if (e?.code !== 11000) throw e;
    }

    return NextResponse.json(
      { message: "You're subscribed! Thanks for joining our newsletter." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}

*/
