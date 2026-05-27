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
          <p className="heading-note">AI 只负责先找候选承诺。保存前请确认方向、负责人、日期和原文证据。</p>
        </div>
      </section>
      <ReviewWorkbench sourceText={sourceText as SourceText} commitments={(commitments ?? []) as Commitment[]} />
    </main>
  );
}
