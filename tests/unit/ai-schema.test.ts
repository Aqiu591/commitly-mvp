import { describe, expect, it } from "vitest";

import { parseCommitmentExtraction } from "@/lib/ai/commitment-schema";

describe("commitment extraction schema", () => {
  it("accepts an empty commitment array", () => {
    const result = parseCommitmentExtraction({
      source_summary: "No commitments.",
      language: "zh-CN",
      warnings: [],
      commitments: []
    });

    expect(result.commitments).toEqual([]);
  });

  it("rejects malformed commitment output", () => {
    expect(() =>
      parseCommitmentExtraction({
        source_summary: "Bad",
        language: "zh-CN",
        warnings: [],
        commitments: [{ direction: "maybe" }]
      })
    ).toThrow();
  });
});
