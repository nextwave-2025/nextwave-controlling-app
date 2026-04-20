import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://nextwave-controlling-app-production.up.railway.app";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type: type as
        | "signup"
        | "invite"
        | "magiclink"
        | "recovery"
        | "email_change"
        | "email",
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(`${SITE_URL}/`);
    }
  }

  return NextResponse.redirect(`${SITE_URL}/login?error=auth_confirm_failed`);
}
