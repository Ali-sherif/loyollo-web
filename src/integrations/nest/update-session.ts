import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "@/lib/server/auth/cookies";
import { nestMe, nestRefresh } from "@/lib/server/auth/nest-client";
import type { SessionUser } from "@/lib/server/auth/types";

const SIGN_IN_PATH = "/auth/sign-in";
const FORCE_PASSWORD_PATH = "/app/settings/password";

/** Coarse protected prefixes (approved App Router map — docs/frontend/02-route-migration.md). */
const PROTECTED_PREFIXES = ["/app"] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function merchantAccessAllowed(user: SessionUser): boolean {
  if (user.role === "customer") return false;
  if (user.account_status === "inactive") return false;
  if (user.must_change_password || user.account_status === "pending") return false;
  return true;
}

function redirectToSignIn(request: NextRequest, reason?: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = SIGN_IN_PATH;
  url.searchParams.set("redirectedFrom", request.nextUrl.pathname);
  if (reason) url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

/**
 * Refresh Nest JWT cookies and apply coarse `/app/*` redirects (Next 16 proxy).
 * Defense-in-depth: protected layouts must still call `getCurrentUser()` (ADR-005).
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    if (isProtectedPath(request.nextUrl.pathname)) {
      return redirectToSignIn(request);
    }
    return response;
  }

  let user: SessionUser | null = null;
  let nextAccessToken = accessToken;

  if (accessToken) {
    const me = await nestMe(accessToken);
    if (me.ok && me.data?.user) {
      user = me.data.user;
    }
  }

  if (!user && refreshToken) {
    const refreshed = await nestRefresh(refreshToken);
    if (refreshed.ok && refreshed.data?.user && refreshed.data.access_token) {
      user = refreshed.data.user;
      nextAccessToken = refreshed.data.access_token;
      response.cookies.set(
        ACCESS_TOKEN_COOKIE,
        refreshed.data.access_token,
        accessTokenCookieOptions(),
      );
    }
  }

  if (!user) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, "", { ...accessTokenCookieOptions(), maxAge: 0 });
    response.cookies.set(REFRESH_TOKEN_COOKIE, "", { ...refreshTokenCookieOptions(), maxAge: 0 });
    if (isProtectedPath(request.nextUrl.pathname)) {
      return redirectToSignIn(request);
    }
    return response;
  }

  if (isProtectedPath(request.nextUrl.pathname)) {
    if (user.role === "customer") {
      return redirectToSignIn(request, "forbidden_role");
    }
    if (user.account_status === "inactive") {
      return redirectToSignIn(request, "account_inactive");
    }
    if (user.must_change_password || user.account_status === "pending") {
      const url = request.nextUrl.clone();
      url.pathname = FORCE_PASSWORD_PATH;
      return NextResponse.redirect(url);
    }
    if (!merchantAccessAllowed(user)) {
      return redirectToSignIn(request);
    }
  }

  if (nextAccessToken && nextAccessToken !== accessToken) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, nextAccessToken, accessTokenCookieOptions());
  }

  return response;
}
