"use client";

import { createBrowserClient } from "@supabase/ssr";

import { requirePublicSupabaseEnv } from "@/config/env";
import type { Database } from "@/integrations/supabase/types";
import { createSupabaseFetch } from "@/integrations/supabase/fetch";

/**
 * Next.js browser Supabase client (cookie session via @supabase/ssr).
 * Do not use the Vite/TanStack `client.ts` localStorage client from Next routes.
 */
export function createBrowserSupabaseClient() {
  const { url, anonKey } = requirePublicSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey, {
    global: {
      fetch: createSupabaseFetch(anonKey),
    },
  });
}
