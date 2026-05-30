"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut().catch(() => null);
    await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => null);
    router.replace("/");
    router.refresh();
  }

  return (
    <button className="icon-text-button" disabled={isSigningOut} onClick={signOut} type="button">
      <LogOut size={15} />
      {isSigningOut ? "退出中…" : "退出"}
    </button>
  );
}
