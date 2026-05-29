"use client";

import { FileText, PencilLine } from "lucide-react";
import { ReactNode, useState } from "react";

type Tab = "import" | "manual";

export function NewCommitmentTabs({
  importForm,
  quickCreateForm
}: {
  importForm: ReactNode;
  quickCreateForm: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("import");

  return (
    <div>
      <div className="tab-bar" role="tablist" aria-label="新建方式">
        <button
          className={`tab-button ${tab === "import" ? "active" : ""}`}
          onClick={() => setTab("import")}
          role="tab"
          aria-selected={tab === "import"}
          type="button"
        >
          <FileText size={15} />
          导入文本
        </button>
        <button
          className={`tab-button ${tab === "manual" ? "active" : ""}`}
          onClick={() => setTab("manual")}
          role="tab"
          aria-selected={tab === "manual"}
          type="button"
        >
          <PencilLine size={15} />
          快速创建
        </button>
      </div>
      {tab === "import" ? importForm : quickCreateForm}
    </div>
  );
}
