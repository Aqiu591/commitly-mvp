import { NextRequest, NextResponse } from "next/server";

import { assertCommitmentTransition } from "@/lib/commitments/status";
import { jsonError, validationError } from "@/lib/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Commitment, CommitmentStatus } from "@/lib/types";
import { patchCommitmentRequestSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = patchCommitmentRequestSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("请先登录。", 401);
  }

  const { data: existingRow } = await supabase
    .from("commitments")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existingRow) {
    return jsonError("找不到这条承诺。", 404);
  }

  const existing = existingRow as Commitment;
  const input = parsed.data;
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

  if (input.status) {
    assertCommitmentTransition(existing.status, input.status as CommitmentStatus);
    patch.status = input.status;

    if (input.status === "confirmed") {
      patch.completed_at = null;
      patch.confirmed_at = existing.confirmed_at ?? new Date().toISOString();
    }

    if (input.status === "done") {
      patch.completed_at = new Date().toISOString();
    }
  }

  const { data: updated, error } = await supabase
    .from("commitments")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !updated) {
    return jsonError("无法更新承诺。", 500, error?.message);
  }

  return NextResponse.json({ commitment: updated });
}
