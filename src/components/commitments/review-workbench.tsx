"use client";

import { AlertTriangle, Check, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Commitment, SourceText } from "@/lib/types";

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
  riskFlags: string[];
};

type ReviewWorkbenchProps = {
  sourceText: SourceText;
  commitments: Commitment[];
};

export function ReviewWorkbench({ sourceText, commitments }: ReviewWorkbenchProps) {
  const router = useRouter();
  const [items, setItems] = useState(() => commitments.map(toReviewCommitment));
  const [error, setError] = useState("");
  const [rawDeleted, setRawDeleted] = useState(Boolean(sourceText.raw_text_deleted_at || !sourceText.raw_text));
  const [isPending, startTransition] = useTransition();

  function updateItem(id: string, patch: Partial<ReviewCommitment>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function confirmAll() {
    setError("");
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
      setError(result?.error ?? "确认失败");
      return;
    }

    startTransition(() => {
      router.push("/dashboard");
      router.refresh();
    });
  }

  async function deleteRawText() {
    setError("");
    const response = await fetch(`/api/source-texts/${sourceText.id}/raw`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error ?? "删除原文失败");
      return;
    }

    setRawDeleted(true);
  }

  return (
    <div className="review-layout">
      <aside className="source-panel">
        <dl className="source-meta">
          <div>
            <dt>客户</dt>
            <dd>{sourceText.customer_name}</dd>
          </div>
          <div>
            <dt>联系人</dt>
            <dd>{sourceText.contact_name || "-"}</dd>
          </div>
          <div>
            <dt>项目</dt>
            <dd>{sourceText.project_name || "-"}</dd>
          </div>
          <div>
            <dt>沟通时间</dt>
            <dd>{new Date(sourceText.communicated_at).toLocaleString("zh-CN", { timeZone: sourceText.timezone })}</dd>
          </div>
        </dl>
        <button className="secondary-button" disabled={rawDeleted} onClick={deleteRawText} type="button">
          <Trash2 size={16} />
          {rawDeleted ? "原文已删除" : "删除原文"}
        </button>
        {sourceText.ai_error ? <p className="error-text">{sourceText.ai_error}</p> : null}
      </aside>

      <section className="review-stack">
        {items.length === 0 ? (
          <div className="empty-state">
            <Check size={24} />
            <h2>没有正式承诺</h2>
          </div>
        ) : (
          items.map((item, index) => (
            <article className="commitment-editor" key={item.id}>
              <div className="editor-heading">
                <div>
                  <span className="count-pill">{index + 1}</span>
                  <strong>{Math.round(item.confidence * 100)}%</strong>
                </div>
                <button className="icon-button" onClick={() => removeItem(item.id)} title="移除" type="button">
                  <X size={18} />
                </button>
              </div>

              {item.riskFlags.length > 0 ? (
                <p className="risk-line">
                  <AlertTriangle size={15} />
                  {item.riskFlags.join(" / ")}
                </p>
              ) : null}

              <label>
                标题
                <input value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} />
              </label>
              <label>
                细节
                <textarea
                  value={item.details}
                  rows={3}
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
                证据
                <input value={item.evidence} onChange={(event) => updateItem(item.id, { evidence: event.target.value })} />
              </label>
            </article>
          ))
        )}

        <div className="sticky-actions">
          {error ? <p className="error-text">{error}</p> : <span />}
          <button className="primary-button" disabled={isPending} onClick={confirmAll} type="button">
            <Save size={18} />
            {isPending ? "保存中" : "确认到看板"}
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
    riskFlags: commitment.risk_flags
  };
}

function emptyToNull(value: string | null) {
  return value && value.trim().length > 0 ? value : null;
}
