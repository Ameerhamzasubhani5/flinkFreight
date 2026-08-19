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

const SubscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export type SubscriberDoc = mongoose.InferSchemaType<typeof SubscriberSchema>;

export default models.Subscriber || model("Subscriber", SubscriberSchema);

*/
