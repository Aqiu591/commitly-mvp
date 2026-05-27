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
          <h1>导入沟通文本</h1>
          <p className="heading-note">
            粘贴一段中文沟通记录，让 AI 先提取候选承诺。Commitly 只处理你粘贴的文本，不连接外部账号。
          </p>
        </div>
      </section>
      <ImportForm />
    </main>
  );
}
