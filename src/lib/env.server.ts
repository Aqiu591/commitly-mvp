import "server-only";

function optionalEnv(name: string) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

export function requireServerEnv(name: string) {
  const value = optionalEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const serverEnv = {
  appUrl: optionalEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
  openaiApiKey: () => requireServerEnv("OPENAI_API_KEY"),
  openaiAnalysisModel: optionalEnv("OPENAI_ANALYSIS_MODEL") ?? "gpt-5.4-mini",
  openaiEvalModel: optionalEnv("OPENAI_EVAL_MODEL") ?? "gpt-5.5",
  supabaseUrl: () => requireServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => requireServerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
  resendApiKey: () => requireServerEnv("RESEND_API_KEY"),
  dailyDigestFrom: optionalEnv("DAILY_DIGEST_FROM") ?? "Commitly <digest@example.com>",
  cronSecret: () => requireServerEnv("CRON_SECRET")
};
