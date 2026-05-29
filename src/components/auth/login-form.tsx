"use client";

import { LoaderCircle, Mail } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { parseAuthHashCallback } from "@/lib/auth-link-params";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatAuthCallbackMessage, formatLoginAuthMessage } from "@/lib/user-facing";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompletingRedirect, setIsCompletingRedirect] = useState(false);

  useEffect(() => {
    const callback = parseAuthHashCallback(window.location.hash);
    if (callback.kind === "empty") {
      return;
    }

    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

    if (callback.kind === "error") {
      setIsErrorMessage(true);
      setMessage(formatAuthCallbackMessage(callback.errorCode));
      return;
    }

    if (callback.kind === "incomplete") {
      setIsErrorMessage(true);
      setMessage("登录链接不完整。请重新发送登录邮件，并确认邮件按钮打开的是当前浏览器。");
      return;
    }

    let isMounted = true;
    setIsCompletingRedirect(true);
    setIsErrorMessage(false);
    setMessage("正在完成登录，请稍候。");

    const supabase = createSupabaseBrowserClient();
    supabase.auth
      .setSession({
        access_token: callback.accessToken,
        refresh_token: callback.refreshToken
      })
      .then(({ error }) => {
        if (!isMounted) {
          return;
        }

        if (error) {
          setIsErrorMessage(true);
          setMessage(formatAuthCallbackMessage("unknown"));
          setIsCompletingRedirect(false);
          return;
        }

        router.replace("/dashboard");
        router.refresh();
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setIsErrorMessage(true);
        setMessage("无法完成登录。请确认本地服务还在运行，然后重新发送登录邮件。");
        setIsCompletingRedirect(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

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

    const callbackUrl = `${window.location.origin}/auth/callback`;
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl
      }
    });

    setIsSubmitting(false);
    setIsErrorMessage(Boolean(error));
    setMessage(
      error
        ? formatLoginAuthMessage(error.message)
        : `登录链接已发送，请检查邮箱。请在当前这个浏览器里打开邮件按钮；如果邮箱客户端跳到别的浏览器，请复制链接到这里打开。本次回调地址是 ${callbackUrl}。`
    );
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      {isCompletingRedirect ? (
        <p className="status-message loading">
          <LoaderCircle size={15} className="spin" />
          正在完成登录，请稍候…
        </p>
      ) : (
        <>
          <label>
            <span>邮箱地址</span>
            <input
              required
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearMessage();
              }}
              placeholder="you@example.com"
              disabled={isSubmitting}
            />
          </label>

          <button className="primary-button" disabled={isSubmitting || !email.trim()} type="submit">
            {isSubmitting ? (
              <>
                <LoaderCircle size={17} className="spin" />
                发送中…
              </>
            ) : (
              <>
                <Mail size={17} />
                发送登录邮件
              </>
            )}
          </button>

          {message && !isErrorMessage ? (
            <p className="status-message success">{message}</p>
          ) : null}

          {message && isErrorMessage ? (
            <p className="status-message error">{message}</p>
          ) : null}

          {!message ? (
            <p className="form-message">
              本地调试时，请确认 Supabase Auth 的 Redirect URLs 包含当前地址的 <code>/auth/callback</code>。
              如果你在 <code>localhost</code> 和 <code>127.0.0.1</code> 之间切换，请两个地址都加入。
            </p>
          ) : null}
        </>
      )}
    </form>
  );
}
