import Link from "next/link";

import { getEnvRows } from "@/lib/setup-status";

type SetupChecklistProps = {
  title?: string;
  description?: string;
};

export function SetupChecklist({
  title = "还差几项配置",
  description = "代码已经能跑，下一步是把真实服务接上。这里不会显示任何密钥值，只显示变量名是否存在。补齐后请重启本地服务。"
}: SetupChecklistProps) {
  const groups = getEnvRows(process.env);

  return (
    <main className="page-shell setup-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">配置</p>
          <h1>{title}</h1>
        </div>
        <Link className="primary-link" href="/login">
          返回登录
        </Link>
      </section>
      <p className="setup-intro">{description}</p>
      <div className="setup-grid">
        {groups.map((group) => (
          <section className="setup-group" key={group.title}>
            <div>
              <h2>{group.title}</h2>
              <p>{group.description}</p>
            </div>
            <ul>
              {group.rows.map((row) => (
                <li key={row.name}>
                  <code>{row.name}</code>
                  <span className={row.configured ? "status-ok" : "status-missing"}>
                    {row.configured ? "已配置" : row.required ? "缺少" : "可选"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="setup-next">
        <h2>建议顺序</h2>
        <ol>
          <li>
            复制 <code>.env.example</code> 的变量名到 <code>.env.local</code>，只在本机填写真实值。
          </li>
          <li>
            先配置 Supabase，并执行 <code>supabase/migrations/001_init.sql</code>。
          </li>
          <li>再配置 OpenAI，让导入页可以提取承诺。</li>
          <li>最后配置 Resend、发件邮箱和 Vercel Cron，用于每日简报。</li>
        </ol>
      </section>
    </main>
  );
}
