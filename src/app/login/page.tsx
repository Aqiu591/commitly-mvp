import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { SetupChecklist } from "@/components/setup/setup-checklist";
import { getMissingEnvNames, REQUIRED_SUPABASE_PAGE_ENV_NAMES } from "@/lib/setup-status";
import { requireUser } from "@/lib/supabase/server";

export default async function LoginPage() {
  if (getMissingEnvNames(process.env, REQUIRED_SUPABASE_PAGE_ENV_NAMES).length > 0) {
    return <SetupChecklist title="登录前需要先配置 Supabase" />;
  }

  const { user } = await requireUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">Commitly</p>
          <h1>登录到承诺看板</h1>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
