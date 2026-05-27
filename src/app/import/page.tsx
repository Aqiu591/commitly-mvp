import { redirect } from "next/navigation";

import { ImportForm } from "@/components/forms/import-form";
import { getMissingEnvNames, REQUIRED_SUPABASE_PAGE_ENV_NAMES } from "@/lib/setup-status";
import { requireUser } from "@/lib/supabase/server";

export default async function ImportPage() {
  if (getMissingEnvNames(process.env, REQUIRED_SUPABASE_PAGE_ENV_NAMES).length > 0) {
    redirect("/setup");
  }

  const { user } = await requireUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="page-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">导入</p>
          <h1>粘贴一段客户沟通</h1>
          <p className="heading-note">只处理你粘贴的文本，不连接邮箱、微信、Slack 或飞书账号。</p>
        </div>
      </section>
      <ImportForm />
    </main>
  );
}
