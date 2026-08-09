import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Coffee,
  Percent,
  Sparkles,
  Truck,
  Cake,
  Package,
  Gift,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Coins,
  Loader2,
  Pencil,
  Trash2,
  BarChart3,
  Plus,
  ArrowLeft,
  MoreHorizontal,
  TrendingUp,
  DollarSign,
  Crown,
  Award,
  Medal,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
import { supabase } from "@/integrations/supabase/client";
import telescopeImg from "@/assets/telescope-empty-state.png";

type Reward = {
  id: string;
  loyalty_program_id: string;
  name: string;
  description: string;
  icon: string;
  point_cost: number | null;
  monthly_limit: number | null;
  redeemed_count: number;
  status: string;
};

type Template = {
  key: string;
  name: string;
  description: string;
  icon: string;
  point_cost: number | null;
};

const TEMPLATES: Template[] = [
  {
    key: "free-coffee",
    name: "Free Coffee",
    description: "Any size, any drink. Valid on all espresso-based beverages.",
    icon: "coffee",
    point_cost: 200,
  },
  {
    key: "10-discount",
    name: "10% Discount",
    description: "Applies to the entire order, including food items.",
    icon: "percent",
    point_cost: 150,
  },
  {
    key: "free-service",
    name: "Free Service",
    description: "One complimentary basic service of the customer's choice.",
    icon: "sparkles",
    point_cost: 500,
  },
  {
    key: "free-delivery",
    name: "Free Delivery",
    description: "Waives delivery fee on the customer's next online order.",
    icon: "truck",
    point_cost: 120,
  },
  {
    key: "birthday-treat",
    name: "Birthday Treat",
    description: "Free pastry of choice during the customer's birthday month.",
    icon: "cake",
    point_cost: null,
  },
  {
    key: "vip-tasting-box",
    name: "VIP Tasting Box",
    description: "Exclusive tasting box for high-tier loyal customers.",
    icon: "package",
    point_cost: 1200,
  },
];

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  coffee: Coffee,
  percent: Percent,
  sparkles: Sparkles,
  truck: Truck,
  cake: Cake,
  package: Package,
  gift: Gift,
};

