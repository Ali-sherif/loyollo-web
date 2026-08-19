import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE } from "@/lib/server/auth/cookies";
import { assertSameOriginMutation } from "@/lib/server/auth/csrf";
import { nestChangePassword } from "@/lib/server/auth/nest-client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const csrf = assertSameOriginMutation(request);
  if (csrf) return csrf;

  const body = (await request.json()) as {
    current_password?: string;
    new_password?: string;
  };
  if (!body.current_password || !body.new_password) {
    return Response.json({ message: "Current and new password are required." }, { status: 400 });
  }

  const jar = await cookies();
  const accessToken = jar.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return Response.json({ message: "Not authenticated." }, { status: 401 });
  }

  const result = await nestChangePassword(accessToken, body.current_password, body.new_password);
  if (!result.ok || !result.data) {
    const message =
      (result.data as { message?: string } | null)?.message ?? "Unable to change password.";
    return Response.json({ message }, { status: result.status || 400 });
  }

  return Response.json({ user: result.data.user });
}
