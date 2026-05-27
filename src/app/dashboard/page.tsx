import { redirect } from "next/navigation";

import { DashboardBoard } from "@/components/dashboard/dashboard-board";
import { buildDashboardSections, formatDateInTimezone } from "@/lib/dashboard/sections";
import { getMissingEnvNames, REQUIRED_SUPABASE_PAGE_ENV_NAMES } from "@/lib/setup-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Commitment } from "@/lib/types";

export default async function DashboardPage() {
  if (getMissingEnvNames(process.env, REQUIRED_SUPABASE_PAGE_ENV_NAMES).length > 0) {
    redirect("/setup");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("commitments")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "draft")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false });

  const today = formatDateInTimezone(new Date(), "Asia/Shanghai");
  const commitments = (data ?? []) as Commitment[];
  const sections = buildDashboardSections(commitments, today);

  return (
    <main className="page-shell dashboard-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">看板</p>
          <h1>今天的承诺</h1>
          <p className="heading-note">按紧急程度和责任方向分组，先处理今日和逾期，再查看后续跟进。</p>
        </div>
        <a className="primary-link" href="/import">
          新增导入
        </a>
      </section>
      <DashboardBoard sections={sections} today={today} />
    </main>
  );
}
