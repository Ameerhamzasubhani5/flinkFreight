import { sendMailViaGraph } from "@/lib/msGraph";

// CONTACT_TO_EMAIL / CAREER_TO_EMAIL accept a comma-separated list, so a
// notification reaches every regional inbox (e.g. the .de and .eu addresses)
// regardless of which language the visitor used.
function parseRecipients(value: string | undefined): string[] {
  return (value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

const TO = parseRecipients(process.env.CONTACT_TO_EMAIL);
// Career applications default to the same inbox(es) as the contact form
// unless dedicated ones are configured.
const CAREER_TO = process.env.CAREER_TO_EMAIL ? parseRecipients(process.env.CAREER_TO_EMAIL) : TO;

/**
 * Language the visitor was using when they submitted. The team notification is
 * always English (one inbox, one working language), but the acknowledgement goes
 * to a customer, so it has to be in their language.
 */
export type MailLocale = "de" | "en";

/** Shared branded header, so every message the site sends looks like the site. */
function shell(bodyHtml: string): string {
  return `
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
          ${bodyHtml}
        </div>
      </div>
  `;
}

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
  if (TO.length === 0) {
    // Throw rather than silently returning: the caller treats a resolved
    // promise as "the team was notified", so a missing recipient has to be
    // reported as a failed delivery channel, not a successful one.
    throw new Error("CONTACT_TO_EMAIL is not set — cannot dispatch notification.");
  }

  const dims = data.dimensions;
  const hasDims =
    dims && (dims.length || dims.width || dims.height || dims.weight);

  await sendMailViaGraph({
    to: TO,
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
  if (CAREER_TO.length === 0) {
    // See sendContactEmail — a missing recipient is a failed delivery channel.
    throw new Error(
      "CAREER_TO_EMAIL (or CONTACT_TO_EMAIL) is not set — cannot dispatch notification."
    );
  }

  await sendMailViaGraph({
    to: CAREER_TO,
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
                    : `${escapeHtml(data.resumeFileName)} <span style="color:#6b7280;">(no storage link — the file could not be filed, ask the applicant to resend it)</span>`
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

/* ═════════════════════════════════════════════════════════════════════════════
 * Acknowledgements to the person who submitted the form.
 *
 * Separate from the team notifications above, and deliberately best-effort: the
 * caller sends these only after the team has been notified, and swallows any
 * failure. Reasoning — the enquiry is already safely captured at that point, so
 * failing the request because a courtesy email bounced would tell the visitor
 * their submission was lost when it was not.
 *
 * Reply-To is the team inbox, not the sending mailbox, so a customer who simply
 * hits reply reaches a human.
 * ═══════════════════════════════════════════════════════════════════════════ */

const COPY = {
  de: {
    contactSubject: "Ihre Anfrage bei Flink Freight",
    contactHeading: "Vielen Dank für Ihre Anfrage",
    contactIntro: (name: string) =>
      `Hallo ${name},<br><br>vielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und melden uns in der Regel innerhalb eines Werktages bei Ihnen.`,
    contactRecap: "Ihre Angaben",
    careerSubject: "Ihre Bewerbung bei Flink Freight",
    careerHeading: "Vielen Dank für Ihre Bewerbung",
    careerIntro: (name: string) =>
      `Hallo ${name},<br><br>vielen Dank für Ihre Bewerbung. Wir haben Ihre Unterlagen erhalten und prüfen sie sorgfältig. Wenn Ihr Profil passt, melden wir uns bei Ihnen.`,
    careerRecap: "Ihre Bewerbung",
    labelSubject: "Betreff",
    labelMessage: "Nachricht",
    labelPosition: "Position",
    labelResume: "Lebenslauf",
    noReplyNote:
      "Diese Bestätigung wurde automatisch versendet. Sie können auf diese E-Mail antworten, wenn Sie etwas ergänzen möchten.",
    signOff: "Ihr Team von Flink Freight Logistics",
  },
  en: {
    contactSubject: "Your enquiry to Flink Freight",
    contactHeading: "Thank you for your enquiry",
    contactIntro: (name: string) =>
      `Hello ${name},<br><br>thank you for your message. We have received your enquiry and normally reply within one working day.`,
    contactRecap: "What you sent us",
    careerSubject: "Your application to Flink Freight",
    careerHeading: "Thank you for your application",
    careerIntro: (name: string) =>
      `Hello ${name},<br><br>thank you for applying. We have received your documents and will review them carefully. If your profile fits, we will be in touch.`,
    careerRecap: "Your application",
    labelSubject: "Subject",
    labelMessage: "Message",
    labelPosition: "Position",
    labelResume: "CV",
    noReplyNote:
      "This confirmation was sent automatically. You can reply to this email if you would like to add anything.",
    signOff: "The Flink Freight Logistics team",
  },
} as const;

function recapRow(label: string, value: string): string {
  return `
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px; width:110px; vertical-align:top;">${escapeHtml(label)}</td>
              <td style="padding:8px 0; color:#111827; font-size:14px; white-space:pre-wrap;">${escapeHtml(value)}</td>
            </tr>`;
}

function acknowledgementBody(
  t: (typeof COPY)[MailLocale],
  heading: string,
  intro: string,
  recapTitle: string,
  rows: string
): string {
  return `
          <h2 style="color:#222222; font-size:18px; margin:0 0 16px;">${escapeHtml(heading)}</h2>
          <p style="color:#374151; font-size:14px; line-height:1.6; margin:0 0 24px;">${intro}</p>
          ${
            rows
              ? `<p style="color:#6b7280; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin:0 0 8px;">${escapeHtml(recapTitle)}</p>
          <table style="width:100%; border-collapse:collapse; border-top:1px solid #e5e7eb;">${rows}
          </table>`
              : ""
          }
          <p style="color:#374151; font-size:14px; margin:28px 0 0;">${escapeHtml(t.signOff)}</p>
          <p style="color:#9ca3af; font-size:12px; line-height:1.5; margin:24px 0 0; padding-top:16px; border-top:1px solid #e5e7eb;">
            ${escapeHtml(t.noReplyNote)}
          </p>`;
}

/** Acknowledges a contact enquiry to the person who sent it. */
export async function sendContactConfirmation(
  data: Pick<ContactPayload, "name" | "email" | "subject" | "message">,
  locale: MailLocale
) {
  const t = COPY[locale];

  const rows =
    (data.subject ? recapRow(t.labelSubject, data.subject) : "") +
    recapRow(t.labelMessage, data.message);

  await sendMailViaGraph({
    to: [data.email],
    // A reply should reach the team, not the unattended sending mailbox.
    replyTo: TO[0],
    subject: t.contactSubject,
    html: shell(
      acknowledgementBody(
        t,
        t.contactHeading,
        t.contactIntro(escapeHtml(data.name)),
        t.contactRecap,
        rows
      )
    ),
  });
}

/** Acknowledges a job application to the applicant. */
export async function sendCareerConfirmation(
  data: Pick<CareerApplicationPayload, "name" | "email" | "position" | "resumeFileName">,
  locale: MailLocale
) {
  const t = COPY[locale];

  const rows =
    (data.position ? recapRow(t.labelPosition, data.position) : "") +
    recapRow(t.labelResume, data.resumeFileName);

  await sendMailViaGraph({
    to: [data.email],
    replyTo: (CAREER_TO[0] ?? TO[0]),
    subject: t.careerSubject,
    html: shell(
      acknowledgementBody(
        t,
        t.careerHeading,
        t.careerIntro(escapeHtml(data.name)),
        t.careerRecap,
        rows
      )
    ),
  });
}
