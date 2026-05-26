import { NextRequest, NextResponse } from "next/server";

import { extractCommitments } from "@/lib/ai/extract";
import { AiIncompleteError, AiParseError, AiRefusalError } from "@/lib/ai/response-parser";
import { mapAiCommitmentsToDraftRows } from "@/lib/commitments/map-ai";
import { serverEnv } from "@/lib/env.server";
import { jsonError, validationError } from "@/lib/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { analyzeRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = analyzeRequestSchema.safeParse(body);

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
  const { data: sourceText, error: sourceError } = await supabase
    .from("source_texts")
    .insert({
      user_id: user.id,
      source_type: input.sourceType,
      customer_name: input.customerName,
      contact_name: input.contactName || null,
      project_name: input.projectName || null,
      communicated_at: input.communicatedAt,
      timezone: input.timezone,
      raw_text: input.rawText,
      analysis_status: "pending"
    })
    .select("id")
    .single();

  if (sourceError || !sourceText) {
    return jsonError("无法保存沟通原文。", 500, sourceError?.message);
  }

  try {
    const extraction = await extractCommitments(input);
    const draftRows = mapAiCommitmentsToDraftRows(extraction, sourceText.id, user.id, input);

    if (draftRows.length > 0) {
      const { error: insertError } = await supabase.from("commitments").insert(draftRows);

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    const { error: updateError } = await supabase
      .from("source_texts")
      .update({
        analysis_status: "analyzed",
        ai_model: serverEnv.openaiAnalysisModel,
        ai_response: extraction,
        ai_error: null
      })
      .eq("id", sourceText.id)
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      sourceTextId: sourceText.id,
      reviewUrl: `/review/${sourceText.id}`,
      commitmentsCreated: draftRows.length,
      warnings: extraction.warnings
    });
  } catch (error) {
    await supabase
      .from("source_texts")
      .update({
        analysis_status: "failed",
        ai_model: serverEnv.openaiAnalysisModel,
        ai_error: error instanceof Error ? error.message : "未知 AI 错误"
      })
      .eq("id", sourceText.id)
      .eq("user_id", user.id);

    if (error instanceof AiRefusalError) {
      return jsonError("模型拒绝分析这段文本。", 422, { sourceTextId: sourceText.id });
    }

    if (error instanceof AiIncompleteError) {
      return jsonError("模型响应超时或不完整。", 504, { sourceTextId: sourceText.id });
    }

    if (error instanceof AiParseError) {
      return jsonError("模型响应无法解析。", 502, { sourceTextId: sourceText.id });
    }

    return jsonError("分析失败。", 502, { sourceTextId: sourceText.id });
  }
}
