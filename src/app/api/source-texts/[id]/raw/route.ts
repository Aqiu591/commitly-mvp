import { NextResponse } from "next/server";

import { jsonError } from "@/lib/http";
import { buildRawTextDeletionPatch } from "@/lib/source-texts/raw-delete";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("请先登录。", 401);
  }

  const { error } = await supabase
    .from("source_texts")
    .update(buildRawTextDeletionPatch())
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return jsonError("无法删除原文。", 500, error.message);
  }

  return NextResponse.json({ ok: true });
}
