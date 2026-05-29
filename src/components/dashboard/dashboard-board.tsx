"use client";

import { CheckCircle2, Circle, LoaderCircle, LogIn, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import type { DashboardSections } from "@/lib/dashboard/sections";
import type { Commitment } from "@/lib/types";

type DashboardBoardProps = {
  sections: DashboardSections;
  today: string;
  isAuthenticated: boolean;
};

const sectionOrder: Array<{
  key: keyof DashboardSections;
  title: string;
  description: string;
  emptyMessage: string;
  emptyHint: string;
  tone: "neutral" | "urgent" | "done";
}> = [
  { key: "today", title: "今日到期", description: "今天需要完成或跟进", emptyMessage: "今天没有到期承诺", emptyHint: "导入新的沟通文本，AI 会自动提取截止日期", tone: "neutral" },
  { key: "overdue", title: "已逾期", description: "需要优先补救", emptyMessage: "没有逾期承诺", emptyHint: "持续跟进今日到期项，避免产生新的逾期", tone: "urgent" },
  { key: "iOwe", title: "我欠别人", description: "我方需要交付", emptyMessage: "没有待交付的承诺", emptyHint: "导入文本后，AI 会识别\"我/我方\"的责任", tone: "neutral" },
  { key: "theyOwe", title: "别人欠我", description: "对方需要交付", emptyMessage: "没有待对方交付的承诺", emptyHint: "导入文本后，AI 会识别\"你/贵方/客户\"的责任", tone: "neutral" },
  { key: "noDueDate", title: "无明确日期", description: "需要补充截止日期", emptyMessage: "没有待补日期的承诺", emptyHint: "审核时可以给缺少日期的承诺补充截止时间", tone: "neutral" },
  { key: "done", title: "已完成", description: "已归档，可恢复", emptyMessage: "还没有已完成的承诺", emptyHint: "点击卡片上的\"标记完成\"来归档", tone: "done" }
];

export function DashboardBoard({ sections, today, isAuthenticated }: DashboardBoardProps) {
  const digestCount =
    sections.today.length + sections.overdue.length + sections.noDueDate.length + sections.iOwe.length + sections.theyOwe.length;
  const emptyBoard = digestCount === 0 && sections.done.length === 0;

  return (
    <>
      <div className="dashboard-grid">
        <section className="digest-card">
          <div>
            <p className="eyebrow">今日工作台</p>
            <h2>
              {digestCount === 0
                ? "今天没有待处理承诺"
                : `今天到期 ${sections.today.length} 件，逾期 ${sections.overdue.length} 件`}
            </h2>
            <p>按紧急程度和责任方向分组，同一承诺只出现一次。</p>
          </div>
          <div className="digest-metrics">
            <span>
              <AnimatedNumber target={today.length > 0 ? 1 : 0} />
              <small>今日日期</small>
            </span>
            <span className="metric-urgent">
              <AnimatedNumber target={sections.overdue.length} />
              <small>逾期</small>
            </span>
            <span>
              <AnimatedNumber target={digestCount} />
              <small>待处理</small>
            </span>
            <span>
              <AnimatedNumber target={sections.noDueDate.length} />
              <small>无日期</small>
            </span>
          </div>
        </section>

        {!isAuthenticated && emptyBoard ? (
          <section className="dashboard-hero">
            <div className="hero-visual">
              <div className="hero-icon-ring">
                <Sparkles size={28} />
              </div>
              <div className="hero-pulse" />
            </div>
            <div>
              <h2>把承诺从聊天记录里，搬到看板上</h2>
              <p>
                粘贴会议纪要、邮件或聊天记录，AI 自动提取承诺，按"今日到期 / 已逾期 / 我欠别人 / 别人欠我"
                分组追踪。不连 CRM，不接通讯工具，只做承诺追踪一件事。
              </p>
              <div className="hero-actions">
                <Link className="primary-button" href="/login">
                  <LogIn size={16} />
                  登录开始使用
                </Link>
                <Link className="secondary-button" href="/import">
                  先体验导入
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {!isAuthenticated && !emptyBoard ? (
          <div className="auth-cta-banner">
            <p>
              <Sparkles size={14} />
              这是你的承诺看板。
              <Link href="/login">登录</Link>
              后可导入新文本、标记完成状态。
            </p>
          </div>
        ) : null}

        {emptyBoard && isAuthenticated ? (
          <section className="dashboard-empty">
            <div>
              <h2>还没有承诺</h2>
              <p>导入一段会议纪要、邮件或聊天记录，AI 提取后审核确认就会出现在这里。</p>
            </div>
            <Link className="primary-link" href="/import">
              去导入
            </Link>
          </section>
        ) : null}
      </div>

      <div className="board-grid">
        {sectionOrder.map((section) => (
          <section className={`board-column ${section.tone}`} key={section.key}>
            <header>
              <div>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </div>
              <span className={sections[section.key].length > 0 ? "has-items" : ""}>
                {sections[section.key].length}
              </span>
            </header>
            <div className="card-stack">
              {sections[section.key].length === 0 ? (
                <div className="empty-column-state">
                  <p>{section.emptyMessage}</p>
                  <p className="form-message">{section.emptyHint}</p>
                </div>
              ) : (
                sections[section.key].map((commitment, i) => (
                  <div className="card-entrance" style={{ animationDelay: `${i * 50}ms` }} key={`${section.key}-${commitment.id}`}>
                    <CommitmentCard commitment={commitment} isAuthenticated={isAuthenticated} />
                  </div>
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function AnimatedNumber({ target }: { target: number }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let raf: number;
    const duration = 600;
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(from + (target - from) * eased));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return <strong ref={ref}>{current}</strong>;
}

function CommitmentCard({ commitment, isAuthenticated }: { commitment: Commitment; isAuthenticated: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [showDoneEffect, setShowDoneEffect] = useState(false);
  const isDone = commitment.status === "done";

  async function setStatus(status: "confirmed" | "done") {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setError("");
    setToggling(true);

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

      if (status === "done") {
        setShowDoneEffect(true);
        setTimeout(() => setShowDoneEffect(false), 800);
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("无法连接到 Commitly 服务，请稍后再试。");
    } finally {
      setToggling(false);
    }
  }

  return (
    <article className={`commitment-card ${showDoneEffect ? "done-pulse" : ""}`}>
      <div className="card-title-row">
        {isDone ? <CheckCircle2 size={16} color="var(--done)" /> : <Circle size={16} color="var(--soft)" />}
        <div>
          <span className={`direction-pill ${commitment.direction}`}>{formatDirection(commitment.direction)}</span>
          <h3>{commitment.title}</h3>
        </div>
      </div>
      {commitment.details ? (
        <p>{commitment.details}</p>
      ) : commitment.evidence ? (
        <p>{commitment.evidence}</p>
      ) : null}
      <p className="route-line">
        {commitment.owner_label || "我"} → {commitment.counterparty_label || "对方"}
      </p>
      <dl>
        <div>
          <dt>截止</dt>
          <dd>{formatDue(commitment)}</dd>
        </div>
        <div>
          <dt>置信度</dt>
          <dd>{Math.round(commitment.confidence * 100)}%</dd>
        </div>
        <div>
          <dt>来源</dt>
          <dd>{commitment.source_text_id ? "AI 提取" : "手动"}</dd>
        </div>
      </dl>
      {commitment.suggested_follow_up_date ? (
        <p className="follow-up-line">建议跟进：{commitment.suggested_follow_up_date}</p>
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}
      <button
        className="secondary-button compact card-action"
        disabled={isPending || toggling}
        onClick={() => setStatus(isDone ? "confirmed" : "done")}
        type="button"
      >
        {toggling ? (
          <LoaderCircle className="spin" size={14} />
        ) : isDone ? (
          <RotateCcw size={14} />
        ) : (
          <CheckCircle2 size={14} />
        )}
        {toggling ? "更新中…" : isDone ? "移回待处理" : "标记完成"}
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
