import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingLeftPanelDecor } from "@/components/onboarding/OnboardingLeftPanelDecor";
import { BUSINESS_CATEGORIES, type BusinessCategory } from "@/data/businessTypes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/business-category")({
  head: () => ({
    meta: [
      { title: "Select your business type — Loyalty" },
      {
        name: "description",
        content: "Pick the sub-type that best fits your business to tailor your loyalty program.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingBusinessCategory,
});

const TOTAL_STEPS = 4;
const CURRENT_STEP = 3;

function OnboardingBusinessCategory() {
  const navigate = useNavigate();
  const { user, isVerified, loading } = useAuth();

  const [category, setCategory] = React.useState<BusinessCategory | null>(null);
  const [selectedSubType, setSelectedSubType] = React.useState<string>("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [checking, setChecking] = React.useState(true);

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
        .select("onboarding_completed, num_locations, business_type, business_category")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.onboarding_completed) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      if (!data?.num_locations) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      // Inherit the top-level category from Step 2. On a first pass it lives
      // in business_type; if Step 3 has already saved once, the top-level is
      // in business_category (business_type then holds the sub-type).
      const topLevel = data.business_category ?? data.business_type;
      const inherited = topLevel
        ? BUSINESS_CATEGORIES.find((c) => c.label === topLevel)
        : undefined;

      if (!inherited) {
        // No category, or a free-text/"Others" value with no matching cards.
        navigate({ to: "/onboarding/business-type", replace: true });
        return;
      }

      setCategory(inherited);
      // Restore previous sub-type only if it still belongs to this category.
      if (
        data.business_category &&
        data.business_type &&
        inherited.items.some((it) => it.label === data.business_type)
      ) {
        setSelectedSubType(data.business_type);
      }
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isVerified, loading, navigate]);

  const isValid = selectedSubType.length > 0;

  async function handleNext() {
    setSubmitError(null);
    if (!isValid || !user || !category) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        business_category: category.label,
        business_type: selectedSubType,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setSubmitError(error.message || "Could not save. Please try again.");
      return;
    }
    navigate({ to: "/onboarding/plan" });
  }

  function handleBack() {
    navigate({ to: "/onboarding/business-type" });
  }

  if (loading || checking || !category) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#eef1f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#eef1f7] p-2 sm:p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col overflow-hidden rounded-[40px] bg-[#eef1f7] lg:min-h-[calc(100vh-3rem)] lg:flex-row lg:p-8">
        <aside className="relative flex w-full flex-col items-center justify-center gap-8 overflow-hidden rounded-[32px] bg-[#0a152f] p-5 text-white lg:h-auto lg:w-[320px] lg:rounded-[40px] lg:p-7">
          <OnboardingLeftPanelDecor />
          <div className="relative flex items-center justify-center rounded-full bg-[#0f1c3d] px-10 py-5">
            <span className="text-base font-semibold leading-none text-[#feb602]">LOGO</span>
          </div>
          <div className="relative flex w-full flex-col items-center gap-4 text-center">
            <h2 className="text-[24px] font-bold leading-[1.2] text-white">
              Let&rsquo;s Setup Your Account
            </h2>
            <p className="text-base font-normal text-[#eef1f7]">
              Just a few quick steps to personalize your experience and launch your loyalty program.
            </p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col justify-between gap-8 px-5 py-8 lg:px-12 lg:py-0">
          <div className="flex flex-1 flex-col gap-8">
            <div
              role="progressbar"
              aria-label={`Step ${CURRENT_STEP} of ${TOTAL_STEPS}`}
              aria-valuemin={1}
              aria-valuemax={TOTAL_STEPS}
              aria-valuenow={CURRENT_STEP}
              className="flex items-center gap-2"
            >
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
                const step = i + 1;
                if (step === CURRENT_STEP) {
                  return <span key={i} className="h-2 w-8 rounded-full bg-[#feb602]" />;
                }
                if (step < CURRENT_STEP) {
                  return <span key={i} className="h-2 w-2 rounded-full bg-[#44b678]" />;
                }
                return <span key={i} className="h-2 w-2 rounded-full bg-[#d7ddea]" />;
              })}
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-[24px] font-bold leading-[1.2] text-[#0a152f]">
                What type of {category.label} business do you run?
              </h1>
              <p className="text-sm text-[#737373]">
                Pick the sub-type that best describes your business. To change your category, go
                Back to the previous step.
              </p>
            </div>

            {/* Filtered card grid — matches Step 2 design */}
            <div
              role="radiogroup"
              aria-label={`${category.label} sub-types`}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            >
              {category.items.map((item) => {
                const isSel = selectedSubType === item.label;
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    role="radio"
                    aria-checked={isSel}
                    onClick={() => setSelectedSubType(item.label)}
                    className={cn(
                      "flex h-[120px] flex-col items-center justify-center gap-2 rounded-[12px] border bg-white px-2 py-3 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1f7]",
                      isSel
                        ? "border-[#feb602] shadow-[0_4px_14px_0_rgba(254,182,2,0.20)]"
                        : "border-[#d7ddea] hover:border-[#0a152f]/30",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full",
                        isSel ? "bg-[#feb602]/15" : "bg-[#eef1f7]",
                      )}
                    >
                      <Icon
                        className={cn("h-5 w-5", isSel ? "text-[#e29f00]" : "text-[#0a152f]")}
                        aria-hidden
                      />
                    </span>
                    <span className="text-[13px] font-medium leading-tight text-[#0a152f]">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div aria-live="polite" className="min-h-5 text-sm text-[#0a152f]">
              {selectedSubType ? (
                <>
                  <span className="text-[#737373]">Selected: </span>
                  <span className="font-semibold">{selectedSubType}</span>
                </>
              ) : (
                <span className="text-[#737373]">No sub-type selected yet</span>
              )}
            </div>

            {submitError && (
              <p role="alert" className="text-sm text-red-600">
                {submitError}
              </p>
            )}

            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-[20px] font-semibold text-[#0a152f] shadow-[0_1px_8px_0_rgba(0,0,0,0.08)] transition hover:bg-[#f5f7fb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a152f]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1f7]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!isValid || saving}
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-10 py-3 text-[20px] font-semibold shadow-[0_1px_8px_0_rgba(0,0,0,0.12)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1f7]",
                  !isValid || saving
                    ? "cursor-not-allowed bg-[#ffe48a] text-[#e29f00] opacity-60"
                    : "bg-[#feb602] text-white hover:bg-[#e29f00]",
                )}
              >
                {saving ? "Saving…" : "Next"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center py-2">
            <p className="text-base text-[#737373]">*Your data stays private and encrypted.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
