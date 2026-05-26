import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const originalDailyDigestFrom = process.env.DAILY_DIGEST_FROM;

describe("server env", () => {
  afterEach(() => {
    if (originalDailyDigestFrom === undefined) {
      delete process.env.DAILY_DIGEST_FROM;
    } else {
      process.env.DAILY_DIGEST_FROM = originalDailyDigestFrom;
    }
    vi.resetModules();
  });

  it("requires DAILY_DIGEST_FROM for real Resend sends", async () => {
    delete process.env.DAILY_DIGEST_FROM;

    const { serverEnv } = await import("@/lib/env.server");

    expect(() => serverEnv.dailyDigestFrom()).toThrow("Missing required environment variable: DAILY_DIGEST_FROM");
  });
});
