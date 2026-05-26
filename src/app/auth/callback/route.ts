import { NextRequest, NextResponse } from "next/server";

import { getMissingEnvNames, REQUIRED_SUPABASE_PAGE_ENV_NAMES } from "@/lib/setup-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  if (getMissingEnvNames(process.env, REQUIRED_SUPABASE_PAGE_ENV_NAMES).length > 0) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
