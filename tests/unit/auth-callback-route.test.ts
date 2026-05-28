import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  missingEnvNames: [] as string[],
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn()
}));

vi.mock("@/lib/setup-status", () => ({
  REQUIRED_SUPABASE_PAGE_ENV_NAMES: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  getMissingEnvNames: () => mocks.missingEnvNames
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      verifyOtp: mocks.verifyOtp
    }
  })
}));

import { GET } from "@/app/auth/callback/route";

describe("auth callback route", () => {
  beforeEach(() => {
    mocks.missingEnvNames = [];
    mocks.exchangeCodeForSession.mockReset();
    mocks.verifyOtp.mockReset();
  });

  it("redirects to login with a readable error when Supabase returns an auth error", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/callback?error=access_denied&error_description=Email%20link%20is%20invalid%20or%20has%20expired"
      )
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?authError=expired");
    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("redirects to login when PKCE session exchange fails", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: { message: "invalid request: both auth code and code verifier should be non-empty" }
    });

    const response = await GET(new NextRequest("http://localhost:3000/auth/callback?code=abc123"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?authError=browser_mismatch");
  });

  it("keeps successful redirects inside the app", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } }, error: null });

    const response = await GET(
      new NextRequest("http://localhost:3000/auth/callback?code=abc123&next=https://evil.example")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("exchanges a Supabase token hash from SSR magic-link templates", async () => {
    mocks.verifyOtp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { access_token: "token" } },
      error: null
    });

    const response = await GET(
      new NextRequest("http://127.0.0.1:3000/auth/callback?token_hash=hash123&type=magiclink&next=/import", {
        headers: { host: "127.0.0.1:3000" }
      })
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://127.0.0.1:3000/import");
    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: "hash123",
      type: "magiclink"
    });
    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("redirects to login with a clear error when token hash verification fails", async () => {
    mocks.verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Token has expired or is invalid" }
    });

    const response = await GET(
      new NextRequest("http://127.0.0.1:3000/auth/callback?token_hash=hash123&type=magiclink", {
        headers: { host: "127.0.0.1:3000" }
      })
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://127.0.0.1:3000/login?authError=expired");
  });
});
