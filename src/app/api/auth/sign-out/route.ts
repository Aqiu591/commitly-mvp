import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut().catch(() => null);

  const response = NextResponse.json({ ok: true });
  request.cookies.getAll().forEach((cookie) => {
    if (isSupabaseAuthCookie(cookie.name)) {
      response.cookies.set(cookie.name, "", {
        path: "/",
        maxAge: 0
      });
    }
  });

  return response;
}

function isSupabaseAuthCookie(name: string) {
  return name.startsWith("sb-") && (name.includes("auth-token") || name.includes("code-verifier"));
}
