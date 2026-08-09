import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import * as React from "react";
import { Check, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/onboarding/success")({
  head: () => ({
    meta: [
      { title: "You're all set — Loyalty" },
      {
        name: "description",
        content:
          "Your loyalty program is ready. Head to your dashboard to get started.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingSuccess,
});

type CompletionState = { justCompleted?: boolean };

function OnboardingSuccess() {
  const navigate = useNavigate();
  const { user, isVerified, loading } = useAuth();

  const justCompleted = useRouterState({
    select: (s) => (s.location.state as CompletionState | undefined)?.justCompleted === true,
  });

  const [checking, setChecking] = React.useState(true);
  const [businessName, setBusinessName] = React.useState<string>("");
  const [businessType, setBusinessType] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const finalizedRef = React.useRef(false);

  const headingRef = React.useRef<HTMLHeadingElement | null>(null);

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
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "onboarding_completed, num_locations, business_type, business_category, business_name, plan",
        )
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;

      // Reachable only right after Step 4 finished, OR the user is already
      // fully onboarded within the same in-flight transition. Otherwise
      // bounce to the appropriate destination.
      if (data?.onboarding_completed && !justCompleted) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      // Require full upstream data
      if (!data?.num_locations || !data?.business_type || !data?.plan) {
        // Send back to earliest incomplete step
        if (!data?.num_locations) navigate({ to: "/onboarding", replace: true });
        else if (!data?.business_type)
          navigate({ to: "/onboarding/business-type", replace: true });
        else navigate({ to: "/onboarding/plan", replace: true });
        return;
      }

      setBusinessName(data.business_name ?? "");
      setBusinessType(data.business_type ?? "");

      // Finalize exactly once
      if (!data.onboarding_completed && !finalizedRef.current) {
        finalizedRef.current = true;
        const { error: upErr } = await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("id", user.id);
        if (upErr) {
          setError(upErr.message || "Could not finalize onboarding.");
        }
      }
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isVerified, loading, navigate, justCompleted]);

  // Move focus to the heading so screen readers announce the success state
  React.useEffect(() => {
    if (!checking && headingRef.current) headingRef.current.focus();
  }, [checking]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef1f7] p-4 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[720px] items-center justify-center">
        <div
          role="status"
          aria-live="polite"
          className="w-full rounded-[32px] bg-white p-8 text-center shadow-[0_1px_8px_0_rgba(0,0,0,0.08)] sm:p-12"
        >
          {/* Success badge — subtle scale-in, respects reduced motion */}
          <div className="flex justify-center">
            <span
              aria-hidden
              className="motion-safe:animate-[popIn_500ms_ease-out_both] inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#effaf4] ring-8 ring-[#effaf4]/60"
            >
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#44b678]">
                <Check className="h-8 w-8 text-white" strokeWidth={3} aria-hidden />
              </span>
            </span>
          </div>

          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-8 text-[28px] font-bold leading-[1.2] text-[#0a152f] focus:outline-none sm:text-[32px]"
          >
            You&rsquo;re all set{businessName ? `, ${businessName}` : ""}!
          </h1>

          <p className="mt-4 text-[16px] font-normal text-[#525252] sm:text-[18px]">
            Your loyalty program is ready to go. We&rsquo;ve saved your setup
            {businessType ? (
              <>
                {" "}for{" "}
                <span className="font-semibold text-[#0a152f]">{businessType}</span>
              </>
            ) : null}
            .
          </p>

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={() => navigate({ to: "/dashboard", replace: true })}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#feb602] px-10 py-3 text-[16px] font-semibold text-white shadow-[0_1px_8px_0_rgba(0,0,0,0.12)] transition hover:bg-[#e29f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:w-auto"
            >
              Go to Dashboard
              <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <p className="mt-8 text-sm text-[#737373]">
            *Your data stays private and encrypted.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
