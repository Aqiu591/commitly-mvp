import { describe, expect, it } from "vitest";

import { mapAiCommitmentsToDraftRows } from "@/lib/commitments/map-ai";
import { buildDashboardSections } from "@/lib/dashboard/sections";
import { groupCommitmentsForDigest } from "@/lib/email/daily-digest";
import type { Commitment } from "@/lib/types";

const input = {
  sourceType: "会议纪要",
  customerName: "匿名客户",
  contactName: "李总",
  projectName: "上线",
  communicatedAt: "2026-05-24T02:00:00.000Z",
  timezone: "Asia/Shanghai",
  rawText: "明天我发报价，李总周三给采购名单。"
};

describe("Commitly core flow", () => {
  it("covers import -> review -> confirm -> dashboard with two directions", () => {
    const drafts = mapAiCommitmentsToDraftRows(
      {
        source_summary: "Two commitments.",
        language: "zh-CN",
        warnings: [],
        commitments: [
          {
            provisional_id: "c1",
            direction: "i_owe",
            title: "发送报价",
            details: "明天发送报价",
            owner: "我",
            counterparty: "李总",
            evidence: "明天我发报价",
            due_date: "2026-05-25",
            due_time: null,
            due_timezone: "Asia/Shanghai",
            suggested_follow_up_date: null,
            confidence: 0.93,
            confidence_reason: "明确承诺和日期",
            is_conditional: false,
            condition_text: null,
            should_create: true,
            risk_flags: []
          },
          {
            provisional_id: "c2",
            direction: "they_owe",
            title: "提供采购名单",
            details: "周三给采购名单",
            owner: "李总",
            counterparty: "我",
            evidence: "李总周三给采购名单",
            due_date: "2026-05-27",
            due_time: null,
            due_timezone: "Asia/Shanghai",
            suggested_follow_up_date: null,
            confidence: 0.91,
            confidence_reason: "明确承诺和日期",
            is_conditional: false,
            condition_text: null,
            should_create: true,
            risk_flags: []
          }
        ]
      },
      "source-1",
      "user-1",
      input
    );

    const confirmed = drafts.map(
      (draft, index) =>
        ({
          id: `commitment-${index}`,
          created_at: "2026-05-24T02:00:00.000Z",
          updated_at: "2026-05-24T02:00:00.000Z",
          confirmed_at: "2026-05-24T02:05:00.000Z",
          completed_at: null,
          ...draft,
          status: "confirmed"
        }) satisfies Commitment
    );

    const sections = buildDashboardSections(confirmed, "2026-05-25");

    expect(sections.today).toHaveLength(1);
    expect(sections.iOwe).toHaveLength(1);
    expect(sections.theyOwe).toHaveLength(1);
  });

  it("keeps daily digest data scoped per user", () => {
    const commitments = [
      fakeCommitment("a", "user-a", "A item"),
      fakeCommitment("b", "user-b", "B item")
    ];

    const groups = groupCommitmentsForDigest(commitments, "2026-05-25");

    expect(groups).toHaveLength(2);
    expect(groups.find((group) => group.userId === "user-a")?.dueToday.map((item) => item.title)).toEqual(["A item"]);
    expect(groups.find((group) => group.userId === "user-b")?.dueToday.map((item) => item.title)).toEqual(["B item"]);
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
    owner_label: "我",
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
