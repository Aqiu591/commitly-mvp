/**
 * Shared camelCase ↔ snake_case field mappings for commitment insert/update.
 * Centralises the mapping that was duplicated across API routes.
 */

import type { Commitment } from "@/lib/types";

/** Maps a camelCase form input to the snake_case DB column shape. */
export function mapCommitmentInput(input: {
  title?: string;
  details?: string;
  direction?: string;
  ownerLabel?: string;
  counterpartyLabel?: string;
  evidence?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  dueTimezone?: string | null;
  suggestedFollowUpDate?: string | null;
}): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (input.title !== undefined) patch.title = input.title;
  if (input.details !== undefined) patch.details = input.details;
  if (input.direction !== undefined) patch.direction = input.direction;
  if (input.ownerLabel !== undefined) patch.owner_label = input.ownerLabel;
  if (input.counterpartyLabel !== undefined) patch.counterparty_label = input.counterpartyLabel;
  if (input.evidence !== undefined) patch.evidence = input.evidence;
  if (input.dueDate !== undefined) patch.due_date = input.dueDate;
  if (input.dueTime !== undefined) patch.due_time = input.dueTime;
  if (input.dueTimezone !== undefined) patch.due_timezone = input.dueTimezone;
  if (input.suggestedFollowUpDate !== undefined) {
    patch.suggested_follow_up_date = input.suggestedFollowUpDate;
  }

  return patch;
}

/** Maps a confirmed commitment edit input to the full update shape. */
export function mapCommitmentEdit(input: {
  id: string;
  title: string;
  details: string;
  direction: string;
  ownerLabel: string;
  counterpartyLabel: string;
  evidence: string;
  dueDate: string | null;
  dueTime: string | null;
  dueTimezone: string | null;
  suggestedFollowUpDate: string | null;
}): Record<string, unknown> {
  return {
    title: input.title,
    details: input.details,
    direction: input.direction,
    owner_label: input.ownerLabel,
    counterparty_label: input.counterpartyLabel,
    evidence: input.evidence,
    due_date: input.dueDate,
    due_time: input.dueTime,
    due_timezone: input.dueTimezone,
    suggested_follow_up_date: input.suggestedFollowUpDate,
  };
}
