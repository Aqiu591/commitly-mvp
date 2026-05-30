import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { getEnvRows } from "@/lib/setup-status";

type SetupChecklistProps = {
  title?: string;
  description?: string;
};

export function SetupChecklist({
  title = "还差几项配置",
  description = "本地代码已就绪，下一步是连接真实环境服务。这里不会显示任何密钥值，只显示变量名是否存在。补齐后请重启本地服务。"
}: SetupChecklistProps) {
  const groups = getEnvRows(process.env);
  const rows = groups.flatMap((group) => group.rows);
  const requiredRows = rows.filter((row) => row.required);
  const missingRequiredRows = requiredRows.filter((row) => !row.configured);
  const configuredRequiredCount = requiredRows.length - missingRequiredRows.length;

  const progressPercent = requiredRows.length > 0 ? Math.round((configuredRequiredCount / requiredRows.length) * 100) : 100;

  return (
    <main className="page-shell setup-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">配置</p>
          <h1>{title}</h1>
        </div>
        <Link className="primary-link" href="/?login=1">
          返回登录
        </Link>
      </section>
      <p className="setup-intro">{description}</p>

      <section className={`setup-summary ${missingRequiredRows.length > 0 ? "needs-action" : "ready"}`}>
        <div>
          <p className="eyebrow">环境状态</p>
          <h2>
            {missingRequiredRows.length > 0
              ? `还有 ${missingRequiredRows.length} 项关键配置缺失`
              : "关键配置已齐，可以开始使用"}
          </h2>
          <p>这里只显示配置项是否存在，不显示也不读取任何密钥值。补齐后请重启本地服务。</p>
        </div>
        <div className="setup-progress">
          {missingRequiredRows.length > 0 ? (
            <AlertTriangle size={20} color="var(--warning)" />
          ) : (
            <CheckCircle2 size={20} color="var(--done)" />
          )}
          <strong>
            {configuredRequiredCount}/{requiredRows.length}
          </strong>
          <span>关键配置</span>
          <div className="setup-bar">
            <div className="setup-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </section>

      {missingRequiredRows.length > 0 ? (
        <section className="setup-missing-list" aria-label="缺失配置">
          <strong>下一步先补：</strong>
          <ul>
            {missingRequiredRows.map((row) => (
              <li key={row.name}>
                <code>{row.name}</code>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="setup-grid">
        {groups.map((group) => {
          const groupConfigured = group.rows.filter((r) => r.configured).length;
          const groupTotal = group.rows.length;
          return (
            <section className="setup-group" key={group.title}>
              <div>
                <h2>{group.title}</h2>
                <p>{group.description}</p>
              </div>
              <ul>
                {group.rows.map((row) => (
                  <li key={row.name}>
                    <span>
                      <code>{row.name}</code>
                      <small>{row.required ? "关键" : "可选"}</small>
                    </span>
                    <span className={row.configured ? "status-ok" : "status-missing"}>
                      {row.configured ? "已配置" : row.required ? "缺少" : "未配置"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="setup-group-progress">
                {groupConfigured}/{groupTotal} 项已配置
              </p>
            </section>
          );
        })}
      </div>

      <section className="setup-next">
        <h2>建议顺序</h2>
        <ol>
          <li>
            复制 <code>.env.example</code> 的变量名到 <code>.env.local</code>，只在本机填写真实值。
          </li>
          <li>
            先配置 Supabase 两项，并执行 <code>supabase/migrations/001_init.sql</code>。
          </li>
          <li>再配置 OpenAI，让导入页可以提取承诺。</li>
          <li>最后配置 Resend、发件邮箱和 Vercel Cron，用于每日简报。</li>
          <li>补齐后重启本地服务，回到登录页即可开始使用。</li>
        </ol>
      </section>
    </main>
  );
}
