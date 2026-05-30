"use client";

import { LoginModal } from "@/components/auth/login-modal";
import { LoginProvider } from "@/lib/login-context";

export function LoginOverlay({ children }: { children: React.ReactNode }) {
  return (
    <LoginProvider>
      {children}
      <LoginModal />
    </LoginProvider>
  );
}
