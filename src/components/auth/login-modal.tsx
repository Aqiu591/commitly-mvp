"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { useLogin } from "@/lib/login-context";

export function LoginModal() {
  const { isOpen, closeLogin } = useLogin();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLogin();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeLogin]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="login-overlay"
      onClick={(e) => { if (e.target === overlayRef.current) closeLogin(); }}
      role="dialog"
      aria-modal="true"
      aria-label="登录 Commitly"
    >
      <div className="login-modal-card">
        <div className="login-modal-side">
          <div className="login-modal-brand">
            <span className="login-modal-logo">C</span>
            <h2>Commitly</h2>
          </div>
          <p className="login-modal-tagline">
            把散落在聊天记录里的承诺，<br />一条一条记清楚。
          </p>
          <ul className="login-modal-features">
            <li>粘贴文本，自动识别"我该做"和"对方该做"</li>
            <li>按紧急程度分组，一眼看清优先级</li>
            <li>每日邮件简报，到期自动提醒</li>
          </ul>
        </div>
        <div className="login-modal-form">
          <button
            className="login-modal-close"
            onClick={closeLogin}
            type="button"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
