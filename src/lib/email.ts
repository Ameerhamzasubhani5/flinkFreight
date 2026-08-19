import { Resend } from "resend";

// Lazily instantiated so the module is safe to import even when the key is absent.
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set in environment variables.");
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const TO = process.env.CONTACT_TO_EMAIL ?? "";
// Career applications default to the same inbox as the contact form unless a
// dedicated one is configured.
const CAREER_TO = process.env.CAREER_TO_EMAIL ?? TO;

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
  imageUrl?: string;
}

export interface CareerApplicationPayload {
  name: string;
  email: string;
  phone?: string;
  position?: string;
  message?: string;
  resumeFileName: string;
  resumeUrl?: string;
}

export async function sendContactEmail(data: ContactPayload) {
  if (!TO) {
    // Throw rather than silently returning: the caller treats a resolved
    // promise as "the team was notified", so a missing recipient has to be
    // reported as a failed delivery channel, not a successful one.
    throw new Error("CONTACT_TO_EMAIL is not set — cannot dispatch notification.");
  }

  const resend = getResend();

  const dims = data.dimensions;
  const hasDims =
    dims && (dims.length || dims.width || dims.height || dims.weight);

  await resend.emails.send({
    from: `Flink Freight <${FROM}>`,
    to: [TO],
    replyTo: data.email,
    subject: data.subject
      ? `Contact Form: ${data.subject}`
      : `New contact from ${data.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background:#222222; padding:24px 32px;">
          <h1 style="color:#FFDC39; font-size:22px; margin:0; letter-spacing:2px; text-transform:uppercase;">
            FLINK FREIGHT
          </h1>
          <p style="color:#ffffff; font-size:11px; letter-spacing:4px; margin:4px 0 0; text-transform:uppercase;">
            LOGISTICS
          </p>
        </div>

        <div style="padding:32px; border:1px solid #e5e7eb; border-top:none;">
          <h2 style="color:#222222; font-size:18px; margin:0 0 24px;">New Contact Form Submission</h2>

          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px; width:120px; vertical-align:top;">Name</td>
              <td style="padding:8px 0; color:#111827; font-size:14px; font-weight:600;">${escapeHtml(data.name)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px; vertical-align:top;">Email</td>
              <td style="padding:8px 0; color:#111827; font-size:14px;">
                <a href="mailto:${escapeHtml(data.email)}" style="color:#1d4ed8;">${escapeHtml(data.email)}</a>
              </td>
            </tr>
            ${data.phone ? `
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px; vertical-align:top;">Phone</td>
              <td style="padding:8px 0; color:#111827; font-size:14px;">${escapeHtml(data.phone)}</td>
            </tr>` : ""}
            ${data.subject ? `
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px; vertical-align:top;">Subject</td>
              <td style="padding:8px 0; color:#111827; font-size:14px;">${escapeHtml(data.subject)}</td>
            </tr>` : ""}
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px; vertical-align:top;">Message</td>
              <td style="padding:8px 0; color:#111827; font-size:14px; white-space:pre-wrap;">${escapeHtml(data.message)}</td>
            </tr>
            ${hasDims ? `
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px; vertical-align:top;">Package</td>
              <td style="padding:8px 0; color:#111827; font-size:14px;">
                ${[
                  dims?.length ? `L: ${dims.length}cm` : null,
                  dims?.width ? `W: ${dims.width}cm` : null,
                  dims?.height ? `H: ${dims.height}cm` : null,
                  dims?.weight ? `Weight: ${dims.weight}kg` : null,
                ]
                  .filter(Boolean)
                  .join(" &middot; ")}
              </td>
            </tr>` : ""}
            ${data.imageUrl ? `
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px; vertical-align:top;">Photo</td>
              <td style="padding:8px 0; color:#111827; font-size:14px;">
                <a href="${escapeHtml(data.imageUrl)}" style="color:#1d4ed8;">View uploaded photo</a>
              </td>
            </tr>` : ""}
          </table>

          <div style="margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb;">
            <a href="mailto:${escapeHtml(data.email)}"
               style="display:inline-block; background:#FFDC39; color:#222222; font-weight:700;
                      padding:10px 24px; border-radius:6px; text-decoration:none; font-size:14px;">
              Reply to ${escapeHtml(data.name)}
            </a>
          </div>
        </div>
      </div>
    `,
  });
}

export async function sendCareerApplicationEmail(data: CareerApplicationPayload) {
  if (!CAREER_TO) {
    // See sendContactEmail — a missing recipient is a failed delivery channel.
    throw new Error(
      "CAREER_TO_EMAIL (or CONTACT_TO_EMAIL) is not set — cannot dispatch notification."
    );
  }

  const resend = getResend();

  await resend.emails.send({
    from: `Flink Freight <${FROM}>`,
    to: [CAREER_TO],
    replyTo: data.email,
    subject: data.position
      ? `New Career Application: ${data.name} — ${data.position}`
      : `New Career Application: ${data.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background:#222222; padding:24px 32px;">
          <h1 style="color:#FFDC39; font-size:22px; margin:0; letter-spacing:2px; text-transform:uppercase;">
            FLINK FREIGHT
          </h1>
          <p style="color:#ffffff; font-size:11px; letter-spacing:4px; margin:4px 0 0; text-transform:uppercase;">
            LOGISTICS
          </p>
        </div>

        <div style="padding:32px; border:1px solid #e5e7eb; border-top:none;">
          <h2 style="color:#222222; font-size:18px; margin:0 0 24px;">New Career Application</h2>

          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px; width:120px; vertical-align:top;">Name</td>
              <td style="padding:8px 0; color:#111827; font-size:14px; font-weight:600;">${escapeHtml(data.name)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px; vertical-align:top;">Email</td>
              <td style="padding:8px 0; color:#111827; font-size:14px;">
                <a href="mailto:${escapeHtml(data.email)}" style="color:#1d4ed8;">${escapeHtml(data.email)}</a>
              </td>
            </tr>
            ${data.phone ? `
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px; vertical-align:top;">Phone</td>
              <td style="padding:8px 0; color:#111827; font-size:14px;">${escapeHtml(data.phone)}</td>
            </tr>` : ""}
            ${data.position ? `
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px; vertical-align:top;">Position</td>
              <td style="padding:8px 0; color:#111827; font-size:14px;">${escapeHtml(data.position)}</td>
            </tr>` : ""}
            ${data.message ? `
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px; vertical-align:top;">Cover letter</td>
              <td style="padding:8px 0; color:#111827; font-size:14px; white-space:pre-wrap;">${escapeHtml(data.message)}</td>
            </tr>` : ""}
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px; vertical-align:top;">Resume</td>
              <td style="padding:8px 0; color:#111827; font-size:14px;">
                ${
                  data.resumeUrl
                    ? `<a href="${escapeHtml(data.resumeUrl)}" style="color:#1d4ed8;">${escapeHtml(data.resumeFileName)}</a>`
                    : `${escapeHtml(data.resumeFileName)} <span style="color:#6b7280;">(saved to database — Microsoft 365 storage not yet configured)</span>`
                }
              </td>
            </tr>
          </table>

          <div style="margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb;">
            <a href="mailto:${escapeHtml(data.email)}"
               style="display:inline-block; background:#FFDC39; color:#222222; font-weight:700;
                      padding:10px 24px; border-radius:6px; text-decoration:none; font-size:14px;">
              Reply to ${escapeHtml(data.name)}
            </a>
          </div>
        </div>
      </div>
    `,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
