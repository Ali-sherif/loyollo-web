import * as React from "react";
import { toast } from "sonner";
import {
  Crown,
  Check,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
  ArrowLeft,

} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import telescopeImg from "@/assets/telescope-empty-state.png";
import type { Tier } from "@/components/loyalty/TierSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TierDialog } from "@/components/loyalty/TierSection";

/* ---------- Templates ---------- */

type Template = {
  id: string;
  name: string;
  color: string;
  threshold: number;
  multiplier: number;
  benefits: string[];
  bonus_percentage: number;
  headerBg: string;
  headerDot: string;
  buttonBg: string;
  buttonHover: string;
  buttonText: string;
};

const TEMPLATES: Template[] = [
  {
    id: "silver",
    name: "Silver",
    color: "silver",
    threshold: 0,
    multiplier: 1.0,
    bonus_percentage: 0,
    benefits: ["Standard rewards", "Birthday reward"],
    headerBg: "#f3f4f6",
    headerDot: "#a3a3a3",
    buttonBg: "#525252",
    buttonHover: "#404040",
    buttonText: "#ffffff",
  },
  {
    id: "gold",
    name: "Gold",
    color: "gold",
    threshold: 1000,
    multiplier: 1.25,
    bonus_percentage: 25,
    benefits: [
      "Standard rewards",
      "Birthday reward",
      "+25% bonus points",
      "Priority redemption",
    ],
    headerBg: "#fff9e6",
    headerDot: "#feb602",
    buttonBg: "#feb602",
    buttonHover: "#e29f00",
    buttonText: "#ffffff",
  },
  {
    id: "vip",
    name: "VIP",
    color: "emerald",
    threshold: 2500,
    multiplier: 1.5,
    bonus_percentage: 50,
    benefits: [
      "Exclusive VIP rewards",
      "Birthday treat",
      "+50% bonus points",
      "Priority redemption",
      "Early access to promotions",
    ],
    headerBg: "#effaf4",
    headerDot: "#44b678",
    buttonBg: "#44b678",
    buttonHover: "#3aa068",
    buttonText: "#ffffff",
  },
];

function rangeLabel(t: Template): string {
  if (t.id === "silver") return "0 – 999 pts";
  if (t.id === "gold") return "1,000 – 2,499 pts";
  return "2,500+ pts";
}

/* ---------- Component ---------- */

type Props = {
  programId: string | null;
  tiers: Tier[];
  reloadTiers: () => void | Promise<void>;
  measuredBy: string;
  setMeasuredBy: (v: string) => void;
  resetPeriod: string;
  setResetPeriod: (v: string) => void;
  notifyUpgrade: boolean;
  setNotifyUpgrade: (v: boolean) => void;
  downgradeProtection: boolean;
  setDowngradeProtection: (v: boolean) => void;
  ensureProgramSaved: () => Promise<string | null>;
  /**
   * When provided AND tiers exist, TierBasedFlow renders the full Screen 2
   * layout itself: a two-column grid (rules + members on the left, this
   * `rightColumn` on the right), and the Tier configuration section spanning
   * full width beneath the grid. When omitted, the flow renders inline as a
   * single column (used inside a caller-controlled grid).
   */
  rightColumn?: React.ReactNode;
};


