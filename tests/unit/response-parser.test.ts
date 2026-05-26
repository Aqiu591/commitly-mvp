import { describe, expect, it } from "vitest";

import {
  AiIncompleteError,
  AiParseError,
  AiRefusalError,
  parseStructuredResponse
} from "@/lib/ai/response-parser";

describe("parseStructuredResponse", () => {
  it("parses output_text JSON", () => {
    expect(parseStructuredResponse({ status: "completed", output_text: '{"commitments":[]}' })).toEqual({
      commitments: []
    });
  });

  it("throws on invalid JSON", () => {
    expect(() => parseStructuredResponse({ status: "completed", output_text: "not-json" })).toThrow(AiParseError);
  });

  it("throws on model refusal", () => {
    expect(() =>
      parseStructuredResponse({
        status: "completed",
        output: [
          {
            type: "message",
            content: [{ type: "refusal", refusal: "Cannot comply." }]
          }
        ]
      })
    ).toThrow(AiRefusalError);
  });

  it("throws on incomplete responses", () => {
    expect(() =>
      parseStructuredResponse({
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" }
      })
    ).toThrow(AiIncompleteError);
  });
});
