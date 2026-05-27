import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyOtp: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      verifyOtp: mocks.verifyOtp
    }
  })
}));

import { POST } from "@/app/api/auth/verify-otp/route";

describe("auth verify otp route", () => {
  beforeEach(() => {
    mocks.verifyOtp.mockReset();
  });

  it("rejects incomplete verification requests", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email: "user@example.com", token: "" })
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it("verifies an email one-time code and creates a session", async () => {
    mocks.verifyOtp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { access_token: "token" } },
      error: null
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email: "user@example.com", token: "123456" })
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      token: "123456",
      type: "email"
    });
  });

  it("returns a clear Chinese message when the code is invalid", async () => {
    mocks.verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Token has expired or is invalid" }
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email: "user@example.com", token: "123456" })
      })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: "验证码已失效或不正确。请重新发送登录邮件，并输入最新一封里的验证码。"
    });
  });
});
