import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { SetupChecklist } from "@/components/setup/setup-checklist";
import { getMissingEnvNames, REQUIRED_SUPABASE_PAGE_ENV_NAMES } from "@/lib/setup-status";
import { requireUser } from "@/lib/supabase/server";
import { formatAuthCallbackMessage } from "@/lib/user-facing";

type LoginPageProps = {
  searchParams?: Promise<{
    authError?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (getMissingEnvNames(process.env, REQUIRED_SUPABASE_PAGE_ENV_NAMES).length > 0) {
    return <SetupChecklist title="登录前需要先配置 Supabase" />;
  }

  const params = await searchParams;
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
            <p className="eyebrow">Commitly</p>
            <h1>登录到承诺看板</h1>
            <p className="heading-note">用邮箱登录后，继续导入沟通文本、审核 AI 草稿和查看每日承诺。</p>
          </div>
          {authError ? <p className="error-text auth-error">{formatAuthCallbackMessage(authError)}</p> : null}
          <LoginForm />
        </section>

        <aside className="auth-side" aria-label="Commitly 工作流">
          <p className="eyebrow">Commitly</p>
          <h2>每天只追踪已经说清楚的承诺</h2>
          <ul>
            <li>粘贴会议纪要、邮件或聊天记录。</li>
            <li>先审核 AI 提取的草稿，再进入看板。</li>
            <li>按今日、逾期、双方责任和完成状态查看。</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
