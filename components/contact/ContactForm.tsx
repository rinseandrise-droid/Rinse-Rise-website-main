"use client";

import { useState } from "react";
import { PhoneField } from "@/components/ui/PhoneField";
import { site } from "@/data/site";
import { isIndianMobile } from "@/lib/phone";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "sent") {
    return (
      <div className="neo p-8">
        <h2 className="font-display text-2xl font-extrabold">Message noted</h2>
        <p className="mt-3 text-muted">
          This form stores your note in this browser for now. For a fast reply, WhatsApp or call {site.phoneDisplay}.
        </p>
      </div>
    );
  }

  return (
    <form
      className="neo grid gap-4 p-8"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (busy) return;
        setError("");
        const data = new FormData(e.currentTarget);
        const name = String(data.get("name") ?? "").trim();
        const phone = String(data.get("phone") ?? "");
        const message = String(data.get("message") ?? "").trim();
        if (name.length < 2) {
          setError("Enter your name.");
          return;
        }
        if (!isIndianMobile(phone)) {
          setError("Enter a valid 10-digit mobile number.");
          return;
        }
        if (message.length < 4) {
          setError("Enter a short message.");
          return;
        }
        setBusy(true);
        try {
          const notes = JSON.parse(localStorage.getItem("rr-contact-notes") ?? "[]") as unknown[];
          notes.push({
            name,
            phone,
            message,
            at: new Date().toISOString(),
          });
          localStorage.setItem("rr-contact-notes", JSON.stringify(notes.slice(-20)));
        } catch {
          /* ignore */
        }
        setBusy(false);
        setStatus("sent");
      }}
    >
      <h2 className="font-display text-2xl font-extrabold">Send a note</h2>
      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
      <label>
        <span className="field-label">Name</span>
        <input className="input" name="name" autoComplete="name" required aria-invalid={error.includes("name") || undefined} />
      </label>
      <label>
        <span className="field-label">Mobile</span>
        <PhoneField required invalid={error.includes("mobile")} />
      </label>
      <label>
        <span className="field-label">Message</span>
        <textarea className="input min-h-32 py-3" name="message" required maxLength={800} />
      </label>
      <button type="submit" className="btn btn-primary mt-2" disabled={busy}>
        {busy ? "Sending…" : "Send"}
      </button>
      <p className="text-xs text-muted">
        Prefer a live reply? WhatsApp or call us — this form does not yet email the studio.
      </p>
    </form>
  );
}
