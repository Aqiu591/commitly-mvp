import { FileSearch } from "lucide-react";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="page-shell">
      <div className="empty-state" style={{ minHeight: 360 }}>
        <FileSearch size={32} />
        <h2>页面未找到</h2>
        <p>这个页面可能已被移动、删除，或者链接地址有误。请检查地址后重试。</p>
        <div className="empty-state-actions">
          <Link className="primary-link" href="/dashboard">
            返回看板
          </Link>
          <Link className="secondary-button" href="/new">
            新建承诺
          </Link>
        </div>
      </div>
    </main>
  );
}
