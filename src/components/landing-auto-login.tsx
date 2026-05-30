"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { useLogin } from "@/lib/login-context";

/** Detects ?login=1 in URL and auto-opens the login modal. */
export function LandingAutoLogin() {
  const { openLogin } = useLogin();
  const searchParams = useSearchParams();
  const hasOpened = useRef(false);

  useEffect(() => {
    if (searchParams.get("login") === "1" && !hasOpened.current) {
      hasOpened.current = true;
      // Small delay to let the landing page render first
      const timer = setTimeout(() => openLogin(), 300);
      return () => clearTimeout(timer);
    }
  }, [searchParams, openLogin]);

  return null;
}
