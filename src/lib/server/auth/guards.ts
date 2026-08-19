import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/server/auth/session";
import type { SessionUser } from "@/lib/server/auth/types";

const DEFAULT_SIGN_IN = "/auth/sign-in";
const FORCE_PASSWORD_PATH = "/app/settings/password";

/**
 * Server Component / layout guard. Redirects unauthenticated or unauthorized users.
 * NestJS policies remain the authorization source of truth (ADR-005).
 */
export async function requireUser(options?: {
  signInPath?: string;
  redirectedFrom?: string;
}): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const signInPath = options?.signInPath ?? DEFAULT_SIGN_IN;
    const redirectedFrom = options?.redirectedFrom;
    if (redirectedFrom) {
      const params = new URLSearchParams({ redirectedFrom });
      redirect(`${signInPath}?${params.toString()}`);
    }
    redirect(signInPath);
  }

  if (user.role === "customer") {
    redirect(`${DEFAULT_SIGN_IN}?error=forbidden_role`);
  }

  if (user.account_status === "inactive") {
    redirect(`${DEFAULT_SIGN_IN}?error=account_inactive`);
  }

  if (user.must_change_password || user.account_status === "pending") {
    redirect(FORCE_PASSWORD_PATH);
  }

  return user;
}
