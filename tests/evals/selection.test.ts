import { describe, expect, it } from "vitest";

import { selectEvalSamples } from "./selection";

const samples = [
  { id: "zh-001", text: "one" },
  { id: "zh-002", text: "two" },
  { id: "zh-003", text: "three" }
];

describe("eval sample selection", () => {
  it("returns every sample by default", () => {
    expect(selectEvalSamples(samples).map((sample) => sample.id)).toEqual(["zh-001", "zh-002", "zh-003"]);
  });

  it("selects explicit sample ids in the requested order", () => {
    expect(selectEvalSamples(samples, { sampleIds: "zh-003, zh-001" }).map((sample) => sample.id)).toEqual([
      "zh-003",
      "zh-001"
    ]);
  });

  it("limits the selected samples for low-budget live eval runs", () => {
    expect(selectEvalSamples(samples, { limit: "2" }).map((sample) => sample.id)).toEqual(["zh-001", "zh-002"]);
  });

  it("throws on unknown ids instead of silently spending API calls on the wrong set", () => {
    expect(() => selectEvalSamples(samples, { sampleIds: "zh-404" })).toThrow("Unknown eval sample id: zh-404");
  });
});
