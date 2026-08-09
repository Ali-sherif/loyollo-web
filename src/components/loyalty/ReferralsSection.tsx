import * as React from "react";
import { toast } from "sonner";
import {
  UserPlus,
  UserRoundPlus,
  Download,
  Loader2,
  Link2,
  ArrowDown,
  ShoppingBag,
  Gift,
  CircleHelp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Settings = {
  id: string;
  loyalty_program_id: string;
  enabled: boolean;
  referrer_bonus_points: number;
  new_customer_discount_pct: number;
};

// TODO(feature): replace with real data once referral tracking exists
// (referrer customer, referred customer, redeemed points, etc.).
type TopReferrer = {
  rank: number;
  initials: string;
  name: string;
  email: string;
  referrals: number;
  rewardPoints: number;
};

const TOP_REFERRERS: TopReferrer[] = [];

type Props = {
  programId: string | null;
  ensureProgramSaved: () => Promise<string | null>;
};

const DEFAULTS = { referrer_bonus_points: 300, new_customer_discount_pct: 15 };

export function ReferralsSection({ programId, ensureProgramSaved }: Props) {
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [enabled, setEnabled] = React.useState(true);
  const [bonusPoints, setBonusPoints] = React.useState<string>(
    String(DEFAULTS.referrer_bonus_points),
  );
  const [discountPct, setDiscountPct] = React.useState<string>(
    String(DEFAULTS.new_customer_discount_pct),
  );
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState<null | "toggle" | "bonus" | "discount">(null);
  const [howItWorksOpen, setHowItWorksOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!programId) {
      setSettings(null);
      setEnabled(true);
      setBonusPoints(String(DEFAULTS.referrer_bonus_points));
      setDiscountPct(String(DEFAULTS.new_customer_discount_pct));
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("referral_settings")
      .select("*")
      .eq("loyalty_program_id", programId)
      .maybeSingle();
    setLoading(false);
    if (error) {
      toast.error("Couldn't load referral settings");
      return;
    }
    if (data) {
      const s = data as Settings;
      setSettings(s);
      setEnabled(s.enabled);
      setBonusPoints(String(s.referrer_bonus_points));
      setDiscountPct(String(s.new_customer_discount_pct));
    }
  }, [programId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function persist(
    patch: Partial<Pick<Settings, "enabled" | "referrer_bonus_points" | "new_customer_discount_pct">>,
    kind: "toggle" | "bonus" | "discount",
  ) {
    const pid = await ensureProgramSaved();
    if (!pid) return;
    setSaving(kind);
    if (settings) {
      const { data, error } = await supabase
        .from("referral_settings")
        .update(patch)
        .eq("id", settings.id)
        .select("*")
        .single();
      setSaving(null);
      if (error || !data) {
        toast.error(error?.message || "Couldn't save changes");
        return;
      }
      setSettings(data as Settings);
    } else {
      const insertPayload = {
        loyalty_program_id: pid,
        enabled: patch.enabled ?? enabled,
        referrer_bonus_points:
          patch.referrer_bonus_points ?? (Number(bonusPoints) || DEFAULTS.referrer_bonus_points),
        new_customer_discount_pct:
          patch.new_customer_discount_pct ??
          (Number(discountPct) || DEFAULTS.new_customer_discount_pct),
      };
      const { data, error } = await supabase
        .from("referral_settings")
        .insert(insertPayload)
        .select("*")
        .single();
      setSaving(null);
      if (error || !data) {
        toast.error(error?.message || "Couldn't save changes");
        return;
      }
      setSettings(data as Settings);
    }
    toast.success("Referral settings saved");
  }

  function handleToggle(next: boolean) {
    setEnabled(next);
    void persist({ enabled: next }, "toggle");
  }

  function handleBonusBlur() {
    const n = Math.max(0, Math.floor(Number(bonusPoints || 0)));
    setBonusPoints(String(n));
    if (settings && n === settings.referrer_bonus_points) return;
    void persist({ referrer_bonus_points: n }, "bonus");
  }

  function handleDiscountBlur() {
    let n = Math.max(0, Math.floor(Number(discountPct || 0)));
    if (n > 100) n = 100;
    setDiscountPct(String(n));
    if (settings && n === settings.new_customer_discount_pct) return;
    void persist({ new_customer_discount_pct: n }, "discount");
  }

  async function exportCsv() {
    if (TOP_REFERRERS.length === 0) {
      toast.info("No referrers yet to export.");
      return;
    }
    const rows = [
      ["Rank", "Customer", "Email", "Referrals", "Reward Earned (pts)"],
      ...TOP_REFERRERS.map((r) => [r.rank, r.name, r.email, r.referrals, r.rewardPoints]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "top-referrers.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Referral Rewards config */}
      <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-bold leading-[1.2] text-[#0a152f]">
              Referral Rewards
            </h2>
            <p className="mt-1 text-[14px] text-[#525252]">
              Reward customers for bringing their friends
            </p>
            <button
              type="button"
              onClick={() => setHowItWorksOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#344f89] transition hover:text-[#0a152f]"
            >
              <CircleHelp className="h-4 w-4" aria-hidden />
              How it works
            </button>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Enable referral rewards"
            disabled={loading || saving === "toggle"}
            onClick={() => handleToggle(!enabled)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              enabled ? "bg-[#44b678]" : "bg-[#d7ddea]"
            } disabled:opacity-60`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                enabled ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        <div
          className={`mt-5 grid gap-4 md:grid-cols-2 ${
            enabled ? "" : "pointer-events-none opacity-60"
          }`}
        >
          {/* Referrer card */}
          <div className="rounded-[12px] border border-[#e5e5e5] p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef1f7] text-[#344f89]">
              <UserPlus className="h-4 w-4" aria-hidden />
            </div>
            <h3 className="mt-3 text-[16px] font-semibold text-[#0a152f]">
              Reward for the referrer
            </h3>
            <p className="mt-1 text-[13px] text-[#737373]">
              Given to the existing customer who shares
            </p>
            <label className="mt-4 block text-[13px] font-medium text-[#424242]">
              Bonus points
            </label>
            <div className="mt-1 flex h-11 items-center rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] px-3 focus-within:border-[#feb602]">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={bonusPoints}
                onChange={(e) => setBonusPoints(e.target.value)}
                onBlur={handleBonusBlur}
                disabled={!enabled || saving === "bonus"}
                className="h-full flex-1 bg-transparent text-[14px] text-[#0a152f] outline-none"
              />
              <span className="pl-2 text-[13px] text-[#737373]">point(s)</span>
              {saving === "bonus" && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin text-[#737373]" />
              )}
            </div>
          </div>

          {/* New customer card */}
          <div className="rounded-[12px] border border-[#e5e5e5] p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef1f7] text-[#344f89]">
              <UserRoundPlus className="h-4 w-4" aria-hidden />
            </div>
            <h3 className="mt-3 text-[16px] font-semibold text-[#0a152f]">
              Reward for the new customer
            </h3>
            <p className="mt-1 text-[13px] text-[#737373]">
              Given to the friend who joins via referral
            </p>
            <label className="mt-4 block text-[13px] font-medium text-[#424242]">
              Welcome discount
            </label>
            <div className="mt-1 flex h-11 items-center rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] px-3 focus-within:border-[#feb602]">
              <span className="pr-2 text-[13px] text-[#737373]">%</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                onBlur={handleDiscountBlur}
                disabled={!enabled || saving === "discount"}
                className="h-full flex-1 bg-transparent text-[14px] text-[#0a152f] outline-none"
              />
              {saving === "discount" && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin text-[#737373]" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Top referrers */}
      <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-bold leading-[1.2] text-[#0a152f]">
              Top referrers
            </h2>
            <p className="mt-1 text-[14px] text-[#525252]">
              Customers driving the most new sign-ups
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-[#44b678] px-4 text-[13px] font-semibold text-white transition hover:bg-[#3aa46b]"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-[12px] border border-[#eef1f7]">
          <div className="min-w-[520px]">
          <div className="grid grid-cols-[80px_1fr_120px_140px] items-center gap-3 bg-[#f8fafc] px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#5d74a2]">
            <div>Rank</div>
            <div>Customer</div>
            <div>Referrals</div>
            <div>Reward Earned</div>
          </div>
          {TOP_REFERRERS.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <p className="text-[14px] font-medium text-[#0a152f]">
                No referrals yet
              </p>
              <p className="text-[13px] text-[#737373]">
                Once customers start referring friends, your top referrers will appear here.
              </p>
            </div>
          ) : (
            TOP_REFERRERS.map((r) => (
              <div
                key={r.rank}
                className="grid grid-cols-[80px_1fr_120px_140px] items-center gap-3 border-t border-[#eef1f7] px-4 py-3"
              >
                <div className="text-[14px] font-semibold text-[#0a152f]">#{r.rank}</div>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef1f7] text-[12px] font-semibold text-[#344f89]">
                    {r.initials}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold text-[#0a152f]">{r.name}</div>
                    <div className="truncate text-[12px] text-[#737373]">{r.email}</div>
                  </div>
                </div>
                <div className="text-[14px] text-[#424242]">{r.referrals}</div>
                <div>
                  <span className="inline-flex rounded-full bg-[#effaf4] px-2.5 py-1 text-[12px] font-semibold text-[#44b678]">
                    {r.rewardPoints.toLocaleString()} pts
                  </span>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      </section>

      <Dialog open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
        <DialogContent className="max-w-[440px] rounded-[20px] bg-white p-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[20px] font-bold leading-[1.2] text-[#0a152f]">
              How referrals work
            </DialogTitle>
            <DialogDescription className="text-[14px] text-[#737373]">
              Both the referrer and the new customer are rewarded
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 h-px w-full bg-[#eef1f7]" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-full rounded-[16px] border border-[#d7ddea] p-4">
              <Link2 className="h-6 w-6 text-[#344f89]" aria-hidden />
              <h3 className="mt-3 text-[14px] font-semibold text-[#0a152f]">
                Customer shares link
              </h3>
              <p className="mt-1 text-[12px] text-[#737373]">
                A unique referral code is generated for every member.
              </p>
            </div>
            <ArrowDown className="h-5 w-5 text-[#a3a3a3]" aria-hidden />
            <div className="w-full rounded-[16px] border border-[#d7ddea] p-4">
              <UserPlus className="h-6 w-6 text-[#feb602]" aria-hidden />
              <h3 className="mt-3 text-[14px] font-semibold text-[#0a152f]">
                Friend signs up
              </h3>
              <p className="mt-1 text-[12px] text-[#737373]">
                New customer joins using the referral code.
              </p>
            </div>
            <ArrowDown className="h-5 w-5 text-[#a3a3a3]" aria-hidden />
            <div className="w-full rounded-[16px] border border-[#d7ddea] p-4">
              <ShoppingBag className="h-6 w-6 text-[#44b678]" aria-hidden />
              <h3 className="mt-3 text-[14px] font-semibold text-[#0a152f]">
                First purchase made
              </h3>
              <p className="mt-1 text-[12px] text-[#737373]">
                Referral is confirmed once they complete a visit.
              </p>
            </div>
            <ArrowDown className="h-5 w-5 text-[#a3a3a3]" aria-hidden />
            <div className="w-full rounded-[16px] border border-[#d7ddea] p-4">
              <Gift className="h-6 w-6 text-[#344f89]" aria-hidden />
              <h3 className="mt-3 text-[14px] font-semibold text-[#0a152f]">
                Both are rewarded
              </h3>
              <p className="mt-1 text-[12px] text-[#737373]">
                Referrer and friend both receive their bonus automatically
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
