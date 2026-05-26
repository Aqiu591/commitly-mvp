import { describe, expect, it } from "vitest";

import { COMMITMENT_EXTRACTION_JSON_SCHEMA, parseCommitmentExtraction } from "@/lib/ai/commitment-schema";

describe("commitment extraction schema", () => {
  it("accepts an empty commitment array", () => {
    const result = parseCommitmentExtraction({
      source_summary: "No commitments.",
      language: "zh-CN",
      warnings: [],
      excluded_candidates: [],
      commitments: []
    });

    expect(result.commitments).toEqual([]);
    expect(result.excluded_candidates).toEqual([]);
  });

  it("keeps rejected candidates for false-positive eval review", () => {
    const result = parseCommitmentExtraction({
      source_summary: "One unmet condition.",
      language: "zh-CN",
      warnings: ["存在条件未成立的候选项。"],
      excluded_candidates: [
        {
          evidence: "如果法务这周能过，我们下周一发正式合同",
          reason: "unmet_condition",
          explanation: "承诺依赖法务先通过，条件尚未成立。"
        }
      ],
      commitments: []
    });

    expect(result.excluded_candidates[0]).toMatchObject({
      reason: "unmet_condition"
    });
  });

  it("requires direction and date reasoning in strict JSON schema", () => {
    expect(COMMITMENT_EXTRACTION_JSON_SCHEMA.required).toContain("excluded_candidates");

    const commitmentSchema = COMMITMENT_EXTRACTION_JSON_SCHEMA.properties.commitments.items;
    expect(commitmentSchema.required).toEqual(
      expect.arrayContaining(["direction_reason", "due_date_reason", "suggested_follow_up_date"])
    );
  });

  it("rejects malformed commitment output", () => {
    expect(() =>
      parseCommitmentExtraction({
        source_summary: "Bad",
        language: "zh-CN",
        warnings: [],
        excluded_candidates: [],
        commitments: [{ direction: "maybe" }]
      })
    ).toThrow();
  });
});
