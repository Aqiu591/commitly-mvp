import { NextRequest, NextResponse } from "next/server";

import { readEmailOtpType, safeNextPath } from "@/lib/auth-link-params";
import { getMissingEnvNames, REQUIRED_SUPABASE_PAGE_ENV_NAMES } from "@/lib/setup-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { classifyAuthCallbackError } from "@/lib/user-facing";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  if (getMissingEnvNames(process.env, REQUIRED_SUPABASE_PAGE_ENV_NAMES).length > 0) {
    return NextResponse.redirect(localUrl("/setup", request));
  }

  const providerError = requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");
  if (providerError) {
    return redirectToLogin(request, classifyAuthCallbackError(providerError));
  }

  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash") ?? requestUrl.searchParams.get("token");
  const type = readEmailOtpType(requestUrl.searchParams.get("type"));
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (!code && !tokenHash) {
    return redirectToLogin(request, "missing_code");
  }

  const supabase = await createSupabaseServerClient();

  if (tokenHash) {
    if (!type) {
      return redirectToLogin(request, "missing_code");
    }

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type
    });

    if (error) {
      return redirectToLogin(request, classifyAuthCallbackError(error.message));
    }

    return NextResponse.redirect(localUrl(next, request));
  }

  if (!code) {
    return redirectToLogin(request, "missing_code");
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectToLogin(request, classifyAuthCallbackError(error.message));
  }

  return NextResponse.redirect(localUrl(next, request));
}

function redirectToLogin(request: NextRequest | string, authError: string) {
  const loginUrl = typeof request === "string" ? new URL("/login", request) : localUrl("/login", request);
  loginUrl.searchParams.set("authError", authError);
  return NextResponse.redirect(loginUrl);
}

function localUrl(path: string, request: NextRequest) {
  return new URL(path, requestOrigin(request));
}

function requestOrigin(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "");

  return host ? `${protocol}://${host}` : requestUrl.origin;
}