function IconFor({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Gift;
  return <Icon className={className} />;
}

type Props = {
  programId: string | null;
  ensureProgramSaved: () => Promise<string | null>;
};

export function RewardsSection({ programId, ensureProgramSaved }: Props) {
  const navigate = useNavigate();
  const [rewards, setRewards] = React.useState<Reward[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [perfSearch, setPerfSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Reward | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Reward | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [statsTarget, setStatsTarget] = React.useState<Reward | null>(null);
  const [applyingKey, setApplyingKey] = React.useState<string | null>(null);
  const [showTemplates, setShowTemplates] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!programId) {
      setRewards([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("rewards")
      .select("*")
      .eq("loyalty_program_id", programId)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (error) {
      toast.error("Couldn't load rewards");
      return;
    }
    setRewards((data ?? []) as Reward[]);
  }, [programId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function applyTemplate(t: Template) {
    setApplyingKey(t.key);
    const pid = await ensureProgramSaved();
    if (!pid) {
      setApplyingKey(null);
      return;
    }
    const { error } = await supabase.from("rewards").insert({
      loyalty_program_id: pid,
      name: t.name,
      description: t.description,
      icon: t.icon,
      point_cost: t.point_cost,
      monthly_limit: null,
      status: "live",
    });
    setApplyingKey(null);
    if (error) {
      toast.error(error.message || "Couldn't add reward");
      return;
    }
    toast.success(`${t.name} added to your rewards`);
    setShowTemplates(false);
    void load();
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from("rewards")
      .delete()
      .eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error("Couldn't remove reward");
      return;
    }
    toast.success("Reward removed");
    setDeleteTarget(null);
    void load();
  }

  async function toggleStatus(r: Reward) {
    const next = r.status === "disabled" ? "live" : "disabled";
    setRewards((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
    const { error } = await supabase
      .from("rewards")
      .update({ status: next })
      .eq("id", r.id);
    if (error) {
      setRewards((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: r.status } : x)));
      toast.error(error.message || "Couldn't update reward");
      return;
    }
    toast.success(next === "disabled" ? `${r.name} disabled` : `${r.name} enabled`);
  }


  const existingNames = React.useMemo(
    () => new Set(rewards.map((r) => r.name.toLowerCase())),
    [rewards],
  );
  const availableTemplates = TEMPLATES.filter(
    (t) => !existingNames.has(t.name.toLowerCase()),
  );
  const filteredRewards = rewards.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );
  const perfRewards = rewards.filter((r) =>
    r.name.toLowerCase().includes(perfSearch.toLowerCase()),
  );

  const isConfigured = rewards.length > 0 && !showTemplates;


  return (
    <div className="flex flex-col gap-6">
      {/* Rewards catalog card */}
      <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {showTemplates && rewards.length > 0 && (
              <button
                type="button"
                onClick={() => setShowTemplates(false)}
                aria-label="Back to rewards"
                className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0a152f] ring-1 ring-[#eef1f7] transition hover:bg-[#f7f8fb]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </button>
            )}
            <div>
              <h2 className="text-[20px] font-bold leading-[1.2] text-[#0a152f]">
                {showTemplates && rewards.length > 0 ? "Add a reward" : "Rewards"}
              </h2>
              <p className="mt-2 text-[14px] text-[#737373]">
                {showTemplates && rewards.length > 0
                  ? "Pick a ready template or create your own."
                  : "Create and manage the rewards customers can earn"}
              </p>
            </div>
          </div>
          {isConfigured && (
            <button
              type="button"
              onClick={() => setShowTemplates(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#feb602] px-5 py-2.5 text-[14px] font-semibold text-[#0a152f] shadow-[0_4px_14px_rgba(254,182,2,0.35)] transition hover:bg-[#e29f00]"
            >
              <Plus className="h-4 w-4 text-[#0a152f]" aria-hidden />
              New Reward
            </button>
          )}
        </div>

        {/* Search + controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex h-11 w-full max-w-[372px] items-center rounded-full bg-[#fafafa] px-4 ring-1 ring-[#eef1f7] focus-within:ring-2 focus-within:ring-[#feb602]">
            <Search className="h-4 w-4 text-[#8698bb]" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rewards"
              className="ml-3 w-full bg-transparent text-[14px] text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-[#eef1f7] text-[13px] font-medium text-[#0a152f] transition hover:bg-[#f7f8fb]"
              aria-label="Filter rewards"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden /> Status
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-[#eef1f7] text-[13px] font-medium text-[#0a152f] transition hover:bg-[#f7f8fb]"
              aria-label="Sort rewards"
            >
              <ArrowUpDown className="h-4 w-4" aria-hidden /> Sort by
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isConfigured
            ? filteredRewards.map((r) => (
                <article
                  key={r.id}
                  className="flex flex-col overflow-hidden rounded-[14px] border border-[#eef1f7] bg-white transition hover:border-[#d7ddea] hover:shadow-[0_2px_8px_rgba(10,13,18,0.06)]"
                >
                  <div className="flex items-start justify-between p-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff9e6] text-[#b48800]">
                      <IconFor name={r.icon} className="h-5 w-5" />
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex flex-col gap-2 px-5">
                    <h3 className="text-[16px] font-semibold text-[#0a152f]">
                      {r.name}
                    </h3>
                    <p className="line-clamp-2 text-[14px] text-[#737373]">
                      {r.description}
                    </p>
                  </div>
                  <div className="mx-5 mt-4 border-t border-[#eef1f7]" />
                  <div className="flex items-center gap-4 px-5 py-3 text-[14px] text-[#525252]">
                    <span className="inline-flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-[#8698bb]" aria-hidden />
                      {r.point_cost == null ? "Free" : `${r.point_cost.toLocaleString()} points`}
                    </span>
                    <span className="text-[#a3a3a3]">·</span>
                    <span>{r.redeemed_count.toLocaleString()} redeemed</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 border-t border-[#eef1f7] bg-[#fafbfd] px-3 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(r);
                        setDialogOpen(true);
                      }}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-[#0a152f] transition hover:bg-white"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatsTarget(r)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-[#0a152f] transition hover:bg-white"
                      aria-label={`Stats for ${r.name}`}
                    >
                      <BarChart3 className="h-3.5 w-3.5" aria-hidden /> Stats
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`More actions for ${r.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#8698bb] transition hover:bg-[#eef1f7] hover:text-[#0a152f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onSelect={() => navigate({ to: "/campaigns" })}>
                          Send Campaign
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => void toggleStatus(r)}>
                          {r.status === "disabled" ? "Enable" : "Disable"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setDeleteTarget(r)}
                          className="text-red-600 focus:text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                  </div>
                </article>
              ))
            : (
              <>
                {availableTemplates.map((t) => {
                  const applying = applyingKey === t.key;
                  return (
                    <article
                      key={t.key}
                      className="flex flex-col overflow-hidden rounded-[14px] border border-[#eef1f7] bg-white transition hover:border-[#d7ddea] hover:shadow-[0_2px_8px_rgba(10,13,18,0.06)]"
                    >
                      <div className="flex items-start justify-between p-5">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff9e6] text-[#b48800]">
                          <IconFor name={t.icon} className="h-5 w-5" />
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 px-5">
                        <h3 className="text-[16px] font-semibold text-[#0a152f]">
                          {t.name}
                        </h3>
                        <p className="line-clamp-2 text-[14px] text-[#737373]">
                          {t.description}
                        </p>
                      </div>
                      <div className="mx-5 mt-4 border-t border-[#eef1f7]" />
                      <div className="flex items-center gap-1.5 px-5 py-3 text-[14px] text-[#525252]">
                        <Coins className="h-4 w-4 text-[#8698bb]" aria-hidden />
                        {t.point_cost == null ? "Free" : `${t.point_cost.toLocaleString()} points`}
                      </div>
                      <div className="mt-auto border-t border-[#eef1f7] bg-[#fafbfd] p-4">
                        <button
                          type="button"
                          onClick={() => void applyTemplate(t)}
                          disabled={applying}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-semibold text-[#0a152f] ring-1 ring-[#d7ddea] transition hover:bg-[#0a152f] hover:text-white hover:ring-[#0a152f] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {applying && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                          Use Template
                        </button>
                      </div>
                    </article>
                  );
                })}

                <button
                  type="button"
                  onClick={openCreate}
                  className="flex min-h-[257px] flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-[#d7ddea] bg-[#fafbfd] p-6 text-center transition hover:border-[#feb602] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#8698bb] ring-1 ring-[#eef1f7]">
                    <Plus className="h-6 w-6" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[16px] font-semibold text-[#0a152f]">
                      Create your own rewards
                    </p>
                    <p className="mt-1 text-[14px] text-[#737373]">
                      Build every reward exactly how you want.
                    </p>
                  </div>
                </button>
              </>
            )}
        </div>

        {loading && (
          <div className="mt-4 flex items-center justify-center text-[#8698bb]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          </div>
        )}
      </section>

      {/* Reward performances */}
      <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-bold leading-[1.2] text-[#0a152f]">
              Reward performances
            </h2>
            <p className="mt-2 text-[14px] text-[#737373]">
              Redemption rate against availability limits
            </p>
          </div>
          {rewards.length > 0 && (
            <button
              type="button"
              onClick={() => void exportPerformancesPdf(perfRewards)}
              className="inline-flex items-center gap-2 rounded-full bg-[#10b981] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition hover:bg-[#059669]"
            >
              Export
            </button>
          )}

        </div>

        {rewards.length === 0 ? (
          <div className="mt-6 flex flex-col items-center text-center">
            <img
              src={telescopeImg}
              alt=""
              width={149}
              height={110}
              loading="lazy"
              className="h-[110px] w-auto"
            />
            <p className="mt-4 text-[20px] font-bold text-[#0a152f]">
              No Rewards Created Yet!
            </p>
            <p className="mt-2 max-w-[560px] text-[14px] leading-[1.4] text-[#737373]">
              Rewards performance will appear here once customers start redeeming them
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex h-11 w-full max-w-[372px] items-center rounded-full bg-[#fafafa] px-4 ring-1 ring-[#eef1f7] focus-within:ring-2 focus-within:ring-[#feb602]">
                <Search className="h-4 w-4 text-[#8698bb]" aria-hidden />
                <input
                  value={perfSearch}
                  onChange={(e) => setPerfSearch(e.target.value)}
                  placeholder="Search rewards"
                  className="ml-3 w-full bg-transparent text-[14px] text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-[#eef1f7] text-[13px] font-medium text-[#0a152f] transition hover:bg-[#f7f8fb]"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden /> Status
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-[#eef1f7] text-[13px] font-medium text-[#0a152f] transition hover:bg-[#f7f8fb]"
                >
                  <ArrowUpDown className="h-4 w-4" aria-hidden /> Sort by
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="border-b border-[#eef1f7] bg-[#fafbfd] text-[#525252]">
                    <th className="px-4 py-3 font-medium">Reward</th>
                    <th className="px-4 py-3 font-medium">Point cost</th>
                    <th className="px-4 py-3 font-medium">Redeemed</th>
                    <th className="px-4 py-3 font-medium">Monthly Limit</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {perfRewards.map((r) => (
                    <tr key={r.id} className="border-b border-[#eef1f7] last:border-b-0">
                      <td className="px-4 py-4 font-semibold text-[#0a152f]">{r.name}</td>
                      <td className="px-4 py-4 text-[#525252]">
                        {r.point_cost == null ? "Free" : r.point_cost.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-[#525252]">
                        {r.redeemed_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-[#525252]">
                        {r.monthly_limit == null ? "Unlimited" : `${r.monthly_limit}/month`}
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>


      <RewardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        programId={programId}
        ensureProgramSaved={ensureProgramSaved}
        onSaved={() => {
          setDialogOpen(false);
          setShowTemplates(false);
          void load();
        }}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reward?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be permanently removed. Customers won't be able to redeem it anymore.
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
              {deleting ? "Removing…" : "Delete reward"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RewardStatsDialog
        reward={statsTarget}
        onOpenChange={(o) => !o && setStatsTarget(null)}
        onEdit={(r) => {
          setStatsTarget(null);
          setEditing(r);
          setDialogOpen(true);
        }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string; dot: string }> = {
    live: { bg: "#DCFCE7", text: "#166534", label: "Live", dot: "#16A34A" },
    paused: { bg: "#F3F4F6", text: "#525252", label: "Paused", dot: "#8698bb" },
    disabled: { bg: "#F3F4F6", text: "#525252", label: "Disabled", dot: "#8698bb" },
    low_stock: { bg: "#FEF3C7", text: "#92400E", label: "Low Stock", dot: "#D97706" },

  };
  const s = map[status] ?? map.live;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {s.label}
    </span>
  );
}

function RewardDialog({
  open,
  onOpenChange,
  editing,
  programId,
  ensureProgramSaved,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Reward | null;
  programId: string | null;
  ensureProgramSaved: () => Promise<string | null>;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [pointCost, setPointCost] = React.useState("");
  const [isFree, setIsFree] = React.useState(false);
  const [monthlyLimit, setMonthlyLimit] = React.useState("");
  const [unlimited, setUnlimited] = React.useState(true);
  const [status, setStatus] = React.useState("live");
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setDescription(editing.description);
      setIsFree(editing.point_cost == null);
      setPointCost(editing.point_cost == null ? "" : String(editing.point_cost));
      setUnlimited(editing.monthly_limit == null);
      setMonthlyLimit(
        editing.monthly_limit == null ? "" : String(editing.monthly_limit),
      );
      setStatus(editing.status);
    } else {
      setName("");
      setDescription("");
      setPointCost("");
      setIsFree(false);
      setMonthlyLimit("");
      setUnlimited(true);
      setStatus("live");
    }
    setErrors({});
  }, [open, editing]);

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Enter a reward name.";
    if (!isFree) {
      const pc = Number(pointCost);
      if (pointCost === "" || Number.isNaN(pc) || pc < 1)
        next.pointCost = "Enter a point cost of 1 or more.";
    }
    if (!unlimited) {
      const ml = Number(monthlyLimit);
      if (monthlyLimit === "" || Number.isNaN(ml) || ml < 1)
        next.monthlyLimit = "Enter a monthly limit of 1 or more.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Radix Portal keeps this outside the outer program <form> in the DOM but
    // React events still bubble through the tree — stopPropagation prevents
    // the outer Save Program handler from also running.
    e.stopPropagation();
    if (!validate()) return;
    setSaving(true);
    const pid = editing?.loyalty_program_id ?? (await ensureProgramSaved());
    if (!pid) {
      setSaving(false);
      return;
    }
    const payload = {
      loyalty_program_id: pid,
      name: name.trim(),
      description: description.trim(),
      icon: editing?.icon ?? "gift",
      point_cost: isFree ? null : Math.floor(Number(pointCost)),
      monthly_limit: unlimited ? null : Math.floor(Number(monthlyLimit)),
      status,
    };
    const { error } = editing
      ? await supabase.from("rewards").update(payload).eq("id", editing.id)
      : await supabase.from("rewards").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message || "Couldn't save reward");
      return;
    }
    toast.success(editing ? "Reward updated" : "Reward created");
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] gap-0 rounded-[16px] p-0">
        <DialogHeader className="space-y-1 px-6 pb-4 pt-6 text-left">
          <DialogTitle className="text-[20px] font-bold text-[#0a152f]">
            {editing ? "Edit Reward" : "Create Reward"}
          </DialogTitle>
          <DialogDescription className="text-[14px] text-[#737373]">
            {editing
              ? "Update the reward customers can redeem."
              : "Build a reward exactly how you want it."}
          </DialogDescription>
        </DialogHeader>
        <div className="border-t border-[#eef1f7]" />
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 px-6 py-5">
          <Field label="Reward name" error={errors.name}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Free Coffee"
              className="w-full bg-transparent text-[14px] text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What do customers get?"
              rows={2}
              className="w-full resize-none bg-transparent text-[14px] text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
            />
          </Field>

          <div>
            <Field label="Point cost" error={errors.pointCost}>
              <input
                value={pointCost}
                onChange={(e) => setPointCost(e.target.value)}
                placeholder="0"
                inputMode="numeric"
                disabled={isFree}
                className="w-full bg-transparent text-[14px] text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none disabled:opacity-50"
              />
              <span className="mx-2 h-4 w-px bg-[#d7ddea]" aria-hidden />
              <span className="text-[14px] text-[#737373]">points</span>
            </Field>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-[13px] text-[#525252]">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="h-4 w-4 rounded border-[#d4d4d4]"
              />
              This reward is free (no points required)
            </label>
          </div>

          <div>
            <Field label="Monthly limit" error={errors.monthlyLimit}>
              <input
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="0"
                inputMode="numeric"
                disabled={unlimited}
                className="w-full bg-transparent text-[14px] text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none disabled:opacity-50"
              />
              <span className="mx-2 h-4 w-px bg-[#d7ddea]" aria-hidden />
              <span className="text-[14px] text-[#737373]">/ month</span>
            </Field>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-[13px] text-[#525252]">
              <input
                type="checkbox"
                checked={unlimited}
                onChange={(e) => setUnlimited(e.target.checked)}
                className="h-4 w-4 rounded border-[#d4d4d4]"
              />
              Unlimited redemptions
            </label>
          </div>

          <div className="-mx-6 border-t border-[#eef1f7]" />
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="rounded-full bg-[#eef1f7] px-6 py-3 text-sm font-semibold text-[#0a152f] transition hover:bg-[#e0e6f2] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#feb602] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(254,182,2,0.35)] transition hover:bg-[#e29f00] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Reward"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[14px] font-medium text-[#0a152f]">{label}</label>
      <div
        className={`mt-2 flex items-center rounded-[10px] bg-[#fafafa] px-3 py-3 ring-1 transition focus-within:ring-2 focus-within:ring-[#feb602] ${
          error ? "ring-red-400" : "ring-[#eef1f7]"
        }`}
      >
        {children}
      </div>
      {error && <p className="mt-1.5 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}

async function exportPerformancesPdf(rows: Reward[]) {
  try {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const statusLabels: Record<string, string> = {
      live: "Live",
      paused: "Paused",
      disabled: "Disabled",
      low_stock: "Low Stock",
    };
    doc.setFontSize(16);
    doc.text("Reward Performances", 40, 48);
    doc.setFontSize(10);
    doc.setTextColor(115);
    doc.text(
      `Generated ${new Date().toLocaleString()}`,
      40,
      66,
    );
    autoTable(doc, {
      startY: 84,
      head: [["Reward", "Point cost", "Redeemed", "Monthly Limit", "Status"]],
      body: rows.map((r) => [
        r.name,
        r.point_cost == null ? "Free" : r.point_cost.toLocaleString(),
        r.redeemed_count.toLocaleString(),
        r.monthly_limit == null ? "Unlimited" : `${r.monthly_limit}/month`,
        statusLabels[r.status] ?? r.status,
      ]),
      styles: { fontSize: 10, cellPadding: 8 },
      headStyles: { fillColor: [10, 21, 47], textColor: 255 },
      alternateRowStyles: { fillColor: [250, 251, 253] },
    });
    doc.save("reward-performances.pdf");
    toast.success("Exported reward-performances.pdf");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Couldn't export PDF");
  }
}

function RewardStatsDialog({
  reward,
  onOpenChange,
  onEdit,
}: {
  reward: Reward | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (r: Reward) => void;
}) {
  // TODO(feature): wire these to real redemption tracking once available.
  // For now every stat defaults to 0 so we never show fabricated numbers.
  const totalRedemptions = reward?.redeemed_count ?? 0;
  const totalRevenue: number = 0;
  const vipRedemptions = 0;
  const goldRedemptions = 0;
  const silverRedemptions = 0;
  const isHighPerforming = false;

  return (
    <Dialog open={!!reward} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] gap-0 rounded-[20px] p-6">
        <DialogHeader className="space-y-0 text-left">
          <DialogTitle className="text-[20px] font-bold leading-[1.2] text-[#0a152f]">
            Reward Performance
          </DialogTitle>
          <DialogDescription className="sr-only">
            Performance stats for {reward?.name ?? "this reward"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 border-t border-[#eef1f7]" />

        {reward && (
          <div className="mt-6 flex flex-col gap-6">
            {/* Reward header card */}
            <div className="flex items-start justify-between rounded-[12px] border border-[#d7ddea] bg-white p-4">
              <div className="flex flex-col gap-2">
                <p className="text-[16px] font-semibold leading-none text-[#0a152f]">
                  {reward.name}
                </p>
                <p className="text-[14px] text-[#737373]">
                  {reward.point_cost == null
                    ? "Free"
                    : `${reward.point_cost.toLocaleString()} points`}
                </p>
              </div>
              <StatusBadge status={reward.status} />
            </div>

            {/* Performance highlight (only when we can prove it) */}
            {isHighPerforming && (
              <div className="flex flex-col gap-2 rounded-[12px] border border-[#d8f3e3] bg-[#effaf4] p-4">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-5 w-5 text-[#267a4d]" aria-hidden />
                  <p className="text-[16px] font-semibold text-[#0a152f]">
                    High Performing Reward
                  </p>
                </div>
                <p className="text-[14px] text-[#525252]">
                  This reward is redeemed more often than your average reward.
                </p>
              </div>
            )}

            {/* Stat tiles */}
            <div className="grid grid-cols-2 gap-2">
              <StatTile
                label="Total Redemptions"
                value={totalRedemptions.toLocaleString()}
                icon={<BarChart3 className="h-5 w-5 text-[#8698bb]" aria-hidden />}
              />
              <StatTile
                label="Total Revenue"
                value={totalRevenue === 0 ? "—" : `$${totalRevenue.toLocaleString()}`}
                icon={<DollarSign className="h-5 w-5 text-[#8698bb]" aria-hidden />}
              />
              <StatTile
                label="VIP Redemptions"
                value={vipRedemptions.toLocaleString()}
                icon={<Crown className="h-5 w-5 text-[#8698bb]" aria-hidden />}
              />
              <StatTile
                label="Gold Redemptions"
                value={goldRedemptions.toLocaleString()}
                icon={<Award className="h-5 w-5 text-[#8698bb]" aria-hidden />}
              />
            </div>
            <StatTile
              label="Silver Redemptions"
              value={silverRedemptions.toLocaleString()}
              icon={<Medal className="h-5 w-5 text-[#8698bb]" aria-hidden />}
            />
          </div>
        )}

        <div className="mt-6 border-t border-[#eef1f7]" />

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full bg-[#f7f7f7] px-10 py-2.5 text-[14px] font-semibold text-[#0a152f] transition hover:bg-[#eef1f7]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => reward && onEdit(reward)}
            className="rounded-full bg-[#feb602] px-10 py-2.5 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(254,182,2,0.35)] transition hover:bg-[#e29f00]"
          >
            Edit Reward
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[12px] border border-[#d7ddea] bg-white p-4">
      <div className="flex items-center gap-4">
        <p className="flex-1 text-[14px] text-[#737373]">{label}</p>
        {icon}
      </div>
      <p className="text-[20px] font-semibold leading-none text-[#0a152f]">
        {value}
      </p>
    </div>
  );
}


