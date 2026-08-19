import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookieOptions,
} from "@/lib/server/auth/cookies";
import { assertSameOriginMutation } from "@/lib/server/auth/csrf";
import { nestSignOut } from "@/lib/server/auth/nest-client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const csrf = assertSameOriginMutation(request);
  if (csrf) return csrf;

  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_TOKEN_COOKIE)?.value;
  await nestSignOut(refreshToken);
  jar.set(ACCESS_TOKEN_COOKIE, "", clearSessionCookieOptions());
  jar.set(REFRESH_TOKEN_COOKIE, "", clearSessionCookieOptions());
  return new Response(null, { status: 204 });
}
