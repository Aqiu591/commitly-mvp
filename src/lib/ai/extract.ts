import "server-only";

import OpenAI from "openai";

import {
  COMMITMENT_EXTRACTION_JSON_SCHEMA,
  parseCommitmentExtraction
} from "@/lib/ai/commitment-schema";
import { buildCommitmentExtractionInput, COMMITMENT_EXTRACTION_PROMPT } from "@/lib/ai/prompts";
import { parseStructuredResponse } from "@/lib/ai/response-parser";
import { serverEnv } from "@/lib/env.server";
import type { AnalyzeRequestInput } from "@/lib/validation";

export async function extractCommitments(input: AnalyzeRequestInput) {
  const client = new OpenAI({
    apiKey: serverEnv.openaiApiKey(),
    timeout: 30000,
    maxRetries: 1
  });

  const response = await client.responses.create({
    model: serverEnv.openaiAnalysisModel,
    instructions: COMMITMENT_EXTRACTION_PROMPT,
    input: buildCommitmentExtractionInput(input),
    text: {
      format: {
        type: "json_schema",
        name: "commitment_extraction",
        strict: true,
        schema: COMMITMENT_EXTRACTION_JSON_SCHEMA
      }
    }
  });

  return parseCommitmentExtraction(parseStructuredResponse(response));
}
