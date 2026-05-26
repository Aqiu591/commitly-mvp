import { describe, expect, it } from "vitest";

import {
  buildDailyDigestMessages,
  groupCommitmentsForDigest,
  renderDailyDigestHtml
} from "@/lib/email/daily-digest";
import type { Commitment } from "@/lib/types";

describe("daily digest email", () => {
  it("renders Chinese digest copy", () => {
    const html = renderDailyDigestHtml({
      userId: "user-a",
      dueToday: [fakeCommitment("a", "user-a", "发送报价", "2026-05-25")],
      overdue: [fakeCommitment("b", "user-a", "补发合同", "2026-05-24")],
      followUps: [fakeCommitment("c", "user-a", "跟进采购名单", null, "2026-05-25")],
      noDueDate: [fakeCommitment("d", "user-a", "确认上线窗口", null)]
    });

    expect(html).toContain("Commitly 每日简报");
    expect(html).toContain("今日到期");
    expect(html).toContain("已经逾期");
    expect(html).toContain("今日跟进");
    expect(html).toContain("无明确日期");
  });

  it("builds one isolated Chinese message per recipient", () => {
    const groups = groupCommitmentsForDigest(
      [
        fakeCommitment("a", "user-a", "A 用户的报价", "2026-05-25"),
        fakeCommitment("b", "user-b", "B 用户的合同", "2026-05-25")
      ],
      "2026-05-25"
    );

    const { messages, skipped } = buildDailyDigestMessages(
      groups,
      new Map([
        ["user-a", "a@example.com"],
        ["user-b", "b@example.com"]
      ]),
      "Commitly <digest@example.com>"
    );

    expect(skipped).toBe(0);
    expect(messages).toHaveLength(2);
    expect(messages.map((message) => message.email.subject)).toEqual([
      "Commitly 每日简报",
      "Commitly 每日简报"
    ]);

    const userAMessage = messages.find((message) => message.userId === "user-a");
    const userBMessage = messages.find((message) => message.userId === "user-b");

    expect(userAMessage?.email.to).toBe("a@example.com");
    expect(userAMessage?.email.html).toContain("A 用户的报价");
    expect(userAMessage?.email.html).not.toContain("B 用户的合同");

    expect(userBMessage?.email.to).toBe("b@example.com");
    expect(userBMessage?.email.html).toContain("B 用户的合同");
    expect(userBMessage?.email.html).not.toContain("A 用户的报价");
  });
});

function fakeCommitment(
  id: string,
  userId: string,
  title: string,
  dueDate: string | null,
  followUpDate: string | null = null
): Commitment {
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
    due_date: dueDate,
    due_time: null,
    due_timezone: "Asia/Shanghai",
    suggested_follow_up_date: followUpDate,
    confidence: 0.9,
    confidence_reason: "",
    risk_flags: [],
    created_at: "2026-05-24T00:00:00.000Z",
    updated_at: "2026-05-24T00:00:00.000Z",
    confirmed_at: "2026-05-24T00:00:00.000Z",
    completed_at: null
  };
}
