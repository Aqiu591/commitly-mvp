import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { NavLinks } from "@/components/nav-links";
import { SignOutButton } from "@/components/auth/sign-out-button";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://commitly.app";
const title = "Commitly - 客户沟通承诺追踪";
const description =
  "导入会议纪要、邮件、聊天记录，AI 自动提取承诺，审核确认后在看板追踪。不连 CRM，不接通讯工具，只做承诺追踪一件事。";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(siteUrl),
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Commitly",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Commitly",
    description,
    url: siteUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CNY",
    },
    author: {
      "@type": "Organization",
      name: "Commitly",
      url: siteUrl,
    },
  };

  return (
    <html lang="zh-CN" className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <header className="topbar">
          <Link className="brand" href="/dashboard">
            Commitly
          </Link>
          <nav className="nav-links" aria-label="Primary">
            <NavLinks />
            <SignOutButton />
          </nav>
        </header>
        <div className="page-transition">{children}</div>
      </body>
    </html>
  );
}
