"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const links = [
  { href: "/dashboard", label: "看板", requiresAuth: false },
  { href: "/new", label: "+ 新建", requiresAuth: true }
];

export function NavLinks() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(Boolean(data.session));
    });
  }, []);

  return (
    <>
      {links
        .filter((link) => !link.requiresAuth || isLoggedIn)
        .map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              className={isActive ? "nav-active" : ""}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          );
        })}
    </>
  );
}
