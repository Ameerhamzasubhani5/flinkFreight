/* ─────────────────────────────────────────────────────────────────────────────
 * DISABLED — MongoDB was removed from the site on 2026-08-19.
 *
 * Submissions now go straight to Microsoft 365 (OneDrive) and are emailed to
 * the team, so no database is involved. This file is kept, commented out, in
 * case the database is reintroduced later.
 *
 * To restore: uncomment everything below, reinstate the `mongoose` import in
 * the API route that used it, and set MONGODB_URI in the environment.
 * ───────────────────────────────────────────────────────────────────────── */

/*
import mongoose, { Schema, model, models } from "mongoose";

const CareerApplicationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    position: { type: String, trim: true },
    message: { type: String, trim: true },
    resumeFileName: { type: String, required: true },
    resumeMimeType: { type: String },
    // Set once the file is uploaded to Microsoft 365 (OneDrive) storage.
    resumeUrl: { type: String },
    // Fallback so the resume is never lost while Microsoft Graph isn't
    // configured yet. Excluded from default queries via select:false —
    // whether the file lives here or in OneDrive is told by resumeUrl.
    resumeData: { type: Buffer, select: false },
  },
  { timestamps: true }
);

export type CareerApplicationDoc = mongoose.InferSchemaType<typeof CareerApplicationSchema>;

export default models.CareerApplication || model("CareerApplication", CareerApplicationSchema);

*/