export function TierBasedFlow(props: Props) {
  const { programId, tiers, reloadTiers, ensureProgramSaved } = props;
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Tier | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Tier | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [creatingFromTemplate, setCreatingFromTemplate] = React.useState<string | null>(null);
  const [preparingCustom, setPreparingCustom] = React.useState(false);
  const [showTemplates, setShowTemplates] = React.useState(false);


  async function applyTemplate(t: Template) {
    if (tiers.some((x) => x.name.toLowerCase() === t.name.toLowerCase())) {
      toast.error(`A ${t.name} tier already exists.`);
      return;
    }
    setCreatingFromTemplate(t.id);
    // Selecting a template IS the action — auto-save the program if needed,
    // then create the tier. This transitions the page to Screen 2.
    const pid = programId ?? (await ensureProgramSaved());
    if (!pid) {
      setCreatingFromTemplate(null);
      return;
    }
    const { error } = await supabase.from("loyalty_program_tiers").insert({
      loyalty_program_id: pid,
      name: t.name,
      color: t.color,
      points_threshold: t.threshold,
      benefits: t.benefits,
      bonus_percentage: t.bonus_percentage,
      points_multiplier: t.multiplier,
      sort_order: t.threshold,
    });
    setCreatingFromTemplate(null);
    if (error) {
      toast.error(error.message || "Couldn't apply template");
      return;
    }
    toast.success(`${t.name} tier created`, {
      description: "You can edit its thresholds and benefits any time.",
    });
    setShowTemplates(false);
    await reloadTiers();
  }


  async function handleCreateCustom() {
    setPreparingCustom(true);
    const pid = programId ?? (await ensureProgramSaved());
    setPreparingCustom(false);
    if (!pid) return;
    setEditing(null);
    setShowTemplates(false);
    setDialogOpen(true);
  }


  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from("loyalty_program_tiers")
      .delete()
      .eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error("Couldn't remove tier");
      return;
    }
    toast.success("Tier removed");
    setDeleteTarget(null);
    reloadTiers();
  }

  const hasTiers = tiers.length > 0;
  const existingTierNames = React.useMemo(
    () => new Set(tiers.map((t) => t.name.toLowerCase())),
    [tiers],
  );

  return (
    <>
      {hasTiers && !showTemplates ? (
        <ConfiguredView
          {...props}
          onAddTier={() => setShowTemplates(true)}
          onEditTier={(t) => {
            setEditing(t);
            setDialogOpen(true);
          }}
          onDeleteTier={(t) => setDeleteTarget(t)}
        />
      ) : (
        <TemplatesView
          onApplyTemplate={applyTemplate}
          creatingId={creatingFromTemplate}
          onCreateCustom={handleCreateCustom}
          preparingCustom={preparingCustom}
          existingTierNames={existingTierNames}
          onBack={hasTiers ? () => setShowTemplates(false) : undefined}
        />
      )}


      <TierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        programId={programId}
        editing={editing}
        existingTiers={tiers}
        onSaved={() => {
          setDialogOpen(false);
          reloadTiers();
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tier?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be permanently removed. Customers currently on this tier
              will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Removing…" : "Delete tier"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ---------- Templates view (Screen 1) ---------- */

function TemplatesView({
  onApplyTemplate,
  onCreateCustom,
  creatingId,
  preparingCustom,
  existingTierNames,
  onBack,
}: {
  onApplyTemplate: (t: Template) => void;
  onCreateCustom: () => void;
  creatingId: string | null;
  preparingCustom: boolean;
  existingTierNames?: Set<string>;
  onBack?: () => void;
}) {
  const busy = creatingId !== null || preparingCustom;
  const availableTemplates = TEMPLATES.filter(
    (t) => !existingTierNames?.has(t.name.toLowerCase()),
  );
  return (
    <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold leading-none text-[#0a152f]">
            {onBack ? "Add a tier" : "Tier configuration"}
          </h2>
          <p className="mt-2 text-[14px] text-[#737373]">
            Choose a tier structure to reward your most loyal customers. Start with a ready-made
            template or build your own from scratch.
          </p>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={busy}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#d7ddea] bg-white px-4 text-[13px] font-semibold text-[#0a152f] transition hover:bg-[#fafafa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back
          </button>
        )}
      </div>

      <p className="mt-[36px] text-[20px] font-semibold leading-none text-[#0a152f]">
        Ready-made templates
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {availableTemplates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            onUse={() => onApplyTemplate(t)}
            loading={creatingId === t.id}
            disabled={busy && creatingId !== t.id}
          />
        ))}
        <button
          type="button"
          onClick={onCreateCustom}
          disabled={busy}
          className="flex min-h-[607px] flex-col items-center justify-center gap-4 rounded-[16px] border border-dashed border-[#b0bcd4] bg-[#eef1f7] p-4 text-center transition hover:border-[#8698bb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-8 w-8 text-[#344f89]" strokeWidth={1.5} aria-hidden />
          <div className="flex flex-col gap-2">
            <p className="text-[20px] font-semibold leading-none text-[#0a152f]">
              + Create your own tiers
            </p>
            <p className="text-[14px] text-[#737373]">
              {preparingCustom ? "Preparing…" : "Build every tier exactly how you want."}
            </p>
          </div>
        </button>
      </div>
    </section>
  );
}


