"use client";

/**
 * Browser Supabase client for AuthProvider / client UI (@supabase/ssr cookies).
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getOptionalPublicSupabaseEnv, isPublicSupabaseConfigured } from "@/config/env";
import type { Database } from "@/integrations/supabase/types";
import { createSupabaseFetch } from "@/integrations/supabase/fetch";

let cached: SupabaseClient<Database> | null = null;

export { isPublicSupabaseConfigured as isAuthSupabaseConfigured };

export function getAuthSupabase(): SupabaseClient<Database> {
  const client = tryGetAuthSupabase();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_* equivalents). See docs/deployment/env.md.",
    );
  }
  return client;
}

/** Returns null when public Supabase env is missing (marketing-only local dev). */
export function tryGetAuthSupabase(): SupabaseClient<Database> | null {
  if (cached) return cached;

  const env = getOptionalPublicSupabaseEnv();
  if (!env) return null;

  const { url, anonKey } = env;
  cached = createBrowserClient<Database>(url, anonKey, {
    global: { fetch: createSupabaseFetch(anonKey) },
  });
  return cached;
}
