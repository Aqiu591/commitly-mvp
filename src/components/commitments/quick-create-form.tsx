"use client";

import { CheckCircle2, LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

export function QuickCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const dueDate = formData.get("dueDate") as string;
    const dueTime = formData.get("dueTime") as string;

    const payload = {
      title: formData.get("title"),
      details: formData.get("details") || "",
      direction: formData.get("direction"),
      ownerLabel: formData.get("ownerLabel") || "我",
      counterpartyLabel: formData.get("counterpartyLabel") || "",
      dueDate: dueDate || null,
      dueTime: dueTime || null
    };

    try {
      const response = await fetch("/api/commitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setError(result?.error ?? "创建失败，请稍后再试。");
        return;
      }

      setSaved(true);
      startTransition(() => {
        router.refresh();
      });

      setTimeout(() => {
        (event.target as HTMLFormElement).reset();
        setSaved(false);
      }, 1500);
    } catch {
      setError("无法连接到 Commitly 服务，请稍后再试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="quick-create-form" onSubmit={handleSubmit}>
      <div className="quick-create-fields">
        <label>
          承诺内容
          <input
            name="title"
            required
            placeholder="必填：例如周五前提交 Q2 续约方案"
            disabled={isSubmitting}
          />
        </label>

        <div className="three-column">
          <label>
            方向
            <select name="direction" required defaultValue="i_owe" disabled={isSubmitting}>
              <option value="i_owe">我欠别人</option>
              <option value="they_owe">别人欠我</option>
            </select>
          </label>
          <label>
            截止日期
            <input type="date" name="dueDate" disabled={isSubmitting} />
          </label>
          <label>
            截止时间
            <input type="time" name="dueTime" disabled={isSubmitting} />
          </label>
        </div>

        <div className="two-column">
          <label>
            负责人
            <input name="ownerLabel" placeholder="我" disabled={isSubmitting} />
          </label>
          <label>
            对方
            <input name="counterpartyLabel" placeholder="对方姓名或公司" disabled={isSubmitting} />
          </label>
        </div>

        <label>
          补充说明
          <textarea
            name="details"
            rows={2}
            placeholder="可选：补充背景信息"
            disabled={isSubmitting}
          />
        </label>
      </div>

      {error ? <p className="status-message error">{error}</p> : null}
      {saved ? (
        <p className="status-message success">
          <CheckCircle2 size={15} />
          已添加到看板
        </p>
      ) : null}

      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <>
            <LoaderCircle className="spin" size={17} />
            创建中…
          </>
        ) : (
          <>
            <Plus size={17} />
            添加到看板
          </>
        )}
      </button>
    </form>
  );
}
