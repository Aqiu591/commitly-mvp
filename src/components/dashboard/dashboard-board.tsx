"use client";

import { CheckCircle2, Circle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { DashboardSections } from "@/lib/dashboard/sections";
import type { Commitment } from "@/lib/types";

type DashboardBoardProps = {
  sections: DashboardSections;
  today: string;
};

const sectionOrder: Array<{
  key: keyof DashboardSections;
  title: string;
  tone: "neutral" | "urgent" | "done";
}> = [
  { key: "today", title: "今日", tone: "neutral" },
  { key: "overdue", title: "逾期", tone: "urgent" },
  { key: "iOwe", title: "我欠别人", tone: "neutral" },
  { key: "theyOwe", title: "别人欠我", tone: "neutral" },
  { key: "noDueDate", title: "无明确日期", tone: "neutral" },
  { key: "done", title: "已完成", tone: "done" }
];

export function DashboardBoard({ sections, today }: DashboardBoardProps) {
  const digestCount =
    sections.today.length + sections.overdue.length + sections.noDueDate.length + sections.iOwe.length + sections.theyOwe.length;

  return (
    <div className="dashboard-grid">
      <section className="digest-card">
        <div>
          <p className="eyebrow">每日简报</p>
          <h2>每日简报</h2>
        </div>
        <div className="digest-metrics">
          <span>
            <strong>{today}</strong>
            <small>今日日期</small>
          </span>
          <span>
            <strong>{digestCount}</strong>
            <small>待关注项</small>
          </span>
        </div>
      </section>

      {sectionOrder.map((section) => (
        <section className={`board-column ${section.tone}`} key={section.key}>
          <header>
            <h2>{section.title}</h2>
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
  const isDone = commitment.status === "done";

  async function setStatus(status: "confirmed" | "done") {
    await fetch(`/api/commitments/${commitment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    startTransition(() => {
      router.refresh();
    });
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
          <dd>{commitment.direction === "i_owe" ? "我欠别人" : "别人欠我"}</dd>
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
