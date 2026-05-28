import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signOut: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      signOut: mocks.signOut
    }
  })
}));

import { POST } from "@/app/api/auth/sign-out/route";

describe("auth sign-out route", () => {
  beforeEach(() => {
    mocks.signOut.mockReset();
    mocks.signOut.mockResolvedValue({ error: null });
  });

  it("signs out through Supabase and clears Supabase auth cookies", async () => {
    const response = await POST(
      new NextRequest("http://127.0.0.1:3000/api/auth/sign-out", {
        method: "POST",
        headers: {
          cookie: [
            "sb-localhost-auth-token=abc",
            "sb-localhost-auth-token.0=chunk",
            "sb-localhost-auth-token-code-verifier=verifier",
            "commitly-theme=light"
          ].join("; ")
        }
      })
    );

    const setCookieHeader = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(setCookieHeader).toContain("sb-localhost-auth-token=;");
    expect(setCookieHeader).toContain("sb-localhost-auth-token.0=;");
    expect(setCookieHeader).toContain("sb-localhost-auth-token-code-verifier=;");
    expect(setCookieHeader).not.toContain("commitly-theme=;");
  });
});
