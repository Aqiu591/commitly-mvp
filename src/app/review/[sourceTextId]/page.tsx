import { notFound, redirect } from "next/navigation";

import { ReviewWorkbench } from "@/components/commitments/review-workbench";
import { getMissingEnvNames, REQUIRED_SUPABASE_PAGE_ENV_NAMES } from "@/lib/setup-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Commitment, SourceText } from "@/lib/types";

type ReviewPageProps = {
  params: Promise<{ sourceTextId: string }>;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  if (getMissingEnvNames(process.env, REQUIRED_SUPABASE_PAGE_ENV_NAMES).length > 0) {
    redirect("/setup");
  }

  const { sourceTextId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: sourceText } = await supabase
    .from("source_texts")
    .select("*")
    .eq("id", sourceTextId)
    .eq("user_id", user.id)
    .single();

  if (!sourceText) {
    notFound();
  }

  const { data: commitments } = await supabase
    .from("commitments")
    .select("*")
    .eq("source_text_id", sourceTextId)
    .eq("user_id", user.id)
    .eq("status", "draft")
    .order("created_at", { ascending: true });

  return (
    <main className="page-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">审核</p>
          <h1>审核 AI 提取结果</h1>
          <p className="heading-note">
            保存前逐条确认承诺内容、责任方向、截止日期、置信度和原文证据。低置信内容会提醒你人工确认。
          </p>
        </div>
      </section>
      <ReviewWorkbench sourceText={sourceText as SourceText} commitments={(commitments ?? []) as Commitment[]} />
    </main>
  );
}
