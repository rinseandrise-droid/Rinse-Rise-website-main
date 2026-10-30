"use client";

import { useEffect, useState } from "react";
import { PhoneField } from "@/components/ui/PhoneField";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { normalizeIndianMobile } from "@/lib/phone";
import { toast } from "@/lib/ui-store";
import { profileSchema } from "@/lib/validation";

export default function ProfilePage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    void supabase
      .from("profiles")
      .select("full_name, phone, email")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setFullName(data.full_name ?? "");
        setPhone(normalizeIndianMobile(data.phone ?? ""));
        setEmail(data.email ?? "");
      });
  }, []);

  return (
    <form
      className="neo max-w-lg grid gap-4 p-7"
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = profileSchema.safeParse({ fullName, phone });
        if (!parsed.success) {
          toast(parsed.error.issues[0]?.message ?? "Check the form", "error");
          return;
        }
        const supabase = getSupabaseBrowser();
        if (!supabase) return;
        const { data: session } = await supabase.auth.getUser();
        if (!session.user) return;
        setBusy(true);
        const { error } = await supabase
          .from("profiles")
          .update({ full_name: parsed.data.fullName, phone: parsed.data.phone, updated_at: new Date().toISOString() })
          .eq("id", session.user.id);
        setBusy(false);
        if (error) toast(error.message, "error");
        else toast("Profile saved");
      }}
    >
      <h1 className="font-display text-3xl font-extrabold">Profile</h1>
      <label>
        <span className="field-label">Full name</span>
        <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </label>
      <label>
        <span className="field-label">Mobile</span>
        <PhoneField value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <label>
        <span className="field-label">Email</span>
        <input className="input" value={email} disabled />
      </label>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={async () => {
          const supabase = getSupabaseBrowser();
          if (!supabase) return;
          await supabase.auth.signOut();
          window.location.href = "/";
        }}
      >
        Log out
      </button>
    </form>
  );
}
