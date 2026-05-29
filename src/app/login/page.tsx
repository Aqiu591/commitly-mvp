import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { SetupChecklist } from "@/components/setup/setup-checklist";
import { buildAuthCallbackPathFromLoginParams } from "@/lib/auth-link-params";
import { getMissingEnvNames, REQUIRED_SUPABASE_PAGE_ENV_NAMES } from "@/lib/setup-status";
import { requireUser } from "@/lib/supabase/server";
import { formatAuthCallbackMessage } from "@/lib/user-facing";

type LoginPageProps = {
  searchParams?: Promise<{
    authError?: string;
    code?: string;
    token_hash?: string;
    token?: string;
    type?: string;
    next?: string;
    error?: string;
    error_description?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (getMissingEnvNames(process.env, REQUIRED_SUPABASE_PAGE_ENV_NAMES).length > 0) {
    return <SetupChecklist title="登录前需要先配置 Supabase" />;
  }

  const params = await searchParams;
  const authCallbackPath = buildAuthCallbackPathFromLoginParams(params ?? {});
  if (authCallbackPath) {
    redirect(authCallbackPath);
  }

  const authError = params?.authError;
  const { user } = await requireUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-panel">
          <div>
            <p className="eyebrow">登录</p>
            <h1>欢迎回到 Commitly</h1>
            <p className="heading-note">用邮箱发送魔法链接，无需密码即可登录。</p>
          </div>
          {authError ? <p className="status-message error auth-error">{formatAuthCallbackMessage(authError)}</p> : null}
          <LoginForm />
        </section>

        <aside className="auth-side" aria-label="Commitly 工作流">
          <p className="eyebrow">工作流</p>
          <h2>只追踪说清楚的承诺</h2>
          <ul>
            <li>粘贴会议纪要、邮件或聊天记录。</li>
            <li>审核 AI 提取的草稿，再确认进入看板。</li>
            <li>按今日、逾期、双方责任和完成状态分组查看。</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