function TemplateCard({
  template: t,
  onUse,
  loading,
  disabled,
}: {
  template: Template;
  onUse: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[16px] border border-[#e5e5e5] bg-white">
      <div
        className="flex items-center gap-2 border-b border-[#e5e5e5] p-4"
        style={{ backgroundColor: t.headerBg }}
      >
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: t.headerDot }}
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <p className="text-[20px] font-semibold leading-none text-[#0a152f]">{t.name}</p>
          <p className="mt-1 text-[14px] text-[#525252]">{rangeLabel(t)}</p>
        </div>
        <MoreHorizontal className="h-5 w-5 text-[#8698bb]" aria-hidden />
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        <div>
          <label className="block text-[14px] font-medium text-[#424242]">Entry threshold</label>
          <div className="mt-2 flex items-center gap-2 rounded-[12px] border border-[#d7ddea] bg-[#fafafa] px-4 py-[14px]">
            <input
              readOnly
              value={t.threshold.toLocaleString()}
              className="w-full bg-transparent text-[16px] text-[#0a152f] focus:outline-none"
            />
            <span aria-hidden className="h-5 w-px bg-[#d7ddea]" />
            <span className="text-[16px] text-[#8698bb]">point(s)</span>
          </div>
        </div>

        <div>
          <label className="block text-[14px] font-medium text-[#424242]">Points multiplier</label>
          <div className="mt-2 flex items-center rounded-[12px] border border-[#d7ddea] bg-[#fafafa] px-4 py-[14px]">
            <input
              readOnly
              value={t.multiplier.toFixed(t.multiplier % 1 === 0 ? 1 : 2)}
              className="w-full bg-transparent text-[16px] text-[#0a152f] focus:outline-none"
            />
          </div>
        </div>

        <hr className="border-[#e5e5e5]" />

        <div className="flex flex-1 flex-col gap-5">
          <p className="text-[14px] font-medium text-[#737373]">Benefits</p>
          <ul className="flex flex-1 flex-col gap-5">
            {t.benefits.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: t.headerDot }}
                  aria-hidden
                >
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </span>
                <span className="flex-1 text-[16px] text-[#0a152f]">{b}</span>
                <span className="text-[14px] text-[#a3a3a3]" aria-hidden>
                  ×
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className="flex items-center justify-center border-t border-[#e5e5e5] p-4"
        style={{ backgroundColor: t.headerBg }}
      >
        <button
          type="button"
          onClick={onUse}
          disabled={disabled || loading}
          className="w-full rounded-[8px] px-4 py-3 text-[14px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: t.buttonBg, color: t.buttonText }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = t.buttonHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = t.buttonBg)}
        >
          {loading ? "Applying…" : "Use Template"}
        </button>
      </div>
    </div>
  );
}

/* ---------- Configured view (Screen 2) ---------- */

