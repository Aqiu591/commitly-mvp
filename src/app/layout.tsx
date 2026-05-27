import type { Metadata } from "next";
import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commitly",
  description: "客户沟通承诺追踪工具"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="topbar">
          <Link className="brand" href="/dashboard">
            Commitly
          </Link>
          <nav className="nav-links" aria-label="Primary">
            <Link href="/import">导入</Link>
            <Link href="/dashboard">看板</Link>
            <Link href="/setup">配置</Link>
            <SignOutButton />
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
