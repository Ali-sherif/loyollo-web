import { cookies } from "next/headers";

import { assertSameOriginMutation } from "@/lib/server/auth/csrf";
import { nestForgotPassword } from "@/lib/server/auth/nest-client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const csrf = assertSameOriginMutation(request);
  if (csrf) return csrf;

  const body = (await request.json()) as { email?: string };
  if (!body.email) {
    return Response.json({ message: "Email is required." }, { status: 400 });
  }

  await nestForgotPassword(body.email);
  return Response.json({ ok: true });
}
