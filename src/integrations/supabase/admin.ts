import "server-only";

import { createClient } from "@supabase/supabase-js";

import { requireServiceRoleKey, requireSupabaseUrl } from "@/config/env";
import type { Database } from "@/integrations/supabase/types";
import { createSupabaseFetch } from "@/integrations/supabase/fetch";

/**
 * Service-role Supabase client (bypasses RLS).
 * Server-only — never import from Client Components (ADR-006).
 * Callers must still validate ownership/authorization before privileged writes.
 */
export function createAdminSupabaseClient() {
  const url = requireSupabaseUrl();
  const serviceRoleKey = requireServiceRoleKey();

  return createClient<Database>(url, serviceRoleKey, {
    global: {
      fetch: createSupabaseFetch(serviceRoleKey),
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
