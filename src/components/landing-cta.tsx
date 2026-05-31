"use client";

import Link from "next/link";
import { LogIn, Eye } from "lucide-react";

import { useLogin } from "@/lib/login-context";

export function LandingCTA() {
  const { openLogin } = useLogin();

  return (
    <div className="landing-hero-actions">
      <Link className="landing-primary-cta" href="/dashboard">
        <Eye size={16} />
        先看看 Demo
      </Link>
      <button className="landing-secondary-cta" onClick={openLogin} type="button">
        <LogIn size={15} />
        免费开始使用
      </button>
    </div>
  );
}
