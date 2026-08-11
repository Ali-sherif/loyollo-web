import "server-only";

import type { User } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/integrations/supabase/server";

/**
 * Validate the current request user via Auth (`getUser()`, not `getSession()`).
 * Returns null when unauthenticated.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
