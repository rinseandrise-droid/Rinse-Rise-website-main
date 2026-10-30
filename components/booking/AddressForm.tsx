"use client";

import { useState } from "react";
import { PhoneField } from "@/components/ui/PhoneField";
import { addressSchema } from "@/lib/validation";

const LABELS = ["Home", "Work", "Other"] as const;

export function AddressForm({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState("");

  return (
    <form
      className="mt-4 grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBanner("");
        const raw = Object.fromEntries(new FormData(e.currentTarget).entries());
        const parsed = addressSchema.safeParse(raw);
        if (!parsed.success) {
          const next: Record<string, string> = {};
          for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
          setErrors(next);
          return;
        }
        setErrors({});
        const { getSupabaseBrowser } = await import("@/lib/supabase/client");
        const supabase = getSupabaseBrowser();
        if (!supabase) {
          setBanner("Accounts are not switched on yet.");
          return;
        }
        const { data: session } = await supabase.auth.getUser();
        if (!session.user) {
          setBanner("Sign in to save an address.");
          return;
        }
        setBusy(true);
        const { error } = await supabase.from("addresses").insert({ ...parsed.data, user_id: session.user.id });
        setBusy(false);
        if (error) {
          setBanner(error.message);
          return;
        }
        e.currentTarget.reset();
        onSaved();
      }}
    >
      {banner && <p className="sm:col-span-2 text-sm font-semibold text-danger">{banner}</p>}
      <div className="sm:col-span-2 flex flex-wrap gap-2">
        {LABELS.map((label) => (
          <label key={label} className="chip cursor-pointer">
            <input type="radio" name="label" value={label} defaultChecked={label === "Home"} className="sr-only" />
            {label}
          </label>
        ))}
      </div>
      <Field name="name" label="Contact name" error={errors.name} autoComplete="name" />
      <Field name="phone" label="Phone" error={errors.phone} autoComplete="tel" />
      <Field name="line1" label="Address line" error={errors.line1} className="sm:col-span-2" autoComplete="address-line1" />
      <Field name="area" label="Area" error={errors.area} autoComplete="address-line2" />
      <Field name="city" label="City" error={errors.city} autoComplete="address-level2" />
      <Field name="state" label="State" error={errors.state} autoComplete="address-level1" />
      <Field name="pincode" label="PIN code" error={errors.pincode} inputMode="numeric" />
      <Field name="landmark" label="Landmark" error={errors.landmark} />
      <label className="sm:col-span-2">
        <span className="field-label">Delivery instructions</span>
        <textarea className="input min-h-20 py-3" name="instructions" maxLength={300} />
      </label>
      <button type="submit" className="btn btn-secondary sm:col-span-2" disabled={busy}>
        {busy ? "Saving…" : "Save address"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  error,
  className = "",
  autoComplete,
  inputMode,
}: {
  name: string;
  label: string;
  error?: string;
  className?: string;
  autoComplete?: string;
  inputMode?: "numeric";
}) {
  return (
    <label className={className}>
      <span className="field-label">{label}</span>
      {name === "phone" ? (
        <PhoneField name={name} autoComplete={autoComplete} invalid={Boolean(error)} />
      ) : (
        <input className="input" name={name} autoComplete={autoComplete} inputMode={inputMode} aria-invalid={Boolean(error)} />
      )}
      {error && <p className="field-error">{error}</p>}
    </label>
  );
}
