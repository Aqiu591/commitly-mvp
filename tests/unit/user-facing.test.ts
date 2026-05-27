import { describe, expect, it } from "vitest";

import {
  formatAuthCallbackMessage,
  formatEmailOtpVerifyMessage,
  formatImportFailureMessage,
  formatLoginAuthMessage,
  formatRiskFlag,
  normalizeEmailOtp
} from "@/lib/user-facing";

describe("user-facing copy helpers", () => {
  it("keeps login failures in plain Chinese instead of raw provider text", () => {
    expect(formatLoginAuthMessage("Email rate limit exceeded")).toBe(
      "登录邮件发送太频繁了，请稍等一会儿再试。"
    );
  });

  it("keeps AI missing-config import failures actionable", () => {
    expect(formatImportFailureMessage(503, "缺少 OPENAI_API_KEY，AI 分析暂时不能运行。")).toBe(
      "缺少 OPENAI_API_KEY，AI 分析暂时不能运行。补齐配置并重启服务后，再重新导入这段文本。"
    );
  });

  it("translates review risk flags for humans", () => {
    expect(formatRiskFlag("no_due_date")).toBe("没有明确截止日期");
    expect(formatRiskFlag("conditional_language")).toBe("带条件，需要人工确认");
  });

  it("explains browser mismatch magic-link failures", () => {
    expect(formatAuthCallbackMessage("browser_mismatch")).toContain("同一个浏览器");
  });

  it("explains expired magic links as a one-time-link problem", () => {
    expect(formatAuthCallbackMessage("expired")).toContain("一次性链接");
    expect(formatAuthCallbackMessage("expired")).toContain("最新一封");
  });

  it("normalizes pasted email verification codes", () => {
    expect(normalizeEmailOtp(" 123 456 ")).toBe("123456");
  });

  it("keeps verification-code failures actionable", () => {
    expect(formatEmailOtpVerifyMessage("Token has expired or is invalid")).toBe(
      "验证码已失效或不正确。请重新发送登录邮件，并输入最新一封里的验证码。"
    );
  });
});
