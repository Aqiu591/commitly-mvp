import { z } from "zod";

const nullableDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable();

const nullableTime = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .nullable();

export const aiCommitmentSchema = z.object({
  provisional_id: z.string().min(1),
  direction: z.enum(["i_owe", "they_owe"]),
  title: z.string().min(1),
  details: z.string(),
  owner: z.string().min(1),
  counterparty: z.string().min(1),
  evidence: z.string().min(1),
  due_date: nullableDate,
  due_time: nullableTime,
  due_timezone: z.string().nullable(),
  suggested_follow_up_date: nullableDate,
  confidence: z.number().min(0).max(1),
  confidence_reason: z.string(),
  is_conditional: z.boolean(),
  condition_text: z.string().nullable(),
  should_create: z.boolean(),
  risk_flags: z.array(
    z.enum([
      "low_confidence",
      "vague_due_date",
      "ambiguous_owner",
      "insufficient_evidence",
      "conditional_language",
      "no_due_date"
    ])
  )
});

export const commitmentExtractionSchema = z.object({
  source_summary: z.string(),
  language: z.string(),
  warnings: z.array(z.string()),
  commitments: z.array(aiCommitmentSchema)
});

export type AiCommitment = z.infer<typeof aiCommitmentSchema>;
export type CommitmentExtraction = z.infer<typeof commitmentExtractionSchema>;

const nullableStringSchema = {
  type: ["string", "null"]
} as const;

const nullableDateSchema = {
  type: ["string", "null"],
  description: "YYYY-MM-DD, or null when no explicit or inferable date exists."
} as const;

export const COMMITMENT_EXTRACTION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["source_summary", "language", "warnings", "commitments"],
  properties: {
    source_summary: {
      type: "string",
      description: "A one-sentence summary of the source communication."
    },
    language: {
      type: "string",
      description: "Main language of the communication."
    },
    warnings: {
      type: "array",
      items: { type: "string" }
    },
    commitments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "provisional_id",
          "direction",
          "title",
          "details",
          "owner",
          "counterparty",
          "evidence",
          "due_date",
          "due_time",
          "due_timezone",
          "suggested_follow_up_date",
          "confidence",
          "confidence_reason",
          "is_conditional",
          "condition_text",
          "should_create",
          "risk_flags"
        ],
        properties: {
          provisional_id: {
            type: "string",
            description: "Stable short id within this response, such as c1."
          },
          direction: {
            type: "string",
            enum: ["i_owe", "they_owe"],
            description: "i_owe means the signed-in user owes the customer/contact. they_owe means the customer/contact owes the user."
          },
          title: {
            type: "string",
            description: "Short actionable commitment title."
          },
          details: {
            type: "string",
            description: "Concrete commitment details."
          },
          owner: {
            type: "string",
            description: "Who must act."
          },
          counterparty: {
            type: "string",
            description: "Who expects or receives the action."
          },
          evidence: {
            type: "string",
            description: "Exact short evidence from the source text."
          },
          due_date: nullableDateSchema,
          due_time: {
            type: ["string", "null"],
            description: "HH:mm in due_timezone, or null."
          },
          due_timezone: nullableStringSchema,
          suggested_follow_up_date: nullableDateSchema,
          confidence: {
            type: "number",
            description: "Confidence from 0 to 1."
          },
          confidence_reason: {
            type: "string"
          },
          is_conditional: {
            type: "boolean",
            description: "True when the commitment only applies if a condition occurs."
          },
          condition_text: nullableStringSchema,
          should_create: {
            type: "boolean",
            description: "False for pure discussion, greetings, unaccepted intentions, or unmet conditional commitments."
          },
          risk_flags: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "low_confidence",
                "vague_due_date",
                "ambiguous_owner",
                "insufficient_evidence",
                "conditional_language",
                "no_due_date"
              ]
            }
          }
        }
      }
    }
  }
} as const;

export function parseCommitmentExtraction(value: unknown) {
  return commitmentExtractionSchema.parse(value);
}
