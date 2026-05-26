import type { AiCommitment, CommitmentExtraction } from "@/lib/ai/commitment-schema";
import type { AnalyzeRequestInput } from "@/lib/validation";

export type DraftCommitmentInsert = {
  source_text_id: string;
  user_id: string;
  status: "draft";
  direction: "i_owe" | "they_owe";
  title: string;
  details: string;
  owner_label: string;
  counterparty_label: string;
  evidence: string;
  due_date: string | null;
  due_time: string | null;
  due_timezone: string | null;
  suggested_follow_up_date: string | null;
  confidence: number;
  confidence_reason: string;
  risk_flags: string[];
};

export function shouldCreateDraftCommitment(commitment: AiCommitment) {
  return commitment.should_create && !commitment.is_conditional && commitment.evidence.trim().length > 0;
}

export function mapAiCommitmentsToDraftRows(
  extraction: CommitmentExtraction,
  sourceTextId: string,
  userId: string,
  input: AnalyzeRequestInput
): DraftCommitmentInsert[] {
  return extraction.commitments.filter(shouldCreateDraftCommitment).map((commitment) => ({
    source_text_id: sourceTextId,
    user_id: userId,
    status: "draft",
    direction: commitment.direction,
    title: commitment.title,
    details: commitment.details,
    owner_label: commitment.owner,
    counterparty_label: commitment.counterparty,
    evidence: commitment.evidence,
    due_date: commitment.due_date,
    due_time: commitment.due_time,
    due_timezone: commitment.due_timezone ?? input.timezone,
    suggested_follow_up_date: commitment.suggested_follow_up_date,
    confidence: commitment.confidence,
    confidence_reason: commitment.confidence_reason,
    risk_flags: normalizeRiskFlags(commitment)
  }));
}

function normalizeRiskFlags(commitment: AiCommitment) {
  const flags = new Set(commitment.risk_flags);

  if (commitment.confidence < 0.72) {
    flags.add("low_confidence");
  }

  if (!commitment.due_date) {
    flags.add("no_due_date");
  }

  return Array.from(flags);
}
