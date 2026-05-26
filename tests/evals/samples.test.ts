import { describe, expect, it } from "vitest";

import samples from "./zh-commitment-samples.json";
import { EVAL_METRICS } from "./scoring";

describe("Chinese eval samples", () => {
  it("contains the MVP eval set", () => {
    expect(samples).toHaveLength(20);
  });

  it("records expected dimensions for manual eval scoring", () => {
    for (const sample of samples) {
      expect(sample).toHaveProperty("id");
      expect(sample).toHaveProperty("text");
      expect(sample).toHaveProperty("expected");
      expect(sample.expected).toHaveProperty("commitmentCount");
      expect(sample.expected).toHaveProperty("metrics");
      expect(sample.expected.metrics).toEqual(EVAL_METRICS);
      expect(sample.expected.directions).toHaveLength(sample.expected.commitmentCount);
      expect(sample.expected.dueDates).toHaveLength(sample.expected.commitmentCount);
    }
  });
});
