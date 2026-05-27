import OpenAI from "openai";
import { describe, expect, it } from "vitest";

import {
  COMMITMENT_EXTRACTION_JSON_SCHEMA,
  parseCommitmentExtraction
} from "@/lib/ai/commitment-schema";
import { buildCommitmentExtractionInput, COMMITMENT_EXTRACTION_PROMPT } from "@/lib/ai/prompts";
import { parseStructuredResponse } from "@/lib/ai/response-parser";

import samples from "./zh-commitment-samples.json";
import { normalizeExpectedEval, scoreCommitmentExtraction, summarizeEvalScores } from "./scoring";
import { selectEvalSamples } from "./selection";

const shouldRunLiveEval = process.env.RUN_OPENAI_EVAL === "1";

describe.skipIf(!shouldRunLiveEval)("OpenAI live Chinese extraction eval", () => {
  it(
    "runs all 20 Chinese samples and reports the six quality metrics",
    async () => {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY must be present in the current process environment; this test does not read .env.local.");
      }

      const model = process.env.OPENAI_ANALYSIS_MODEL ?? "gpt-5.4-mini";
      const client = new OpenAI({
        apiKey,
        timeout: 45000,
        maxRetries: 1
      });
      const selectedSamples = selectEvalSamples(samples, {
        sampleIds: process.env.OPENAI_EVAL_SAMPLE_IDS,
        limit: process.env.OPENAI_EVAL_LIMIT
      });

      const scores = [];

      for (const sample of selectedSamples) {
        const response = await client.responses.create({
          model,
          instructions: COMMITMENT_EXTRACTION_PROMPT,
          input: buildCommitmentExtractionInput({
            sourceType: sample.sourceType,
            customerName: "匿名客户",
            contactName: "匿名联系人",
            projectName: "Commitly eval",
            communicatedAt: sample.communicatedAt,
            timezone: sample.timezone,
            rawText: sample.text
          }),
          text: {
            format: {
              type: "json_schema",
              name: "commitment_extraction",
              strict: true,
              schema: COMMITMENT_EXTRACTION_JSON_SCHEMA
            }
          }
        });

        const extraction = parseCommitmentExtraction(parseStructuredResponse(response));
        scores.push({
          id: sample.id,
          ...scoreCommitmentExtraction(normalizeExpectedEval(sample.expected), extraction)
        });
      }

      const summary = summarizeEvalScores(scores);
      console.info(
        JSON.stringify(
          {
            model,
            selectedSampleIds: selectedSamples.map((sample) => sample.id),
            summary,
            scores
          },
          null,
          2
        )
      );

      expect(scores).toHaveLength(selectedSamples.length);
      expect(summary.sampleCount).toBe(selectedSamples.length);
    },
    300000
  );
});
