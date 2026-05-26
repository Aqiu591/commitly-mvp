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
});
