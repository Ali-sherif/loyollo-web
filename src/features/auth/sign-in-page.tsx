"use client";

import { Link, useNavigate, useRouterState } from "@/lib/navigation";
import * as React from "react";
import { getAuthSupabase } from "@/integrations/supabase/auth-client";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Gift,
  Users,
} from "lucide-react";
import avatar1 from "@/assets/avatar-1.jpg";
import avatar2 from "@/assets/avatar-2.jpg";
import avatar3 from "@/assets/avatar-3.jpg";
import avatar4 from "@/assets/avatar-4.jpg";
import { useAuth } from "@/hooks/use-auth";
import loyolloLogoSignin from "@/assets/loyollo-logo-signin.svg";

const avatars = [avatar1, avatar2, avatar3, avatar4];

type FormState = {
  email: string;
  password: string;
  remember: boolean;
};

type Errors = Partial<Record<"email" | "password", string>>;

function SignInPage() {
  const navigate = useNavigate();
  const { signIn, resendVerification } = useAuth();
  const [form, setForm] = React.useState<FormState>({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = React.useState(false);
  const [resendMsg, setResendMsg] = React.useState<string | null>(null);
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.password) e.password = "Password is required";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitError(null);
    setNeedsVerification(false);
    setResendMsg(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    const result = await signIn(form.email.trim(), form.password);
    setLoading(false);
    if (result.error) {
      setSubmitError(result.error);
      if (result.needsVerification) setNeedsVerification(true);
      return;
    }
    // Route based on onboarding completion.
    const { data: sessionData } = await getAuthSupabase().auth.getUser();
    const uid = sessionData.user?.id;
    if (uid) {
      const { data: profile } = await getAuthSupabase()
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", uid)
        .maybeSingle();
      navigate({ to: profile?.onboarding_completed ? "/dashboard" : "/onboarding" });
    } else {
      navigate({ to: "/dashboard" });
    }
  }

  async function handleResend() {
    setResendMsg(null);
    const { error } = await resendVerification(form.email.trim());
    setResendMsg(error ? error : "Verification email sent. Check your inbox.");
  }

  return (
    <div className="bg-[#eef1f7] p-3 sm:p-6 lg:p-12">
      <div className="mx-auto flex max-w-[1440px] flex-col items-stretch justify-center gap-6 lg:flex-row lg:gap-0">
        {/* Left: form panel */}
        <div className="flex flex-1 flex-col items-center justify-center gap-10 rounded-[32px] bg-transparent px-6 py-10 sm:px-12 lg:px-20 lg:py-0">
          {/* Logo */}
          <img src={loyolloLogoSignin} alt="Loyollo logo" className="h-8 w-auto md:h-10" />

          {/* Heading */}
          <div className="w-full text-center">
            <h1 className="text-2xl font-bold leading-[1.2] text-[#0a152f]">
              Sign in to your account
            </h1>
            <p className="mt-2 text-base text-[#525252]">
              Build customer loyalty and grow your business
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex w-full max-w-[560px] flex-col gap-5"
          >
            <div className="flex flex-col gap-4">
              <Field
                id="email"
                label="Business email"
                type="email"
                icon={<Mail className="h-4 w-4" />}
                placeholder="Business email"
                value={form.email}
                onChange={(v) => update("email", v)}
                error={errors.email}
                autoComplete="email"
              />

              <div className="flex flex-col gap-2">
                <Field
                  id="password"
                  label="Password"
                  type={showPw ? "text" : "password"}
                  icon={<Lock className="h-4 w-4" />}
                  placeholder="Password"
                  value={form.password}
                  onChange={(v) => update("password", v)}
                  error={errors.password}
                  autoComplete="current-password"
                  rightAction={{
                    label: showPw ? "Hide password" : "Show password",
                    icon: showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />,
                    onClick: () => setShowPw((s) => !s),
                  }}
                />
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-[#0a152f] hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => update("remember", e.target.checked)}
                className="h-6 w-6 shrink-0 cursor-pointer rounded-md border border-[#b2e7c7] bg-[#effaf4] accent-[#44b678]"
              />
              <span className="text-[#0a152f]">Remember me</span>
            </label>

            {submitError && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                <p>{submitError}</p>
                {needsVerification && (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="mt-2 font-semibold text-[#e29f00] underline underline-offset-2"
                  >
                    Resend verification email
                  </button>
                )}
                {resendMsg && <p className="mt-2 text-[#0a152f]">{resendMsg}</p>}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#feb602] px-6 py-3 text-xl font-semibold text-[#0A152F] shadow-[0_1px_8px_0_rgba(0,0,0,0.12),0_0_2px_0_rgba(0,0,0,0.1)] transition-transform hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
              <ArrowRight className="h-5 w-5 text-[#0A152F]" />
            </button>

            <p className="text-center text-base text-[#0a152f]">
              Don&rsquo;t have an account?{" "}
              <Link to="/signup" className="font-semibold text-[#e29f00] underline">
                Create account
              </Link>
            </p>
          </form>
        </div>

        {/* Right: showcase panel */}
        <div className="relative flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden rounded-[32px] bg-[#0a152f] p-8 sm:p-12 lg:p-20">
          <div className="pointer-events-none absolute -left-16 -top-16 h-[320px] w-[320px] rounded-full bg-[#feb602]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-[320px] w-[320px] rounded-full bg-[#44b678]/10 blur-3xl" />

          <div className="relative flex w-full flex-col items-stretch gap-4 rounded-[20px] bg-white/10 p-4 backdrop-blur-sm sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#fff9e6]/20">
                <TrendingUp className="h-6 w-6 text-[#feb602]" />
              </div>
              <p className="min-w-0 flex-1 text-base font-semibold text-[#eef1f7]">
                Start Building Your Loyalty Program &amp; Grow Your Business
              </p>
            </div>
            <Link
              to="/signup"
              className="inline-flex shrink-0 items-center justify-center gap-1 self-start rounded-full bg-[#feb602] px-5 py-2 text-base font-semibold text-white shadow-[0_1px_8px_0_rgba(0,0,0,0.12)] sm:self-auto sm:py-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Start Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-6 sm:col-span-1">
              <StatCard
                icon={<Gift className="h-6 w-6 text-[#feb602]" />}
                iconBg="bg-[#fff9e6]/20"
                delta="+20%"
                label="Points Redeemed"
                value="863.5K"
              />
              <StatCard
                icon={<Sparkles className="h-6 w-6 text-[#44b678]" />}
                iconBg="bg-[#effaf4]/20"
                delta="+50%"
                label="Total Customers"
                value="5.6M"
              />
            </div>

            <div className="flex flex-col items-center justify-end gap-6 rounded-[20px] bg-white/10 p-4">
              <div className="grid grid-cols-2 gap-3 p-4">
                {avatars.map((src, i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="h-[60px] w-[60px] rounded-full bg-cover bg-center ring-4 ring-[#0a152f]"
                    style={{ backgroundImage: `url(${src})` }}
                  />
                ))}
              </div>

              <div className="w-full rounded-[20px] bg-white/10 p-4 text-center">
                <p className="text-[32px] font-bold leading-[1.2] text-white">+10K</p>
                <p className="mt-3 text-base font-semibold text-[#eef1f7]">
                  <Users className="mr-1 inline h-4 w-4" />
                  Businesses
                </p>
              </div>
            </div>
          </div>

          <div className="relative w-full text-center">
            <h2 className="text-2xl font-bold leading-[1.2] text-white">
              The Smarter Way to Retain Customers
            </h2>
            <p className="mt-2 text-base text-[#eef1f7]/80">
              Everything you need to manage loyalty programs, customer insights, and rewards in one
              platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type StatCardProps = {
  icon: React.ReactNode;
  iconBg: string;
  delta: string;
  label: string;
  value: string;
};

function StatCard({ icon, iconBg, delta, label, value }: StatCardProps) {
  return (
    <div className="rounded-[20px] bg-white/10 p-4">
      <div className="flex items-center justify-between">
        <div className={`grid h-14 w-14 place-items-center rounded-full ${iconBg}`}>{icon}</div>
        <div className="flex items-center gap-1 text-base font-semibold text-[#44b678]">
          {delta}
          <ArrowRight className="h-4 w-4 -rotate-45" />
        </div>
      </div>
      <p className="mt-6 text-base font-semibold text-[#eef1f7]">{label}</p>
      <p className="mt-3 text-[32px] font-bold leading-[1.2] text-white">{value}</p>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  autoComplete?: string;
  rightAction?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  };
};

function Field({
  id,
  label,
  icon,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  autoComplete,
  rightAction,
}: FieldProps) {
  const describedBy = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={`flex h-[53px] items-center gap-2 rounded-[12px] border bg-[#fafafa] px-4 ${
          error ? "border-red-400" : "border-[#d7ddea]"
        } focus-within:border-[#feb602] focus-within:ring-2 focus-within:ring-[#feb602]/30`}
      >
        <span className="grid h-4 w-4 place-items-center text-[#737373]">{icon}</span>
        <div className="h-5 w-px bg-[#d7ddea]" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className="flex-1 bg-transparent text-base text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
        />
        {rightAction && (
          <button
            type="button"
            onClick={rightAction.onClick}
            aria-label={rightAction.label}
            className="grid h-4 w-4 place-items-center text-[#737373] hover:text-[#0a152f]"
          >
            {rightAction.icon}
          </button>
        )}
      </div>
      {error && (
        <p id={describedBy} className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

export default SignInPage;
