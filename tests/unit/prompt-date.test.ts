import { describe, expect, it } from "vitest";

import { buildCommitmentExtractionInput, COMMITMENT_EXTRACTION_PROMPT } from "@/lib/ai/prompts";

describe("date grounding prompt", () => {
  it("passes communicated_at and timezone instead of relying on server time", () => {
    const payload = buildCommitmentExtractionInput({
      sourceType: "会议纪要",
      customerName: "匿名客户",
      contactName: "张三",
      projectName: "试点",
      communicatedAt: "2026-05-24T02:30:00.000Z",
      timezone: "Asia/Shanghai",
      rawText: "明天下午我把方案发你。"
    });

    expect(payload).toContain("2026-05-24T02:30:00.000Z");
    expect(payload).toContain("Asia/Shanghai");
    expect(COMMITMENT_EXTRACTION_PROMPT).toContain("不要使用服务器当前时间");
  });

  it("asks the model to guard the six eval failure modes", () => {
    expect(COMMITMENT_EXTRACTION_PROMPT).toContain("漏提");
    expect(COMMITMENT_EXTRACTION_PROMPT).toContain("误提");
    expect(COMMITMENT_EXTRACTION_PROMPT).toContain("日期误判");
    expect(COMMITMENT_EXTRACTION_PROMPT).toContain("方向误判");
    expect(COMMITMENT_EXTRACTION_PROMPT).toContain("编辑率");
    expect(COMMITMENT_EXTRACTION_PROMPT).toContain("删除率");
  });

  it("discourages dependent future commitments without fixed dates", () => {
    expect(COMMITMENT_EXTRACTION_PROMPT).toContain("收到后");
    expect(COMMITMENT_EXTRACTION_PROMPT).toContain("不要创建带日期的承诺");
  });
});
