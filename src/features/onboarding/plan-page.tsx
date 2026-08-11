"use client";

import { Link, useNavigate, useRouterState } from "@/lib/navigation";
import * as React from "react";
import { Check, CreditCard, Calendar, Lock, User, ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAuthSupabase } from "@/integrations/supabase/auth-client";
import { OnboardingLeftPanelDecor } from "@/components/onboarding/OnboardingLeftPanelDecor";
import { BUSINESS_CATEGORIES } from "@/data/businessTypes";

const TOTAL_STEPS = 4;
const CURRENT_STEP = 4;

type PlanId = "starter" | "growth" | "premium";

type Plan = {
  id: PlanId;
  name: string;
  price: string;
  tagline: string;
  priceColor: string;
  popular?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$99",
    tagline: "Perfect for new businesses",
    priceColor: "text-[#feb602]",
  },
  {
    id: "growth",
    name: "Growth",
    price: "$299",
    tagline: "Most popular for growing businesses",
    priceColor: "text-[#44b678]",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$499",
    tagline: "For established businesses",
    priceColor: "text-[#2a3f6e]",
  },
];

function formatCardNumber(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length < 3) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

function OnboardingPlanPage() {
  const navigate = useNavigate();
  const { user, isVerified, loading } = useAuth();

  const [checking, setChecking] = React.useState(true);
  const [selectedPlan, setSelectedPlan] = React.useState<PlanId>("growth");
  const [card, setCard] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvc, setCvc] = React.useState("");
  const [cardName, setCardName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

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
      const { data } = await getAuthSupabase()
        .from("profiles")
        .select("onboarding_completed, num_locations, business_type, business_category, plan")
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
      if (!data?.business_type) {
        navigate({ to: "/onboarding/business-type", replace: true });
        return;
      }
      // Step 3 requires business_category to match a real category and
      // business_type to be one of its sub-types.
      const cat = BUSINESS_CATEGORIES.find((c) => c.label === data.business_category);
      const validSubType = cat && cat.items.some((i) => i.label === data.business_type);
      if (!cat || !validSubType) {
        navigate({ to: "/onboarding/business-category", replace: true });
        return;
      }
      if (data.plan === "starter" || data.plan === "growth" || data.plan === "premium") {
        setSelectedPlan(data.plan);
      }
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isVerified, loading, navigate]);

  const isValid =
    card.trim().length > 0 &&
    expiry.trim().length > 0 &&
    cvc.trim().length > 0 &&
    cardName.trim().length > 0;

  async function handleStart() {
    setSubmitError(null);
    if (!isValid || !user) return;
    setSaving(true);
    const { error } = await getAuthSupabase()
      .from("profiles")
      .update({ plan: selectedPlan })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setSubmitError(error.message || "Could not save. Please try again.");
      return;
    }
    navigate({ to: "/onboarding/success", state: { justCompleted: true } as never });
  }

  function handleBack() {
    navigate({ to: "/onboarding/business-category" });
  }

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef1f7] p-2 sm:p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col overflow-hidden rounded-[40px] bg-[#eef1f7] lg:min-h-[calc(100vh-3rem)] lg:flex-row lg:p-8">
        {/* Left panel — shared onboarding shell */}
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

        {/* Right panel */}
        <section className="flex min-w-0 flex-1 flex-col justify-between gap-8 px-5 py-8 lg:px-12 lg:py-0">
          <div className="flex flex-1 flex-col gap-8 lg:pt-0">
            {/* Progress */}
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
                Choose Your Monthly Plan
              </h1>
              <p className="text-[20px] font-normal text-[#737373]">
                All plans include a 14-day free trial
              </p>
            </div>

            {/* Plans */}
            <div
              role="radiogroup"
              aria-label="Monthly plan"
              className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3"
            >
              {PLANS.map((plan) => {
                const active = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={
                      "relative flex flex-col items-center gap-4 rounded-[16px] border bg-white p-6 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1f7] " +
                      (plan.popular ? "border-[#85d5a4] " : "border-[#d7ddea] ") +
                      (active
                        ? "shadow-[0_4px_14px_0_rgba(68,182,120,0.20)]"
                        : "hover:border-[#0a152f]/30")
                    }
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#44b678] px-4 py-[5px] text-[14px] font-bold text-white">
                        Most Popular
                      </span>
                    )}
                    {/* Selection indicator */}
                    <span
                      aria-hidden
                      className={
                        "absolute left-6 top-6 flex h-6 w-6 items-center justify-center rounded-full border " +
                        (active ? "border-[#44b678] bg-[#effaf4]" : "border-[#b2e7c7] bg-[#effaf4]")
                      }
                    >
                      {active && <span className="h-3 w-3 rounded-full bg-[#44b678]" />}
                    </span>
                    {/* Right icon */}
                    <span aria-hidden className="absolute right-6 top-6 text-[#0a152f]">
                      <CreditCard className="h-6 w-6" />
                    </span>

                    <div className="flex flex-col items-center gap-2 pt-1">
                      <span className="text-[20px] font-semibold leading-none text-[#0a152f]">
                        {plan.name}
                      </span>
                      <span className="min-h-[28px] text-[12px] font-normal text-[#525252]">
                        {plan.tagline}
                      </span>
                    </div>

                    <div className="flex items-end justify-center gap-1">
                      <span className={"text-[24px] font-semibold leading-none " + plan.priceColor}>
                        {plan.price}
                      </span>
                      <span className="text-[14px] font-normal text-[#737373]">/month</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Payment fields */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="card_number" className="sr-only">
                  Card number
                </label>
                <div className="flex h-[53px] items-center gap-2 rounded-[12px] border border-[#d7ddea] bg-[#fafafa] px-4 focus-within:border-[#feb602]">
                  <CreditCard className="h-4 w-4 text-[#737373]" aria-hidden />
                  <span className="h-full w-px bg-[#d7ddea]" aria-hidden />
                  <input
                    id="card_number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9010"
                    value={card}
                    onChange={(e) => setCard(formatCardNumber(e.target.value))}
                    className="flex-1 bg-transparent text-base text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex flex-1 flex-col gap-2">
                  <label htmlFor="card_expiry" className="sr-only">
                    Expiry date
                  </label>
                  <div className="flex h-[53px] items-center gap-2 rounded-[12px] border border-[#d7ddea] bg-[#fafafa] px-4 focus-within:border-[#feb602]">
                    <Calendar className="h-4 w-4 text-[#737373]" aria-hidden />
                    <span className="h-full w-px bg-[#d7ddea]" aria-hidden />
                    <input
                      id="card_expiry"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      className="flex-1 bg-transparent text-base text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <label htmlFor="card_cvc" className="sr-only">
                    CVC
                  </label>
                  <div className="flex h-[53px] items-center gap-2 rounded-[12px] border border-[#d7ddea] bg-[#fafafa] px-4 focus-within:border-[#feb602]">
                    <Lock className="h-4 w-4 text-[#737373]" aria-hidden />
                    <span className="h-full w-px bg-[#d7ddea]" aria-hidden />
                    <input
                      id="card_cvc"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="CVC"
                      maxLength={4}
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="flex-1 bg-transparent text-base text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="card_name" className="sr-only">
                  Cardholder name
                </label>
                <div className="flex h-[53px] items-center gap-2 rounded-[12px] border border-[#d7ddea] bg-[#fafafa] px-4 focus-within:border-[#feb602]">
                  <User className="h-4 w-4 text-[#737373]" aria-hidden />
                  <span className="h-full w-px bg-[#d7ddea]" aria-hidden />
                  <input
                    id="card_name"
                    autoComplete="cc-name"
                    placeholder="Cardholder name"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="flex-1 bg-transparent text-base text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-[#d7ddea]" />

            <div className="flex items-center justify-between">
              <span className="text-base font-normal text-[#737373]">Total:</span>
              <span className="text-[20px] font-bold leading-[1.2] text-[#0a152f]">$0.00</span>
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
                className="inline-flex items-center justify-center gap-1 rounded-full bg-white px-8 py-3 text-[16px] font-semibold text-[#0a152f] shadow-[0_1px_8px_0_rgba(0,0,0,0.08)] transition hover:bg-[#f5f7fb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a152f]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1f7]"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden />
                Back
              </button>
              <button
                type="button"
                onClick={handleStart}
                disabled={!isValid || saving}
                className={
                  "inline-flex items-center justify-center gap-1 rounded-full px-10 py-3 text-[16px] font-semibold shadow-[0_1px_8px_0_rgba(0,0,0,0.12)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1f7] " +
                  (!isValid || saving
                    ? "cursor-not-allowed bg-[#ffe48a] text-[#e29f00] opacity-60"
                    : "bg-[#feb602] text-white hover:bg-[#e29f00]")
                }
              >
                {saving ? "Starting…" : "Start Free Trial"}
                {!saving && <ArrowRight className="h-5 w-5" aria-hidden />}
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

export default OnboardingPlanPage;
