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
