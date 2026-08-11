import { z } from "zod";

/**
 * Validated Next.js env (ADR-008 / docs/deployment/env.md).
 * Server-only secrets must never use NEXT_PUBLIC_* / VITE_*.
 */

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

/** Call from server entry points when Supabase public config is required. */
export function requirePublicSupabaseEnv(): {
  url: string;
  anonKey: string;
} {
  const env = getPublicEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. See docs/deployment/env.md.",
    );
  }
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/** Alias for anon/publishable key used by Next cookie factories. */
export function requireAnonKey(): string {
  return requirePublicSupabaseEnv().anonKey;
}

/** Prefer NEXT_PUBLIC URL; fall back to server SUPABASE_URL for SSR factories. */
export function requireSupabaseUrl(): string {
  const publicEnv = getPublicEnv();
  if (publicEnv.NEXT_PUBLIC_SUPABASE_URL) {
    return publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  }
  const serverEnv = getServerEnv();
  if (serverEnv.SUPABASE_URL) {
    return serverEnv.SUPABASE_URL;
  }
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL. See docs/deployment/env.md.",
  );
}

export function requireServiceRoleKey(): string {
  const key = getServerEnv().SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (server-only). See docs/deployment/env.md.",
    );
  }
  return key;
}
