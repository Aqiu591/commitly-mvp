import { redirect } from "next/navigation";

import { ImportForm } from "@/components/forms/import-form";
import { QuickCreateForm } from "@/components/commitments/quick-create-form";
import { getMissingEnvNames, REQUIRED_SUPABASE_PAGE_ENV_NAMES } from "@/lib/setup-status";
import { requireUser } from "@/lib/supabase/server";
import { NewCommitmentTabs } from "./tabs";

export default async function NewPage() {
  if (getMissingEnvNames(process.env, REQUIRED_SUPABASE_PAGE_ENV_NAMES).length > 0) {
    redirect("/setup");
  }

  const { user } = await requireUser();

  if (!user) {
    redirect("/?login=1");
  }

  return (
    <main className="page-shell">
      <section className="page-heading">
        <div>
          <p className="eyebrow">新建</p>
          <h1>新建承诺</h1>
          <p className="heading-note">
            通过粘贴文本让 AI 自动提取，或直接手动录入。两种方式都会直接进入看板。
          </p>
        </div>
      </section>
      <NewCommitmentTabs importForm={<ImportForm />} quickCreateForm={<QuickCreateForm />} />
    </main>
  );
}
