import { NextResponse } from "next/server";
import { preflight, withCors } from "@/lib/cors";
import { sendContactEmail, sendContactConfirmation, type MailLocale } from "@/lib/email";
import { uploadToOneDrive, isGraphConfigured } from "@/lib/msGraph";
import {
  MAX_UPLOAD_BYTES,
  IMAGE_MIME_TYPES,
  CONTACT_FOLDER,
  imageFormat,
  storedUploadName,
  tooLongField,
} from "@/lib/uploads";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { isHoneypotFilled, HONEYPOT_FIELD } from "@/lib/honeypot";

function toNumber(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

// Browser pre-flight for the cross-origin POST from the static site.
export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  try {
    // Throttle before reading the body — an abusive caller should not get a
    // multipart parse (and a possible 5MB upload) out of us on every attempt.
    const limit = rateLimit("contact", clientIp(request));
    if (!limit.ok) {
      return withCors(NextResponse.json(
        { error: "Too many messages from this connection. Please try again in a few minutes." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      ), request);
    }

    const formData = await request.formData();

    // Bot check. Answer exactly as a success would look: a bot that gets an
    // error learns to work around the field, one that gets "sent" does not.
    if (isHoneypotFilled(formData.get(HONEYPOT_FIELD))) {
      console.warn("[contact] Honeypot triggered — submission dropped.");
      return withCors(NextResponse.json(
        { message: "Thanks for reaching out! We'll get back to you soon." },
        { status: 201 }
      ), request);
    }

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    // Which language the visitor filled the form in, so the acknowledgement
    // goes out in that language. Anything unexpected falls back to German,
    // which is the site's default locale.
    const locale: MailLocale = formData.get("locale") === "en" ? "en" : "de";

    const dimensions = {
      length: toNumber(formData.get("length")),
      width: toNumber(formData.get("width")),
      height: toNumber(formData.get("height")),
      weight: toNumber(formData.get("weight")),
    };

    const imageEntry = formData.get("image");
    const image = imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null;

    if (!name || !email || !message) {
      return withCors(NextResponse.json(
        { error: "Name, email and message are required." },
        { status: 400 }
      ), request);
    }

    // Allowlist, not "anything except whitespace and @". The old pattern
    // accepted `a?cc=attacker@evil.example&body=...`, which then survived
    // HTML escaping into the mailto: href of the staff notification and
    // pre-filled a reply composer with attacker-chosen recipients.
    const overLong = tooLongField({ name, email, phone, subject, message });
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

    if (image) {
      if (image.size > MAX_UPLOAD_BYTES) {
        return withCors(NextResponse.json(
          { error: "Image must be 5MB or smaller." },
          { status: 400 }
        ), request);
      }
      if (!IMAGE_MIME_TYPES.includes(image.type)) {
        return withCors(NextResponse.json(
          { error: "Image must be a JPG, PNG or WEBP file." },
          { status: 400 }
        ), request);
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

          // See the career route: the declared MIME type is a claim, the bytes
          // are the fact. A photo that is not a photo is dropped, but the
          // enquiry still goes through - the message matters more than the
          // attachment.
          const format = imageFormat(buffer);
          if (!format) {
            console.warn(
              `[contact] Photo dropped: declared "${image.type}" but the content is not a JPEG, PNG or WEBP.`
            );
          } else {
            const uploaded = await uploadToOneDrive(
              buffer,
              storedUploadName(image.name, format),
              CONTACT_FOLDER
            );
            imageUrl = uploaded.webUrl;
          }
        } catch (err) {
          console.error("[contact] OneDrive upload failed:", err);
        }
      }
    }

    // With no database, the email is the only record — so a failure here has
    // to reach the visitor, otherwise the enquiry is silently lost.
    await sendContactEmail({ name, email, phone, subject, message, dimensions, imageUrl });

    // The team now has the enquiry, so it is safe. The acknowledgement to the
    // visitor is a courtesy on top: if it fails we log it and still report
    // success, because the submission genuinely did succeed.
    try {
      await sendContactConfirmation({ name, email, subject, message }, locale);
    } catch (err) {
      console.error("[contact] Acknowledgement to the visitor failed:", err);
    }

    return withCors(NextResponse.json(
      { message: "Thanks for reaching out! We'll get back to you soon." },
      { status: 201 }
    ), request);
  } catch (err) {
    console.error("Contact form error:", err);
    return withCors(NextResponse.json(
      { error: "We couldn't send your message right now. Please try again in a moment." },
      { status: 503 }
    ), request);
  }
}
