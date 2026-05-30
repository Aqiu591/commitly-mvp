"use client";

import { LogIn } from "lucide-react";

import { useLogin } from "@/lib/login-context";

export function LandingCTA() {
  const { openLogin } = useLogin();

  return (
    <button className="landing-primary-cta" onClick={openLogin} type="button">
      <LogIn size={16} />
      免费开始使用
    </button>
  );
}
