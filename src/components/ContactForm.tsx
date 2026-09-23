"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Upload, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { formEndpoint } from "@/lib/formEndpoint";
import { MAX_UPLOAD_BYTES, IMAGE_MIME_TYPES, IMAGE_ACCEPT } from "@/lib/uploads";

const initial = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  length: "",
  width: "",
  height: "",
  weight: "",
};

export default function ContactForm() {
  const { t } = useApp();
  const [form, setForm] = useState(initial);
  const [image, setImage] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  function update(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setImage(null);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setStatus("error");
      setMessage(cf.fileTooLarge);
      e.target.value = "";
      return;
    }
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      setStatus("error");
      setMessage(cf.invalidFileType);
      e.target.value = "";
      return;
    }
    setStatus("idle");
    setMessage("");
    setImage(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (image) body.append("image", image);

      const res = await fetch(formEndpoint("/api/contact"), { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setStatus("ok");
      setMessage(data.message);
      setForm(initial);
      setImage(null);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const cf = t.contactForm;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{cf.nameLbl}</Label>
          <Input
            id="name"
            name="name"
            required
            value={form.name}
            onChange={update}
            placeholder={cf.namePlh}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{cf.emailLbl}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={update}
            placeholder={cf.emailPlh}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{cf.phoneLbl}</Label>
          <Input
            id="phone"
            name="phone"
            value={form.phone}
            onChange={update}
            placeholder={cf.phonePlh}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">{cf.subjectLbl}</Label>
          <Input
            id="subject"
            name="subject"
            value={form.subject}
            onChange={update}
            placeholder={cf.subjectPlh}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">{cf.messageLbl}</Label>
        <Textarea
          id="message"
          name="message"
          required
          rows={5}
          value={form.message}
          onChange={update}
          placeholder={cf.messagePlh}
        />
      </div>

      <div className="space-y-3 rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-semibold">{cf.dimensionsTitle}</p>
          <p className="text-xs text-muted-foreground">{cf.dimensionsHint}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="length">{cf.lengthLbl}</Label>
            <Input
              id="length"
              name="length"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={form.length}
              onChange={update}
              placeholder={cf.lengthPlh}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="width">{cf.widthLbl}</Label>
            <Input
              id="width"
              name="width"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={form.width}
              onChange={update}
              placeholder={cf.widthPlh}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">{cf.heightLbl}</Label>
            <Input
              id="height"
              name="height"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={form.height}
              onChange={update}
              placeholder={cf.heightPlh}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">{cf.weightLbl}</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={form.weight}
              onChange={update}
              placeholder={cf.weightPlh}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">{cf.imageLbl}</Label>
        {image ? (
          <div className="flex items-center justify-between rounded-md border border-input px-4 py-2.5 text-sm">
            <span className="truncate">{image.name}</span>
            <button
              type="button"
              onClick={() => setImage(null)}
              aria-label="Remove image"
              className="ml-3 shrink-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="image"
            className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-md border border-dashed border-input px-4 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Upload className="h-4 w-4" />
            {cf.imageLbl}
          </label>
        )}
        <input
          id="image"
          name="image"
          type="file"
          accept={IMAGE_ACCEPT}
          onChange={onImageChange}
          className="sr-only"
        />
        <p className="text-xs text-muted-foreground">{cf.imageHint}</p>
      </div>

      <Button
        type="submit"
        variant="accent"
        size="lg"
        disabled={status === "loading"}
        className="w-full sm:w-auto"
      >
        {status === "loading" ? cf.sending : cf.send}
      </Button>
      {message && (
        <div
          className={
            status === "ok"
              ? "flex items-center gap-2 text-sm font-medium text-emerald-600"
              : "flex items-center gap-2 text-sm font-medium text-destructive"
          }
        >
          {status === "ok" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message}
        </div>
      )}
    </form>
  );
}
