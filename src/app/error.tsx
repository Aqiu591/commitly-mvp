"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <main className="page-shell">
      <div className="empty-state" style={{ minHeight: 320 }}>
        <TriangleAlert size={28} />
        <h2>页面加载出错</h2>
        <p>
          {error.message?.trim() || "页面发生了未知错误，请稍后重试。"}
        </p>
        <div className="empty-state-actions">
          <button className="secondary-button" onClick={reset} type="button">
            <RotateCcw size={15} />
            重试
          </button>
        </div>
      </div>
    </main>
  );
}
