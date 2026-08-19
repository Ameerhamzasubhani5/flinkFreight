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
