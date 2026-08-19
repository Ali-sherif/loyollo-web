import "server-only";

import { getNestApiUrl } from "@/config/env";
import type { AuthTokensResponse, AuthSession } from "@/lib/server/auth/types";

type NestFetchOptions = Omit<RequestInit, "body"> & {
  accessToken?: string;
  body?: unknown;
};

export async function nestFetch<T>(
  path: string,
  options: NestFetchOptions = {},
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const base = getNestApiUrl();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  const response = await fetch(`${base}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  let data: T | null = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = null;
    }
  }

  return { ok: response.ok, status: response.status, data };
}

export async function nestSignIn(
  email: string,
  password: string,
): Promise<{ ok: boolean; status: number; data: AuthTokensResponse | null }> {
  return nestFetch<AuthTokensResponse>("/auth/sign-in", {
    method: "POST",
    body: { email, password },
  });
}

export async function nestSignUp(body: {
  email: string;
  password: string;
  full_name?: string;
  business_name?: string;
  phone?: string;
}): Promise<{ ok: boolean; status: number; data: AuthTokensResponse | null }> {
  return nestFetch<AuthTokensResponse>("/auth/sign-up", {
    method: "POST",
    body,
  });
}

export async function nestMe(
  accessToken: string,
): Promise<{ ok: boolean; status: number; data: AuthSession | null }> {
  return nestFetch<AuthSession>("/auth/me", {
    method: "GET",
    accessToken,
  });
}

export async function nestRefresh(
  refreshToken: string,
): Promise<{ ok: boolean; status: number; data: { user: AuthSession["user"]; access_token: string } | null }> {
  return nestFetch<{ user: AuthSession["user"]; access_token: string }>("/auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });
}

export async function nestSignOut(refreshToken?: string): Promise<void> {
  await nestFetch("/auth/sign-out", {
    method: "POST",
    body: refreshToken ? { refresh_token: refreshToken } : {},
  });
}

export async function nestForgotPassword(
  email: string,
): Promise<{ ok: boolean; status: number; data: { ok: true } | null }> {
  return nestFetch<{ ok: true }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function nestResetPassword(
  token: string,
  password: string,
): Promise<{ ok: boolean; status: number; data: AuthTokensResponse | null }> {
  return nestFetch<AuthTokensResponse>("/auth/reset-password", {
    method: "POST",
    body: { token, password },
  });
}

export async function nestChangePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; status: number; data: { user: AuthSession["user"] } | null }> {
  return nestFetch<{ user: AuthSession["user"] }>("/auth/change-password", {
    method: "POST",
    accessToken,
    body: { current_password: currentPassword, new_password: newPassword },
  });
}
