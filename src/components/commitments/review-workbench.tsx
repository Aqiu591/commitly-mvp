"use client";

import { AlertTriangle, Check, LoaderCircle, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Commitment, SourceText } from "@/lib/types";
import { formatRiskFlag } from "@/lib/user-facing";

type ReviewCommitment = {
  id: string;
  title: string;
  details: string;
  direction: "i_owe" | "they_owe";
  ownerLabel: string;
  counterpartyLabel: string;
  evidence: string;
  dueDate: string | null;
  dueTime: string | null;
  dueTimezone: string | null;
  suggestedFollowUpDate: string | null;
  confidence: number;
  confidenceReason: string;
  riskFlags: string[];
};

type ReviewWorkbenchProps = {
  sourceText: SourceText;
  commitments: Commitment[];
};

const LOW_CONFIDENCE_THRESHOLD = 0.75;

export function ReviewWorkbench({ sourceText, commitments }: ReviewWorkbenchProps) {
  const router = useRouter();
  const [items, setItems] = useState(() => commitments.map(toReviewCommitment));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rawDeleted, setRawDeleted] = useState(Boolean(sourceText.raw_text_deleted_at || !sourceText.raw_text));
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeletingRaw, setIsDeletingRaw] = useState(false);
  const [isPending, startTransition] = useTransition();
  const removedCount = commitments.length - items.length;
  const needsReviewCount = items.filter(needsHumanReview).length;

  function updateItem(id: string, patch: Partial<ReviewCommitment>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    if (!window.confirm("确认删除这条候选承诺？")) return;
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function confirmAll() {
    setError("");
    setNotice("");
    setIsConfirming(true);

    try {
      const response = await fetch("/api/commitments/bulk-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTextId: sourceText.id,
          commitments: items.map((item) => ({
            id: item.id,
            title: item.title,
            details: item.details,
            direction: item.direction,
            ownerLabel: item.ownerLabel,
            counterpartyLabel: item.counterpartyLabel,
            evidence: item.evidence,
            dueDate: emptyToNull(item.dueDate),
            dueTime: emptyToNull(item.dueTime),
            dueTimezone: emptyToNull(item.dueTimezone),
            suggestedFollowUpDate: emptyToNull(item.suggestedFollowUpDate)
          }))
        })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setError(result?.error ?? "保存审核结果失败。请检查必填项后再试。");
        return;
      }

      startTransition(() => {
        router.push("/dashboard");
        router.refresh();
      });
    } catch {
      setError("无法保存审核结果。请确认本地服务还在运行，稍后再试。");
    } finally {
      setIsConfirming(false);
    }
  }

  async function deleteRawText() {
    if (!window.confirm("确认删除这条沟通原文？删除后不可恢复。")) return;
    setError("");
    setNotice("");
    setIsDeletingRaw(true);

    try {
      const response = await fetch(`/api/source-texts/${sourceText.id}/raw`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setError(result?.error ?? "删除原文失败。请稍后再试。");
        return;
      }

      setRawDeleted(true);
      setNotice("原文已删除，审核结果仍会保留。");
    } catch {
      setError("无法删除原文。请确认本地服务还在运行，稍后再试。");
    } finally {
      setIsDeletingRaw(false);
    }
  }

  return (
    <div className="review-layout">
      <aside className="source-panel">
        <div>
          <p className="eyebrow">原文信息</p>
          <h2>先看上下文，再改承诺</h2>
          <p className="source-note">原文仅用于审核参考。如无需保留原文，可在此删除。</p>
        </div>
        <dl className="source-meta">
          <div>
            <dt>客户</dt>
            <dd>{sourceText.customer_name}</dd>
          </div>
          <div>
            <dt>联系人</dt>
            <dd>{sourceText.contact_name || "—"}</dd>
          </div>
          <div>
            <dt>项目</dt>
            <dd>{sourceText.project_name || "—"}</dd>
          </div>
          <div>
            <dt>沟通时间</dt>
            <dd>{new Date(sourceText.communicated_at).toLocaleString("zh-CN", { timeZone: sourceText.timezone })}</dd>
          </div>
        </dl>
        <button
          className="secondary-button"
          disabled={rawDeleted || isDeletingRaw}
          onClick={deleteRawText}
          type="button"
        >
          {isDeletingRaw ? (
            <>
              <LoaderCircle className="spin" size={14} />
              删除中…
            </>
          ) : (
            <>
              <Trash2 size={14} />
              {rawDeleted ? "原文已删除" : "删除沟通原文"}
            </>
          )}
        </button>
        {sourceText.raw_text && !rawDeleted ? (
          <details className="raw-text-box">
            <summary>查看沟通原文</summary>
            <p>{sourceText.raw_text}</p>
          </details>
        ) : (
          <p className="form-message">原文未保存或已经删除。</p>
        )}
        <div className="review-tips">
          <strong>审核顺序</strong>
          <ol>
            <li>删掉不像承诺的项。</li>
            <li>确认方向、负责人和日期。</li>
            <li>最后保存到看板。</li>
          </ol>
        </div>
        {notice ? <p className="status-message success">{notice}</p> : null}
        {error ? <p className="status-message error">{error}</p> : null}
        {sourceText.ai_error ? <p className="error-text">{sourceText.ai_error}</p> : null}
      </aside>

      <section className="review-stack">
        <div className="review-list-header">
          <div>
            <p className="eyebrow">待确认</p>
            <h2>{items.length} 条候选承诺</h2>
            <p>可直接编辑字段、删除误提取的条目，最后一次性确认保存。</p>
          </div>
          <div className="review-counters" aria-label="审核统计">
            <span>
              <strong>{needsReviewCount}</strong>
              <small>需要人工确认</small>
            </span>
            <span>
              <strong>{removedCount}</strong>
              <small>已移除</small>
            </span>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <Check size={22} />
            <h2>没有待确认承诺</h2>
            <p>所有候选承诺已移除。可以直接完成审核，或返回导入页换一段承诺关系更清晰的沟通文本。</p>
            <div className="empty-state-actions">
              <Link className="primary-link" href="/new">返回新建页</Link>
            </div>
          </div>
        ) : (
          items.map((item, index) => (
            <article className={`commitment-editor ${needsHumanReview(item) ? "needs-review" : ""}`} key={item.id} style={{ animationDelay: `${index * 40}ms` }}>
              <header className="editor-heading">
                <div className="editor-title-group">
                  <span className="count-pill">{index + 1}</span>
                  <div>
                    <p className="commitment-card-label">承诺 #{index + 1}</p>
                    <h2>{item.title || "未命名承诺"}</h2>
                  </div>
                </div>
                <button className="danger-button compact" onClick={() => removeItem(item.id)} type="button">
                  <Trash2 size={14} />
                  删除这条
                </button>
              </header>

              <div className="review-facts">
                <div>
                  <span>责任方向</span>
                  <strong>{formatDirection(item.direction)}</strong>
                </div>
                <div>
                  <span>截止日期</span>
                  <strong>{item.dueDate || "无明确日期"}</strong>
                </div>
                <div>
                  <span>置信度</span>
                  <strong>{Math.round(item.confidence * 100)}%</strong>
                </div>
              </div>

              <div className="confidence-row">
                <span className={needsHumanReview(item) ? "review-badge warning" : "review-badge ok"}>
                  {needsHumanReview(item) ? (
                    <>
                      <AlertTriangle size={13} />
                      需要人工确认
                    </>
                  ) : (
                    <>
                      <Check size={13} />
                      可信度较高
                    </>
                  )}
                </span>
                <div className="confidence-meter" aria-label={`AI 置信度 ${Math.round(item.confidence * 100)}%`}>
                  <span style={{ width: `${Math.round(item.confidence * 100)}%` }} />
                </div>
              </div>

              {item.riskFlags.length > 0 ? (
                <p className="risk-line">
                  <AlertTriangle size={14} />
                  {item.riskFlags.map(formatRiskFlag).join(" / ")}
                </p>
              ) : null}
              {item.confidenceReason ? <p className="confidence-reason">{item.confidenceReason}</p> : null}

              <label>
                承诺内容
                <input value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} />
              </label>
              <label>
                补充说明
                <textarea
                  value={item.details}
                  rows={2}
                  onChange={(event) => updateItem(item.id, { details: event.target.value })}
                />
              </label>
              <div className="two-column">
                <label>
                  方向
                  <select
                    value={item.direction}
                    onChange={(event) => updateItem(item.id, { direction: event.target.value as ReviewCommitment["direction"] })}
                  >
                    <option value="i_owe">我欠别人</option>
                    <option value="they_owe">别人欠我</option>
                  </select>
                </label>
                <label>
                  截止日期
                  <input
                    type="date"
                    value={item.dueDate ?? ""}
                    onChange={(event) => updateItem(item.id, { dueDate: event.target.value })}
                  />
                </label>
              </div>
              <div className="two-column">
                <label>
                  负责人
                  <input
                    value={item.ownerLabel}
                    onChange={(event) => updateItem(item.id, { ownerLabel: event.target.value })}
                  />
                </label>
                <label>
                  对方
                  <input
                    value={item.counterpartyLabel}
                    onChange={(event) => updateItem(item.id, { counterpartyLabel: event.target.value })}
                  />
                </label>
              </div>
              <div className="two-column">
                <label>
                  截止时间
                  <input
                    type="time"
                    value={item.dueTime ?? ""}
                    onChange={(event) => updateItem(item.id, { dueTime: event.target.value })}
                  />
                </label>
                <label>
                  建议跟进
                  <input
                    type="date"
                    value={item.suggestedFollowUpDate ?? ""}
                    onChange={(event) => updateItem(item.id, { suggestedFollowUpDate: event.target.value })}
                  />
                </label>
              </div>
              <label>
                原文证据
                <textarea
                  value={item.evidence}
                  rows={2}
                  onChange={(event) => updateItem(item.id, { evidence: event.target.value })}
                />
              </label>
            </article>
          ))
        )}

        <div className="sticky-actions">
          {error ? (
            <p className="error-text">{error}</p>
          ) : (
            <p className="form-message">
              将确认 <strong>{items.length}</strong> 条，移除 <strong>{removedCount}</strong> 条。
            </p>
          )}
          <button
            className="primary-button"
            disabled={isPending || isConfirming}
            onClick={confirmAll}
            type="button"
          >
            {isPending || isConfirming ? (
              <>
                <LoaderCircle className="spin" size={17} />
                保存中…
              </>
            ) : (
              <>
                <Save size={17} />
                确认并保存到看板
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

function toReviewCommitment(commitment: Commitment): ReviewCommitment {
  return {
    id: commitment.id,
    title: commitment.title,
    details: commitment.details,
    direction: commitment.direction,
    ownerLabel: commitment.owner_label,
    counterpartyLabel: commitment.counterparty_label,
    evidence: commitment.evidence,
    dueDate: commitment.due_date,
    dueTime: commitment.due_time ? commitment.due_time.slice(0, 5) : null,
    dueTimezone: commitment.due_timezone,
    suggestedFollowUpDate: commitment.suggested_follow_up_date,
    confidence: commitment.confidence,
    confidenceReason: commitment.confidence_reason,
    riskFlags: commitment.risk_flags
  };
}

function emptyToNull(value: string | null) {
  return value && value.trim().length > 0 ? value : null;
}

function needsHumanReview(item: ReviewCommitment) {
  return item.confidence < LOW_CONFIDENCE_THRESHOLD || item.riskFlags.length > 0;
}

function formatDirection(direction: ReviewCommitment["direction"]) {
  return direction === "i_owe" ? "我欠别人" : "别人欠我";
}
