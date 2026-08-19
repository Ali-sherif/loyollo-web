import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "@/lib/server/auth/cookies";
import { assertSameOriginMutation } from "@/lib/server/auth/csrf";
import { nestResetPassword } from "@/lib/server/auth/nest-client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const csrf = assertSameOriginMutation(request);
  if (csrf) return csrf;

  const body = (await request.json()) as { token?: string; password?: string };
  if (!body.token || !body.password) {
    return Response.json({ message: "Token and password are required." }, { status: 400 });
  }

  const result = await nestResetPassword(body.token, body.password);
  if (!result.ok || !result.data) {
    const message =
      (result.data as { message?: string } | null)?.message ??
      "This reset link is invalid or has expired.";
    return Response.json({ message }, { status: result.status || 401 });
  }

  const jar = await cookies();
  jar.set(ACCESS_TOKEN_COOKIE, result.data.access_token, accessTokenCookieOptions());
  jar.set(REFRESH_TOKEN_COOKIE, result.data.refresh_token, refreshTokenCookieOptions());

  return Response.json({ user: result.data.user });
}
