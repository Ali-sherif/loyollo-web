import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import {
  User,
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Gift,
  Users,
  ChevronDown,
} from "lucide-react";
import avatar1 from "@/assets/avatar-1.jpg";
import avatar2 from "@/assets/avatar-2.jpg";
import avatar3 from "@/assets/avatar-3.jpg";
import avatar4 from "@/assets/avatar-4.jpg";
import { useAuth } from "@/hooks/use-auth";
import loyolloLogoSignup from "@/assets/loyollo-logo-signup.svg";

const avatars = [avatar1, avatar2, avatar3, avatar4];

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    plan: typeof search.plan === "string" ? search.plan : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create your account — Loyalty" },
      {
        name: "description",
        content:
          "Sign up for Loyalty and start building customer loyalty and growing your business with digital rewards.",
      },
      { property: "og:title", content: "Create your account — Loyalty" },
      {
        property: "og:description",
        content: "Start building customer loyalty and growing your business.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignUpPage,
});

type FormState = {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
};

type Errors = Partial<Record<keyof FormState, string>>;

function SignUpPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [form, setForm] = React.useState<FormState>({
    fullName: "",
    businessName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    agreePrivacy: false,
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showPw, setShowPw] = React.useState(false);
  const [showConfirmPw, setShowConfirmPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function passwordChecks(pw: string) {
    return {
      length: pw.length >= 8,
      uppercase: /[A-Z]/.test(pw),
      lowercase: /[a-z]/.test(pw),
      number: /[0-9]/.test(pw),
      special: /[^A-Za-z0-9]/.test(pw),
    };
  }

  function passwordFeedback(pw: string): string | null {
    if (pw.length === 0) return null;
    const c = passwordChecks(pw);
    if (!c.length) return "Use at least 8 characters";
    const missing: string[] = [];
    if (!c.uppercase) missing.push("an uppercase letter");
    if (!c.lowercase) missing.push("a lowercase letter");
    if (!c.number) missing.push("a number");
    if (!c.special) missing.push("a special character");
    if (missing.length === 0) return null;
    if (missing.length === 1) return `Add ${missing[0]}`;
    if (missing.length === 2) return `Add ${missing[0]} and ${missing[1]}`;
    return `Add ${missing.slice(0, -1).join(", ")}, and ${missing[missing.length - 1]}`;
  }

  const liveFeedback = passwordFeedback(form.password);
  const passwordValid = form.password.length > 0 && liveFeedback === null;

  function validate(): Errors {
    const e: Errors = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.businessName.trim()) e.businessName = "Business name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    const fb = passwordFeedback(form.password);
    if (form.password.length === 0) e.password = "Password is required";
    else if (fb) e.password = fb;
    if (form.confirmPassword !== form.password) e.confirmPassword = "Passwords do not match";
    if (!form.agreeTerms) e.agreeTerms = "You must accept the Terms & Conditions";
    if (!form.agreePrivacy) e.agreePrivacy = "You must accept the Privacy Policy";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    const { error } = await signUp({
      email: form.email.trim(),
      password: form.password,
      fullName: form.fullName.trim(),
      businessName: form.businessName.trim(),
      phone: form.phone.trim(),
    });
    setLoading(false);
    if (error) {
      setSubmitError(error);
      return;
    }
    navigate({ to: "/verify", search: { email: form.email } });
  }

  return (
    <div className="bg-[#eef1f7] p-3 sm:p-6 lg:p-12">
      <div className="mx-auto flex max-w-[1440px] flex-col items-stretch justify-center gap-6 lg:flex-row lg:gap-0">
        {/* Left: form panel */}
        <div className="flex flex-1 flex-col items-center justify-center gap-10 rounded-[32px] bg-transparent px-6 py-10 sm:px-12 lg:px-20 lg:py-0">
          {/* Logo */}
          <img src={loyolloLogoSignup} alt="Loyollo" className="h-8 w-auto md:h-10" />

          {/* Heading */}
          <div className="w-full text-center">
            <h1 className="text-2xl font-bold leading-[1.2] text-[#0a152f]">Create your account</h1>
            <p className="mt-2 text-base text-[#525252]">
              Start building customer loyalty and growing your business
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex w-full max-w-[560px] flex-col gap-5"
          >
            {/* Fields */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  id="fullName"
                  label="Full name"
                  icon={<User className="h-4 w-4" />}
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={(v) => update("fullName", v)}
                  error={errors.fullName}
                  autoComplete="name"
                />
                <Field
                  id="businessName"
                  label="Business name"
                  icon={<Briefcase className="h-4 w-4" />}
                  placeholder="Business name"
                  value={form.businessName}
                  onChange={(v) => update("businessName", v)}
                  error={errors.businessName}
                  autoComplete="organization"
                />
              </div>

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

              {/* Phone with country prefix */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="sr-only">
                  Phone number
                </label>
                <div
                  className={`flex h-[53px] items-center gap-2 rounded-[12px] border bg-[#fafafa] px-4 ${
                    errors.phone ? "border-red-400" : "border-[#d7ddea]"
                  } focus-within:border-[#feb602] focus-within:ring-2 focus-within:ring-[#feb602]/30`}
                >
                  <div className="flex items-center gap-1">
                    <span aria-hidden className="text-lg leading-none">
                      🇨🇦
                    </span>
                    <ChevronDown className="h-4 w-4 text-[#0a152f]" />
                  </div>
                  <div className="h-5 w-px bg-[#d7ddea]" />
                  <span className="whitespace-nowrap text-base text-[#0a152f]">+1 (416)</span>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="000-0000"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                    className="flex-1 bg-transparent text-base text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
                  />
                </div>
                {errors.phone && (
                  <p id="phone-error" className="text-sm text-red-500">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Field
                  id="password"
                  label="Password"
                  type={showPw ? "text" : "password"}
                  icon={<Lock className="h-4 w-4" />}
                  placeholder="Password"
                  value={form.password}
                  onChange={(v) => update("password", v)}
                  error={errors.password}
                  describedById="password-help"
                  autoComplete="new-password"
                  rightAction={{
                    label: showPw ? "Hide password" : "Show password",
                    icon: showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />,
                    onClick: () => setShowPw((s) => !s),
                  }}
                />
                <p
                  id="password-help"
                  aria-live="polite"
                  className={`min-h-0 text-sm ${passwordValid ? "text-[#44b678]" : "text-red-500"}`}
                >
                  {errors.password
                    ? null
                    : liveFeedback
                      ? liveFeedback
                      : passwordValid
                        ? "Strong password"
                        : null}
                </p>
              </div>

              <Field
                id="confirmPassword"
                label="Confirm password"
                type={showConfirmPw ? "text" : "password"}
                icon={<Lock className="h-4 w-4" />}
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={(v) => update("confirmPassword", v)}
                error={errors.confirmPassword}
                autoComplete="new-password"
                rightAction={{
                  label: showConfirmPw ? "Hide password" : "Show password",
                  icon: showConfirmPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  ),
                  onClick: () => setShowConfirmPw((s) => !s),
                }}
              />
            </div>

            {/* Consent */}
            <div className="flex flex-col gap-4">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => update("agreeTerms", e.target.checked)}
                  aria-invalid={!!errors.agreeTerms}
                  className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer rounded-md border border-[#b2e7c7] bg-[#effaf4] accent-[#44b678]"
                />
                <span className="text-[#0a152f]">
                  I agree to the{" "}
                  <a href="/terms" className="font-semibold text-[#2563eb] underline">
                    Terms &amp; Conditions
                  </a>
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="-mt-3 text-sm text-red-500">{errors.agreeTerms}</p>
              )}

              <label className="flex items-start gap-4 text-sm">
                <input
                  type="checkbox"
                  checked={form.agreePrivacy}
                  onChange={(e) => update("agreePrivacy", e.target.checked)}
                  aria-invalid={!!errors.agreePrivacy}
                  className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer rounded-md border border-[#b2e7c7] bg-[#effaf4] accent-[#44b678]"
                />
                <span className="text-[#0a152f]">
                  I have read and accept the{" "}
                  <a href="/privacy" className="font-semibold text-[#2563eb] underline">
                    Privacy Policy
                  </a>
                  , including data collection and processing practices
                </span>
              </label>
              {errors.agreePrivacy && (
                <p className="-mt-3 text-sm text-red-500">{errors.agreePrivacy}</p>
              )}
            </div>

            {submitError && (
              <p
                role="alert"
                aria-live="polite"
                className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {submitError}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#feb602] px-6 py-3 text-xl font-semibold text-[#0A152F] shadow-[0_1px_8px_0_rgba(0,0,0,0.12),0_0_2px_0_rgba(0,0,0,0.1)] transition-transform hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create Account"}
              <ArrowRight className="h-5 w-5 text-[#0A152F]" />
            </button>

            <p className="text-center text-base text-[#0a152f]">
              Have an account?{" "}
              <Link to="/signin" className="font-semibold text-[#e29f00] underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>

        {/* Right: showcase panel */}
        <div className="relative flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden rounded-[32px] bg-[#0a152f] p-8 sm:p-12 lg:p-20">
          {/* Decorative glows */}
          <div className="pointer-events-none absolute -left-16 -top-16 h-[320px] w-[320px] rounded-full bg-[#feb602]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-[320px] w-[320px] rounded-full bg-[#44b678]/10 blur-3xl" />

          {/* CTA banner */}
          <div className="relative flex w-full flex-col items-stretch gap-4 rounded-[20px] bg-white/10 p-4 backdrop-blur-sm sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#fff9e6]/20">
                <TrendingUp className="h-6 w-6 text-[#feb602]" />
              </div>
              <p className="min-w-0 flex-1 text-base font-semibold text-[#eef1f7]">
                Start Building Your Loyalty Program &amp; Grow Your Business
              </p>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center gap-1 self-start rounded-full bg-[#feb602] px-5 py-2 text-base font-semibold text-white shadow-[0_1px_8px_0_rgba(0,0,0,0.12)] sm:self-auto sm:py-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Start Now
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Stat cards grid */}
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
                icon={<Users className="h-6 w-6 text-[#44b678]" />}
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

          {/* Tagline */}
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
  describedById?: string;
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
  describedById,
  rightAction,
}: FieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, describedById].filter(Boolean).join(" ") || undefined;
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
        <p id={errorId} className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
