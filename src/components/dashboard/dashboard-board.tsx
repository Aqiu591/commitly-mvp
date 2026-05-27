"use client";

import { CheckCircle2, Circle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { DashboardSections } from "@/lib/dashboard/sections";
import type { Commitment } from "@/lib/types";

type DashboardBoardProps = {
  sections: DashboardSections;
  today: string;
};

const sectionOrder: Array<{
  key: keyof DashboardSections;
  title: string;
  description: string;
  tone: "neutral" | "urgent" | "done";
}> = [
  { key: "today", title: "今日到期", description: "今天必须处理", tone: "neutral" },
  { key: "overdue", title: "已逾期", description: "先补救这些", tone: "urgent" },
  { key: "iOwe", title: "我方后续", description: "未来要交付", tone: "neutral" },
  { key: "theyOwe", title: "对方后续", description: "未来要跟进", tone: "neutral" },
  { key: "noDueDate", title: "待定日期", description: "需要补日期", tone: "neutral" },
  { key: "done", title: "已完成", description: "可恢复追踪", tone: "done" }
];

export function DashboardBoard({ sections, today }: DashboardBoardProps) {
  const digestCount =
    sections.today.length + sections.overdue.length + sections.noDueDate.length + sections.iOwe.length + sections.theyOwe.length;
  const emptyBoard = digestCount === 0 && sections.done.length === 0;

  return (
    <div className="dashboard-grid">
      <section className="digest-card">
        <div>
          <p className="eyebrow">每日简报</p>
          <h2>今天先看 {digestCount} 件事</h2>
          <p>看板按优先级分组，同一条承诺只会出现在一个待办栏里。</p>
        </div>
        <div className="digest-metrics">
          <span>
            <strong>{today}</strong>
            <small>今日日期</small>
          </span>
          <span>
            <strong>{sections.overdue.length}</strong>
            <small>逾期</small>
          </span>
          <span>
            <strong>{sections.noDueDate.length}</strong>
            <small>待补日期</small>
          </span>
        </div>
      </section>

      {emptyBoard ? (
        <section className="dashboard-empty">
          <h2>还没有承诺</h2>
          <p>先导入一段会议纪要、邮件文本或聊天记录，审核后就会出现在这里。</p>
          <a className="primary-link" href="/import">
            去导入
          </a>
        </section>
      ) : null}

      {sectionOrder.map((section) => (
        <section className={`board-column ${section.tone}`} key={section.key}>
          <header>
            <div>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </div>
            <span>{sections[section.key].length}</span>
          </header>
          <div className="card-stack">
            {sections[section.key].length === 0 ? (
              <p className="muted-text">暂无</p>
            ) : (
              sections[section.key].map((commitment) => (
                <CommitmentCard commitment={commitment} key={`${section.key}-${commitment.id}`} />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function CommitmentCard({ commitment }: { commitment: Commitment }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const isDone = commitment.status === "done";

  async function setStatus(status: "confirmed" | "done") {
    setError("");

    try {
      const response = await fetch(`/api/commitments/${commitment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setError(result?.error ?? "更新失败，请稍后再试。");
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("无法连接到 Commitly 服务，请稍后再试。");
    }
  }

  return (
    <article className="commitment-card">
      <div className="card-title-row">
        {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        <h3>{commitment.title}</h3>
      </div>
      <p>{commitment.details || commitment.evidence}</p>
      <dl>
        <div>
          <dt>方向</dt>
          <dd>{commitment.direction === "i_owe" ? "我方交付" : "对方交付"}</dd>
        </div>
        <div>
          <dt>负责人</dt>
          <dd>{commitment.owner_label}</dd>
        </div>
        <div>
          <dt>截止</dt>
          <dd>{commitment.due_date || "未定"}</dd>
        </div>
      </dl>
      {commitment.suggested_follow_up_date ? (
        <p className="follow-up-line">建议跟进：{commitment.suggested_follow_up_date}</p>
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}
      <button
        className="secondary-button compact"
        disabled={isPending}
        onClick={() => setStatus(isDone ? "confirmed" : "done")}
        type="button"
      >
        {isDone ? <RotateCcw size={15} /> : <CheckCircle2 size={15} />}
        {isDone ? "恢复" : "完成"}
      </button>
    </article>
  );
}
