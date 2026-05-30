"use client";

import { CheckCircle2, Circle, LoaderCircle, LogIn, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import type { DashboardSections } from "@/lib/dashboard/sections";
import type { Commitment } from "@/lib/types";

type DashboardBoardProps = {
  sections: DashboardSections;
  today: string;
  isAuthenticated: boolean;
  userEmail: string | null;
};

const sectionOrder: Array<{
  key: keyof DashboardSections;
  title: string;
  description: string;
  emptyMessage: string;
  emptyHint: string;
  tone: "neutral" | "urgent" | "done";
}> = [
  { key: "today", title: "今日到期", description: "今天需要完成或跟进", emptyMessage: "今天没有到期承诺", emptyHint: "干干净净的一天，挺好。新的约定随时可以记下来", tone: "neutral" },
  { key: "overdue", title: "已逾期", description: "需要优先补救", emptyMessage: "没有逾期承诺", emptyHint: "节奏感不错，继续保持这份从容", tone: "urgent" },
  { key: "iOwe", title: "我欠别人", description: "我方需要交付", emptyMessage: "没有待交付的承诺", emptyHint: "手头清爽，心里踏实。答应过的事，一条都不会落下", tone: "neutral" },
  { key: "theyOwe", title: "别人欠我", description: "对方需要交付", emptyMessage: "没有待对方交付的承诺", emptyHint: "暂时没人欠你什么。等有了约定，这里会替你记着", tone: "neutral" },
  { key: "noDueDate", title: "无明确日期", description: "需要补充截止日期", emptyMessage: "没有待补日期的承诺", emptyHint: "每条承诺都有了时间锚点，心里更有谱", tone: "neutral" },
  { key: "done", title: "已完成", description: "已归档，可恢复", emptyMessage: "还没有已完成的承诺", emptyHint: "划掉第一个承诺的那一刻，比什么都治愈", tone: "done" }
];

export function DashboardBoard({ sections, today, isAuthenticated, userEmail }: DashboardBoardProps) {
  const digestCount =
    sections.today.length + sections.overdue.length + sections.noDueDate.length + sections.iOwe.length + sections.theyOwe.length;
  const totalCount = digestCount + sections.done.length;
  const doneRatio = totalCount > 0 ? sections.done.length / totalCount : 0;
  const emptyBoard = digestCount === 0 && sections.done.length === 0;

  const greeting = getTimeGreeting(userEmail);

  return (
    <div style={{ position: "relative" }}>


      <div className="dashboard-grid">
        <section className="digest-card">
          <div>
            <p className="eyebrow">{greeting}</p>
            <h2>
              {digestCount === 0
                ? "今天没有待处理承诺"
                : `今天到期 ${sections.today.length} 件，逾期 ${sections.overdue.length} 件`}
            </h2>
            <p>按紧急程度和责任方向分组，同一承诺只出现一次。</p>
          </div>
          <div className="digest-metrics">
            <ProgressRing ratio={doneRatio} />
            <span>
              <AnimatedNumber target={digestCount} />
              <small>待处理</small>
            </span>
            <span className="metric-urgent">
              <AnimatedNumber target={sections.overdue.length} />
              <small>逾期</small>
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
                <Link className="secondary-button" href="/new">
                  先体验新建
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
            <Link className="primary-link" href="/new">
              去新建
            </Link>
          </section>
        ) : null}
      </div>

      <div className="board-grid">
        {sectionOrder.map((section) => (
          <section className={`board-column ${section.tone}`} key={section.key}>
            <header>
              <div>
                <h2>
                  {section.key === "today" && sections.today.length > 0 ? (
                    <span className="breathing-dot" aria-hidden="true" />
                  ) : null}
                  {section.title}
                </h2>
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
    </div>
  );
}

function getTimeGreeting(userEmail: string | null) {
  const hour = new Date().getHours();
  let prefix: string;
  if (hour < 10) prefix = "早上好";
  else if (hour < 14) prefix = "中午好";
  else if (hour < 18) prefix = "下午好";
  else prefix = "晚上好";

  const name = userNameFromEmail(userEmail);
  return name ? `${prefix}，${name} · 今日工作台` : `${prefix} · 今日工作台`;
}

function userNameFromEmail(email: string | null) {
  if (!email) return null;
  const local = email.split("@")[0];
  if (!local) return null;
  // If it looks like a name (contains dots/underscores/hyphens), try to make it readable
  const readable = local
    .replace(/[._-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return readable || local;
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

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return <strong ref={ref}>{current}</strong>;
}

function ProgressRing({ ratio }: { ratio: number }) {
  const circumference = 2 * Math.PI * 20;
  const offset = circumference * (1 - ratio);

  return (
    <span className="progress-ring-metric">
      <svg width="48" height="48" viewBox="0 0 48 48" aria-label={`完成率 ${Math.round(ratio * 100)}%`}>
        <circle
          cx="24" cy="24" r="20"
          fill="none"
          stroke="var(--line)"
          strokeWidth="3"
        />
        <circle
          cx="24" cy="24" r="20"
          fill="none"
          stroke="var(--done)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 24 24)"
          style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
        <text
          x="24" y="24"
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          fontSize="11"
          fontWeight="750"
        >
          {Math.round(ratio * 100)}%
        </text>
      </svg>
      <small>完成率</small>
    </span>
  );
}

function CommitmentCard({ commitment, isAuthenticated }: { commitment: Commitment; isAuthenticated: boolean }) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; angle: number; speed: number; tx: number; ty: number }>>([]);
  const confettiId = useRef(0);
  const isDone = commitment.status === "done";

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    setTilt({
      rx: dy * -3,
      ry: dx * 3,
      gx: (dx + 0.5) * 100,
      gy: (dy + 0.5) * 100
    });
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });
  }, []);

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
        spawnConfetti();
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

  function spawnConfetti() {
    const colors = ["#176b5b", "#3e7c50", "#b8573a", "#286a9c", "#a86713", "#788590"];
    const particles = Array.from({ length: 24 }, () => {
      confettiId.current += 1;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const speed = 3 + Math.random() * 5;
      return {
        id: confettiId.current,
        x: 50 + (Math.random() - 0.5) * 30,
        y: 40 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle,
        speed,
        tx: Math.cos(angle) * speed * 20,
        ty: Math.sin(angle) * speed * 20 - 30
      };
    });
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 800);
  }

  return (
    <article
      ref={cardRef}
      className={`commitment-card ${isHovered ? "card-hovered" : ""}`}
      tabIndex={0}
      role="button"
      aria-label={isDone ? `恢复 "${commitment.title}"` : `完成 "${commitment.title}"`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setStatus(isDone ? "confirmed" : "done");
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(600px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-2px)`
          : "perspective(600px) rotateX(0deg) rotateY(0deg) translateY(0)",
        transition: isHovered ? "none" : "transform 400ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 400ms ease"
      }}
    >
      {/* Glare overlay */}
      <div
        className="card-glare"
        style={{
          background: isHovered
            ? `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.15) 0%, transparent 60%)`
            : "none"
        }}
        aria-hidden="true"
      />

      {/* Confetti particles */}
      {confetti.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`
          } as React.CSSProperties}
        />
      ))}

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
