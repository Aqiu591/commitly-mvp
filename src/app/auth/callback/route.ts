import { NextRequest, NextResponse } from "next/server";

import { getMissingEnvNames, REQUIRED_SUPABASE_PAGE_ENV_NAMES } from "@/lib/setup-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { classifyAuthCallbackError } from "@/lib/user-facing";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  if (getMissingEnvNames(process.env, REQUIRED_SUPABASE_PAGE_ENV_NAMES).length > 0) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  const providerError = requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");
  if (providerError) {
    return redirectToLogin(request.url, classifyAuthCallbackError(providerError));
  }

  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return redirectToLogin(request.url, "missing_code");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectToLogin(request.url, classifyAuthCallbackError(error.message));
  }

  return NextResponse.redirect(new URL(next, request.url));
}

function redirectToLogin(requestUrl: string, authError: string) {
  const loginUrl = new URL("/login", requestUrl);
  loginUrl.searchParams.set("authError", authError);
  return NextResponse.redirect(loginUrl);
}

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}
