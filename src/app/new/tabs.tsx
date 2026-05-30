"use client";

import { FileText, PencilLine } from "lucide-react";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

type Tab = "import" | "manual";

const tabs: Array<{ key: Tab; label: string; icon: ReactNode }> = [
  { key: "import", label: "导入文本", icon: <FileText size={15} /> },
  { key: "manual", label: "快速创建", icon: <PencilLine size={15} /> }
];

export function NewCommitmentTabs({
  importForm,
  quickCreateForm
}: {
  importForm: ReactNode;
  quickCreateForm: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("import");
  const barRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number } | null>(null);

  // Measure the active button and slide the indicator
  const measureIndicator = useCallback(() => {
    const bar = barRef.current;
    const button = buttonRefs.current.get(tab);
    if (!bar || !button) return;

    const barRect = bar.getBoundingClientRect();
    const btnRect = button.getBoundingClientRect();
    setIndicatorStyle({
      left: btnRect.left - barRect.left,
      width: btnRect.width
    });
  }, [tab]);

  useEffect(() => {
    measureIndicator();
  }, [measureIndicator]);

  // Keep indicator aligned on window resize
  useEffect(() => {
    window.addEventListener("resize", measureIndicator);
    return () => window.removeEventListener("resize", measureIndicator);
  }, [measureIndicator]);

  return (
    <div>
      <div className="tab-bar" ref={barRef} role="tablist" aria-label="新建方式">
        {/* Sliding indicator pill — hidden until first measurement to avoid flash */}
        {indicatorStyle ? (
          <div
            className="tab-indicator"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width
            }}
            aria-hidden="true"
          />
        ) : null}
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            ref={(el) => {
              if (el) buttonRefs.current.set(key, el);
              else buttonRefs.current.delete(key);
            }}
            className={`tab-button ${tab === key ? "active" : ""}`}
            onClick={() => setTab(key)}
            role="tab"
            aria-selected={tab === key}
            type="button"
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
      {tab === "import" ? importForm : quickCreateForm}
    </div>
  );
}
