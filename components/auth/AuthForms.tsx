"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { firstOrderOffer, site } from "@/data/site";
import { PhoneField } from "@/components/ui/PhoneField";
import { AUTH_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { loginSchema, signupSchema } from "@/lib/validation";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="field-error">{message}</p>;
}

export function SignupForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/account";
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState("");

  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBanner("");
        const data = Object.fromEntries(new FormData(e.currentTarget).entries());
        const parsed = signupSchema.safeParse(data);
        if (!parsed.success) {
          const nextErr: Record<string, string> = {};
          for (const issue of parsed.error.issues) {
            const key = String(issue.path[0] ?? "form");
            nextErr[key] ??= issue.message;
          }
          setErrors(nextErr);
          return;
        }
        setErrors({});
        const supabase = getSupabaseBrowser();
        if (!supabase) {
          setBanner(AUTH_NOT_CONFIGURED_MESSAGE);
          return;
        }
        setBusy(true);
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
            emailRedirectTo: `${site.url}/login`,
          },
        });
        setBusy(false);
        if (error) {
          setBanner(error.message);
          return;
        }
        router.push(`/signup/welcome?next=${encodeURIComponent(next)}`);
      }}
    >
      <p className="rounded-2xl bg-orange-tint px-4 py-3 text-sm font-bold text-orange-dark">
        Get {firstOrderOffer.percent}% OFF your first order.
      </p>
      {banner && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{banner}</p>}
      <label>
        <span className="field-label">Full name</span>
        <input className="input" name="fullName" autoComplete="name" required aria-invalid={!!errors.fullName} />
        <FieldError message={errors.fullName} />
      </label>
      <label>
        <span className="field-label">Mobile number</span>
        <PhoneField required invalid={!!errors.phone} />
        <FieldError message={errors.phone} />
      </label>
      <label>
        <span className="field-label">Email</span>
        <input className="input" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} />
        <FieldError message={errors.email} />
      </label>
      <label>
        <span className="field-label">Password</span>
        <input className="input" name="password" type="password" autoComplete="new-password" required aria-invalid={!!errors.password} />
        <FieldError message={errors.password} />
      </label>
      <label>
        <span className="field-label">Confirm password</span>
        <input className="input" name="confirmPassword" type="password" autoComplete="new-password" required aria-invalid={!!errors.confirmPassword} />
        <FieldError message={errors.confirmPassword} />
      </label>
      <button type="submit" className="btn btn-primary mt-2" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-extrabold text-orange-dark">
          Login
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/account";
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState("");

  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBanner("");
        const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget).entries()));
        if (!parsed.success) {
          const nextErr: Record<string, string> = {};
          for (const issue of parsed.error.issues) {
            const key = String(issue.path[0] ?? "form");
            nextErr[key] ??= issue.message;
          }
          setErrors(nextErr);
          return;
        }
        setErrors({});
        const supabase = getSupabaseBrowser();
        if (!supabase) {
          setBanner(AUTH_NOT_CONFIGURED_MESSAGE);
          return;
        }
        setBusy(true);
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        setBusy(false);
        if (error) {
          setBanner("Email or password is incorrect.");
          return;
        }
        router.push(next.startsWith("/") ? next : "/account");
        router.refresh();
      }}
    >
      {banner && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{banner}</p>}
      <label>
        <span className="field-label">Email</span>
        <input className="input" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} />
        <FieldError message={errors.email} />
      </label>
      <label>
        <span className="field-label">Password</span>
        <input className="input" name="password" type="password" autoComplete="current-password" required aria-invalid={!!errors.password} />
        <FieldError message={errors.password} />
      </label>
      <div className="flex justify-end">
        <Link href="/login/reset" className="text-sm font-bold text-orange-dark">
          Reset password
        </Link>
      </div>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Signing in…" : "Login"}
      </button>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-extrabold text-orange-dark">
          Create account
        </Link>
      </p>
    </form>
  );
}

export function ResetForm() {
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return <p className="text-muted">If that email is registered, a reset link is on its way. Check your inbox.</p>;
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const email = String(new FormData(e.currentTarget).get("email") ?? "");
        const supabase = getSupabaseBrowser();
        if (!supabase) {
          setBanner(AUTH_NOT_CONFIGURED_MESSAGE);
          return;
        }
        setBusy(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${site.url}/login` });
        setBusy(false);
        if (error) {
          setBanner(error.message);
          return;
        }
        setSent(true);
      }}
    >
      {banner && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{banner}</p>}
      <label>
        <span className="field-label">Email</span>
        <input className="input" name="email" type="email" autoComplete="email" required />
      </label>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
