import { NextRequest, NextResponse } from "next/server";

import { buildReminderRows } from "@/lib/commitments/reminders";
import { jsonError, validationError } from "@/lib/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Commitment } from "@/lib/types";
import { bulkConfirmRequestSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = bulkConfirmRequestSchema.safeParse(body);

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

  const { sourceTextId, commitments } = parsed.data;
  const { data: sourceText } = await supabase
    .from("source_texts")
    .select("id")
    .eq("id", sourceTextId)
    .eq("user_id", user.id)
    .single();

  if (!sourceText) {
    return jsonError("找不到这条沟通原文。", 404);
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("commitments")
    .select("*")
    .eq("source_text_id", sourceTextId)
    .eq("user_id", user.id)
    .eq("status", "draft");

  if (existingError) {
    return jsonError("无法加载待审核承诺。", 500, existingError.message);
  }

  const existing = (existingRows ?? []) as Commitment[];
  const existingIds = new Set(existing.map((commitment) => commitment.id));
  const keptIds = new Set(commitments.map((commitment) => commitment.id));

  for (const commitment of commitments) {
    if (!existingIds.has(commitment.id)) {
      return jsonError(`承诺 ${commitment.id} 不是这条原文下的待审核项。`, 400);
    }
  }

  const now = new Date().toISOString();

  await Promise.all(
    commitments.map((commitment) =>
      supabase
        .from("commitments")
        .update({
          status: "confirmed",
          title: commitment.title,
          details: commitment.details,
          direction: commitment.direction,
          owner_label: commitment.ownerLabel,
          counterparty_label: commitment.counterpartyLabel,
          evidence: commitment.evidence,
          due_date: commitment.dueDate,
          due_time: commitment.dueTime,
          due_timezone: commitment.dueTimezone,
          suggested_follow_up_date: commitment.suggestedFollowUpDate,
          confirmed_at: now
        })
        .eq("id", commitment.id)
        .eq("user_id", user.id)
    )
  );

  const removedIds = existing.filter((commitment) => !keptIds.has(commitment.id)).map((commitment) => commitment.id);

  if (removedIds.length > 0) {
    await supabase
      .from("commitments")
      .update({ status: "deleted" })
      .in("id", removedIds)
      .eq("user_id", user.id);
  }

  if (commitments.length > 0) {
    const { data: confirmedRows } = await supabase.from("commitments").select("*").in(
      "id",
      commitments.map((commitment) => commitment.id)
    );

    const reminderRows = buildReminderRows((confirmedRows ?? []) as Commitment[]);

    if (reminderRows.length > 0) {
      await supabase.from("reminders").upsert(reminderRows, {
        onConflict: "commitment_id,reminder_type,scheduled_for",
        ignoreDuplicates: true
      });
    }
  }

  await supabase
    .from("source_texts")
    .update({ analysis_status: "confirmed" })
    .eq("id", sourceTextId)
    .eq("user_id", user.id);

  return NextResponse.json({
    confirmed: commitments.length,
    removed: removedIds.length
  });
}
