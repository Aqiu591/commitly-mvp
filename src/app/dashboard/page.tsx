import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardBoard } from "@/components/dashboard/dashboard-board";
import { buildDashboardSections, formatDateInTimezone } from "@/lib/dashboard/sections";
import { getMissingEnvNames, REQUIRED_SUPABASE_PAGE_ENV_NAMES } from "@/lib/setup-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Commitment } from "@/lib/types";

function getDemoCommitments(today: string): Commitment[] {
  const demoUserId = "00000000-0000-0000-0000-000000000000";
  const yesterday = shiftDate(today, -1);
  const lastWeek = shiftDate(today, -7);
  const tomorrow = shiftDate(today, 1);
  const nextWeek = shiftDate(today, 7);

  return [
    {
      id: "demo-1", source_text_id: "demo-src-1", user_id: demoUserId,
      status: "confirmed", direction: "i_owe",
      title: "提交 Q2 续约方案", details: "包含价格对比和服务升级说明",
      owner_label: "我", counterparty_label: "李总（客户）",
      evidence: "我周五前把续约方案发你",
      due_date: tomorrow, due_time: "17:00", due_timezone: "Asia/Shanghai",
      suggested_follow_up_date: null,
      confidence: 0.93, confidence_reason: "明确承诺与日期",
      risk_flags: [],
      created_at: lastWeek, updated_at: lastWeek,
      confirmed_at: lastWeek, completed_at: null
    },
    {
      id: "demo-2", source_text_id: "demo-src-1", user_id: demoUserId,
      status: "confirmed", direction: "they_owe",
      title: "确认采购数量", details: "对方内部审批后确认最终采购量",
      owner_label: "王经理（采购）", counterparty_label: "我",
      evidence: "下周一会确认采购数量",
      due_date: yesterday, due_time: null, due_timezone: "Asia/Shanghai",
      suggested_follow_up_date: today,
      confidence: 0.87, confidence_reason: "明确承诺",
      risk_flags: [],
      created_at: lastWeek, updated_at: lastWeek,
      confirmed_at: lastWeek, completed_at: null
    },
    {
      id: "demo-3", source_text_id: "demo-src-2", user_id: demoUserId,
      status: "confirmed", direction: "i_owe",
      title: "整理物流方案对比表", details: "三家物流商的时效和报价",
      owner_label: "我", counterparty_label: "张总",
      evidence: "我回头发你物流方案",
      due_date: null, due_time: null, due_timezone: null,
      suggested_follow_up_date: tomorrow,
      confidence: 0.68, confidence_reason: "时间模糊",
      risk_flags: ["no_due_date", "low_confidence"],
      created_at: lastWeek, updated_at: lastWeek,
      confirmed_at: lastWeek, completed_at: null
    },
    {
      id: "demo-4", source_text_id: "demo-src-2", user_id: demoUserId,
      status: "confirmed", direction: "they_owe",
      title: "提供技术接口文档", details: "对方开发团队需要提供 API 对接文档",
      owner_label: "赵工（对方技术）", counterparty_label: "我",
      evidence: "我们这边周三前把接口文档发你",
      due_date: yesterday, due_time: null, due_timezone: "Asia/Shanghai",
      suggested_follow_up_date: null,
      confidence: 0.91, confidence_reason: "明确承诺与日期",
      risk_flags: [],
      created_at: shiftDate(today, -14), updated_at: shiftDate(today, -14),
      confirmed_at: shiftDate(today, -14), completed_at: null
    },
    {
      id: "demo-5", source_text_id: "demo-src-3", user_id: demoUserId,
      status: "confirmed", direction: "i_owe",
      title: "发送报价单", details: "含三种规格的价格和交期",
      owner_label: "我", counterparty_label: "陈总",
      evidence: "我下午把报价单发你",
      due_date: today, due_time: "14:00", due_timezone: "Asia/Shanghai",
      suggested_follow_up_date: null,
      confidence: 0.95, confidence_reason: "明确承诺与日期",
      risk_flags: [],
      created_at: yesterday, updated_at: yesterday,
      confirmed_at: yesterday, completed_at: null
    },
    {
      id: "demo-6", source_text_id: "demo-src-3", user_id: demoUserId,
      status: "confirmed", direction: "i_owe",
      title: "安排下周产品演示", details: "需要准备演示环境和样品",
      owner_label: "我", counterparty_label: "周总",
      evidence: "下周安排一次演示",
      due_date: nextWeek, due_time: null, due_timezone: "Asia/Shanghai",
      suggested_follow_up_date: null,
      confidence: 0.82, confidence_reason: "明确承诺，日期相对",
      risk_flags: ["relative_due_date"],
      created_at: yesterday, updated_at: yesterday,
      confirmed_at: yesterday, completed_at: null
    },
    {
      id: "demo-7", source_text_id: "demo-src-4", user_id: demoUserId,
      status: "done", direction: "i_owe",
      title: "完成合同初稿", details: "已发送法务审核",
      owner_label: "我", counterparty_label: "刘总",
      evidence: "合同初稿这周给你",
      due_date: lastWeek, due_time: null, due_timezone: "Asia/Shanghai",
      suggested_follow_up_date: null,
      confidence: 0.94, confidence_reason: "明确承诺",
      risk_flags: [],
      created_at: shiftDate(today, -21), updated_at: shiftDate(today, -7),
      confirmed_at: shiftDate(today, -21), completed_at: shiftDate(today, -7)
    }
  ] as Commitment[];
}

function shiftDate(dateStr: string, days: number): string {
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  if (getMissingEnvNames(process.env, REQUIRED_SUPABASE_PAGE_ENV_NAMES).length > 0) {
    redirect("/setup");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const today = formatDateInTimezone(new Date(), "Asia/Shanghai");

  let commitments: Commitment[] = [];

  if (user) {
    const { data } = await supabase
      .from("commitments")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "draft")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("updated_at", { ascending: false });

    commitments = (data ?? []) as Commitment[];
  } else {
    // Show demo data when not logged in — visitors see the full experience instantly
    commitments = getDemoCommitments(today);
  }

  const sections = buildDashboardSections(commitments, today);
  const isAuthenticated = Boolean(user);
  const userEmail = user?.email ?? null;

  return (
    <main className="page-shell dashboard-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">看板</p>
          <h1>今天的承诺</h1>
          <p className="heading-note">优先处理今日到期和已逾期项，再按责任方向查看后续跟进。</p>
        </div>
        {!isAuthenticated ? (
          <Link className="primary-link" href="/?login=1">
            开始使用
          </Link>
        ) : null}
      </section>
      <DashboardBoard sections={sections} today={today} isAuthenticated={isAuthenticated} userEmail={userEmail} />
    </main>
  );
}
