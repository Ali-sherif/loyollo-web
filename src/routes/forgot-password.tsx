import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { Mail, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import loyolloLogoSignup from "@/assets/loyollo-logo-signup.svg";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — Loyalty" },
      {
        name: "description",
        content: "Reset your Loyalty account password by email.",
      },
      { property: "og:title", content: "Forgot password — Loyalty" },
      { property: "og:description", content: "Reset your account password by email." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setEmailError(null);
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setLoading(true);
    // Do not surface whether the email exists.
    await resetPasswordForEmail(email.trim());
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="bg-[#eef1f7] p-3 sm:p-6 lg:p-12">
      <div className="mx-auto flex w-full max-w-[720px] flex-col items-center justify-center gap-10 rounded-[40px] bg-[#eef1f7] px-6 py-10 sm:px-12 lg:px-20 lg:py-12">
        <img src={loyolloLogoSignup} alt="Loyollo logo" className="h-8 w-auto md:h-10" />

        <div className="w-full text-center">
          <h1 className="text-2xl font-bold leading-[1.2] text-[#0a152f]">
            {sent ? "Check your email" : "Forgot your password?"}
          </h1>
          <p className="mt-2 text-base text-[#525252]">
            {sent
              ? "If an account exists for that email, we sent a link to reset your password."
              : "Enter your email and we'll send you a link to reset your password."}
          </p>
        </div>

        {!sent && (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex w-full max-w-[560px] flex-col gap-5"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fp-email" className="sr-only">
                Business email
              </label>
              <div
                className={`flex h-[53px] items-center gap-2 rounded-[12px] border bg-[#fafafa] px-4 ${
                  emailError ? "border-red-400" : "border-[#d7ddea]"
                } focus-within:border-[#feb602] focus-within:ring-2 focus-within:ring-[#feb602]/30`}
              >
                <Mail className="h-4 w-4 text-[#737373]" />
                <div className="h-5 w-px bg-[#d7ddea]" />
                <input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Business email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!emailError}
                  className="flex-1 bg-transparent text-base text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
                />
              </div>
              {emailError && (
                <p role="alert" className="text-sm text-red-500">
                  {emailError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#feb602] px-6 py-3 text-xl font-semibold text-[#0A152F] shadow-[0_1px_8px_0_rgba(0,0,0,0.12),0_0_2px_0_rgba(0,0,0,0.1)] transition-transform hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        )}

        <p className="text-center text-base text-[#0a152f]">
          Remembered it?{" "}
          <Link to="/signin" className="font-semibold text-[#e29f00] underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
