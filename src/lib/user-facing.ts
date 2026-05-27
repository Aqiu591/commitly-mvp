export type MissingConfigContext = "ai" | "cron" | "email" | "general";
export type AuthCallbackErrorCode = "expired" | "browser_mismatch" | "missing_code" | "unknown";

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

export function formatAuthCallbackMessage(code?: string) {
  if (code === "expired") {
    return "登录的一次性链接已失效或已经用过。请重新发送登录邮件，并只使用最新一封。若邮箱客户端会预打开链接，可以改用邮件里的验证码登录。";
  }

  if (code === "browser_mismatch") {
    return "登录链接没有在同一个浏览器里完成。请在发送登录邮件的这个浏览器里打开邮件按钮；如果邮箱客户端跳到别的浏览器，请复制邮件里的链接到当前浏览器地址栏。";
  }

  if (code === "missing_code") {
    return "登录链接不完整。请重新发送一封登录邮件后再试。";
  }

  return "登录链接无法完成登录。请重新发送一封登录邮件后再试。";
}

export function normalizeEmailOtp(value: string) {
  return value.replace(/\s+/g, "").trim();
}

export function formatEmailOtpVerifyMessage(rawMessage?: string) {
  const normalized = rawMessage?.toLowerCase() ?? "";

  if (normalized.includes("expired") || normalized.includes("invalid") || normalized.includes("token")) {
    return "验证码已失效或不正确。请重新发送登录邮件，并输入最新一封里的验证码。";
  }

  if (normalized.includes("rate") || normalized.includes("too many")) {
    return "验证尝试太频繁了，请稍等一会儿再试。";
  }

  return "验证码登录失败。请检查邮箱和验证码后再试。";
}

export function classifyAuthCallbackError(message?: string | null): AuthCallbackErrorCode {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("code verifier") || normalized.includes("code_verifier")) {
    return "browser_mismatch";
  }

  if (normalized.includes("expired") || normalized.includes("invalid")) {
    return "expired";
  }

  return "unknown";
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
