import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { serverEnv } from "@/lib/env.server";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  type CookieToSet = { name: string; value: string; options: CookieOptions };

  return createServerClient(serverEnv.supabaseUrl(), serverEnv.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // Server Components cannot always set cookies; middleware refreshes them.
          if (process.env.NODE_ENV === "development") {
            console.warn("[supabase/server] 无法设置 cookie，将由 middleware 刷新：", error instanceof Error ? error.message : error);
          }
        }
      }
    }
  });
}

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}
