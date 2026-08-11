"use client";

/**
 * Browser Supabase client for AuthProvider / client UI.
 * Next → @supabase/ssr cookie client; TanStack/Vite → localStorage client.
 */

import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { createSupabaseFetch } from "@/integrations/supabase/fetch";
import { isNextRuntime } from "@/lib/navigation/paths";

let cached: SupabaseClient<Database> | null = null;

function readPublicUrl(): string {
  const fromProcess =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  if (fromProcess) return fromProcess;
  try {
    // Vite build-time env (ignored / empty under Next)
    const vite = (import.meta as ImportMeta & { env?: Record<string, string> })
      .env;
    if (vite?.VITE_SUPABASE_URL) return vite.VITE_SUPABASE_URL;
  } catch {
    /* ignore */
  }
  throw new Error("Missing Supabase URL for browser client");
}

function readPublicAnonKey(): string {
  const fromProcess =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;
  if (fromProcess) return fromProcess;
  try {
    const vite = (import.meta as ImportMeta & { env?: Record<string, string> })
      .env;
    if (vite?.VITE_SUPABASE_PUBLISHABLE_KEY)
      return vite.VITE_SUPABASE_PUBLISHABLE_KEY;
  } catch {
    /* ignore */
  }
  throw new Error("Missing Supabase anon/publishable key for browser client");
}

export function getAuthSupabase(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = readPublicUrl();
  const anonKey = readPublicAnonKey();

  if (isNextRuntime()) {
    cached = createBrowserClient<Database>(url, anonKey, {
      global: { fetch: createSupabaseFetch(anonKey) },
    });
    return cached;
  }

  cached = createClient<Database>(url, anonKey, {
    global: { fetch: createSupabaseFetch(anonKey) },
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return cached;
}
