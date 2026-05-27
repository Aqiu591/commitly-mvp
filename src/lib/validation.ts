import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

export const analyzeRequestSchema = z.object({
  sourceType: nonEmptyString,
  customerName: nonEmptyString,
  contactName: z.string().trim().optional().default(""),
  projectName: z.string().trim().optional().default(""),
  communicatedAt: nonEmptyString,
  timezone: nonEmptyString,
  rawText: z.string().trim().min(3)
});

export type AnalyzeRequestInput = z.infer<typeof analyzeRequestSchema>;

export const emailOtpVerifyRequestSchema = z.object({
  email: z.string().trim().email(),
  token: z.string().transform((value) => value.replace(/\s+/g, "")).pipe(z.string().min(6))
});

export type EmailOtpVerifyRequestInput = z.infer<typeof emailOtpVerifyRequestSchema>;

const nullableDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable();

const nullableTime = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .nullable();

export const commitmentEditSchema = z.object({
  id: z.string().uuid(),
  title: nonEmptyString,
  details: z.string().trim().default(""),
  direction: z.enum(["i_owe", "they_owe"]),
  ownerLabel: nonEmptyString,
  counterpartyLabel: nonEmptyString,
  evidence: nonEmptyString,
  dueDate: nullableDate,
  dueTime: nullableTime,
  dueTimezone: z.string().trim().nullable(),
  suggestedFollowUpDate: nullableDate
});

export const bulkConfirmRequestSchema = z.object({
  sourceTextId: z.string().uuid(),
  commitments: z.array(commitmentEditSchema)
});

export type BulkConfirmRequestInput = z.infer<typeof bulkConfirmRequestSchema>;

export const patchCommitmentRequestSchema = z
  .object({
    title: nonEmptyString.optional(),
    details: z.string().trim().optional(),
    direction: z.enum(["i_owe", "they_owe"]).optional(),
    ownerLabel: nonEmptyString.optional(),
    counterpartyLabel: nonEmptyString.optional(),
    evidence: nonEmptyString.optional(),
    dueDate: nullableDate.optional(),
    dueTime: nullableTime.optional(),
    dueTimezone: z.string().trim().nullable().optional(),
    suggestedFollowUpDate: nullableDate.optional(),
    status: z.enum(["draft", "confirmed", "done", "deleted"]).optional()
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export type PatchCommitmentRequestInput = z.infer<typeof patchCommitmentRequestSchema>;
