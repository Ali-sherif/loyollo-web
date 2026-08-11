"use client";

import { Link, useNavigate, useRouterState } from "@/lib/navigation";
import * as React from "react";
import {
  Store,
  Utensils,
  Plane,
  HeartPulse,
  Sparkles,
  Home,
  Briefcase,
  Ticket,
  GraduationCap,
  Car,
  Landmark,
  Antenna,
  Gift,
  Building2,
  HandHeart,
  PlayCircle,
  Truck,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAuthSupabase } from "@/integrations/supabase/auth-client";
import { OnboardingLeftPanelDecor } from "@/components/onboarding/OnboardingLeftPanelDecor";

const TOTAL_STEPS = 4;
const CURRENT_STEP = 2;

type BusinessType = { label: string; icon: LucideIcon };

const BUSINESS_TYPES: BusinessType[] = [
  { label: "Retail", icon: Store },
  { label: "Food & Beverage", icon: Utensils },
  { label: "Travel & Hospitality", icon: Plane },
  { label: "Health & Wellness", icon: HeartPulse },
  { label: "Beauty & Personal Care", icon: Sparkles },
  { label: "Home & Services", icon: Home },
  { label: "Professional Services", icon: Briefcase },
  { label: "Entertainment & Leisure", icon: Ticket },
  { label: "Education & Childcare", icon: GraduationCap },
  { label: "Automotive", icon: Car },
  { label: "Financial & Payment", icon: Landmark },
  { label: "Telecom & Utilities", icon: Antenna },
  { label: "Gifts, Experiences & Specialty", icon: Gift },
  { label: "B2B & Wholesale", icon: Building2 },
  { label: "Nonprofit & Community", icon: HandHeart },
  { label: "Digital & Subscriptions", icon: PlayCircle },
  { label: "Logistics & Delivery", icon: Truck },
  { label: "Others", icon: MoreHorizontal },
];

function BusinessTypePage() {
  const navigate = useNavigate();
  const { user, isVerified, loading } = useAuth();

  const [selected, setSelected] = React.useState<string>("");
  const [otherText, setOtherText] = React.useState<string>("");
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
      const { data } = await getAuthSupabase()
        .from("profiles")
        .select("onboarding_completed, num_locations, business_type, business_category")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.onboarding_completed) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      // Require step 1 to be completed first.
      if (!data?.num_locations) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      // Prefer business_category when step 3 has already run (business_type
      // then holds a sub-type). Otherwise use business_type from step 2.
      const topLevel = data.business_category ?? data.business_type;
      if (topLevel) {
        const match = BUSINESS_TYPES.find((b) => b.label === topLevel);
        if (match && match.label !== "Others") {
          setSelected(match.label);
        } else {
          setSelected("Others");
          setOtherText(topLevel);
        }
      }
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isVerified, loading, navigate]);

  const isOther = selected === "Others";
  const trimmedOther = otherText.trim();
  const isValid = selected.length > 0 && (!isOther || trimmedOther.length > 0);

  async function handleNext() {
    setSubmitError(null);
    if (!isValid || !user) return;
    const valueToSave = isOther ? trimmedOther : selected;
    setSaving(true);
    const { error } = await getAuthSupabase()
      .from("profiles")
      .update({ business_type: valueToSave, business_category: null })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setSubmitError(error.message || "Could not save. Please try again.");
      return;
    }
    navigate({ to: "/onboarding/business-category" });
  }

  function handleBack() {
    navigate({ to: "/onboarding" });
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
        {/* Left panel — reused from step 1 */}
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

            <h1 className="text-[24px] font-bold leading-[1.2] text-[#0a152f]">
              Select Your Business Type
            </h1>

            <div
              role="radiogroup"
              aria-label="Business type"
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            >
              {BUSINESS_TYPES.map((bt) => {
                const active = selected === bt.label;
                const Icon = bt.icon;
                return (
                  <button
                    key={bt.label}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelected(bt.label)}
                    className={
                      "flex h-[120px] flex-col items-center justify-center gap-2 rounded-[12px] border bg-white px-2 py-3 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1f7] " +
                      (active
                        ? "border-[#feb602] shadow-[0_4px_14px_0_rgba(254,182,2,0.20)]"
                        : "border-[#d7ddea] hover:border-[#0a152f]/30")
                    }
                  >
                    <span
                      className={
                        "flex h-11 w-11 items-center justify-center rounded-full " +
                        (active ? "bg-[#feb602]/15" : "bg-[#eef1f7]")
                      }
                    >
                      <Icon
                        className={"h-5 w-5 " + (active ? "text-[#e29f00]" : "text-[#0a152f]")}
                        aria-hidden
                      />
                    </span>
                    <span className="text-[13px] font-medium leading-tight text-[#0a152f]">
                      {bt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {isOther && (
              <div className="flex flex-col gap-1">
                <label htmlFor="business_type_other" className="text-sm font-medium text-[#0a152f]">
                  Tell us about your business category
                </label>
                <input
                  id="business_type_other"
                  type="text"
                  autoFocus
                  maxLength={80}
                  placeholder="e.g. Pet grooming, Art studio, Coworking space"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  className="h-[53px] rounded-[12px] border border-[#d7ddea] bg-[#fafafa] px-4 text-base text-[#0a152f] placeholder:text-[#a3a3a3] focus:border-[#feb602] focus:outline-none"
                />
              </div>
            )}

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
                className={
                  "inline-flex items-center justify-center rounded-full px-10 py-3 text-[20px] font-semibold shadow-[0_1px_8px_0_rgba(0,0,0,0.12)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1f7] " +
                  (!isValid || saving
                    ? "cursor-not-allowed bg-[#ffe48a] text-[#e29f00] opacity-60"
                    : "bg-[#feb602] text-white hover:bg-[#e29f00]")
                }
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

export default BusinessTypePage;
