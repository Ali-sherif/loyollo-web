import "server-only";

/**
 * ADR-017: Origin/Host allow-list for cookie-authenticated mutations.
 */
export function isSameOriginRequest(request: Request): boolean {
  const host = request.headers.get("host");
  if (!host) return false;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  return false;
}

export function assertSameOriginMutation(request: Request): Response | null {
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { code: "CSRF_ORIGIN_REJECTED", message: "Cross-origin mutation rejected." },
      { status: 403 },
    );
  }
  return null;
}
