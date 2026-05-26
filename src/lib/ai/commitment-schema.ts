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
  direction_reason: z.string().min(1),
  title: z.string().min(1),
  details: z.string(),
  owner: z.string().min(1),
  counterparty: z.string().min(1),
  evidence: z.string().min(1),
  due_date: nullableDate,
  due_time: nullableTime,
  due_timezone: z.string().nullable(),
  due_date_reason: z.string().min(1),
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
      "no_due_date",
      "relative_due_date",
      "dependent_due_date",
      "needs_follow_up"
    ])
  )
});

export const excludedCandidateSchema = z.object({
  evidence: z.string().min(1),
  reason: z.enum([
    "pure_discussion",
    "greeting",
    "unaccepted_intention",
    "unmet_condition",
    "insufficient_action",
    "dependent_date",
    "out_of_scope"
  ]),
  explanation: z.string().min(1)
});

export const commitmentExtractionSchema = z.object({
  source_summary: z.string(),
  language: z.string(),
  warnings: z.array(z.string()),
  excluded_candidates: z.array(excludedCandidateSchema),
  commitments: z.array(aiCommitmentSchema)
});

export type AiCommitment = z.infer<typeof aiCommitmentSchema>;
export type ExcludedCandidate = z.infer<typeof excludedCandidateSchema>;
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
  required: ["source_summary", "language", "warnings", "excluded_candidates", "commitments"],
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
    excluded_candidates: {
      type: "array",
      description: "Candidates that looked promise-like but should not become draft commitments.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["evidence", "reason", "explanation"],
        properties: {
          evidence: {
            type: "string",
            description: "Exact short phrase from the source text."
          },
          reason: {
            type: "string",
            enum: [
              "pure_discussion",
              "greeting",
              "unaccepted_intention",
              "unmet_condition",
              "insufficient_action",
              "dependent_date",
              "out_of_scope"
            ]
          },
          explanation: {
            type: "string",
            description: "Why this candidate should not create a draft commitment."
          }
        }
      }
    },
    commitments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "provisional_id",
          "direction",
          "direction_reason",
          "title",
          "details",
          "owner",
          "counterparty",
          "evidence",
          "due_date",
          "due_time",
          "due_timezone",
          "due_date_reason",
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
          direction_reason: {
            type: "string",
            description: "Brief reason grounded in the speaker/counterparty wording."
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
          due_date_reason: {
            type: "string",
            description: "Brief explanation of the resolved due date, null due date, or follow-up date."
          },
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
                "no_due_date",
                "relative_due_date",
                "dependent_due_date",
                "needs_follow_up"
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
