import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { getCurrentUser } from "@/lib/server/auth/session";

const DEFAULT_SIGN_IN = "/auth/sign-in";

/**
 * Server Component / layout guard. Redirects unauthenticated users to sign-in.
 * Backend Auth + RLS remain the authorization source of truth (ADR-005).
 */
export async function requireUser(options?: {
  signInPath?: string;
  redirectedFrom?: string;
}): Promise<User> {
  const user = await getCurrentUser();
  if (user) return user;

  const signInPath = options?.signInPath ?? DEFAULT_SIGN_IN;
  const redirectedFrom = options?.redirectedFrom;
  if (redirectedFrom) {
    const params = new URLSearchParams({ redirectedFrom });
    redirect(`${signInPath}?${params.toString()}`);
  }
  redirect(signInPath);
}
