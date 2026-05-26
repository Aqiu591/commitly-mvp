import { describe, expect, it } from "vitest";

import type { AiCommitment, CommitmentExtraction } from "@/lib/ai/commitment-schema";

import samples from "./zh-commitment-samples.json";
import { EVAL_METRICS, normalizeExpectedEval, scoreCommitmentExtraction, summarizeEvalScores } from "./scoring";
import type { ExpectedEval } from "./scoring";

function extraction(commitments: AiCommitment[]): CommitmentExtraction {
  return {
    source_summary: "测试提取结果",
    language: "zh-CN",
    warnings: [],
    excluded_candidates: [],
    commitments
  };
}

function commitment(overrides: Partial<AiCommitment> = {}): AiCommitment {
  return {
    provisional_id: "c1",
    direction: "i_owe",
    direction_reason: "原文说我方要交付给客户。",
    title: "提交材料",
    details: "提交材料给客户",
    owner: "我方",
    counterparty: "客户",
    evidence: "我今天提交材料",
    due_date: "2026-05-26",
    due_time: null,
    due_timezone: "Asia/Shanghai",
    due_date_reason: "communicated_at 所在时区的今天是 2026-05-26。",
    suggested_follow_up_date: null,
    confidence: 0.9,
    confidence_reason: "有明确动作和责任方。",
    is_conditional: false,
    condition_text: null,
    should_create: true,
    risk_flags: [],
    ...overrides
  };
}

describe("eval scoring", () => {
  it("keeps the six MVP quality metrics in order", () => {
    expect(EVAL_METRICS).toEqual(["漏提", "误提", "日期误判", "方向误判", "编辑率", "删除率"]);
  });

  it("scores omissions without counting should_create=false candidates as false positives", () => {
    const expected: ExpectedEval = {
      commitmentCount: 2,
      directions: ["i_owe", "they_owe"],
      dueDates: ["2026-05-26", "2026-05-27"],
      metrics: EVAL_METRICS
    };

    const score = scoreCommitmentExtraction(
      expected,
      extraction([
        commitment({ direction: "i_owe", due_date: "2026-05-26" }),
        commitment({
          provisional_id: "x1",
          should_create: false,
          is_conditional: true,
          condition_text: "如果客户确认",
          risk_flags: ["conditional_language"]
        })
      ])
    );

    expect(score.missingCount).toBe(1);
    expect(score.falsePositiveCount).toBe(0);
    expect(score.editRate).toBe(0);
    expect(score.deleteRate).toBe(0);
  });

  it("scores extra created commitments as false positives and deletions", () => {
    const expected: ExpectedEval = {
      commitmentCount: 0,
      directions: [],
      dueDates: [],
      metrics: EVAL_METRICS
    };

    const score = scoreCommitmentExtraction(expected, extraction([commitment()]));

    expect(score.falsePositiveCount).toBe(1);
    expect(score.deleteCount).toBe(1);
    expect(score.deleteRate).toBe(1);
  });

  it("scores date and direction mistakes as one edited commitment", () => {
    const expected: ExpectedEval = {
      commitmentCount: 1,
      directions: ["i_owe"],
      dueDates: ["2026-05-26"],
      metrics: EVAL_METRICS
    };

    const score = scoreCommitmentExtraction(
      expected,
      extraction([commitment({ direction: "they_owe", due_date: "2026-05-27" })])
    );

    expect(score.directionMismatchCount).toBe(1);
    expect(score.dateMismatchCount).toBe(1);
    expect(score.editCount).toBe(1);
    expect(score.editRate).toBe(1);
  });

  it("treats missing suggested follow-up for no-date promises as a date mistake", () => {
    const expected: ExpectedEval = {
      commitmentCount: 1,
      directions: ["i_owe"],
      dueDates: [null],
      suggestedFollowUp: true,
      metrics: EVAL_METRICS
    };

    const score = scoreCommitmentExtraction(expected, extraction([commitment({ due_date: null })]));

    expect(score.dateMismatchCount).toBe(1);
    expect(score.editCount).toBe(1);
  });

  it("summarizes the full Chinese eval set", () => {
    const scores = samples.map((sample) => {
      const expected = normalizeExpectedEval(sample.expected);

      return scoreCommitmentExtraction(
        expected,
        extraction(
          expected.directions.map((direction, index) =>
            commitment({
              provisional_id: `c${index + 1}`,
              direction,
              due_date: expected.dueDates[index],
              suggested_follow_up_date:
                expected.dueDates[index] === null && expected.suggestedFollowUp ? "2026-05-28" : null
            })
          )
        )
      );
    });

    expect(scores).toHaveLength(20);
    expect(summarizeEvalScores(scores)).toMatchObject({
      sampleCount: 20,
      missingCount: 0,
      falsePositiveCount: 0,
      dateMismatchCount: 0,
      directionMismatchCount: 0,
      editRate: 0,
      deleteRate: 0
    });
  });
});
