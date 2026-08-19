"use client";

import * as React from "react";

import type { SessionUser } from "@/lib/server/auth/types";

const AUTH_NOT_CONFIGURED =
  "Authentication service is not configured. See docs/deployment/env.md.";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  isVerified: boolean;
  refreshSession: () => Promise<SessionUser | null>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    businessName: string;
    phone: string;
  }) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsVerification?: boolean; user?: SessionUser | null }>;
  signOut: () => Promise<void>;
  resendVerification: (
    email: string,
  ) => Promise<{
    error: string | null;
    status?: number;
    code?: string;
    alreadyVerified?: boolean;
    rateLimited?: boolean;
  }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (token: string, password: string) => Promise<{ error: string | null; user?: SessionUser | null }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ error: string | null; user?: SessionUser | null }>;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

async function readSession(): Promise<SessionUser | null> {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  if (!response.ok) return null;
  const data = (await response.json()) as { user: SessionUser | null };
  return data.user;
}

function friendlyMessage(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("invalid") && msg.includes("password")) return "Invalid email or password.";
  if (msg.includes("already")) return "An account with this email already exists.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Too many attempts. Please wait a moment and try again.";
  return message || "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refreshSession = React.useCallback(async () => {
    try {
      const nextUser = await readSession();
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  React.useEffect(() => {
    void refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isVerified: user?.account_status === "active",
      refreshSession,
      async signUp({ email, password, fullName, businessName, phone }) {
        const response = await fetch("/api/auth/sign-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            business_name: businessName,
            phone,
          }),
        });
        const data = (await response.json()) as { message?: string; user?: SessionUser };
        if (!response.ok) {
          return { error: friendlyMessage(data.message ?? "Unable to create account.") };
        }
        setUser(data.user ?? null);
        return { error: null };
      },
      async signIn(email, password) {
        const response = await fetch("/api/auth/sign-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = (await response.json()) as { message?: string; user?: SessionUser };
        if (!response.ok) {
          if (data.message?.includes("FORBIDDEN_ROLE")) {
            return { error: "This account cannot access the merchant app." };
          }
          if (data.message?.includes("ACCOUNT_NOT_ACTIVE")) {
            return { error: "This account is inactive." };
          }
          return { error: friendlyMessage(data.message ?? "Invalid email or password.") };
        }
        setUser(data.user ?? null);
        return { error: null, user: data.user ?? null };
      },
      async signOut() {
        await fetch("/api/auth/sign-out", { method: "POST" });
        setUser(null);
      },
      async resendVerification() {
        return {
          error:
            "Email verification is handled by NestJS messaging contracts and is not wired in this slice yet.",
        };
      },
      async verifyEmailOtp() {
        return { error: AUTH_NOT_CONFIGURED };
      },
      async resetPasswordForEmail(email) {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!response.ok) {
          const data = (await response.json()) as { message?: string };
          return { error: friendlyMessage(data.message ?? "Unable to send reset email.") };
        }
        return { error: null };
      },
      async resetPassword(token, password) {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        });
        const data = (await response.json()) as { message?: string; user?: SessionUser };
        if (!response.ok) {
          return { error: friendlyMessage(data.message ?? "Unable to reset password.") };
        }
        setUser(data.user ?? null);
        return { error: null, user: data.user ?? null };
      },
      async changePassword(currentPassword, newPassword) {
        const response = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        });
        const data = (await response.json()) as { message?: string; user?: SessionUser };
        if (!response.ok) {
          if (data.message?.toLowerCase().includes("current password")) {
            return { error: "Current password is incorrect." };
          }
          return { error: friendlyMessage(data.message ?? "Unable to change password.") };
        }
        setUser(data.user ?? null);
        return { error: null, user: data.user ?? null };
      },
    }),
    [user, loading, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
