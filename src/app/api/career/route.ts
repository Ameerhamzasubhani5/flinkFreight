import { NextResponse } from "next/server";
import { sendCareerApplicationEmail } from "@/lib/email";
import { uploadToOneDrive, isGraphConfigured } from "@/lib/msGraph";
import { MAX_UPLOAD_BYTES, RESUME_MIME_TYPES } from "@/lib/uploads";

/* ─────────────────────────────────────────────────────────────────────────────
 * DISABLED — database persistence, removed 2026-08-19.
 *
 * Applications are no longer stored in MongoDB. The CV goes to Microsoft 365
 * (OneDrive) and the team gets an email containing a link to it, so the inbox
 * is the record. To restore the database, uncomment these imports and the
 * `CareerApplication.create(...)` block further down, and uncomment
 * src/lib/mongodb.ts and src/models/CareerApplication.ts.
 *
 * import { connectToDatabase } from "@/lib/mongodb";
 * import CareerApplication from "@/models/CareerApplication";
 * import { deliverSubmission } from "@/lib/submissions";
 * ───────────────────────────────────────────────────────────────────────── */

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const position = String(formData.get("position") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    const resumeEntry = formData.get("resume");
    const resume = resumeEntry instanceof File && resumeEntry.size > 0 ? resumeEntry : null;

    if (!name || !email || !resume) {
      return NextResponse.json(
        { error: "Name, email and a resume file are required." },
        { status: 400 }
      );
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (resume.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Resume must be 5MB or smaller." },
        { status: 400 }
      );
    }

    if (!RESUME_MIME_TYPES.includes(resume.type)) {
      return NextResponse.json(
        { error: "Resume must be a PDF or Word document." },
        { status: 400 }
      );
    }

    // The CV is the point of the application, so unlike the contact photo a
    // failed upload is fatal here — without it there is nothing to review.
    if (!isGraphConfigured()) {
      console.error(
        "[career] Microsoft Graph is not configured — cannot store the CV."
      );
      return NextResponse.json(
        { error: "We couldn't submit your application right now. Please try again in a moment." },
        { status: 503 }
      );
    }

    const buffer = Buffer.from(await resume.arrayBuffer());
    const uploaded = await uploadToOneDrive(buffer, resume.name, "CareerApplications");
    const resumeUrl = uploaded.webUrl;

    // With no database, the email is the only record of the application.
    await sendCareerApplicationEmail({
      name,
      email,
      phone,
      position,
      message,
      resumeFileName: resume.name,
      resumeUrl,
    });

    return NextResponse.json(
      { message: "Thanks for applying! Our team will review your application and be in touch soon." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Career application error:", err);
    return NextResponse.json(
      { error: "We couldn't submit your application right now. Please try again in a moment." },
      { status: 503 }
    );
  }
}
