import "server-only";

import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/server/auth/cookies";
import { nestMe, nestRefresh } from "@/lib/server/auth/nest-client";
import type { SessionUser } from "@/lib/server/auth/types";

export type SessionState = {
  user: SessionUser | null;
  accessToken: string | null;
};

async function readTokens(): Promise<{ accessToken: string | undefined; refreshToken: string | undefined }> {
  const jar = await cookies();
  return {
    accessToken: jar.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: jar.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}

/**
 * Validate the current request user via Nest `/auth/me` (Bearer from HTTP-only cookie).
 * Attempts refresh when the access token is expired.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSessionState();
  return session.user;
}

export async function getSessionState(): Promise<SessionState> {
  const { accessToken, refreshToken } = await readTokens();
  if (!accessToken && !refreshToken) {
    return { user: null, accessToken: null };
  }

  if (accessToken) {
    const me = await nestMe(accessToken);
    if (me.ok && me.data?.user) {
      return { user: me.data.user, accessToken };
    }
  }

  if (refreshToken) {
    const refreshed = await nestRefresh(refreshToken);
    if (refreshed.ok && refreshed.data?.user && refreshed.data.access_token) {
      return {
        user: refreshed.data.user,
        accessToken: refreshed.data.access_token,
      };
    }
  }

  return { user: null, accessToken: null };
}
