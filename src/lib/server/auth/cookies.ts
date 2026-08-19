import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const ACCESS_TOKEN_COOKIE = "loyollo_access_token";
export const REFRESH_TOKEN_COOKIE = "loyollo_refresh_token";

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export function sessionCookieOptions(maxAge: number): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function accessTokenCookieOptions(): Partial<ResponseCookie> {
  return sessionCookieOptions(ACCESS_MAX_AGE);
}

export function refreshTokenCookieOptions(): Partial<ResponseCookie> {
  return sessionCookieOptions(REFRESH_MAX_AGE);
}

export function clearSessionCookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
