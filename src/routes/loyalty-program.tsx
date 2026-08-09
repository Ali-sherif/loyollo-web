import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  Coins,
  MapPin,
  Crown,
  Check,
  QrCode,
  Download,
  Printer,
  Share2,
  Loader2,
  Coins as CoinsIcon,
  Gift as GiftIcon,
  Activity,
  Stamp,
  Layers,
  Clock,
  Users,
  CheckCircle2,
  Crown as CrownIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { type Tier } from "@/components/loyalty/TierSection";
import { TierBasedFlow } from "@/components/loyalty/TierBasedFlow";
import { VisitsProgressSection } from "@/components/loyalty/VisitsProgressSection";
import { RewardsSection } from "@/components/loyalty/RewardsSection";
import { ReferralsSection } from "@/components/loyalty/ReferralsSection";
import { QRExperienceSection } from "@/components/loyalty/QRExperienceSection";
import { StampCardPreview, rewardLabel } from "@/components/loyalty/StampCardPreview";

type ProgramType = "points" | "visit" | "tier";
type Tab = "programs" | "rewards" | "referrals" | "qr-experience";

function validateLoyaltySearch(search: Record<string, unknown>): { tab: Tab } {
  const raw = typeof search.tab === "string" ? search.tab : "programs";
  const valid: Tab[] = ["programs", "rewards", "referrals", "qr-experience"];
  return { tab: valid.includes(raw as Tab) ? (raw as Tab) : "programs" };
}