function ConfiguredView({
  tiers,
  measuredBy,
  setMeasuredBy,
  resetPeriod,
  setResetPeriod,
  notifyUpgrade,
  setNotifyUpgrade,
  downgradeProtection,
  setDowngradeProtection,
  rightColumn,
  onAddTier,
  onEditTier,
  onDeleteTier,
}: Props & {
  onAddTier: () => void;
  onEditTier: (t: Tier) => void;
  onDeleteTier: (t: Tier) => void;
}) {
  const rules = (
    <div className="flex flex-col gap-6">
      {/* Global tier rules */}
      <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
        <h2 className="text-[20px] font-semibold leading-none text-[#0a152f]">Global tier rules</h2>
        <p className="mt-2 text-[14px] text-[#737373]">Applied across all tiers</p>


        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <TierSelectField
            id="tier-measured-by"
            label="Tier measured by"
            helper="Can also measure by total spend or visit count"
            value={measuredBy}
            onChange={setMeasuredBy}
            options={[
              { value: "points", label: "Points" },
              { value: "total_spend", label: "Total spend" },
              { value: "visit_count", label: "Visit count" },
            ]}
          />
          <TierSelectField
            id="tier-reset-period"
            label="Tier reset period"
            helper="Optionally reset tiers annually or every 6 months"
            value={resetPeriod}
            onChange={setResetPeriod}
            options={[
              { value: "never", label: "Never" },
              { value: "annually", label: "Annually" },
              { value: "every_6_months", label: "Every 6 months" },
            ]}
          />
        </div>

        <hr className="my-6 border-[#eef1f7]" />

        <TierToggleRow
          title="Notify customer on tier upgrade"
          description="Send automatic message when they reach a new tier"
          checked={notifyUpgrade}
          onChange={setNotifyUpgrade}
        />
        <div className="mt-5">
          <TierToggleRow
            title="Downgrade protection"
            description="Keep tier for 60 days before downgrading due to inactivity"
            checked={downgradeProtection}
            onChange={setDowngradeProtection}
          />
        </div>
      </section>

      {/* Members close to upgrading */}
      <MembersCloseToUpgradingPanel />
    </div>
  );

  const tierList = (
    <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold leading-none text-[#0a152f]">Tier configuration</h2>
          <p className="mt-2 text-[14px] text-[#737373]">

            Choose a tier structure to reward your most loyal customers. Start with a ready-made
            template or build your own from scratch.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddTier}
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-[#feb602] px-4 text-[13px] font-semibold text-white transition hover:bg-[#e29f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
        >
          + Add Tier
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {tiers.map((t) => (
          <ConfiguredTierCard
            key={t.id}
            tier={t}
            onEdit={() => onEditTier(t)}
            onDelete={() => onDeleteTier(t)}
          />
        ))}
      </div>
    </section>
  );

  // When a right column is provided, own the full Screen 2 layout: two-column
  // grid on top (rules + rightColumn), tier configuration full-width below.
  if (rightColumn !== undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_410px]">
          {rules}
          <div className="flex flex-col gap-6">{rightColumn}</div>
        </div>
        {tierList}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {rules}
      {tierList}
    </div>
  );
}


const TIER_HEADER: Record<string, { bg: string; dot: string; footerBg: string; footerText: string }> = {
  silver:  { bg: "#f3f4f6", dot: "#a3a3a3", footerBg: "#f3f4f6", footerText: "#525252" },
  gold:    { bg: "#fff9e6", dot: "#feb602", footerBg: "#fff9e6", footerText: "#8a6a00" },
  vip:     { bg: "#effaf4", dot: "#44b678", footerBg: "#effaf4", footerText: "#267a4d" },
  emerald: { bg: "#effaf4", dot: "#44b678", footerBg: "#effaf4", footerText: "#267a4d" },
  bronze:  { bg: "#f5ebe0", dot: "#cd7f32", footerBg: "#f5ebe0", footerText: "#8b5a2b" },
};

function ConfiguredTierCard({
  tier,
  onEdit,
  onDelete,
}: {
  tier: Tier & { points_multiplier?: number };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const c = TIER_HEADER[tier.color] ?? TIER_HEADER.silver;
  const multiplier =
    typeof tier.points_multiplier === "number" && tier.points_multiplier > 0
      ? tier.points_multiplier
      : 1 + (tier.bonus_percentage || 0) / 100;
  return (
    <div className="flex flex-col overflow-hidden rounded-[16px] border border-[#e5e5e5] bg-white">
      <div
        className="flex items-center gap-2 border-b border-[#e5e5e5] p-4"
        style={{ backgroundColor: c.bg }}
      >
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: c.dot }}
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <p className="text-[20px] font-semibold leading-none text-[#0a152f]">{tier.name}</p>
          <p className="mt-1 text-[14px] text-[#525252]">
            {tier.points_threshold.toLocaleString()}+ pts
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`${tier.name} tier options`}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#8698bb] transition hover:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" aria-hidden /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        <div>
          <label className="block text-[14px] font-medium text-[#424242]">Entry threshold</label>
          <div className="mt-2 flex items-center gap-2 rounded-[12px] border border-[#d7ddea] bg-[#fafafa] px-4 py-[14px]">
            <input
              readOnly
              value={tier.points_threshold.toLocaleString()}
              className="w-full bg-transparent text-[16px] text-[#0a152f] focus:outline-none"
            />
            <span aria-hidden className="h-5 w-px bg-[#d7ddea]" />
            <span className="text-[16px] text-[#8698bb]">point(s)</span>
          </div>
        </div>

        <div>
          <label className="block text-[14px] font-medium text-[#424242]">Points multiplier</label>
          <div className="mt-2 flex items-center rounded-[12px] border border-[#d7ddea] bg-[#fafafa] px-4 py-[14px]">
            <input
              readOnly
              value={multiplier.toFixed(multiplier % 1 === 0 ? 1 : 2)}
              className="w-full bg-transparent text-[16px] text-[#0a152f] focus:outline-none"
            />
          </div>
        </div>

        <hr className="border-[#e5e5e5]" />

        <div className="flex flex-1 flex-col gap-5">
          <p className="text-[14px] font-medium text-[#737373]">Benefits</p>
          <ul className="flex flex-1 flex-col gap-5">
            {tier.benefits.length === 0 ? (
              <li className="text-[14px] text-[#a3a3a3]">No benefits configured</li>
            ) : (
              tier.benefits.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: c.dot }}
                    aria-hidden
                  >
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </span>
                  <span className="flex-1 text-[16px] text-[#0a152f]">{b}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div
        className="flex items-center justify-center gap-1.5 border-t border-[#e5e5e5] p-4 text-[14px] font-medium"
        style={{ backgroundColor: c.footerBg, color: c.footerText }}
      >
        <Crown className="h-4 w-4" aria-hidden /> 0
      </div>
    </div>
  );
}

