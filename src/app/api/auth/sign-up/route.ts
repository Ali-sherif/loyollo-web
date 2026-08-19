import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "@/lib/server/auth/cookies";
import { assertSameOriginMutation } from "@/lib/server/auth/csrf";
import { nestSignUp } from "@/lib/server/auth/nest-client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const csrf = assertSameOriginMutation(request);
  if (csrf) return csrf;

  const body = (await request.json()) as {
    email?: string;
    password?: string;
    full_name?: string;
    business_name?: string;
    phone?: string;
  };
  if (!body.email || !body.password) {
    return Response.json({ message: "Email and password are required." }, { status: 400 });
  }

  const result = await nestSignUp({
    email: body.email,
    password: body.password,
    full_name: body.full_name,
    business_name: body.business_name,
    phone: body.phone,
  });
  if (!result.ok || !result.data) {
    const message =
      (result.data as { message?: string } | null)?.message ?? "Unable to create account.";
    return Response.json({ message }, { status: result.status || 400 });
  }

  const jar = await cookies();
  jar.set(ACCESS_TOKEN_COOKIE, result.data.access_token, accessTokenCookieOptions());
  jar.set(REFRESH_TOKEN_COOKIE, result.data.refresh_token, refreshTokenCookieOptions());

  return Response.json({ user: result.data.user });
}