export const Route = createFileRoute("/loyalty-program")({
  head: () => ({
    meta: [
      { title: "Loyalty Program — Loyalty" },
      {
        name: "description",
        content:
          "Create and manage loyalty programs that keep customers engaged and coming back.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: validateLoyaltySearch,
  component: LoyaltyProgramPage,
});

const PROGRAM_TYPES: {
  id: ProgramType;
  title: string;
  description: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "points",
    title: "Points System",
    description: "Customers earn points based on how much they spend.",
    hint: "Spend $1 → Earn 1 point",
    icon: Coins,
  },
  {
    id: "visit",
    title: "Visit Based",
    description: "Reward customers after a set number of visits.",
    hint: "5 visits → 1 free reward",
    icon: MapPin,
  },
  {
    id: "tier",
    title: "Tier Based",
    description: "Unlock Silver, Gold, and VIP levels with growing perks.",
    hint: "Silver → Gold → VIP",
    icon: Crown,
  },
];

function LoyaltyProgramPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { user, isVerified, loading, signOut } = useAuth();
  const { tab } = Route.useSearch();

  const [firstName, setFirstName] = React.useState("");
  const [businessName, setBusinessName] = React.useState("");
  const [ready, setReady] = React.useState(false);

  // form state
  const [programType, setProgramType] = React.useState<ProgramType>("points");
  const [spendAmount, setSpendAmount] = React.useState("");
  const [pointsEarned, setPointsEarned] = React.useState("");
  const [minSpend, setMinSpend] = React.useState("");
  const [pointsExpiry, setPointsExpiry] = React.useState("");
  const [gracePeriod, setGracePeriod] = React.useState("");
  const [bonusSignup, setBonusSignup] = React.useState(false);
  const [doubleBirthdays, setDoubleBirthdays] = React.useState(false);

  // Visit-based state
  const [visitsRequired, setVisitsRequired] = React.useState("");
  const [rewardOnCompletion, setRewardOnCompletion] = React.useState("");
  const [minSpendPerVisit, setMinSpendPerVisit] = React.useState("");
  const [cardExpiryDays, setCardExpiryDays] = React.useState("");
  const [maxVisitsPerDay, setMaxVisitsPerDay] = React.useState("");
  const [afterRewardAction, setAfterRewardAction] = React.useState("");
  const [bonusStampSignup, setBonusStampSignup] = React.useState(false);
  const [doubleStampWeekends, setDoubleStampWeekends] = React.useState(false);
  const [notifyOneVisitAway, setNotifyOneVisitAway] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [programId, setProgramId] = React.useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [totalScans, setTotalScans] = React.useState(0);
  const [scansThisWeek, setScansThisWeek] = React.useState(0);

  // Visit-based stats (wired to state so they update when tracking exists).
  const [stampsIssuedThisMonth, setStampsIssuedThisMonth] = React.useState(0);
  const [cardsCompleted, setCardsCompleted] = React.useState(0);
  const [customersOneVisitAway, setCustomersOneVisitAway] = React.useState(0);

  // Tier-based state
  const [tierMeasuredBy, setTierMeasuredBy] = React.useState("points");
  const [tierResetPeriod, setTierResetPeriod] = React.useState("never");
  const [notifyTierUpgrade, setNotifyTierUpgrade] = React.useState(true);
  const [tierDowngradeProtection, setTierDowngradeProtection] = React.useState(false);
  const [tiers, setTiers] = React.useState<Tier[]>([]);

  const reloadTiers = React.useCallback(async () => {
    if (!programId) {
      setTiers([]);
      return;
    }
    const { data } = await supabase
      .from("loyalty_program_tiers")
      .select("*")
      .eq("loyalty_program_id", programId)
      .order("points_threshold", { ascending: true });
    setTiers((data ?? []) as Tier[]);
  }, [programId]);

  React.useEffect(() => {
    void reloadTiers();
  }, [reloadTiers]);

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
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, business_name, onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile?.onboarding_completed) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      const full = (profile?.full_name as string | null)?.trim() ?? "";
      setFirstName(full.split(/\s+/)[0] || (user.email?.split("@")[0] ?? ""));
      setBusinessName((profile?.business_name as string | null)?.trim() ?? "");

      // If a program already exists, this is the management view.
      // TODO(feature): dedicated management/overview screen (out of scope here).
      // For now we prefill the form with the existing values so the same page
      // acts as both create and edit.
      const { data: existing } = await supabase
        .from("loyalty_programs")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (existing) {
        setProgramId(existing.id as string);
        setProgramType(existing.program_type as ProgramType);
        setSpendAmount(String(existing.spend_amount ?? ""));
        setPointsEarned(String(existing.points_earned ?? ""));
        setMinSpend(String(existing.minimum_spend ?? ""));
        setPointsExpiry(String(existing.points_expiry_months ?? ""));
        setGracePeriod(String(existing.grace_period_months ?? ""));
        setBonusSignup(!!existing.bonus_signup_points);
        setDoubleBirthdays(!!existing.double_points_birthdays);
        setVisitsRequired(existing.visits_required ? String(existing.visits_required) : "");
        setRewardOnCompletion((existing.reward_on_completion as string | null) ?? "");
        setMinSpendPerVisit(existing.min_spend_per_visit ? String(existing.min_spend_per_visit) : "");
        setCardExpiryDays(existing.card_expiry_days ? String(existing.card_expiry_days) : "");
        setMaxVisitsPerDay(existing.max_visits_per_day ? String(existing.max_visits_per_day) : "");
        setAfterRewardAction((existing.after_reward_action as string | null) ?? "");
        setBonusStampSignup(!!existing.bonus_stamp_signup);
        setDoubleStampWeekends(!!existing.double_stamp_weekends);
        setNotifyOneVisitAway(!!existing.notify_one_visit_away);
        const ex = existing as unknown as Record<string, unknown>;
        setTierMeasuredBy((ex.tier_measured_by as string | null) || "points");
        setTierResetPeriod((ex.tier_reset_period as string | null) || "never");
        setNotifyTierUpgrade(ex.notify_tier_upgrade === undefined ? true : !!ex.notify_tier_upgrade);
        setTierDowngradeProtection(!!ex.tier_downgrade_protection);
      }
      setReady(true);
    })();
  }, [user, isVerified, loading, navigate]);

  // Generate QR whenever we have a program id.
  React.useEffect(() => {
    if (!programId) {
      setQrDataUrl(null);
      return;
    }
    const url = `${window.location.origin}/join/${programId}`;
    QRCode.toDataURL(url, { width: 512, margin: 1, color: { dark: "#0a152f", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [programId]);

  // Scan analytics are wired to state (not static markup) so they'll reflect
  // real numbers once a scans/enrollments table exists. Until then, the query
  // returns 0/0 for every program.
  React.useEffect(() => {
    if (!programId) {
      setTotalScans(0);
      setScansThisWeek(0);
      return;
    }
    // TODO(feature): replace with real supabase count() against a scans table.
    setTotalScans(0);
    setScansThisWeek(0);
  }, [programId]);

  // Visit analytics are wired to state so they reflect real numbers once
  // a customer enrollment / stamp-tracking system exists. Until then, the
  // query returns 0 for every metric.
  React.useEffect(() => {
    if (!programId) {
      setStampsIssuedThisMonth(0);
      setCardsCompleted(0);
      setCustomersOneVisitAway(0);
      return;
    }
    // TODO(feature): replace with real supabase queries:
    //   - stampsIssuedThisMonth: count stamps created this month for this program
    //   - cardsCompleted: count customers where stamps_earned >= visits_required
    //   - customersOneVisitAway: count customers where stamps_earned === visits_required - 1
    setStampsIssuedThisMonth(0);
    setCardsCompleted(0);
    setCustomersOneVisitAway(0);
  }, [programId]);

  const joinUrl = React.useMemo(
    () => (programId ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${programId}` : ""),
    [programId],
  );

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (programType === "points") {
      if (!spendAmount || Number(spendAmount) <= 0)
        next.spendAmount = "Enter a spend amount greater than 0.";
      if (!pointsEarned || Number(pointsEarned) <= 0)
        next.pointsEarned = "Enter points earned per spend.";
      if (minSpend !== "" && Number(minSpend) < 0)
        next.minSpend = "Minimum spend can't be negative.";
      if (pointsExpiry !== "" && Number(pointsExpiry) < 0)
        next.pointsExpiry = "Expiry can't be negative.";
      if (gracePeriod !== "" && Number(gracePeriod) < 0)
        next.gracePeriod = "Grace period can't be negative.";
    } else if (programType === "visit") {
      if (!visitsRequired || Number(visitsRequired) <= 0)
        next.visitsRequired = "Enter the number of visits required.";
      if (!rewardOnCompletion.trim())
        next.rewardOnCompletion = "Choose a reward on completion.";
      if (minSpendPerVisit !== "" && Number(minSpendPerVisit) < 0)
        next.minSpendPerVisit = "Minimum spend can't be negative.";
      if (cardExpiryDays !== "" && Number(cardExpiryDays) < 0)
        next.cardExpiryDays = "Card expiry can't be negative.";
      if (maxVisitsPerDay !== "" && Number(maxVisitsPerDay) < 0)
        next.maxVisitsPerDay = "Max visits can't be negative.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const canSubmit =
    programType === "points"
      ? spendAmount !== "" &&
        Number(spendAmount) > 0 &&
        pointsEarned !== "" &&
        Number(pointsEarned) > 0
      : programType === "visit"
        ? visitsRequired !== "" &&
          Number(visitsRequired) > 0 &&
          rewardOnCompletion.trim() !== ""
        : true;

  function buildProgramPayload() {
    if (!user) return null;
    const isPoints = programType === "points";
    const isVisit = programType === "visit";
    const isTier = programType === "tier";
    return {
      owner_id: user.id,
      program_type: programType,
      // points-only columns
      spend_amount: isPoints ? Number(spendAmount || 0) : 0,
      points_earned: isPoints ? Math.floor(Number(pointsEarned || 0)) : 0,
      minimum_spend: isPoints ? Number(minSpend || 0) : 0,
      points_expiry_months: isPoints ? Math.floor(Number(pointsExpiry || 0)) : 0,
      grace_period_months: isPoints ? Math.floor(Number(gracePeriod || 0)) : 0,
      bonus_signup_points: isPoints ? bonusSignup : false,
      double_points_birthdays: isPoints ? doubleBirthdays : false,
      // visit-only columns
      visits_required: isVisit ? Math.floor(Number(visitsRequired || 0)) : 0,
      reward_on_completion: isVisit ? rewardOnCompletion.trim() || null : null,
      min_spend_per_visit: isVisit ? Number(minSpendPerVisit || 0) : 0,
      card_expiry_days: isVisit ? Math.floor(Number(cardExpiryDays || 0)) : 0,
      max_visits_per_day: isVisit ? Math.floor(Number(maxVisitsPerDay || 0)) : 0,
      after_reward_action: isVisit ? afterRewardAction || null : null,
      bonus_stamp_signup: isVisit ? bonusStampSignup : false,
      double_stamp_weekends: isVisit ? doubleStampWeekends : false,
      notify_one_visit_away: isVisit ? notifyOneVisitAway : false,
      // tier-only columns
      tier_measured_by: isTier ? tierMeasuredBy : null,
      tier_reset_period: isTier ? tierResetPeriod : null,
      notify_tier_upgrade: isTier ? notifyTierUpgrade : false,
      tier_downgrade_protection: isTier ? tierDowngradeProtection : false,
    };
  }

  // Auto-save a minimal tier-based program so selecting a template or creating
  // a custom tier can transition directly to Screen 2 without a manual save.
  const ensureProgramSaved = React.useCallback(async (): Promise<string | null> => {
    if (programId) return programId;
    if (!user) return null;
    const payload = {
      owner_id: user.id,
      program_type: "tier" as const,
      spend_amount: 0,
      points_earned: 0,
      minimum_spend: 0,
      points_expiry_months: 0,
      grace_period_months: 0,
      bonus_signup_points: false,
      double_points_birthdays: false,
      visits_required: 0,
      reward_on_completion: null,
      min_spend_per_visit: 0,
      card_expiry_days: 0,
      max_visits_per_day: 0,
      after_reward_action: null,
      bonus_stamp_signup: false,
      double_stamp_weekends: false,
      notify_one_visit_away: false,
      tier_measured_by: tierMeasuredBy,
      tier_reset_period: tierResetPeriod,
      notify_tier_upgrade: notifyTierUpgrade,
      tier_downgrade_protection: tierDowngradeProtection,
    };
    const { data, error } = await supabase
      .from("loyalty_programs")
      .upsert(payload as never, { onConflict: "owner_id" })
      .select("id")
      .single();
    if (error || !data) {
      toast.error(error?.message || "Couldn't save program");
      return null;
    }
    setProgramId(data.id as string);
    return data.id as string;
  }, [programId, user, tierMeasuredBy, tierResetPeriod, notifyTierUpgrade, tierDowngradeProtection]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!user) return;
    if (!validate()) return;
    setSaving(true);
    const payload = buildProgramPayload();
    if (!payload) {
      setSaving(false);
      return;
    }
    const { data, error } = await supabase
      .from("loyalty_programs")
      .upsert(payload as never, { onConflict: "owner_id" })
      .select("id")
      .single();
    setSaving(false);
    if (error || !data) {
      setFormError(error?.message || "Something went wrong. Please try again.");
      return;
    }
    const isFirstTime = !programId;
    setProgramId(data.id as string);
    if (isFirstTime) {
      toast.success("Your QR code is ready", {
        description: "Download or share it to start collecting customers.",
      });
    } else {
      toast.success("Program updated");
    }
    navigate({ to: "/dashboard" });
  }

  async function handleDownloadPng() {
    if (!qrDataUrl || !programId) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `loyalty-qr-${programId}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function handlePrintPdf() {
    if (!qrDataUrl) return;
    const w = window.open("", "_blank", "width=600,height=700");
    if (!w) {
      toast.error("Enable pop-ups to print your QR code.");
      return;
    }
    w.document.write(`<!doctype html><html><head><title>Loyalty QR</title>
<style>body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:32px;}img{width:320px;height:320px;}p{margin-top:16px;color:#525252;font-size:14px;word-break:break-all;text-align:center;}</style>
</head><body><img src="${qrDataUrl}" alt="Loyalty QR"/><p>${joinUrl}</p>
<script>window.onload=function(){setTimeout(function(){window.print();},200);}</script>
</body></html>`);
    w.document.close();
  }

  async function handleShare() {
    if (!joinUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join our loyalty program",
          text: "Scan or tap to join and start earning rewards.",
          url: joinUrl,
        });
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }


  if (loading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardShell firstName={firstName} onSignOut={signOut}>
      <div className="mx-auto max-w-[1140px]">
        {/* Title */}
        <div className="pt-2">
          <h1 className="text-[20px] font-bold leading-[1.2] text-[#0a152f]">
            Loyalty Program
          </h1>
          <p className="mt-2 text-[14px] leading-[1.4] text-[#525252]">
            Create and manage loyalty programs that keep customers engaged and coming back.
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-6 inline-flex items-center gap-1 rounded-[12px] bg-white p-1 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
          <TabButton
            active={tab === "programs"}
            onClick={() => navigate({ search: { tab: "programs" } })}
          >
            Programs
          </TabButton>
          <TabButton
            active={tab === "rewards"}
            onClick={() => navigate({ search: { tab: "rewards" } })}
          >
            Rewards
          </TabButton>
          <TabButton
            active={tab === "referrals"}
            onClick={() => navigate({ search: { tab: "referrals" } })}
          >
            Referrals
          </TabButton>
          <TabButton
            active={tab === "qr-experience"}
            onClick={() => navigate({ search: { tab: "qr-experience" } })}
          >
            QR Experience
          </TabButton>
        </div>

        {tab === "rewards" ? (
          <div className="mt-6">
            <RewardsSection
              programId={programId}
              ensureProgramSaved={ensureProgramSaved}
            />
          </div>
        ) : tab === "referrals" ? (
          <div className="mt-6">
            <ReferralsSection
              programId={programId}
              ensureProgramSaved={ensureProgramSaved}
            />
          </div>
        ) : tab === "qr-experience" ? (
          <div className="mt-6">
            <QRExperienceSection
              programId={programId}
              ensureProgramSaved={ensureProgramSaved}
              programConfig={{
                program_type: programType,
                spend_amount: Number(spendAmount) || 0,
                points_earned: Number(pointsEarned) || 0,
                visits_required: Number(visitsRequired) || 0,
                reward_on_completion: rewardOnCompletion || null,
                business_name: businessName,
              }}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6" noValidate>
            {/* Program type */}
            <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
              <h2 className="text-[16px] font-semibold text-[#0a152f]">Program type</h2>
              <p className="mt-1 text-[14px] text-[#737373]">
                Choose how customers earn rewards. You can change this anytime.
              </p>

              <div
                role="radiogroup"
                aria-label="Program type"
                className="mt-5 grid gap-4 md:grid-cols-3"
              >
                {PROGRAM_TYPES.map((t) => {
                  const selected = programType === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      key={t.id}
                      onClick={() => setProgramType(t.id)}
                      className={`rounded-[12px] border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 ${
                        selected
                          ? "border-[#44b678] bg-[#effaf4] shadow-[0_1px_3px_rgba(10,13,18,0.08)]"
                          : "border-[#d7ddea] bg-white hover:border-[#8698bb]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="flex h-6 w-6 items-center justify-center text-[#344f89]">
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            selected
                              ? "border-[#44b678] bg-[#44b678]"
                              : "border-[#d4d4d4] bg-white"
                          }`}
                          aria-hidden
                        >
                          {selected && (
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          )}
                        </span>
                      </div>
                      <p className="mt-4 text-[16px] font-semibold text-[#0a152f]">
                        {t.title}
                      </p>
                      <p className="mt-1 text-[13px] leading-[1.4] text-[#737373]">
                        {t.description}
                      </p>
                      <p
                        className={`mt-4 text-[13px] font-medium ${
                          selected ? "text-[#44b678]" : "text-[#8698bb]"
                        }`}
                      >
                        {t.hint}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Tier-based Screen 1 (templates picker): full-width, no right
                column and no manual Save/Cancel row. Selecting a template or
                creating a custom tier auto-saves the program and flips to
                Screen 2 (tiers.length > 0). */}
            {programType === "tier" && tiers.length === 0 ? (
              <TierBasedFlow
                programId={programId}
                tiers={tiers}
                reloadTiers={reloadTiers}
                measuredBy={tierMeasuredBy}
                setMeasuredBy={setTierMeasuredBy}
                resetPeriod={tierResetPeriod}
                setResetPeriod={setTierResetPeriod}
                notifyUpgrade={notifyTierUpgrade}
                setNotifyUpgrade={setNotifyTierUpgrade}
                downgradeProtection={tierDowngradeProtection}
                setDowngradeProtection={setTierDowngradeProtection}
                ensureProgramSaved={ensureProgramSaved}
              />
            ) : programType === "tier" ? (
              // Tier-based Screen 2: TierBasedFlow owns the layout — two-column
              // grid (rules + rightColumn) on top, Tier configuration section
              // spanning full width below.
              <>
                <TierBasedFlow
                  programId={programId}
                  tiers={tiers}
                  reloadTiers={reloadTiers}
                  measuredBy={tierMeasuredBy}
                  setMeasuredBy={setTierMeasuredBy}
                  resetPeriod={tierResetPeriod}
                  setResetPeriod={setTierResetPeriod}
                  notifyUpgrade={notifyTierUpgrade}
                  setNotifyUpgrade={setNotifyTierUpgrade}
                  downgradeProtection={tierDowngradeProtection}
                  setDowngradeProtection={setTierDowngradeProtection}
                  ensureProgramSaved={ensureProgramSaved}
                  rightColumn={
                    <>
                      <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="text-[16px] font-semibold text-[#0a152f]">QR code settings</h2>
                            <p className="mt-1 text-[14px] text-[#737373]">
                              Customers scan this to join and earn points
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 rounded-full text-[13px] font-semibold text-[#0a152f] hover:bg-[#eef1f7]"
                            asChild
                          >
                            <Link
                              to="/loyalty-program"
                              search={{ tab: "qr-experience" }}
                            >
                              Customize your QR
                            </Link>
                          </Button>
                        </div>


                        {programId && qrDataUrl ? (
                          <>
                            <div className="mt-5 flex items-start gap-4 rounded-[12px] bg-[#fafafa] p-4">
                              <img
                                src={qrDataUrl}
                                alt="Loyalty program QR code"
                                width={110}
                                height={110}
                                className="h-[110px] w-[110px] rounded-[8px] bg-white ring-1 ring-[#eef1f7]"
                              />
                              <div className="flex flex-col gap-3">
                                <Stat label="Total scans" value={String(totalScans)} />
                                <Stat label="Scans this week" value={String(scansThisWeek)} />
                              </div>
                            </div>

                            <p className="mt-3 break-all text-[12px] text-[#737373]">
                              {joinUrl}
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={handleDownloadPng}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#feb602] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e29f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
                              >
                                <Download className="h-4 w-4" aria-hidden /> Download PNG
                              </button>
                              <button
                                type="button"
                                onClick={handlePrintPdf}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#44b678] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3aa068] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#44b678]/60"
                              >
                                <Printer className="h-4 w-4" aria-hidden /> Print PDF
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={handleShare}
                              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#eef1f7] px-4 py-3 text-sm font-semibold text-[#0a152f] transition hover:bg-[#e0e6f2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
                            >
                              <Share2 className="h-4 w-4" aria-hidden /> Share QR Code
                            </button>
                          </>
                        ) : (
                          <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed border-[#d7ddea] bg-[#fafafa] px-5 py-8 text-center">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#8698bb] ring-1 ring-[#eef1f7]">
                              <QrCode className="h-6 w-6" aria-hidden />
                            </span>
                            <p className="text-[13px] leading-[1.5] text-[#525252]">
                              Create your loyalty program to generate a QR code your customers can scan to join.
                            </p>
                          </div>
                        )}
                      </section>
                      <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
                        <h2 className="text-[16px] font-semibold text-[#0a152f]">Tier stats</h2>
                        <div className="mt-5 flex flex-col gap-3">
                          {tiers.length === 0 ? (
                            <p className="text-[13px] text-[#737373]">
                              Add tiers to start tracking distribution.
                            </p>
                          ) : (
                            tiers.map((t) => (
                              <StatCard
                                key={t.id}
                                icon={CrownIcon}
                                label={`${t.name} members`}
                                value="0"
                              />
                            ))
                          )}
                        </div>
                      </section>
                    </>
                  }
                />
                {formError && (
                  <div
                    role="alert"
                    className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-[14px] text-red-700"
                  >
                    {formError}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/dashboard" })}
                    className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0a152f] shadow-[0_1px_2px_rgba(15,28,61,0.04)] transition hover:bg-[#eef1f7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit || saving}
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(254,182,2,0.35)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                      !canSubmit || saving
                        ? "bg-[#feb602]/50 cursor-not-allowed"
                        : "bg-[#feb602] hover:bg-[#e29f00]"
                    }`}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    {saving ? "Saving…" : "Save Program"}
                  </button>
                </div>
              </>
            ) : (

            <>
            {/* Grid: rules + right column */}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_410px]">
              <div className="flex flex-col gap-6">
                {programType === "visit" ? (
                  /* Visit rules */
                  <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
                    <h2 className="text-[16px] font-semibold text-[#0a152f]">Visit rules</h2>
                    <p className="mt-1 text-[14px] text-[#737373]">
                      Define how many visits are needed and what counts as a visit.
                    </p>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <Field
                        id="visits-required"
                        label="Visits required"
                        helper="Number of stamps needed to unlock the reward"
                        error={errors.visitsRequired}
                        suffix="visit(s)"
                        value={visitsRequired}
                        onChange={setVisitsRequired}
                        placeholder="0"
                        inputMode="numeric"
                      />
                      <SelectField
                        id="reward-on-completion"
                        label="Reward on completion"
                        helper="Choose from your Rewards catalog"
                        error={errors.rewardOnCompletion}
                        value={rewardOnCompletion}
                        onChange={setRewardOnCompletion}
                        placeholder="Select Option"
                        options={[
                          { value: "free_item", label: "Free item" },
                          { value: "discount", label: "Discount" },
                          { value: "custom", label: "Custom reward" },
                        ]}
                      />
                      <Field
                        id="min-spend-per-visit"
                        label="Minimum spend per visit"
                        helper="Visits below this amount won't count toward a stamp"
                        error={errors.minSpendPerVisit}
                        prefix="$"
                        value={minSpendPerVisit}
                        onChange={setMinSpendPerVisit}
                        placeholder="0.00"
                        inputMode="decimal"
                      />
                      <Field
                        id="card-expiry-days"
                        label="Card expiry"
                        helper="Stamp progress resets after this many days of inactivity"
                        error={errors.cardExpiryDays}
                        suffix="day(s)"
                        value={cardExpiryDays}
                        onChange={setCardExpiryDays}
                        placeholder="0"
                        inputMode="numeric"
                      />
                      <Field
                        id="max-visits-per-day"
                        label="Max visits per day"
                        helper="Prevents multiple stamps from a single visit"
                        error={errors.maxVisitsPerDay}
                        suffix="visit(s)"
                        value={maxVisitsPerDay}
                        onChange={setMaxVisitsPerDay}
                        placeholder="0"
                        inputMode="numeric"
                      />
                      <SelectField
                        id="after-reward-action"
                        label="After reward is claimed"
                        helper="What happens once a customer redeems their reward"
                        value={afterRewardAction}
                        onChange={setAfterRewardAction}
                        placeholder="Select Option"
                        options={[
                          { value: "reset", label: "Reset the card" },
                          { value: "continue", label: "Continue earning" },
                        ]}
                      />
                    </div>

                    <hr className="my-6 border-[#eef1f7]" />

                    <ToggleRow
                      title="Bonus stamp on sign-up"
                      description="New members start with 1 stamp already filled"
                      checked={bonusStampSignup}
                      onChange={setBonusStampSignup}
                    />
                    <div className="mt-5">
                      <ToggleRow
                        title="Double stamp on weekends"
                        description="Encourage visits during slower weekend hours"
                        checked={doubleStampWeekends}
                        onChange={setDoubleStampWeekends}
                      />
                    </div>
                    <div className="mt-5">
                      <ToggleRow
                        title="Notify customer when 1 visit away"
                        description="Sends an automatic push notification or SMS"
                        checked={notifyOneVisitAway}
                        onChange={setNotifyOneVisitAway}
                      />
                    </div>
                  </section>
                ) : (
                  /* Points rules */
                  <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
                    <h2 className="text-[16px] font-semibold text-[#0a152f]">Points rules</h2>
                    <p className="mt-1 text-[14px] text-[#737373]">
                      Define how points are earned and when they expire.
                    </p>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <Field
                        id="spend-amount"
                        label="Spend amount"
                        helper="The dollar amount required to earn points"
                        error={errors.spendAmount}
                        prefix="$"
                        value={spendAmount}
                        onChange={setSpendAmount}
                        placeholder="0.00"
                        inputMode="decimal"
                      />
                      <Field
                        id="points-earned"
                        label="Points earned"
                        helper="Points awarded per spend amount"
                        error={errors.pointsEarned}
                        suffix="point(s)"
                        value={pointsEarned}
                        onChange={setPointsEarned}
                        placeholder="0"
                        inputMode="numeric"
                      />
                      <Field
                        id="min-spend"
                        label="Minimum spend to earn"
                        helper="No points awarded below this amount"
                        error={errors.minSpend}
                        prefix="$"
                        value={minSpend}
                        onChange={setMinSpend}
                        placeholder="0.00"
                        inputMode="decimal"
                      />
                      <Field
                        id="points-expiry"
                        label="Points expiry"
                        helper="Points expire after inactivity period"
                        error={errors.pointsExpiry}
                        suffix="month(s)"
                        value={pointsExpiry}
                        onChange={setPointsExpiry}
                        placeholder="0"
                        inputMode="numeric"
                      />
                      <div className="sm:col-span-2 sm:max-w-[calc(50%-10px)]">
                        <Field
                          id="grace-period"
                          label={
                            <>
                              Grace Period{" "}
                              <span className="font-normal italic text-[#737373]">(Optional)</span>
                            </>
                          }
                          helper="Number of days customers can still redeem their points after they expire."
                          error={errors.gracePeriod}
                          suffix="month(s)"
                          value={gracePeriod}
                          onChange={setGracePeriod}
                          placeholder="0"
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    <hr className="my-6 border-[#eef1f7]" />

                    <ToggleRow
                      title="Bonus points on sign-up"
                      description="Give new members a welcome point boost"
                      checked={bonusSignup}
                      onChange={setBonusSignup}
                    />
                    <div className="mt-5">
                      <ToggleRow
                        title="Double points on birthdays"
                        description="Automatically applied during their birthday month"
                        checked={doubleBirthdays}
                        onChange={setDoubleBirthdays}
                      />
                    </div>
                  </section>
                )}

                {programType === "visit" ? (
                  <VisitsProgressSection
                    programId={programId}
                    visitsRequired={Number(visitsRequired) || 0}
                  />
                ) : null}
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-6">
                <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-[16px] font-semibold text-[#0a152f]">QR code settings</h2>
                      <p className="mt-1 text-[14px] text-[#737373]">
                        Customers scan this to join and earn points
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-full text-[13px] font-semibold text-[#0a152f] hover:bg-[#eef1f7]"
                      asChild
                    >
                      <Link
                        to="/loyalty-program"
                        search={{ tab: "qr-experience" }}
                      >
                        Customize your QR
                      </Link>
                    </Button>
                  </div>


                  {programId && qrDataUrl ? (
                    <>
                      <div className="mt-5 flex items-start gap-4 rounded-[12px] bg-[#fafafa] p-4">
                        <img
                          src={qrDataUrl}
                          alt="Loyalty program QR code"
                          width={110}
                          height={110}
                          className="h-[110px] w-[110px] rounded-[8px] bg-white ring-1 ring-[#eef1f7]"
                        />
                        <div className="flex flex-col gap-3">
                          <Stat label="Total scans" value={String(totalScans)} />
                          <Stat label="Scans this week" value={String(scansThisWeek)} />
                        </div>
                      </div>

                      <p className="mt-3 break-all text-[12px] text-[#737373]">
                        {joinUrl}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={handleDownloadPng}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#feb602] px-4 py-3 text-sm font-semibold text-[#0a152f] transition hover:bg-[#e29f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
                        >
                          <Download className="h-4 w-4 text-[#0a152f]" aria-hidden /> Download PNG
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintPdf}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#44b678] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3aa068] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#44b678]/60"
                        >
                          <Printer className="h-4 w-4" aria-hidden /> Print PDF
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleShare}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#eef1f7] px-4 py-3 text-sm font-semibold text-[#0a152f] transition hover:bg-[#e0e6f2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
                      >
                        <Share2 className="h-4 w-4" aria-hidden /> Share QR Code
                      </button>
                    </>
                  ) : (
                    <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed border-[#d7ddea] bg-[#fafafa] px-5 py-8 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#8698bb] ring-1 ring-[#eef1f7]">
                        <QrCode className="h-6 w-6" aria-hidden />
                      </span>
                      <p className="text-[13px] leading-[1.5] text-[#525252]">
                        Create your loyalty program to generate a QR code your customers can scan to join.
                      </p>
                    </div>
                  )}
                </section>

                {programType === "visit" ? (
                  <StampCardPreview
                    businessName={businessName}
                    visitsRequired={Number(visitsRequired) || 0}
                    rewardDescription={rewardLabel(rewardOnCompletion)}
                  />
                ) : null}

                {programType === "visit" ? (
                  <>
                    <VisitStatsPanel
                      stampsIssued={stampsIssuedThisMonth}
                      cardsCompleted={cardsCompleted}
                      customersOneVisitAway={customersOneVisitAway}
                    />
                    <CompletionFunnelPanel />
                  </>
                ) : (
                  <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
                    <h2 className="text-[16px] font-semibold text-[#0a152f]">Program stats</h2>
                    <div className="mt-5 flex flex-col gap-3">
                      <StatCard icon={CoinsIcon} label="Total points issued" value="0" />
                      <StatCard icon={GiftIcon} label="Points redeemed" value="0" />
                      <StatCard icon={Activity} label="Avg. points per visit" value="0" />
                    </div>
                  </section>
                )}
              </div>
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-[14px] text-red-700"
              >
                {formError}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate({ to: "/dashboard" })}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0a152f] shadow-[0_1px_2px_rgba(15,28,61,0.04)] transition hover:bg-[#eef1f7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || saving}
                className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#0a152f] shadow-[0_4px_14px_rgba(254,182,2,0.35)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                  !canSubmit || saving
                    ? "bg-[#feb602]/50 cursor-not-allowed"
                    : "bg-[#feb602] hover:bg-[#e29f00]"
                }`}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin text-[#0a152f]" aria-hidden />}
                {saving ? "Saving…" : "Save Program"}
              </button>
            </div>
            </>
            )}
          </form>
        )}
      </div>
    </DashboardShell>
  );
}

/* ---------------- helpers ---------------- */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[8px] px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 ${
        active
          ? "bg-[#feb602] text-white"
          : "text-[#0a152f] hover:bg-[#eef1f7]"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  id,
  label,
  helper,
  error,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  inputMode,
}: {
  id: string;
  label: React.ReactNode;
  helper?: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const helperId = helper ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-medium text-[#0a152f]">
        {label}
      </label>
      <div
        className={`mt-2 flex items-center rounded-[10px] bg-[#fafafa] px-3 py-3 ring-1 transition focus-within:ring-2 focus-within:ring-[#feb602] ${
          error ? "ring-red-400" : "ring-[#eef1f7]"
        }`}
      >
        {prefix && (
          <span className="mr-2 text-[14px] text-[#737373]" aria-hidden>
            {prefix}
          </span>
        )}
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          aria-invalid={!!error}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          className="w-full bg-transparent text-[14px] text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
        />
        {suffix && (
          <>
            <span aria-hidden className="mx-2 h-4 w-px bg-[#d7ddea]" />
            <span className="text-[14px] text-[#737373]" aria-hidden>
              {suffix}
            </span>
          </>
        )}
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-[12px] text-red-600">
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className="mt-1.5 text-[12px] text-[#737373]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  id,
  label,
  helper,
  error,
  value,
  onChange,
  placeholder,
  options,
}: {
  id: string;
  label: React.ReactNode;
  helper?: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
}) {
  const helperId = helper ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-medium text-[#0a152f]">
        {label}
      </label>
      <div
        className={`mt-2 flex items-center rounded-[10px] bg-[#fafafa] px-3 py-3 ring-1 transition focus-within:ring-2 focus-within:ring-[#feb602] ${
          error ? "ring-red-400" : "ring-[#eef1f7]"
        }`}
      >
        <GiftIcon className="mr-2 h-4 w-4 text-[#8698bb]" aria-hidden />
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          className={`w-full appearance-none bg-transparent text-[14px] focus:outline-none ${
            value ? "text-[#0a152f]" : "text-[#a3a3a3]"
          }`}
        >
          <option value="" disabled>
            {placeholder ?? "Select Option"}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value} className="text-[#0a152f]">
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-[12px] text-red-600">
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className="mt-1.5 text-[12px] text-[#737373]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[#0a152f]">{title}</p>
        <p className="mt-1 text-[13px] text-[#737373]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 ${
          checked ? "bg-[#44b678]" : "bg-[#d7ddea]"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[13px] text-[#737373]">{label}</p>
      <p className="mt-1 text-[16px] font-semibold text-[#0a152f]">{value}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[12px] bg-[#fafafa] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#737373]">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#344f89]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-[20px] font-bold text-[#0a152f]">{value}</p>
    </div>
  );
}

function VisitStatsPanel({
  stampsIssued,
  cardsCompleted,
  customersOneVisitAway,
}: {
  stampsIssued: number;
  cardsCompleted: number;
  customersOneVisitAway: number;
}) {
  return (
    <section className="rounded-[12px] border border-[#d7ddea] bg-white p-5">
      <h2 className="text-[20px] font-semibold text-[#0a152f]">Visits stats</h2>
      <div className="mt-5 flex flex-col gap-3">
        <VisitStatCard
          icon={Stamp}
          label="Stamps issued this month"
          value={String(stampsIssued)}
        />
        <VisitStatCard
          icon={Layers}
          label="Cards completed"
          value={String(cardsCompleted)}
        />
        <VisitStatCard
          icon={Clock}
          label="Customers 1 visit away"
          value={String(customersOneVisitAway)}
        />
      </div>
    </section>
  );
}

function VisitStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[12px] border border-[#d7ddea] bg-white p-4">
      <div className="flex items-center gap-4">
        <p className="flex-1 text-[14px] text-[#737373]">{label}</p>
        <Icon className="h-6 w-6 shrink-0 text-[#feb602]" aria-hidden />
      </div>
      <p className="mt-3 text-[20px] font-semibold text-[#0a152f]">{value}</p>
    </div>
  );
}

/**
 * Completion funnel — visit-based only.
 *
 * TODO(feature): wire each metric to real queries once the customer
 * enrollment / stamp-tracking tables exist. Suggested sources:
 *  - customersOnCard: count of enrolled customers with an active card
 *      for this loyalty_program_id
 *  - reachedOneStamp: count where stamps_earned >= 1
 *  - completedFullCard: count where stamps_earned >= visits_required
 *  - redeemedReward: count of reward redemptions for this program
 */
function CompletionFunnelPanel() {
  // TODO(feature): replace with real queries; keep as state so it isn't
  // hardcoded "0" text in markup.
  const [customersOnCard] = React.useState(0);
  const [reachedOneStamp] = React.useState(0);
  const [completedFullCard] = React.useState(0);
  const [redeemedReward] = React.useState(0);

  return (
    <section className="flex flex-col gap-6 rounded-[12px] border border-[#d7ddea] bg-white p-5">
      <h2 className="text-[20px] font-semibold leading-none text-[#0a152f]">
        Completion funnel
      </h2>
      <div className="flex flex-col gap-3">
        <FunnelStatCard icon={Users} label="Customers on card" value={customersOnCard} />
        <FunnelStatCard icon={Stamp} label="Reached 1+ stamps" value={reachedOneStamp} />
        <FunnelStatCard icon={CheckCircle2} label="Completed full card" value={completedFullCard} />
        <FunnelStatCard icon={GiftIcon} label="Redeemed reward" value={redeemedReward} />
      </div>
    </section>
  );
}

function FunnelStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[12px] border border-[#d7ddea] bg-white p-4">
      <div className="flex items-center gap-4">
        <p className="flex-1 text-[14px] text-[#737373]">{label}</p>
        <Icon className="h-6 w-6 shrink-0 text-[#44b678]" aria-hidden />
      </div>
      <p className="text-[20px] font-semibold leading-none text-[#0a152f]">
        {value}
      </p>
    </div>
  );
}

