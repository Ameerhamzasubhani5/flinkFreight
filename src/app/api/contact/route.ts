import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Contact from "@/models/Contact";
import { sendContactEmail } from "@/lib/email";
import { deliverSubmission } from "@/lib/submissions";
import { uploadToOneDrive, isGraphConfigured } from "@/lib/msGraph";
import { MAX_UPLOAD_BYTES, IMAGE_MIME_TYPES } from "@/lib/uploads";

function toNumber(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    const dimensions = {
      length: toNumber(formData.get("length")),
      width: toNumber(formData.get("width")),
      height: toNumber(formData.get("height")),
      weight: toNumber(formData.get("weight")),
    };

    const imageEntry = formData.get("image");
    const image = imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email and message are required." },
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

    if (image) {
      if (image.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "Image must be 5MB or smaller." },
          { status: 400 }
        );
      }
      if (!IMAGE_MIME_TYPES.includes(image.type)) {
        return NextResponse.json(
          { error: "Image must be a JPG, PNG or WEBP file." },
          { status: 400 }
        );
      }
    }

    let imageUrl: string | undefined;
    let imageBuffer: Buffer | undefined;

    if (image) {
      const buffer = Buffer.from(await image.arrayBuffer());
      if (isGraphConfigured()) {
        try {
          const uploaded = await uploadToOneDrive(buffer, image.name, "ContactUploads");
          imageUrl = uploaded.webUrl;
        } catch (err) {
          console.error("OneDrive image upload failed:", err);
          imageBuffer = buffer; // fall back to storing it in Mongo
        }
      } else {
        imageBuffer = buffer;
      }
    }

    const { delivered } = await deliverSubmission(
      "contact",
      async () => {
        await connectToDatabase();
        await Contact.create({
          name,
          email,
          phone,
          subject,
          message,
          dimensions,
          imageFileName: image?.name,
          imageMimeType: image?.type,
          imageUrl,
          imageData: imageBuffer,
        });
      },
      () => sendContactEmail({ name, email, phone, subject, message, dimensions, imageUrl })
    );

    if (!delivered) {
      return NextResponse.json(
        { error: "We couldn't send your message right now. Please try again in a moment." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { message: "Thanks for reaching out! We'll get back to you soon." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
