"use client";

import { ClipboardPaste, LoaderCircle } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const sourceTypes = ["会议纪要", "邮件", "微信", "Slack", "飞书", "电话记录", "其他"];

export function ImportForm() {
  const router = useRouter();
  const browserTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai",
    []
  );
  const [timezone, setTimezone] = useState(browserTimezone);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => null);
    setIsSubmitting(false);

    if (!response.ok) {
      setError(result?.error ?? "导入失败");
      return;
    }

    router.push(result.reviewUrl);
  }

  return (
    <form className="import-grid" onSubmit={handleSubmit}>
      <section className="form-panel">
        <label>
          来源
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
          沟通时间
          <input name="communicatedAt" required type="datetime-local" defaultValue={defaultDateTimeLocal()} />
        </label>
        <label>
          时区
          <input value={timezone} onChange={(event) => setTimezone(event.target.value)} required />
        </label>
      </section>
      <section className="form-panel text-panel">
        <label>
          原文
          <textarea
            name="rawText"
            required
            rows={18}
            placeholder="粘贴会议纪要、邮件、聊天记录或电话摘要..."
          />
        </label>
        <div className="form-actions">
          {error ? <p className="error-text">{error}</p> : <span />}
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? <LoaderCircle className="spin" size={18} /> : <ClipboardPaste size={18} />}
            {isSubmitting ? "分析中" : "分析并进入审核"}
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
