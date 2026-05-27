import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Commitment } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  commitments: [] as Commitment[],
  users: [] as Array<{ id: string; email?: string }>,
  reminderRows: [] as unknown[],
  sentEmails: [] as unknown[],
  sendResponse: { data: { id: "email-1" }, error: null } as {
    data: { id: string } | null;
    error: { message: string } | null;
  },
  missingEnvName: "" as "" | "CRON_SECRET" | "RESEND_API_KEY" | "DAILY_DIGEST_FROM"
}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    cronSecret: () => readMockEnv("CRON_SECRET", "test-cron-secret"),
    dailyDigestFrom: () => readMockEnv("DAILY_DIGEST_FROM", "Commitly <digest@example.com>"),
    resendApiKey: () => readMockEnv("RESEND_API_KEY", "test-resend-key")
  }
}));

function readMockEnv(name: typeof mocks.missingEnvName, value: string) {
  if (mocks.missingEnvName === name) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table === "commitments") {
        return {
          select: () => ({
            eq: async () => ({ data: mocks.commitments, error: null })
          })
        };
      }

      if (table === "reminders") {
        return {
          insert: async (row: unknown) => {
            mocks.reminderRows.push(row);
            return { error: null };
          }
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: mocks.users }, error: null })
      }
    }
  })
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn(async (payload: unknown) => {
        mocks.sentEmails.push(payload);
        return mocks.sendResponse;
      })
    }
  }))
}));

import { POST } from "@/app/api/reminders/daily-digest/route";

describe("daily digest route", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-25T12:00:00.000Z"));
    mocks.commitments = [fakeCommitment("a", "user-a", "发送报价")];
    mocks.users = [{ id: "user-a", email: "a@example.com" }];
    mocks.reminderRows = [];
    mocks.sentEmails = [];
    mocks.sendResponse = { data: { id: "email-1" }, error: null };
    mocks.missingEnvName = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not mark the digest sent when Resend returns an error", async () => {
    mocks.sendResponse = { data: null, error: { message: "Domain not verified" } };

    const response = await POST(
      new NextRequest("http://localhost/api/reminders/daily-digest", {
        method: "POST",
        headers: { authorization: "Bearer test-cron-secret" }
      })
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      error: "每日简报发送失败。请检查 Resend 发件域名、API Key 和收件人邮箱。",
      details: "Domain not verified"
    });
    expect(mocks.sentEmails).toHaveLength(1);
    expect(mocks.reminderRows).toHaveLength(0);
  });

  it("returns a clear setup error when cron config is missing", async () => {
    mocks.missingEnvName = "CRON_SECRET";

    const response = await POST(
      new NextRequest("http://localhost/api/reminders/daily-digest", {
        method: "POST"
      })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      error: "缺少 CRON_SECRET，定时任务暂时不能验证请求。请补齐配置后重试。",
      details: { missing: "CRON_SECRET" }
    });
  });
});

function fakeCommitment(id: string, userId: string, title: string): Commitment {
  return {
    id,
    user_id: userId,
    source_text_id: "source",
    status: "confirmed",
    direction: "i_owe",
    title,
    details: "",
    owner_label: "我方",
    counterparty_label: "客户",
    evidence: title,
    due_date: "2026-05-25",
    due_time: null,
    due_timezone: "Asia/Shanghai",
    suggested_follow_up_date: null,
    confidence: 0.9,
    confidence_reason: "",
    risk_flags: [],
    created_at: "2026-05-24T00:00:00.000Z",
    updated_at: "2026-05-24T00:00:00.000Z",
    confirmed_at: "2026-05-24T00:00:00.000Z",
    completed_at: null
  };
}
