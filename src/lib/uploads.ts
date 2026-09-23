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
