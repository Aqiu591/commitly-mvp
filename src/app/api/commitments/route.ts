import { NextRequest, NextResponse } from "next/server";

import { jsonError, validationError } from "@/lib/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const createCommitmentSchema = z.object({
  title: z.string().trim().min(1),
  details: z.string().trim().optional().default(""),
  direction: z.enum(["i_owe", "they_owe"]),
  ownerLabel: z.string().trim().optional().default("我"),
  counterpartyLabel: z.string().trim().optional().default(""),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().default(null),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional().default(null)
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createCommitmentSchema.safeParse(body);

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

  const input = parsed.data;
  const { data: created, error } = await supabase
    .from("commitments")
    .insert({
      user_id: user.id,
      status: "confirmed",
      title: input.title,
      details: input.details,
      direction: input.direction,
      owner_label: input.ownerLabel,
      counterparty_label: input.counterpartyLabel,
      evidence: "",
      due_date: input.dueDate,
      due_time: input.dueTime,
      due_timezone: null,
      suggested_follow_up_date: null,
      confidence: 1.0,
      confidence_reason: "手动创建",
      risk_flags: [],
      confirmed_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (error || !created) {
    return jsonError("创建承诺失败。", 500, error?.message);
  }

  return NextResponse.json({ commitment: created }, { status: 201 });
}
