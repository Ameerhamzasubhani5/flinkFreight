import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";
import { uploadToOneDrive, isGraphConfigured } from "@/lib/msGraph";
import { MAX_UPLOAD_BYTES, IMAGE_MIME_TYPES } from "@/lib/uploads";

/* ─────────────────────────────────────────────────────────────────────────────
 * DISABLED — database persistence, removed 2026-08-19.
 *
 * Enquiries are no longer stored in MongoDB. The photo goes to Microsoft 365
 * (OneDrive) and the team gets an email containing a link to it, so the inbox
 * is the record. To restore the database, uncomment these imports and the
 * `Contact.create(...)` block further down, and uncomment src/lib/mongodb.ts
 * and src/models/Contact.ts.
 *
 * import { connectToDatabase } from "@/lib/mongodb";
 * import Contact from "@/models/Contact";
 * import { deliverSubmission } from "@/lib/submissions";
 * ───────────────────────────────────────────────────────────────────────── */

function toNumber(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    const dimensions = {
      length: toNumber(formData.get("length")),
      width: toNumber(formData.get("width")),
      height: toNumber(formData.get("height")),
      weight: toNumber(formData.get("weight")),
    };

    const imageEntry = formData.get("image");
    const image = imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email and message are required." },
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

    if (image) {
      if (image.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "Image must be 5MB or smaller." },
          { status: 400 }
        );
      }
      if (!IMAGE_MIME_TYPES.includes(image.type)) {
        return NextResponse.json(
          { error: "Image must be a JPG, PNG or WEBP file." },
          { status: 400 }
        );
      }
    }

    // Upload the photo to OneDrive first — the email carries a link to it.
    // A failed upload does not block the enquiry: the team still gets the
    // message, just without the photo, and the error is logged.
    let imageUrl: string | undefined;
    if (image) {
      if (!isGraphConfigured()) {
        console.warn(
          "[contact] Microsoft Graph is not configured — the photo was not stored."
        );
      } else {
        try {
          const buffer = Buffer.from(await image.arrayBuffer());
          const uploaded = await uploadToOneDrive(buffer, image.name, "ContactUploads");
          imageUrl = uploaded.webUrl;
        } catch (err) {
          console.error("[contact] OneDrive upload failed:", err);
        }
      }
    }

    // With no database, the email is the only record — so a failure here has
    // to reach the visitor, otherwise the enquiry is silently lost.
    await sendContactEmail({ name, email, phone, subject, message, dimensions, imageUrl });

    return NextResponse.json(
      { message: "Thanks for reaching out! We'll get back to you soon." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "We couldn't send your message right now. Please try again in a moment." },
      { status: 503 }
    );
  }
}
