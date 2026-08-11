import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { passwordFeedback } from "@/lib/password";
import loyolloLogoSignup from "@/assets/loyollo-logo-signup.svg";

export const Route = createFileRoute("/change-password")({
  head: () => ({
    meta: [
      { title: "Change password — Loyalty" },
      { name: "description", content: "Update the password for your Loyalty account." },
      { property: "og:title", content: "Change password — Loyalty" },
      { property: "og:description", content: "Update the password for your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <ChangePasswordPage />
    </ProtectedRoute>
  ),
});

function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, updatePassword } = useAuth();

  const [current, setCurrent] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [fieldErrors, setFieldErrors] = React.useState<{
    current?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const liveFeedback = passwordFeedback(password);
  const passwordValid = password.length > 0 && liveFeedback === null;
  const confirmMismatch = confirm.length > 0 && confirm !== password;

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitError(null);
    const errs: typeof fieldErrors = {};
    if (!current) errs.current = "Enter your current password";
    if (!password) errs.password = "Password is required";
    else if (liveFeedback) errs.password = liveFeedback;
    if (!confirm) errs.confirm = "Please confirm your new password";
    else if (confirm !== password) errs.confirm = "Passwords do not match";
    if (current && password && current === password)
      errs.password = "New password must be different from current password";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    // Verify current password via re-authentication.
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: current,
    });
    if (signInErr) {
      setLoading(false);
      setFieldErrors((e) => ({ ...e, current: "Current password is incorrect" }));
      return;
    }
    const { error: updErr } = await updatePassword(password);
    setLoading(false);
    if (updErr) {
      setSubmitError(updErr);
      return;
    }
    setSuccess(true);
    setCurrent("");
    setPassword("");
    setConfirm("");
    window.setTimeout(() => navigate({ to: "/" }), 1500);
  }

  return (
    <div className="bg-[#eef1f7] p-3 sm:p-6 lg:p-12">
      <div className="mx-auto flex w-full max-w-[720px] flex-col items-center justify-center gap-10 rounded-[40px] bg-[#eef1f7] px-6 py-10 sm:px-12 lg:px-20 lg:py-12">
        <img src={loyolloLogoSignup} alt="Loyollo" className="h-8 w-auto md:h-10" />

        <div className="w-full text-center">
          <h1 className="text-2xl font-bold leading-[1.2] text-[#0a152f]">Create New Password</h1>
          <p className="mt-2 text-base text-[#525252]">
            Choose a strong password to secure your account.
          </p>
        </div>

        {success ? (
          <p role="status" aria-live="polite" className="text-center text-base text-[#44b678]">
            Password updated successfully. Redirecting…
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
            <PwField
              id="current-password"
              placeholder="Current Password"
              value={current}
              onChange={(v) => {
                setCurrent(v);
                if (fieldErrors.current) setFieldErrors((e) => ({ ...e, current: undefined }));
              }}
              show={showCurrent}
              onToggle={() => setShowCurrent((s) => !s)}
              autoComplete="current-password"
              invalid={!!fieldErrors.current}
              hint={fieldErrors.current}
            />
            <PwField
              id="new-password"
              placeholder="New Password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: undefined }));
              }}
              show={showNew}
              onToggle={() => setShowNew((s) => !s)}
              autoComplete="new-password"
              invalid={!!fieldErrors.password}
              hint={
                fieldErrors.password ??
                (passwordValid ? "Looks strong ✓" : (liveFeedback ?? undefined))
              }
              hintTone={fieldErrors.password ? "error" : passwordValid ? "success" : "muted"}
            />
            <PwField
              id="confirm-new-password"
              placeholder="Confirm New Password"
              value={confirm}
              onChange={(v) => {
                setConfirm(v);
                if (fieldErrors.confirm) setFieldErrors((e) => ({ ...e, confirm: undefined }));
              }}
              show={showConfirm}
              onToggle={() => setShowConfirm((s) => !s)}
              autoComplete="new-password"
              invalid={!!fieldErrors.confirm || confirmMismatch}
              hint={fieldErrors.confirm ?? (confirmMismatch ? "Passwords do not match" : undefined)}
              hintTone="error"
            />

            {submitError && (
              <p
                role="alert"
                aria-live="polite"
                className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-full bg-[#feb602] px-6 py-2 text-xl font-semibold text-[#0A152F] shadow-[0_1px_8px_0_rgba(0,0,0,0.12),0_0_2px_0_rgba(0,0,0,0.1)] transition-transform hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{loading ? "Updating…" : "Reset Password"}</span>
              <ArrowRight className="h-6 w-6 text-[#0A152F]" />
            </button>

            <Link
              to="/"
              className="text-center text-sm font-medium text-[#525252] hover:text-[#0a152f]"
            >
              Cancel
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

function PwField({
  id,
  placeholder,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  invalid,
  hint,
  hintTone = "muted",
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
  invalid?: boolean;
  hint?: string;
  hintTone?: "muted" | "error" | "success";
}) {
  const toneClass =
    hintTone === "error"
      ? "text-red-500"
      : hintTone === "success"
        ? "text-[#44b678]"
        : "text-[#525252]";
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div
        className={`flex h-[53px] items-center gap-2 rounded-[12px] border bg-[#fafafa] px-4 py-[17px] ${
          invalid ? "border-red-400" : "border-[#d7ddea]"
        } focus-within:border-[#feb602] focus-within:ring-2 focus-within:ring-[#feb602]/30`}
      >
        <Lock className="h-4 w-4 text-[#737373]" />
        <div className="h-5 w-px bg-[#d7ddea]" />
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!invalid}
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
      {hint && (
        <p aria-live="polite" className={`text-sm ${toneClass}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
