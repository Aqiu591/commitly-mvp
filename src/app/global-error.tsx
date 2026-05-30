"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          display: "grid",
          minHeight: "100vh",
          placeItems: "center",
          margin: 0,
          padding: "24px 16px",
          background: "#f5f7f8",
          color: "#17212b",
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          fontSize: 15,
          textAlign: "center"
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 8,
            justifyItems: "center",
            maxWidth: 420,
            border: "1px solid #d8e0e5",
            borderRadius: 8,
            background: "#fff",
            padding: "40px 24px"
          }}
        >
          <TriangleAlert size={28} color="#788590" />
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 650 }}>
            应用遇到了问题
          </h2>
          <p style={{ margin: 0, color: "#54606b", fontSize: "0.88rem", lineHeight: 1.5 }}>
            请刷新页面重试。如果问题持续出现，请检查网络连接和应用配置。
          </p>
          <button
            onClick={reset}
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 6,
              border: "1px solid #d8e0e5",
              borderRadius: 8,
              background: "#fff",
              color: "#17212b",
              padding: "10px 16px",
              fontSize: "0.9rem",
              fontWeight: 650,
              cursor: "pointer"
            }}
          >
            <RotateCcw size={15} />
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
