import { describe, expect, it } from "vitest";

import { buildAuthCallbackPathFromLoginParams, parseAuthHashCallback } from "@/lib/auth-link-params";

describe("auth link parameter helpers", () => {
  it("forwards callback parameters that accidentally land on the login page", () => {
    expect(
      buildAuthCallbackPathFromLoginParams({
        code: "abc123",
        next: "/import"
      })
    ).toBe("/auth/callback?code=abc123&next=%2Fimport");

    expect(
      buildAuthCallbackPathFromLoginParams({
        authError: "expired"
      })
    ).toBeNull();
  });

  it("parses implicit-flow session hashes so the login page can finish or explain the callback", () => {
    expect(parseAuthHashCallback("#access_token=access&refresh_token=refresh")).toEqual({
      kind: "session",
      accessToken: "access",
      refreshToken: "refresh"
    });

    expect(parseAuthHashCallback("#error=access_denied&error_description=Email%20link%20is%20invalid")).toEqual({
      kind: "error",
      errorCode: "expired"
    });

    expect(parseAuthHashCallback("#access_token=access")).toEqual({ kind: "incomplete" });
    expect(parseAuthHashCallback("")).toEqual({ kind: "empty" });
  });
});
