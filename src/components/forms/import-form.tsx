"use client";

import { CheckCircle2, ClipboardPaste, LoaderCircle, Sparkles } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { formatImportFailureMessage } from "@/lib/user-facing";

const sourceTypes = ["会议纪要", "邮件文本", "聊天记录", "电话摘要", "其他"];

export function ImportForm() {
  const router = useRouter();
  const browserTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai",
    []
  );
  const [timezone, setTimezone] = useState(browserTimezone);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rawText, setRawText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedTextLength = rawText.trim().length;
  const canSubmit = trimmedTextLength >= 3 && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("正在分析文本，通常需要几秒钟。");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const communicatedAtLocal = String(formData.get("communicatedAt") ?? "");
    const payload = {
      sourceType: String(formData.get("sourceType") ?? ""),
      customerName: String(formData.get("customerName") ?? ""),
      contactName: String(formData.get("contactName") ?? ""),
      projectName: String(formData.get("projectName") ?? ""),
      communicatedAt: zonedLocalToIso(communicatedAtLocal, timezone),
      timezone,
      rawText: String(formData.get("rawText") ?? "")
    };

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setNotice("");
        setError(formatImportFailureMessage(response.status, result?.error));
        return;
      }

      if (!result?.reviewUrl) {
        setNotice("");
        setError("分析完成了，但没有拿到审核入口。请刷新看板后再试。");
        return;
      }

      setNotice("分析完成，正在打开审核页。");
      router.push(result.reviewUrl);
    } catch {
      setNotice("");
      setError("无法连接到 Commitly 服务。请确认本地服务还在运行，网络正常后再试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="import-grid" onSubmit={handleSubmit}>
      <section className="form-panel import-details-panel">
        <div className="panel-heading-small">
          <p className="eyebrow">上下文</p>
          <h2>这段沟通来自哪里</h2>
          <p>这些信息只帮助看板分组和回看，不会创建联系人库。</p>
        </div>
        <div className="panel-kicker">
          <Sparkles size={17} />
          <span>AI 只生成待审核草稿，最终仍由你确认。</span>
        </div>
        <label>
          文本来源
          <select name="sourceType" required defaultValue="会议纪要">
            {sourceTypes.map((sourceType) => (
              <option key={sourceType} value={sourceType}>
                {sourceType}
              </option>
            ))}
          </select>
        </label>
        <label>
          客户 / 公司
          <input name="customerName" required placeholder="例如：Acme China" />
          <span className="form-hint">用于看板显示上下文。</span>
        </label>
        <label>
          联系人
          <input name="contactName" placeholder="例如：王经理" />
        </label>
        <label>
          项目
          <input name="projectName" placeholder="例如：Q3 续约" />
        </label>
        <label>
          沟通发生时间
          <input name="communicatedAt" required type="datetime-local" defaultValue={defaultDateTimeLocal()} />
        </label>
        <label>
          时区
          <input value={timezone} onChange={(event) => setTimezone(event.target.value)} required />
        </label>
        <ul className="helper-list" aria-label="导入提示">
          <li>保留“谁答应了什么”和“什么时候完成”。</li>
          <li>没有明确日期也可以导入，审核时会标记出来。</li>
          <li>敏感原文可在审核页删除。</li>
        </ul>
      </section>
      <section className="form-panel text-panel">
        <div className="field-header">
          <div>
            <p className="eyebrow">原文</p>
            <h2>粘贴中文沟通文本</h2>
          </div>
          <span className={trimmedTextLength >= 3 ? "count-chip ready" : "count-chip"}>{trimmedTextLength} 字</span>
        </div>
        <label>
          沟通原文
          <textarea
            name="rawText"
            required
            minLength={3}
            rows={18}
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="粘贴会议纪要、邮件、聊天记录或电话摘要。尽量保留谁答应了什么、给谁、什么时候完成。"
          />
          <span className="form-hint">3 字以上即可分析，越完整越容易提取准确。</span>
        </label>
        {error ? (
          <p className="status-message error">{error}</p>
        ) : notice ? (
          <p className={isSubmitting ? "status-message loading" : "status-message success"}>
            {isSubmitting ? <LoaderCircle className="spin" size={16} /> : <CheckCircle2 size={16} />}
            {notice}
          </p>
        ) : null}
        <div className="form-actions">
          <span className="form-message">下一步会进入审核页，不会直接写入正式看板。</span>
          <button className="primary-button" disabled={!canSubmit} type="submit">
            {isSubmitting ? <LoaderCircle className="spin" size={18} /> : <ClipboardPaste size={18} />}
            {isSubmitting ? "分析中" : "开始分析"}
          </button>
        </div>
      </section>
    </form>
  );
}

function defaultDateTimeLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function zonedLocalToIso(localDateTime: string, timeZone: string) {
  if (!localDateTime) {
    return "";
  }

  const guessedUtc = new Date(`${localDateTime}:00.000Z`);
  const offset = getTimezoneOffsetMs(guessedUtc, timeZone);
  return new Date(guessedUtc.getTime() - offset).toISOString();
}

function getTimezoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const asUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second")
  );

  return asUtc - date.getTime();
}