/* ---------- Members close to upgrading ---------- */

function MembersCloseToUpgradingPanel() {
  // TODO(feature): replace with real query — customers whose current points
  // are within 20% of the next tier's threshold for this loyalty_program_id.
  const [customers] = React.useState<Array<{ id: string; name: string; points: number }>>([]);
  const hasData = customers.length > 0;

  return (
    <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold leading-none text-[#0a152f]">Members close to upgrading</h2>
          <p className="mt-2 text-[14px] text-[#737373]">

            Customers within 20% of the next tier threshold
          </p>
        </div>
        {hasData && (
          <button
            type="button"
            onClick={() =>
              toast.success("Upgrade nudge sent", {
                description: "Everyone close to the next tier just got a reminder.",
              })
            }
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#fff9e6] px-4 text-[13px] font-semibold text-[#8a6a00] transition hover:bg-[#fff1bf] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
          >
            <Send className="h-3.5 w-3.5" aria-hidden /> Send Upgrade Nudge
          </button>
        )}
      </div>

      {!hasData ? (
        <div className="mt-6 flex flex-col items-center text-center">
          <img
            src={telescopeImg}
            alt=""
            width={149}
            height={110}
            loading="lazy"
            className="h-[110px] w-auto"
          />
          <p className="mt-4 text-[20px] font-bold text-[#0a152f]">No Customers Yet!</p>
          <p className="mt-2 max-w-[458px] text-[14px] leading-[1.4] text-[#737373]">
            Customers listing will appear here once they are close to upgrading
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {customers.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-[10px] border border-[#eef1f7] bg-[#fafafa] p-3"
            >
              <span className="text-[14px] text-[#0a152f]">{c.name}</span>
              <span className="text-[13px] text-[#737373]">{c.points} pts</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- Local field helpers (kept local to this component so we don't
   couple to route-level Field/SelectField/ToggleRow) ---------- */

function TierSelectField({
  id,
  label,
  helper,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  helper?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const helperId = helper ? `${id}-helper` : undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-medium text-[#0a152f]">
        {label}
      </label>
      <div className="mt-2 flex items-center rounded-[10px] bg-[#fafafa] px-3 py-3 ring-1 ring-[#eef1f7] transition focus-within:ring-2 focus-within:ring-[#feb602]">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={helperId}
          className={`w-full appearance-none bg-transparent text-[14px] focus:outline-none ${
            value ? "text-[#0a152f]" : "text-[#a3a3a3]"
          }`}
        >
          <option value="" disabled>
            Select Option
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value} className="text-[#0a152f]">
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {helper && (
        <p id={helperId} className="mt-1.5 text-[12px] text-[#737373]">
          {helper}
        </p>
      )}
    </div>
  );
}

function TierToggleRow({
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
