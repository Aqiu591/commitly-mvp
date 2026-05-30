import { NextRequest, NextResponse } from "next/server";

import { jsonError, validationError } from "@/lib/http";
import { checkRateLimit, clientKey, rateLimitResponse } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatEmailOtpVerifyMessage } from "@/lib/user-facing";
import { emailOtpVerifyRequestSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit({
    key: `verify-otp:${clientKey(request)}`,
    limit: 5,
    windowSeconds: 60
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.remaining, rateLimit.resetAt);
  }
  const body = await request.json().catch(() => null);
  const parsed = emailOtpVerifyRequestSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email"
  });

  if (error) {
    return jsonError(formatEmailOtpVerifyMessage(error.message), 401);
  }

  return NextResponse.json({ ok: true });
}
