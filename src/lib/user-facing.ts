export type MissingConfigContext = "ai" | "cron" | "email" | "general";

const riskFlagLabels: Record<string, string> = {
  no_due_date: "没有明确截止日期",
  low_confidence: "AI 信心偏低",
  conditional_language: "带条件，需要人工确认",
  ambiguous_owner: "责任人不够明确",
  ambiguous_due_date: "日期可能需要确认"
};

export function formatRiskFlag(flag: string) {
  return riskFlagLabels[flag] ?? flag;
}

export function formatLoginAuthMessage(rawMessage?: string) {
  const message = rawMessage?.trim();
  const normalized = message?.toLowerCase() ?? "";

  if (!message) {
    return "登录失败，请稍后重试。";
  }

  if (normalized.includes("rate") || normalized.includes("too many")) {
    return "登录邮件发送太频繁了，请稍等一会儿再试。";
  }

  if (normalized.includes("invalid") && normalized.includes("email")) {
    return "邮箱格式看起来不对，请检查后再试。";
  }

  if (normalized.includes("signup") || normalized.includes("signups")) {
    return "当前 Supabase 项目没有开放邮箱登录，请先检查 Auth 配置。";
  }

  return "登录失败，请确认邮箱可用，稍后再试。";
}

export function formatImportFailureMessage(status: number, errorMessage?: string) {
  const message = errorMessage?.trim();

  if (message && missingEnvNameFromText(message)) {
    return `${ensureChinesePeriod(message)}补齐配置并重启服务后，再重新导入这段文本。`;
  }

  if (status === 401) {
    return "登录状态已失效，请重新登录后再导入。";
  }

  if (status === 422) {
    return "AI 拒绝分析这段文本。请删掉不必要的敏感内容，或换一段更明确的沟通记录再试。";
  }

  if (status === 504) {
    return "AI 分析超时了。可以先缩短原文，或稍后重新导入。";
  }

  if (status >= 500) {
    return `${message ?? "导入失败。"} 请稍后重试；如果连续失败，先检查 OpenAI、Supabase 和网络配置。`;
  }

  return message ?? "导入失败，请检查必填项后再试。";
}

export function missingEnvNameFromError(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  return missingEnvNameFromText(error.message);
}

export function missingEnvNameFromText(message: string) {
  return (
    message.match(/Missing required environment variable: ([A-Z0-9_]+)/)?.[1] ??
    message.match(/缺少\s+([A-Z0-9_]+)/)?.[1] ??
    null
  );
}

export function formatMissingConfigMessage(name: string, context: MissingConfigContext = "general") {
  if (context === "ai") {
    return `缺少 ${name}，AI 分析暂时不能运行。`;
  }

  if (context === "cron") {
    return `缺少 ${name}，定时任务暂时不能验证请求。请补齐配置后重试。`;
  }

  if (context === "email") {
    return `缺少 ${name}，邮件简报暂时不能发送。请补齐配置后重试。`;
  }

  return `缺少 ${name}，应用配置还不完整。请补齐配置后重试。`;
}

function ensureChinesePeriod(value: string) {
  return /[。！？.!?]$/.test(value) ? value : `${value}。`;
}
