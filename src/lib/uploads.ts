// Shared upload constraints used by both the client-side forms (for instant
// validation feedback) and the API routes (for the real enforcement).

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export const RESUME_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const RESUME_ACCEPT = ".pdf,.doc,.docx";

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp";

// Where each kind of upload is filed in SharePoint (or OneDrive). Override
// either one in .env.local to change the structure without touching code —
// nested paths are fine and every level is created automatically.
export const CAREER_FOLDER = process.env.MS_GRAPH_CAREER_FOLDER || "Web/CVs";
export const CONTACT_FOLDER =
  process.env.MS_GRAPH_CONTACT_FOLDER || "Web/Queries/Transport Material";


/* ─────────────────────────────────────────────────────────────────────────────
 * Text field limits.
 *
 * Neither route bounded any text field, and the client forms set no maxlength.
 * Nginx allows a 10MB body, so one request could push megabytes of prose into
 * the outbound notification. Reject rather than truncate, so what the team
 * receives is always exactly what was submitted.
 * ───────────────────────────────────────────────────────────────────────── */

export const FIELD_LIMITS = {
  name: 100,
  email: 254, // RFC 5321 maximum for a forward path
  phone: 40,
  subject: 200,
  position: 100,
  message: 5000,
} as const;

/** First field that exceeds its limit, or null when all are within bounds. */
export function tooLongField(
  fields: Partial<Record<keyof typeof FIELD_LIMITS, string>>
): { field: string; limit: number } | null {
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    const value = fields[field as keyof typeof FIELD_LIMITS];
    if (typeof value === "string" && value.length > limit) {
      return { field, limit };
    }
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Content sniffing.
 *
 * The MIME type on an uploaded File is the Content-Type the CLIENT put in the
 * multipart part. It is a claim, not a fact, and one line of curl sets it to
 * anything:
 *
 *   curl -F "resume=@shell.sh;filename=CV.pdf;type=application/pdf" ...
 *
 * So the declared type is only a cheap first gate. These checks are the real
 * one, and they are deliberately STRUCTURAL rather than a substring search.
 *
 * An earlier version of this file searched the first 1024 bytes for "%PDF-"
 * with Buffer.includes, which is a substring match: a shell script with
 * "# %PDF-" on its second line passed. It also accepted the empty-archive
 * marker PK\x05\x06 as a DOCX and confirmed OOXML-ness by looking for the
 * literal "[Content_Types].xml" anywhere in the first 4 KiB, which any file
 * can simply contain. Every signature below is therefore anchored at a fixed
 * offset, and the ZIP check parses the local file header instead of scanning.
 * ───────────────────────────────────────────────────────────────────────── */

export type ResumeFormat = "PDF" | "DOC" | "DOCX";
export type ImageFormat = "JPEG" | "PNG" | "WEBP";

/** Canonical extension for each format. The stored name is built from this, never from the caller. */
const RESUME_EXTENSION: Record<ResumeFormat, string> = {
  PDF: ".pdf",
  DOC: ".doc",
  DOCX: ".docx",
};
const IMAGE_EXTENSION: Record<ImageFormat, string> = {
  JPEG: ".jpg",
  PNG: ".png",
  WEBP: ".webp",
};

function at(b: Buffer, offset: number, bytes: number[]): boolean {
  if (b.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) if (b[offset + i] !== bytes[i]) return false;
  return true;
}

/** A UTF-8 BOM is the only prefix tolerated before a PDF header. */
function pdfHeaderOffset(b: Buffer): number | null {
  if (at(b, 0, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 0; // "%PDF-"
  if (at(b, 0, [0xef, 0xbb, 0xbf]) && at(b, 3, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 3;
  return null;
}

/**
 * Name of the first entry in a ZIP, read from its local file header rather
 * than searched for.
 *
 * Layout: 0 signature(4) · 26 name length(2, LE) · 28 extra length(2, LE) ·
 * 30 name(n). A real OOXML package puts "[Content_Types].xml" first, so this
 * distinguishes a document from any archive that merely contains that string.
 */
function firstZipEntryName(b: Buffer): string | null {
  if (!at(b, 0, [0x50, 0x4b, 0x03, 0x04])) return null; // only a real local file header
  if (b.length < 30) return null;
  const nameLength = b.readUInt16LE(26);
  if (nameLength === 0 || nameLength > 512 || b.length < 30 + nameLength) return null;
  return b.subarray(30, 30 + nameLength).toString("latin1");
}

/**
 * The format the bytes really are, or null.
 *
 * Note on macro-enabled Office files: .docm and .xlsm are also OOXML packages
 * whose first entry is "[Content_Types].xml", so this cannot tell them from a
 * .docx without inflating the package. They are accepted, and they are stored
 * with a .docx extension (see storedUploadName), which strips the association
 * that would make Word offer to run the macros. Microsoft 365 also scans the
 * library. If macro content must be refused outright, the package has to be
 * inflated and its content types read — a deliberate choice, not an oversight.
 */
export function resumeFormat(buffer: Buffer): ResumeFormat | null {
  if (pdfHeaderOffset(buffer) !== null) return "PDF";
  // OLE2 compound file — legacy .doc
  if (at(buffer, 0, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return "DOC";
  if (firstZipEntryName(buffer) === "[Content_Types].xml") return "DOCX";
  return null;
}

export function imageFormat(buffer: Buffer): ImageFormat | null {
  if (at(buffer, 0, [0xff, 0xd8, 0xff])) return "JPEG";
  if (at(buffer, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "PNG";
  // "RIFF" .... "WEBP"
  if (at(buffer, 0, [0x52, 0x49, 0x46, 0x46]) && at(buffer, 8, [0x57, 0x45, 0x42, 0x50])) {
    return "WEBP";
  }
  return null;
}

/** True when the bytes really are a PDF or Word document. */
export function isRealResume(buffer: Buffer): boolean {
  return resumeFormat(buffer) !== null;
}

/** True when the bytes really are a JPEG, PNG or WEBP image. */
export function isRealImage(buffer: Buffer): boolean {
  return imageFormat(buffer) !== null;
}

/**
 * The name an upload is stored under.
 *
 * The caller's filename is a display string, not a safe name, and the previous
 * version passed it through to SharePoint with only SharePoint's own illegal
 * characters replaced. The dot was not among them and there was no extension
 * allowlist, so a genuine PDF could be filed as "invoice.html" — the extension,
 * which is what decides how a colleague's machine opens the file, was chosen by
 * the uploader rather than by what the bytes turned out to be.
 *
 * So: keep a readable stem from the caller, and take the extension from the
 * format that was actually detected.
 */
export function storedUploadName(
  clientName: string,
  format: ResumeFormat | ImageFormat
): string {
  const extension =
    format in RESUME_EXTENSION
      ? RESUME_EXTENSION[format as ResumeFormat]
      : IMAGE_EXTENSION[format as ImageFormat];

  const stem = clientName
    .replace(/\.[^.]*$/, "") // drop the caller's extension; ours replaces it
    // Unicode bidi/format controls can make a name render reversed, so a
    // "...fdp.exe" reads as "...exe.pdf" in SharePoint and in the notification.
    .replace(/[\u202a-\u202e\u2066-\u2069\u200e\u200f]/g, "")
    // C0/C1 controls, and the characters SharePoint itself rejects.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
    .replace(/[\/:*?"<>|#%]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  return `${stem || "upload"}${extension}`;
}
