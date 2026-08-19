import { type NextRequest } from "next/server";

import { updateSession } from "@/integrations/nest/update-session";

/**
 * Next.js 16 proxy (replaces middleware.ts) — session refresh + coarse `/app` gate.
 * D-28: Nest JWT HTTP-only cookies via Next proxy + RSC session validation.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match HTML navigations and auth-related paths; skip static assets.
     * See docs/architecture/spikes/auth-ssr-spike.md
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
