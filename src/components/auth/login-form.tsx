"use client";

import { Mail } from "lucide-react";
import { FormEvent, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatLoginAuthMessage } from "@/lib/user-facing";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setMessage(error ? formatLoginAuthMessage(error.message) : "登录链接已发送，请检查邮箱。链接通常几分钟内送达。");
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <label>
        邮箱
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </label>
      <button className="primary-button" disabled={isSubmitting} type="submit">
        <Mail size={18} />
        {isSubmitting ? "发送中" : "发送登录链接"}
      </button>
      {message ? <p className={isErrorMessage ? "error-text" : "form-message"}>{message}</p> : null}
    </form>
  );
}
