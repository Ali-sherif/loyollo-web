import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
} from "@/lib/server/auth/cookies";
import { assertSameOriginMutation } from "@/lib/server/auth/csrf";
import { nestRefresh } from "@/lib/server/auth/nest-client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const csrf = assertSameOriginMutation(request);
  if (csrf) return csrf;

  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return Response.json({ message: "No refresh token." }, { status: 401 });
  }

  const result = await nestRefresh(refreshToken);
  if (!result.ok || !result.data) {
    return Response.json({ message: "Unable to refresh session." }, { status: 401 });
  }

  jar.set(ACCESS_TOKEN_COOKIE, result.data.access_token, accessTokenCookieOptions());
  return Response.json({ user: result.data.user });
}
