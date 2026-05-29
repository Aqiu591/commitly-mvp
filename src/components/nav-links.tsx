"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/import", label: "导入" },
  { href: "/dashboard", label: "看板" },
  { href: "/setup", label: "配置" }
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
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
