import "server-only";

import { createClient } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env.server";

export function createSupabaseAdminClient() {
  return createClient(serverEnv.supabaseUrl(), serverEnv.supabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
