"use client";

import { Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatLoginAuthMessage, normalizeEmailOtp } from "@/lib/user-facing";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  function clearMessage() {
    if (message) {
      setMessage("");
      setIsErrorMessage(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setIsErrorMessage(false);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    setIsSubmitting(false);
    setIsErrorMessage(Boolean(error));
    setMessage(
      error
        ? formatLoginAuthMessage(error.message)
        : "登录链接已发送，请检查邮箱。请在当前这个浏览器里打开邮件按钮；如果邮箱客户端跳到别的浏览器，请复制链接到这里打开。"
    );
  }

  async function verifyOtp() {
    setIsVerifying(true);
    setMessage("");
    setIsErrorMessage(false);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token: normalizeEmailOtp(otp)
        })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setIsErrorMessage(true);
        setMessage(result?.error ?? "验证码登录失败。请检查邮箱和验证码后再试。");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setIsErrorMessage(true);
      setMessage("无法连接到 Commitly 服务。请确认本地服务还在运行，稍后再试。");
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <label>
        邮箱
        <input
          required
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearMessage();
          }}
          placeholder="you@example.com"
        />
      </label>
      <button className="primary-button" disabled={isSubmitting} type="submit">
        <Mail size={18} />
        {isSubmitting ? "发送中" : "发送登录链接"}
      </button>
      {message ? <p className={isErrorMessage ? "error-text" : "form-message"}>{message}</p> : null}
      <div className="auth-divider">
        <span>或输入邮件验证码</span>
      </div>
      <label>
        邮件验证码
        <input
          inputMode="numeric"
          value={otp}
          onChange={(event) => {
            setOtp(event.target.value);
            clearMessage();
          }}
          placeholder="例如：123456"
        />
      </label>
      <button
        className="secondary-button"
        disabled={isVerifying || !email.trim() || normalizeEmailOtp(otp).length < 6}
        onClick={verifyOtp}
        type="button"
      >
        {isVerifying ? "验证中" : "用验证码登录"}
      </button>
      <p className="form-message">
        如果邮件按钮被邮箱客户端预打开导致失效，请使用最新一封邮件里的验证码。若邮件里没有验证码，请在 Supabase 邮件模板中加入{" "}
        <code>{"{{ .Token }}"}</code>。
      </p>
    </form>
  );
}
