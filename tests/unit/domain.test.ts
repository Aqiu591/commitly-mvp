import { describe, expect, it } from "vitest";

import { mapAiCommitmentsToDraftRows } from "@/lib/commitments/map-ai";
import { canTransitionCommitmentStatus } from "@/lib/commitments/status";
import { buildRawTextDeletionPatch } from "@/lib/source-texts/raw-delete";

const baseInput = {
  sourceType: "邮件",
  customerName: "匿名客户",
  contactName: "",
  projectName: "",
  communicatedAt: "2026-05-24T01:00:00.000Z",
  timezone: "Asia/Shanghai",
  rawText: "我回头发你。"
};

describe("domain helpers", () => {
  it("keeps low-date commitments in review with no_due_date risk", () => {
    const rows = mapAiCommitmentsToDraftRows(
      {
        source_summary: "Follow-up promised.",
        language: "zh-CN",
        warnings: [],
        excluded_candidates: [],
        commitments: [
          {
            provisional_id: "c1",
            direction: "i_owe",
            direction_reason: "原文里的“我”是己方。",
            title: "发送材料",
            details: "回头发送材料",
            owner: "我",
            counterparty: "客户",
            evidence: "我回头发你",
            due_date: null,
            due_time: null,
            due_timezone: null,
            due_date_reason: "回头发没有明确日期，适合设置跟进日期。",
            suggested_follow_up_date: "2026-05-27",
            confidence: 0.68,
            confidence_reason: "时间较模糊",
            is_conditional: false,
            condition_text: null,
            should_create: true,
            risk_flags: ["low_confidence"]
          }
        ]
      },
      "source-id",
      "user-id",
      baseInput
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].due_date).toBeNull();
    expect(rows[0].suggested_follow_up_date).toBe("2026-05-27");
    expect(rows[0].risk_flags).toContain("no_due_date");
  });

  it("filters pure discussion and unmet conditional intentions", () => {
    const rows = mapAiCommitmentsToDraftRows(
      {
        source_summary: "Discussion only.",
        language: "zh-CN",
        warnings: [],
        excluded_candidates: [],
        commitments: [
          {
            provisional_id: "c1",
            direction: "they_owe",
            direction_reason: "候选动作来自客户。",
            title: "可能安排会议",
            details: "如果预算批了再看",
            owner: "客户",
            counterparty: "我",
            evidence: "如果预算批了再看",
            due_date: null,
            due_time: null,
            due_timezone: null,
            due_date_reason: "条件未成立且没有明确日期。",
            suggested_follow_up_date: null,
            confidence: 0.4,
            confidence_reason: "条件未成立",
            is_conditional: true,
            condition_text: "预算批了",
            should_create: false,
            risk_flags: ["conditional_language"]
          }
        ]
      },
      "source-id",
      "user-id",
      baseInput
    );

    expect(rows).toEqual([]);
  });

  it("validates status transitions", () => {
    expect(canTransitionCommitmentStatus("draft", "confirmed")).toBe(true);
    expect(canTransitionCommitmentStatus("confirmed", "done")).toBe(true);
    expect(canTransitionCommitmentStatus("deleted", "confirmed")).toBe(false);
    expect(canTransitionCommitmentStatus("done", "deleted")).toBe(true);
  });

  it("builds a raw text deletion patch", () => {
    expect(buildRawTextDeletionPatch(new Date("2026-05-25T00:00:00.000Z"))).toEqual({
      raw_text: null,
      raw_text_deleted_at: "2026-05-25T00:00:00.000Z"
    });
  });
});
