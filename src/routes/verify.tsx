import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import loyolloLogoSignup from "@/assets/loyollo-logo-signup.svg";

export const Route = createFileRoute("/verify")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify your email — Loyalty" },
      {
        name: "description",
        content: "Click the link we sent to your email to verify your account.",
      },
      { property: "og:title", content: "Verify your email — Loyalty" },
      {
        property: "og:description",
        content: "Click the link we sent to your email to verify your account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyPage,
});

const RESEND_SECONDS = 60;

function VerifyPage() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const { user, isVerified, resendVerification } = useAuth();
  const userEmail = email || user?.email || "";
  const displayEmail = userEmail || "your email";

  // If verified (e.g. after clicking the email link), redirect away.
  React.useEffect(() => {
    if (isVerified) {
      navigate({ to: "/verified", replace: true });
    }
  }, [isVerified, navigate]);

  const [status, setStatus] = React.useState<"idle" | "error" | "success" | "info">("idle");
  const [message, setMessage] = React.useState<string>("");
  const [remaining, setRemaining] = React.useState<number>(RESEND_SECONDS);
  const [isSending, setIsSending] = React.useState(false);
  const [alreadyVerified, setAlreadyVerified] = React.useState(false);
  const intervalRef = React.useRef<number | null>(null);

  const startCooldown = React.useCallback((seconds: number) => {
    setRemaining(seconds);
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }, []);

  // Start initial cooldown on mount; clean up on unmount.
  React.useEffect(() => {
    startCooldown(RESEND_SECONDS);
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startCooldown]);

  async function handleResend() {
    if (isSending || remaining > 0 || alreadyVerified) return;
    if (!userEmail) {
      setStatus("error");
      setMessage("We couldn't find your email. Please sign up again.");
      return;
    }
    setIsSending(true);
    setStatus("idle");
    setMessage("");
    try {
      const result = await resendVerification(userEmail);
      if (!result.error) {
        setStatus("success");
        setMessage("Verification email resent. Please check your inbox.");
        startCooldown(RESEND_SECONDS);
        return;
      }
      if (result.alreadyVerified) {
        setAlreadyVerified(true);
        setStatus("info");
        setMessage("This email is already verified — try signing in.");
        return;
      }
      if (result.rateLimited) {
        setStatus("error");
        setMessage("You've requested this recently — please wait a moment before trying again.");
        startCooldown(RESEND_SECONDS);
        return;
      }
      console.error("[verify] resend failed:", result);
      setStatus("error");
      setMessage("Something went wrong sending the email — please try again.");
    } catch (err) {
      console.error("[verify] resend threw:", err);
      setStatus("error");
      setMessage("Something went wrong sending the email — please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="bg-[#eef1f7] p-3 sm:p-6 lg:p-12">
      <div className="mx-auto flex w-full max-w-[720px] flex-col items-center justify-center gap-10 rounded-[40px] bg-[#eef1f7] px-6 py-10 sm:px-12 lg:px-20 lg:py-12">
        {/* Logo */}
        <img src={loyolloLogoSignup} alt="Loyollo" className="h-8 w-auto md:h-10" />

        {/* Heading */}
        <div className="w-full text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#fff9e6]">
            <ShieldCheck className="h-7 w-7 text-[#feb602]" />
          </div>
          <h1 className="text-2xl font-bold leading-[1.2] text-[#0a152f]">Email Verification</h1>
          <p className="mt-2 text-base text-[#525252]">
            We sent a verification link to{" "}
            <span className="font-bold text-[#0a152f]">{displayEmail}</span>
          </p>
        </div>

        {/* Resend / status */}
        <div className="flex w-full flex-col items-center gap-6">
          <p
            role={status === "error" ? "alert" : undefined}
            aria-live="polite"
            className={`min-h-[1.25rem] text-center text-sm ${
              status === "error"
                ? "text-red-500"
                : status === "success"
                  ? "text-[#44b678]"
                  : status === "info"
                    ? "text-[#0a152f]"
                    : "text-transparent"
            }`}
          >
            {message || "placeholder"}
          </p>

          <div className="flex items-center justify-center py-2">
            {alreadyVerified ? (
              <Link
                to="/signin"
                className="text-center text-base font-semibold text-[#feb602] underline underline-offset-2 hover:text-[#e29f00]"
              >
                Go to sign in
              </Link>
            ) : remaining > 0 ? (
              <p className="text-center text-base text-[#0a152f]" aria-live="polite">
                Resend in{" "}
                <span className="text-[#feb602]">00:{remaining.toString().padStart(2, "0")}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isSending || remaining > 0}
                className="text-center text-base font-semibold text-[#feb602] underline underline-offset-2 hover:text-[#e29f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/40 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSending ? "Sending…" : "Resend link"}
              </button>
            )}
          </div>

          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-1 rounded-full bg-[#f7f7f7] px-6 py-3 text-base font-semibold text-[#0a152f] shadow-[0_0_2px_0_rgba(0,0,0,0.1),0_1px_8px_0_rgba(0,0,0,0.12)] hover:brightness-95"
          >
            Back to sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
