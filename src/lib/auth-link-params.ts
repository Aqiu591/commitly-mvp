import type { EmailOtpType } from "@supabase/supabase-js";

import { classifyAuthCallbackError, type AuthCallbackErrorCode } from "@/lib/user-facing";

const callbackParamNames = ["code", "token_hash", "token", "type", "next", "error", "error_description"] as const;
const emailOtpTypes = new Set<string>(["signup", "invite", "magiclink", "recovery", "email_change", "email"]);

export type AuthHashCallbackResult =
  | { kind: "empty" }
  | { kind: "session"; accessToken: string; refreshToken: string }
  | { kind: "error"; errorCode: AuthCallbackErrorCode }
  | { kind: "incomplete" };

export function buildAuthCallbackPathFromLoginParams(params: Record<string, string | string[] | undefined>) {
  const callbackParams = new URLSearchParams();
  let hasAuthCallbackParam = false;

  callbackParamNames.forEach((name) => {
    const value = firstParamValue(params[name]);
    if (!value) {
      return;
    }

    callbackParams.set(name, value);
    if (name !== "next") {
      hasAuthCallbackParam = true;
    }
  });

  if (!hasAuthCallbackParam) {
    return null;
  }

  return `/auth/callback?${callbackParams.toString()}`;
}

export function parseAuthHashCallback(hash: string): AuthHashCallbackResult {
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!normalized) {
    return { kind: "empty" };
  }

  const params = new URLSearchParams(normalized);
  const providerError = params.get("error_description") ?? params.get("error");
  if (providerError) {
    return { kind: "error", errorCode: classifyAuthCallbackError(providerError) };
  }

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (accessToken && refreshToken) {
    return { kind: "session", accessToken, refreshToken };
  }

  if (accessToken || refreshToken || params.has("expires_in") || params.has("token_type")) {
    return { kind: "incomplete" };
  }

  return { kind: "empty" };
}

export function readEmailOtpType(value: string | null): EmailOtpType | null {
  if (!value || !emailOtpTypes.has(value)) {
    return null;
  }

  return value as EmailOtpType;
}

export function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

function firstParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
