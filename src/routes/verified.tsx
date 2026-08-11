import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { hostedAssets } from "@/assets/hosted";

const loyolloLogoSignup = hostedAssets.loyolloLogoSignup;
const newIllustration = hostedAssets.jonFinanceIllustration;

export const Route = createFileRoute("/verified")({
  head: () => ({
    meta: [
      { title: "Email Verified — Loyalty" },
      {
        name: "description",
        content: "Your email has been verified. Continue setting up your account.",
      },
      { property: "og:title", content: "Email Verified — Loyalty" },
      {
        property: "og:description",
        content: "Your email has been verified. Continue setting up your account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifiedPage,
});

function VerifiedPage() {
  const navigate = useNavigate();
  const { user, isVerified, loading } = useAuth();
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/signin", replace: true });
      return;
    }
    if (!isVerified) {
      navigate({
        to: "/verify",
        search: { email: user.email ?? "" },
        replace: true,
      });
    }
  }, [user, isVerified, loading, navigate]);

  React.useEffect(() => {
    if (!loading && user && isVerified) {
      headingRef.current?.focus();
    }
  }, [loading, user, isVerified]);

  if (loading || !user || !isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef1f7] p-3 sm:p-6 lg:p-12">
      <div className="mx-auto flex w-full max-w-[720px] flex-col items-center justify-center gap-10 rounded-[40px] bg-[#eef1f7] px-6 py-10 sm:px-12 lg:px-20 lg:py-12">
        {/* Logo */}
        <img
          src={loyolloLogoSignup.url}
          alt="Loyollo"
          className="h-8 w-auto md:h-10"
        />

        {/* Illustration */}
        <img
          src={newIllustration.url}
          alt=""
          width={320}
          height={320}
          className="h-auto w-[200px] animate-[verified-pop_500ms_ease-out] sm:w-[240px]"
        />

        {/* Copy */}
        <div
          className="w-full text-center"
          role="status"
          aria-live="polite"
        >
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-bold leading-[1.2] text-[#0a152f] outline-none sm:text-[28px]"
          >
            Email Verified Successfully!
          </h1>
          <p className="mt-2 text-base text-[#525252]">
            Your email has been verified successfully. Let's set up your account.
          </p>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={async () => {
            if (!user) {
              navigate({ to: "/signin" });
              return;
            }
            const { data } = await supabase
              .from("profiles")
              .select("onboarding_completed")
              .eq("id", user.id)
              .maybeSingle();
            navigate({
              to: data?.onboarding_completed ? "/dashboard" : "/onboarding",
            });
          }}
          className="inline-flex min-w-[280px] items-center justify-center rounded-full bg-[#feb602] px-8 py-4 text-base font-semibold text-[#0A152F] shadow-[0_4px_14px_0_rgba(254,182,2,0.35)] transition hover:bg-[#e29f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1f7]"
        >
          Let's Get Started
        </button>
      </div>

      <style>{`
        @keyframes verified-pop {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
