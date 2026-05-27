export type EnvGroup = {
  title: string;
  description: string;
  names: string[];
};

export const ENV_GROUPS: EnvGroup[] = [
  {
    title: "基础访问",
    description: "Commitly 自己的访问地址，用于邮件链接和回调。",
    names: ["NEXT_PUBLIC_APP_URL"]
  },
  {
    title: "Supabase",
    description: "负责登录、数据库和权限。登录页至少需要前两项。",
    names: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]
  },
  {
    title: "OpenAI",
    description: "负责把沟通文本提取成待审核承诺。模型变量有默认值。",
    names: ["OPENAI_API_KEY", "OPENAI_ANALYSIS_MODEL", "OPENAI_EVAL_MODEL"]
  },
  {
    title: "Resend 和定时任务",
    description: "用于每日邮件简报和定时触发。",
    names: ["RESEND_API_KEY", "DAILY_DIGEST_FROM", "CRON_SECRET"]
  }
];

export const REQUIRED_ENV_NAMES = [
  "OPENAI_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "DAILY_DIGEST_FROM",
  "CRON_SECRET",
  "NEXT_PUBLIC_APP_URL"
] as const;

export const REQUIRED_SUPABASE_PAGE_ENV_NAMES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
] as const;

export function getMissingEnvNames(
  env: Record<string, string | undefined>,
  names: readonly string[] = REQUIRED_ENV_NAMES
) {
  return names.filter((name) => !env[name] || env[name]?.trim().length === 0);
}

export function getEnvRows(env: Record<string, string | undefined>) {
  return ENV_GROUPS.map((group) => ({
    ...group,
    rows: group.names.map((name) => ({
      name,
      configured: Boolean(env[name] && env[name]?.trim().length > 0),
      required: REQUIRED_ENV_NAMES.includes(name as (typeof REQUIRED_ENV_NAMES)[number])
    }))
  }));
}
