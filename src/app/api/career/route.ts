import { NextResponse } from "next/server";
import { preflight, withCors } from "@/lib/cors";
import { sendCareerApplicationEmail, sendCareerConfirmation, type MailLocale } from "@/lib/email";
import { uploadToOneDrive, isGraphConfigured, isGraphMailConfigured } from "@/lib/msGraph";
import {
  MAX_UPLOAD_BYTES,
  RESUME_MIME_TYPES,
  CAREER_FOLDER,
  resumeFormat,
  storedUploadName,
  tooLongField,
} from "@/lib/uploads";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { isHoneypotFilled, HONEYPOT_FIELD } from "@/lib/honeypot";

// Browser pre-flight for the cross-origin POST from the static site.
export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  try {
    const limit = rateLimit("career", clientIp(request));
    if (!limit.ok) {
      return withCors(NextResponse.json(
        { error: "Too many applications from this connection. Please try again in a few minutes." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      ), request);
    }

    const formData = await request.formData();

    // See the contact route — a bot gets the success wording, not a hint.
    if (isHoneypotFilled(formData.get(HONEYPOT_FIELD))) {
      console.warn("[career] Honeypot triggered — submission dropped.");
      return withCors(NextResponse.json(
        { message: "Thanks for applying! Our team will review your application and be in touch soon." },
        { status: 201 }
      ), request);
    }

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const position = String(formData.get("position") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    // See the contact route — the applicant is written to in their own language.
    const locale: MailLocale = formData.get("locale") === "en" ? "en" : "de";

    const resumeEntry = formData.get("resume");
    const resume = resumeEntry instanceof File && resumeEntry.size > 0 ? resumeEntry : null;

    if (!name || !email || !resume) {
      return withCors(NextResponse.json(
        { error: "Name, email and a resume file are required." },
        { status: 400 }
      ), request);
    }

    // Allowlist, not "anything except whitespace and @". The old pattern
    // accepted `a?cc=attacker@evil.example&body=...`, which then survived
    // HTML escaping into the mailto: href of the staff notification and
    // pre-filled a reply composer with attacker-chosen recipients.
    const overLong = tooLongField({ name, email, phone, position, message });
    if (overLong) {
      return withCors(NextResponse.json(
        { error: `That ${overLong.field} is too long (maximum ${overLong.limit} characters).` },
        { status: 400 }
      ), request);
    }

    const emailOk = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(
      email
    );
    if (!emailOk) {
      return withCors(NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      ), request);
    }

    if (resume.size > MAX_UPLOAD_BYTES) {
      return withCors(NextResponse.json(
        { error: "Resume must be 5MB or smaller." },
        { status: 400 }
      ), request);
    }

    if (!RESUME_MIME_TYPES.includes(resume.type)) {
      return withCors(NextResponse.json(
        { error: "Resume must be a PDF or Word document." },
        { status: 400 }
      ), request);
    }

    // The CV is the point of the application, so unlike the contact photo a
    // failed upload is fatal here — without it there is nothing to review.
    if (!isGraphConfigured() || !isGraphMailConfigured()) {
      console.error(
        "[career] Microsoft Graph is not fully configured — need storage credentials " +
          "(MS_GRAPH_TENANT_ID/CLIENT_ID/CLIENT_SECRET + a destination) and " +
          "MS_GRAPH_SENDER_EMAIL. Refusing the application rather than losing it."
      );
      return withCors(NextResponse.json(
        { error: "We couldn't submit your application right now. Please try again in a moment." },
        { status: 503 }
      ), request);
    }

    const buffer = Buffer.from(await resume.arrayBuffer());

    // The MIME check above only tested what the client CLAIMED. This tests the
    // bytes, structurally. Without it, "resume=@shell.sh;type=application/pdf"
    // put an arbitrary file into the CV folder for a colleague to open.
    const format = resumeFormat(buffer);
    if (!format) {
      console.warn(
        `[career] Upload rejected: declared "${resume.type}" but the content is not a PDF or Word document.`
      );
      return withCors(NextResponse.json(
        { error: "That file does not look like a PDF or Word document. Please upload your CV as a PDF or DOCX." },
        { status: 400 }
      ), request);
    }

    // Store it under OUR name with the extension the bytes earned, not the
    // caller's — the extension is what decides how a colleague's machine opens
    // the file, so it must follow the detected format.
    const uploaded = await uploadToOneDrive(
      buffer,
      storedUploadName(resume.name, format),
      CAREER_FOLDER
    );
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

    // The team has the application; the applicant's acknowledgement is a
    // courtesy on top and must never turn a successful submission into an error.
    try {
      await sendCareerConfirmation(
        { name, email, position, resumeFileName: resume.name },
        locale
      );
    } catch (err) {
      console.error("[career] Acknowledgement to the applicant failed:", err);
    }

    return withCors(NextResponse.json(
      { message: "Thanks for applying! Our team will review your application and be in touch soon." },
      { status: 201 }
    ), request);
  } catch (err) {
    console.error("Career application error:", err);
    return withCors(NextResponse.json(
      { error: "We couldn't submit your application right now. Please try again in a moment." },
      { status: 503 }
    ), request);
  }
}
