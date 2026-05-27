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
  emptyMessage: string;
  tone: "neutral" | "urgent" | "done";
}> = [
  { key: "today", title: "今日到期", description: "今天需要完成或跟进", emptyMessage: "今天没有到期承诺", tone: "neutral" },
  { key: "overdue", title: "已逾期", description: "优先补救这些事项", emptyMessage: "没有逾期承诺", tone: "urgent" },
  { key: "iOwe", title: "我欠别人", description: "我方未来要交付", emptyMessage: "没有未来要交付的承诺", tone: "neutral" },
  { key: "theyOwe", title: "别人欠我", description: "对方未来要交付", emptyMessage: "没有需要对方交付的承诺", tone: "neutral" },
  { key: "noDueDate", title: "无明确日期", description: "需要补充日期或跟进", emptyMessage: "没有待补日期的承诺", tone: "neutral" },
  { key: "done", title: "已完成", description: "已归档，可恢复追踪", emptyMessage: "还没有已完成承诺", tone: "done" }
];

export function DashboardBoard({ sections, today }: DashboardBoardProps) {
  const digestCount =
    sections.today.length + sections.overdue.length + sections.noDueDate.length + sections.iOwe.length + sections.theyOwe.length;
  const emptyBoard = digestCount === 0 && sections.done.length === 0;

  return (
    <div className="dashboard-grid">
      <section className="digest-card">
        <div>
          <p className="eyebrow">今日工作台</p>
          <h2>{sections.today.length === 0 ? "今天没有到期承诺" : `今天到期 ${sections.today.length} 件`}</h2>
          <p>看板按今日、逾期、责任方向、无明确日期和已完成分组，同一条承诺只会出现一次。</p>
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
            <strong>{digestCount}</strong>
            <small>待处理</small>
          </span>
          <span>
            <strong>{sections.noDueDate.length}</strong>
            <small>无明确日期</small>
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
              <p className="empty-column-state">{section.emptyMessage}</p>
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
        <div>
          <span className={`direction-pill ${commitment.direction}`}>{formatDirection(commitment.direction)}</span>
          <h3>{commitment.title}</h3>
        </div>
      </div>
      <p>{commitment.details || commitment.evidence}</p>
      <p className="route-line">
        {commitment.owner_label} 给 {commitment.counterparty_label}
      </p>
      <dl>
        <div>
          <dt>负责人</dt>
          <dd>{commitment.owner_label}</dd>
        </div>
        <div>
          <dt>截止</dt>
          <dd>{formatDue(commitment)}</dd>
        </div>
        <div>
          <dt>置信度</dt>
          <dd>{Math.round(commitment.confidence * 100)}%</dd>
        </div>
      </dl>
      {commitment.suggested_follow_up_date ? (
        <p className="follow-up-line">建议跟进：{commitment.suggested_follow_up_date}</p>
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}
      <button
        className="secondary-button compact card-action"
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

function formatDirection(direction: Commitment["direction"]) {
  return direction === "i_owe" ? "我欠别人" : "别人欠我";
}

function formatDue(commitment: Commitment) {
  if (!commitment.due_date) {
    return "无明确日期";
  }

  return commitment.due_time ? `${commitment.due_date} ${commitment.due_time.slice(0, 5)}` : commitment.due_date;
}
