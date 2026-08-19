import * as React from "react";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { tryGetAuthSupabase } from "@/integrations/supabase/auth-client";

const SUPABASE_NOT_CONFIGURED =
  "Supabase is not configured for local development. See docs/deployment/env.md.";
import { resolveHref } from "@/lib/navigation/paths";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isVerified: boolean;
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
  ) => Promise<{ error: string | null; needsVerification?: boolean }>;
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
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

function friendlyError(error: AuthError | Error | null): string | null {
  if (!error) return null;
  const msg = (error.message || "").toLowerCase();
  if (msg.includes("invalid login") || msg.includes("invalid credentials"))
    return "Invalid email or password.";
  if (msg.includes("email not confirmed")) return "Please verify your email before signing in.";
  if (
    msg.includes("already registered") ||
    msg.includes("already been registered") ||
    msg.includes("user already")
  )
    return "An account with this email already exists.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Too many attempts. Please wait a moment and try again.";
  if (msg.includes("expired") || msg.includes("invalid token") || msg.includes("otp"))
    return "That code is invalid or has expired. Please request a new one.";
  if (msg.includes("network") || msg.includes("fetch"))
    return "Network error. Please check your connection and try again.";
  if (msg.includes("password") && msg.includes("short")) return "Password is too short.";
  return error.message || "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const supabase = React.useMemo(() => tryGetAuthSupabase(), []);

  React.useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });

    // Then restore existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isVerified: !!session?.user?.email_confirmed_at,
      async signUp({ email, password, fullName, businessName, phone }) {
        if (!supabase) return { error: SUPABASE_NOT_CONFIGURED };
        const redirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}${resolveHref("/verify")}`
            : undefined;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              full_name: fullName,
              business_name: businessName,
              phone,
            },
          },
        });
        return { error: friendlyError(error) };
      },
      async signIn(email, password) {
        if (!supabase) return { error: SUPABASE_NOT_CONFIGURED };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const msg = (error.message || "").toLowerCase();
          if (msg.includes("email not confirmed")) {
            return {
              error: "Please verify your email before signing in.",
              needsVerification: true,
            };
          }
          return { error: friendlyError(error) };
        }
        return { error: null };
      },
      async signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
      async resendVerification(email) {
        if (!supabase) return { error: SUPABASE_NOT_CONFIGURED };
        const redirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}${resolveHref("/verify")}`
            : undefined;
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: redirectTo },
        });
        if (!error) return { error: null };
        const msg = (error.message || "").toLowerCase();
        const status = (error as { status?: number }).status;
        const code = (error as { code?: string }).code;
        const rateLimited =
          status === 429 ||
          msg.includes("rate limit") ||
          msg.includes("for security purposes") ||
          msg.includes("only request this after");
        const alreadyVerified =
          msg.includes("already confirmed") ||
          msg.includes("already been confirmed") ||
          msg.includes("already verified") ||
          code === "email_address_already_confirmed";
        return {
          error: friendlyError(error),
          status,
          code,
          rateLimited,
          alreadyVerified,
        };
      },

      async verifyEmailOtp(email, token) {
        if (!supabase) return { error: SUPABASE_NOT_CONFIGURED };
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: "signup",
        });
        return { error: friendlyError(error) };
      },
      async resetPasswordForEmail(email) {
        if (!supabase) return { error: SUPABASE_NOT_CONFIGURED };
        const redirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}${resolveHref("/reset-password")}`
            : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });
        return { error: friendlyError(error) };
      },
      async updatePassword(newPassword) {
        if (!supabase) return { error: SUPABASE_NOT_CONFIGURED };
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error: friendlyError(error) };
      },
    }),
    [session, loading, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
