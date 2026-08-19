"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Upload, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { MAX_UPLOAD_BYTES, RESUME_MIME_TYPES, RESUME_ACCEPT } from "@/lib/uploads";

const initial = {
  name: "",
  email: "",
  phone: "",
  position: "",
  message: "",
};

export default function CareerForm() {
  const { t } = useApp();
  const cf = t.careerForm;

  const [form, setForm] = useState(initial);
  const [resume, setResume] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  function update(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function onResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setResume(null);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setStatus("error");
      setMessage(cf.fileTooLarge);
      e.target.value = "";
      return;
    }
    if (!RESUME_MIME_TYPES.includes(file.type)) {
      setStatus("error");
      setMessage(cf.invalidFileType);
      e.target.value = "";
      return;
    }
    setStatus("idle");
    setMessage("");
    setResume(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resume) {
      setStatus("error");
      setMessage(cf.resumeRequired);
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      body.append("resume", resume);

      const res = await fetch("/api/career", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit application");
      setStatus("ok");
      setMessage(data.message);
      setForm(initial);
      setResume(null);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="career-name">{cf.nameLbl}</Label>
          <Input
            id="career-name"
            name="name"
            required
            value={form.name}
            onChange={update}
            placeholder={cf.namePlh}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="career-email">{cf.emailLbl}</Label>
          <Input
            id="career-email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={update}
            placeholder={cf.emailPlh}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="career-phone">{cf.phoneLbl}</Label>
          <Input
            id="career-phone"
            name="phone"
            value={form.phone}
            onChange={update}
            placeholder={cf.phonePlh}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="career-position">{cf.positionLbl}</Label>
          <Input
            id="career-position"
            name="position"
            value={form.position}
            onChange={update}
            placeholder={cf.positionPlh}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="career-message">{cf.messageLbl}</Label>
        <Textarea
          id="career-message"
          name="message"
          rows={5}
          value={form.message}
          onChange={update}
          placeholder={cf.messagePlh}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="resume">{cf.resumeLbl}</Label>
        {resume ? (
          <div className="flex items-center justify-between rounded-md border border-input px-4 py-2.5 text-sm">
            <span className="truncate">{resume.name}</span>
            <button
              type="button"
              onClick={() => setResume(null)}
              aria-label="Remove resume"
              className="ml-3 shrink-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="resume"
            className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-md border border-dashed border-input px-4 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Upload className="h-4 w-4" />
            {cf.resumeLbl}
          </label>
        )}
        <input
          id="resume"
          name="resume"
          type="file"
          required
          accept={RESUME_ACCEPT}
          onChange={onResumeChange}
          className="sr-only"
        />
        <p className="text-xs text-muted-foreground">{cf.resumeHint}</p>
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
