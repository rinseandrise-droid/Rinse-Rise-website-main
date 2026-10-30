import { NextResponse } from "next/server";
import { AUTH_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation";

function signupErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already") || lower.includes("registered") || lower.includes("exists")) {
    return "An account with this email already exists. Log in instead.";
  }
  if (lower.includes("rate limit")) {
    return "Too many account emails were sent. Wait about an hour, then try again.";
  }
  return message;
}

/** Creates a confirmed account without sending Supabase's confirmation email. */
export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: AUTH_NOT_CONFIGURED_MESSAGE }, { status: 503 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  }

  const { email, password, fullName, phone } = parsed.data;
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });

  if (error) return NextResponse.json({ error: signupErrorMessage(error.message) }, { status: 400 });
  return NextResponse.json({ ok: true });
}
