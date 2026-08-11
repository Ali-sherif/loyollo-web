"use client";

import { Link, useNavigate, useRouterState } from "@/lib/navigation";
import * as React from "react";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAuthSupabase } from "@/integrations/supabase/auth-client";
import loyolloLogoSignup from "@/assets/loyollo-logo-signup.svg";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [ready, setReady] = React.useState(false);
  const [validSession, setValidSession] = React.useState<boolean | null>(null);
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Wait for Supabase to detect the recovery token from the URL.
  React.useEffect(() => {
    let mounted = true;
    const { data: sub } = getAuthSupabase().auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setValidSession(true);
        setReady(true);
      }
    });
    getAuthSupabase().auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setValidSession(!!data.session);
      setReady(true);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  function validate(): string | null {
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== confirm) return "Passwords do not match";
    return null;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setSuccess(true);
    window.setTimeout(() => navigate({ to: "/signin" }), 1200);
  }

  return (
    <div className="bg-[#eef1f7] p-3 sm:p-6 lg:p-12">
      <div className="mx-auto flex w-full max-w-[720px] flex-col items-center justify-center gap-10 rounded-[40px] bg-[#eef1f7] px-6 py-10 sm:px-12 lg:px-20 lg:py-12">
        <img
          src={loyolloLogoSignup}
          alt="Loyollo logo"
          className="h-8 w-auto md:h-10"
        />

        <div className="w-full text-center">
          <h1 className="text-2xl font-bold leading-[1.2] text-[#0a152f]">
            Set a new password
          </h1>
          <p className="mt-2 text-base text-[#525252]">
            Choose a strong password you haven't used before.
          </p>
        </div>

        {!ready ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
        ) : validSession === false ? (
          <div className="w-full max-w-[560px] rounded-md bg-red-50 px-4 py-4 text-center text-sm text-red-600">
            <p>This reset link is invalid or has expired.</p>
            <Link to="/forgot-password" className="mt-2 inline-block font-semibold text-[#e29f00] underline">
              Request a new reset link
            </Link>
          </div>
        ) : success ? (
          <p role="status" aria-live="polite" className="text-center text-base text-[#44b678]">
            Password updated. Redirecting to sign in…
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex w-full max-w-[560px] flex-col gap-5">
            <PwField
              id="new-password"
              placeholder="New password"
              value={password}
              onChange={setPassword}
              show={showPw}
              onToggle={() => setShowPw((s) => !s)}
            />
            <PwField
              id="confirm-password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              show={showPw}
              onToggle={() => setShowPw((s) => !s)}
            />

            {error && (
              <p role="alert" aria-live="polite" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#feb602] px-6 py-3 text-xl font-semibold text-[#0A152F] shadow-[0_1px_8px_0_rgba(0,0,0,0.12),0_0_2px_0_rgba(0,0,0,0.1)] transition-transform hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating…" : "Update password"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function PwField({
  id, placeholder, value, onChange, show, onToggle,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex h-[53px] items-center gap-2 rounded-[12px] border border-[#d7ddea] bg-[#fafafa] px-4 focus-within:border-[#feb602] focus-within:ring-2 focus-within:ring-[#feb602]/30">
      <Lock className="h-4 w-4 text-[#737373]" />
      <div className="h-5 w-px bg-[#d7ddea]" />
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete="new-password"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-base text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        className="text-[#737373]"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}


export default ResetPasswordPage;
