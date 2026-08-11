import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requirePublicSupabaseEnv } from "@/config/env";
import type { Database } from "@/integrations/supabase/types";
import { createSupabaseFetch } from "@/integrations/supabase/fetch";

/**
 * Next.js RSC / Server Action Supabase client (HTTP-only cookies).
 * Cookie writes from Server Components may throw — proxy owns refresh (ADR-005 / D-28).
 */
export async function createServerSupabaseClient() {
  const { url, anonKey } = requirePublicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    global: {
      fetch: createSupabaseFetch(anonKey),
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — ignore; proxy refreshes sessions.
        }
      },
    },
  });
}
