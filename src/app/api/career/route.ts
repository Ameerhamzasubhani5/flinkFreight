import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CareerApplication from "@/models/CareerApplication";
import { sendCareerApplicationEmail } from "@/lib/email";
import { deliverSubmission } from "@/lib/submissions";
import { uploadToOneDrive, isGraphConfigured } from "@/lib/msGraph";
import { MAX_UPLOAD_BYTES, RESUME_MIME_TYPES } from "@/lib/uploads";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const position = String(formData.get("position") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    const resumeEntry = formData.get("resume");
    const resume = resumeEntry instanceof File && resumeEntry.size > 0 ? resumeEntry : null;

    if (!name || !email || !resume) {
      return NextResponse.json(
        { error: "Name, email and a resume file are required." },
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

    if (resume.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Resume must be 5MB or smaller." },
        { status: 400 }
      );
    }

    if (!RESUME_MIME_TYPES.includes(resume.type)) {
      return NextResponse.json(
        { error: "Resume must be a PDF or Word document." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await resume.arrayBuffer());
    let resumeUrl: string | undefined;
    let resumeData: Buffer | undefined;

    if (isGraphConfigured()) {
      try {
        const uploaded = await uploadToOneDrive(buffer, resume.name, "CareerApplications");
        resumeUrl = uploaded.webUrl;
      } catch (err) {
        console.error("OneDrive resume upload failed:", err);
        resumeData = buffer; // fall back to storing it in Mongo
      }
    } else {
      resumeData = buffer;
    }

    const { delivered } = await deliverSubmission(
      "career",
      async () => {
        await connectToDatabase();
        await CareerApplication.create({
          name,
          email,
          phone,
          position,
          message,
          resumeFileName: resume.name,
          resumeMimeType: resume.type,
          resumeUrl,
          resumeData,
        });
      },
      () =>
        sendCareerApplicationEmail({
          name,
          email,
          phone,
          position,
          message,
          resumeFileName: resume.name,
          resumeUrl,
        })
    );

    if (!delivered) {
      return NextResponse.json(
        { error: "We couldn't submit your application right now. Please try again in a moment." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { message: "Thanks for applying! Our team will review your application and be in touch soon." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Career application error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
