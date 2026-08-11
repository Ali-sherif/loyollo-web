import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import {
  Plus,
  MapPin,
  Users as UsersIcon,
  Gift,
  MoreHorizontal,
  GitBranch as GitBranchIcon,
  UserCheck,
  Search,
  ArrowUpDown,
  ChevronDown,
  Calendar as CalendarIcon,
  AlertTriangle,
  Info,
  ArrowUpRight,
} from "lucide-react";

import { type Plan, PLAN_LIMITS, NEXT_PLAN, PLAN_LABEL } from "@/lib/plans";
import { useAuth } from "@/hooks/use-auth";
import { notifyBranchAdded } from "@/lib/notify-client";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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

export const Route = createFileRoute("/branches/")({
  head: () => ({
    meta: [
      { title: "Branches — Loyalty" },
      {
        name: "description",
        content:
          "Manage business locations, track performance, and compare loyalty activity across branches.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BranchesPage,
});

type Branch = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  manager_name: string | null;
  is_main: boolean;
  is_active: boolean;
  created_at: string;
};

export type BranchFormData = {
  name: string;
  address: string;
  city: string;
  email: string;
  phone: string;
  manager_name: string;
  is_main: boolean;
};

// Parse profiles.num_locations ("1", "2-5", "6-10", "10+", ...) into a target count.
function parseTargetCount(v: string | null | undefined): number {
  if (!v) return 1;
  const s = v.trim();
  if (s === "1") return 1;
  const range = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) return parseInt(range[1], 10); // low end of stated range
  const plus = s.match(/^(\d+)\s*\+$/);
  if (plus) return parseInt(plus[1], 10);
  const num = parseInt(s, 10);
  return Number.isFinite(num) && num > 0 ? num : 1;
}

const PALETTE = ["#0f1c3d", "#44b678", "#feb602", "#a3a3a3", "#344f89", "#c48a5b"];

function BranchesPage() {
  const navigate = useNavigate();
  const { user, isVerified, loading, signOut } = useAuth();

  const [firstName, setFirstName] = React.useState("");
  const [ready, setReady] = React.useState(false);
  const [numLocations, setNumLocations] = React.useState<string | null>(null);
  const [mainLocation, setMainLocation] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<Plan>("starter");
  const [programId, setProgramId] = React.useState<string | null>(null);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [customerCount, setCustomerCount] = React.useState(0);
  const [activeCustomers, setActiveCustomers] = React.useState(0);
  const [rewardsRedeemed, setRewardsRedeemed] = React.useState(0);

  const [addOpen, setAddOpen] = React.useState(false);
  const [addPresetMain, setAddPresetMain] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Branch | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Branch | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<"newest" | "name">("newest");

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
        .select("full_name, onboarding_completed, num_locations, main_location, plan")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile?.onboarding_completed) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      const full = (profile?.full_name as string | null)?.trim() ?? "";
      setFirstName(full.split(/\s+/)[0] || (user.email?.split("@")[0] ?? ""));
      setNumLocations((profile?.num_locations as string | null) ?? "1");
      setMainLocation((profile?.main_location as string | null) ?? null);
      const p = (profile as { plan?: string } | null)?.plan;
      if (p === "starter" || p === "growth" || p === "premium") setPlan(p);

      const { data: rows } = await supabase
        .from("branches")
        .select(
          "id, name, address, city, email, phone, manager_name, is_main, is_active, created_at",
        )
        .eq("owner_id", user.id)
        .order("is_main", { ascending: false })
        .order("created_at", { ascending: true });
      setBranches((rows as Branch[] | null) ?? []);

      const { data: program } = await supabase
        .from("loyalty_programs")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      const pid = program?.id ?? null;
      setProgramId(pid);
      if (pid) {
        const [{ data: cs }, { data: rs }] = await Promise.all([
          supabase.from("customers").select("status").eq("loyalty_program_id", pid),
          supabase.from("rewards").select("redeemed_count").eq("loyalty_program_id", pid),
        ]);
        setCustomerCount(cs?.length ?? 0);
        setActiveCustomers(
          (cs ?? []).filter((c) => (c as { status: string }).status === "active").length,
        );
        setRewardsRedeemed(
          (rs ?? []).reduce(
            (s, r) => s + ((r as { redeemed_count: number }).redeemed_count ?? 0),
            0,
          ),
        );
      }
      setReady(true);
    })();
  }, [user, isVerified, loading, navigate]);

  const target = parseTargetCount(numLocations);
  const missingCount = Math.max(0, target - branches.length);
  const canAddBeyondTarget = branches.length >= target;

  const planLimit = PLAN_LIMITS[plan];
  const nextPlan = NEXT_PLAN[plan];
  const nextPlanLimit = nextPlan ? PLAN_LIMITS[nextPlan] : null;
  const atLimit = branches.length >= planLimit;
  const oneAway = branches.length === planLimit - 1;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = branches.filter(
      (b) =>
        !q ||
        b.name.toLowerCase().includes(q) ||
        (b.city ?? "").toLowerCase().includes(q) ||
        (b.address ?? "").toLowerCase().includes(q),
    );
    if (sort === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [branches, query, sort]);

  // Even distribution placeholder (no per-branch revenue source yet).
  // TODO(feature): wire real per-branch revenue once transactions are tracked.
  const perfSlices = React.useMemo(() => {
    if (branches.length === 0) return [] as { name: string; pct: number; color: string }[];
    const even = Math.floor(100 / branches.length);
    const remainder = 100 - even * branches.length;
    return branches.map((b, i) => ({
      name: b.name,
      pct: even + (i === 0 ? remainder : 0),
      color: PALETTE[i % PALETTE.length],
    }));
  }, [branches]);

  const handleAdd = async (data: BranchFormData) => {
    if (!user) return;
    // Enforce single main branch: if flagged main, unflag existing main(s) first.
    if (data.is_main) {
      await supabase
        .from("branches")
        .update({ is_main: false })
        .eq("owner_id", user.id)
        .eq("is_main", true);
    }
    const { data: row, error } = await supabase
      .from("branches")
      .insert({
        owner_id: user.id,
        name: data.name.trim(),
        address: data.address.trim() || null,
        city: data.city.trim() || null,
        email: data.email.trim() || null,
        phone: data.phone.trim() || null,
        manager_name: data.manager_name.trim() || null,
        is_main: data.is_main,
      })
      .select("id, name, address, city, email, phone, manager_name, is_main, is_active, created_at")
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }
    setBranches((prev) => {
      const next = data.is_main ? prev.map((b) => ({ ...b, is_main: false })) : prev.slice();
      return [...next, row as Branch].sort(
        (a, b) =>
          Number(b.is_main) - Number(a.is_main) ||
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    });
    setAddOpen(false);
    setAddPresetMain(false);
    notifyBranchAdded({
      userId: user.id,
      branchId: (row as Branch).id,
      branchName: (row as Branch).name,
    });
    toast.success("Branch added");
  };

  const handleEdit = async (data: BranchFormData) => {
    if (!editTarget || !user) return;
    if (data.is_main && !editTarget.is_main) {
      await supabase
        .from("branches")
        .update({ is_main: false })
        .eq("owner_id", user.id)
        .eq("is_main", true);
    }
    const { data: row, error } = await supabase
      .from("branches")
      .update({
        name: data.name.trim(),
        address: data.address.trim() || null,
        city: data.city.trim() || null,
        email: data.email.trim() || null,
        phone: data.phone.trim() || null,
        manager_name: data.manager_name.trim() || null,
        is_main: data.is_main,
      })
      .eq("id", editTarget.id)
      .select("id, name, address, city, email, phone, manager_name, is_main, is_active, created_at")
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }
    setBranches((prev) => {
      const mapped = prev.map((b) => {
        if (b.id === editTarget.id) return row as Branch;
        return data.is_main ? { ...b, is_main: false } : b;
      });
      return mapped.sort(
        (a, b) =>
          Number(b.is_main) - Number(a.is_main) ||
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    });
    setEditTarget(null);
    toast.success("Branch updated");
  };

  const handleToggleActive = async (b: Branch, next: boolean) => {
    const { error } = await supabase.from("branches").update({ is_active: next }).eq("id", b.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBranches((prev) => prev.map((x) => (x.id === b.id ? { ...x, is_active: next } : x)));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("branches").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBranches((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Branch deleted");
  };

  if (loading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
      </div>
    );
  }

  // Per-branch stats (equal split; TODO(feature) once transactions tracked).
  const perBranchCustomers = branches.length ? Math.round(customerCount / branches.length) : 0;
  const perBranchRedemptions = branches.length ? Math.round(rewardsRedeemed / branches.length) : 0;

  return (
    <DashboardShell firstName={firstName} onSignOut={signOut}>
      <div className="mx-auto max-w-[1180px] space-y-6">
        {oneAway && nextPlan && nextPlanLimit ? (
          <div className="flex flex-col gap-3 rounded-[20px] border border-[#fff1bf] bg-[#fff9e6] p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#ffe48a] bg-[#fff1bf]">
                <AlertTriangle className="h-5 w-5 text-[#e29f00]" aria-hidden />
              </span>
              <p className="min-w-0 flex-1 text-[14px] font-semibold text-[#0a152f] sm:text-[15px]">
                Upgrade to {PLAN_LABEL[nextPlan]} to add up to {nextPlanLimit} locations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: "/pricing" })}
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#feb602] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(254,182,2,0.35)] hover:bg-[#e29f00]"
            >
              Upgrade Now
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}
        {atLimit ? (
          <div className="flex flex-col gap-3 rounded-[20px] border border-[#b0bcd4] bg-[#dbeafe] p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#b0bcd4] bg-[#dbeafe]">
                <Info className="h-5 w-5 text-[#344f89]" aria-hidden />
              </span>
              <p className="min-w-0 flex-1 text-[14px] font-semibold text-[#0a152f] sm:text-[15px]">
                You have used {branches.length} of {planLimit} available locations.
              </p>
            </div>
            {nextPlan && nextPlanLimit ? (
              <button
                type="button"
                onClick={() => navigate({ to: "/pricing" })}
                className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#feb602] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(254,182,2,0.35)] hover:bg-[#e29f00]"
              >
                Upgrade to {PLAN_LABEL[nextPlan]}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
        ) : null}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-bold leading-[1.2] text-[#0a152f]">Branches</h1>
            <p className="mt-2 text-[14px] text-[#737373]">
              Manage your business locations, track performance, and compare loyalty activity across
              branches.
            </p>
          </div>
          {!atLimit ? (
            <button
              type="button"
              onClick={() => {
                setAddPresetMain(branches.length === 0);
                setAddOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#feb602] px-5 py-2.5 text-sm font-semibold text-[#0a152f] shadow-[0_4px_14px_rgba(254,182,2,0.35)] hover:bg-[#e29f00]"
            >
              <Plus className="h-4 w-4 text-[#0a152f]" aria-hidden />
              Add Branch
            </button>
          ) : null}
        </header>

        {/* Card grid */}
        <section className="rounded-[16px] bg-white p-4 shadow-[0_1px_2px_rgba(15,28,61,0.04)] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-[360px]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, or phone"
                className="h-10 w-full rounded-full border-0 bg-[#f5f7fb] pl-9 pr-4 text-sm text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
              />
            </div>
            <button
              type="button"
              onClick={() => setSort((s) => (s === "newest" ? "name" : "newest"))}
              className="inline-flex items-center gap-2 rounded-full bg-[#f5f7fb] px-4 py-2 text-sm font-medium text-[#0a152f]"
            >
              <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
              Sort by {sort === "newest" ? "Newest" : "Name"}
              <ChevronDown className="h-3 w-3 text-[#737373]" aria-hidden />
            </button>
          </div>

          {branches.length === 0 && missingCount === 0 ? (
            <EmptyBranches onAdd={() => setAddOpen(true)} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((b) => (
                <BranchCard
                  key={b.id}
                  branch={b}
                  customerCount={perBranchCustomers}
                  redemptions={perBranchRedemptions}
                  onView={() => navigate({ to: "/branches/$branchId", params: { branchId: b.id } })}
                  onToggleActive={(next) => handleToggleActive(b, next)}
                  onEdit={() => setEditTarget(b)}
                  onDelete={() => setDeleteTarget(b)}
                />
              ))}
              {query === "" &&
                Array.from({
                  length: Math.max(0, Math.min(missingCount, planLimit - branches.length)),
                }).map((_, i) => {
                  const isMainSlot = branches.length === 0 && i === 0;
                  return (
                    <PlaceholderBranchCard
                      key={`placeholder-${i}`}
                      label={
                        isMainSlot && mainLocation
                          ? `Main Location · ${mainLocation}`
                          : `Branch ${branches.length + i + 1}`
                      }
                      onAdd={() => {
                        setAddPresetMain(isMainSlot);
                        setAddOpen(true);
                      }}
                    />
                  );
                })}
            </div>
          )}

          {canAddBeyondTarget && branches.length > 0 ? (
            <p className="mt-4 text-[12px] text-[#737373]">
              You reached the {target} location{target === 1 ? "" : "s"} declared in onboarding. You
              can still add more branches as your business grows.
            </p>
          ) : null}
        </section>

        {/* Performance + Stats */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          <div className="rounded-[16px] bg-white p-5 shadow-[0_1px_2px_rgba(15,28,61,0.04)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-bold text-[#0a152f]">Performance</h2>
                <p className="mt-1 text-[13px] text-[#737373]">By revenue</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-[#f5f7fb] px-3 py-1.5 text-[12px] font-medium text-[#0a152f]"
              >
                <CalendarIcon className="h-3.5 w-3.5" aria-hidden />
                This month
                <ChevronDown className="h-3 w-3 text-[#737373]" aria-hidden />
              </button>
            </div>
            {perfSlices.length === 0 ? (
              <div className="mt-6 flex h-[220px] items-center justify-center text-[13px] text-[#737373]">
                Add a branch to see performance breakdown.
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-6">
                <Donut
                  slices={perfSlices.map((s) => ({
                    name: s.name,
                    count: s.pct,
                    color: s.color,
                  }))}
                  centerLabel="—"
                  centerSub="Revenue"
                />
                <ul className="grid w-full grid-cols-2 gap-y-2 gap-x-4">
                  {perfSlices.map((s) => (
                    <li key={s.name} className="flex items-center gap-2 text-[12px]">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                      <span className="min-w-0 flex-1 truncate text-[#0a152f]">{s.name}</span>
                      <span className="text-[#737373]">{s.pct}%</span>
                    </li>
                  ))}
                </ul>
                {/* TODO(feature): revenue per branch requires transaction tracking. */}
              </div>
            )}
          </div>

          <div className="rounded-[16px] bg-white p-5 shadow-[0_1px_2px_rgba(15,28,61,0.04)] sm:p-6">
            <h2 className="text-[16px] font-bold text-[#0a152f]">Branches stats</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatTile
                label="Total Branches"
                value={branches.length.toLocaleString()}
                icon={<GitBranchIcon className="h-4 w-4 text-[#344f89]" />}
              />
              <StatTile
                label="Total Customers"
                value={customerCount.toLocaleString()}
                icon={<UsersIcon className="h-4 w-4 text-[#344f89]" />}
              />
              <StatTile
                label="Active Loyalty Members"
                value={activeCustomers.toLocaleString()}
                icon={<UserCheck className="h-4 w-4 text-[#44b678]" />}
              />
              <StatTile
                label="Rewards Redeemed"
                value={rewardsRedeemed.toLocaleString()}
                icon={<Gift className="h-4 w-4 text-[#feb602]" />}
              />
            </div>
          </div>
        </section>
      </div>

      <BranchDialog
        open={addOpen}
        title="Add Branch"
        submitLabel="Add branch"
        initial={{
          name: addPresetMain && mainLocation ? mainLocation : "",
          address: "",
          city: "",
          email: "",
          phone: "",
          manager_name: "",
          is_main: addPresetMain || branches.length === 0,
        }}
        onSubmit={handleAdd}
        onClose={() => {
          setAddOpen(false);
          setAddPresetMain(false);
        }}
      />
      <BranchDialog
        open={!!editTarget}
        title="Edit Branch"
        submitLabel="Save changes"
        initial={
          editTarget
            ? {
                name: editTarget.name,
                address: editTarget.address ?? "",
                city: editTarget.city ?? "",
                email: editTarget.email ?? "",
                phone: editTarget.phone ?? "",
                manager_name: editTarget.manager_name ?? "",
                is_main: editTarget.is_main,
              }
            : {
                name: "",
                address: "",
                city: "",
                email: "",
                phone: "",
                manager_name: "",
                is_main: false,
              }
        }

        onSubmit={handleEdit}
        onClose={() => setEditTarget(null)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete branch?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes “{deleteTarget?.name}” from your locations. This action can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}

function BranchCard({
  branch,
  customerCount,
  redemptions,
  onView,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  branch: Branch;
  customerCount: number;
  redemptions: number;
  onView: () => void;
  onToggleActive: (next: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-[#eef1f7] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold text-[#0a152f]">{branch.name}</h3>
            {branch.is_main ? (
              <span className="rounded-full bg-[#fff9e6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#e29f00]">
                Main
              </span>
            ) : null}
          </div>
          <p className="mt-1 flex items-center gap-1 truncate text-[13px] text-[#737373]">
            <MapPin className="h-3.5 w-3.5 text-[#a3a3a3]" aria-hidden />
            {branch.city || branch.address || "—"}
          </p>
        </div>
        <Toggle checked={branch.is_active} onChange={onToggleActive} />
      </div>

      <div className="flex items-center gap-4 border-t border-dashed border-[#eef1f7] pt-3 text-[12px] text-[#525252]">
        <span className="flex items-center gap-1.5">
          <UsersIcon className="h-3.5 w-3.5 text-[#a3a3a3]" aria-hidden />
          {customerCount.toLocaleString()} customers
        </span>
        <span className="text-[#e5e7eb]">·</span>
        <span className="flex items-center gap-1.5">
          <Gift className="h-3.5 w-3.5 text-[#a3a3a3]" aria-hidden />
          {redemptions.toLocaleString()} rewards redeemed
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onView}
          className="flex-1 rounded-full bg-white px-3 py-2 text-[13px] font-medium text-[#0a152f] shadow-[0_1px_2px_rgba(15,28,61,0.06)] ring-1 ring-[#eef1f7] hover:bg-[#f5f7fb]"
        >
          View Details
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(15,28,61,0.06)] ring-1 ring-[#eef1f7]"
              aria-label="More"
            >
              <MoreHorizontal className="h-4 w-4 text-[#0a152f]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Edit branch</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function PlaceholderBranchCard({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex min-h-[178px] flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-[#d5dbe8] bg-[#fafbfe] p-4 text-center text-[#344f89] hover:border-[#feb602] hover:bg-[#fff9e6]/40"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-[#eef1f7]">
        <Plus className="h-4 w-4 text-[#344f89]" aria-hidden />
      </span>
      <span className="text-[13px] font-semibold">{label}</span>
      <span className="text-[12px] text-[#737373]">Add branch details</span>
    </button>
  );
}

function EmptyBranches({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef1f7]">
        <GitBranchIcon className="h-6 w-6 text-[#344f89]" aria-hidden />
      </span>
      <h3 className="text-[16px] font-bold text-[#0a152f]">No branches yet</h3>
      <p className="max-w-[320px] text-[13px] text-[#737373]">
        Add your first business location to start tracking performance per branch.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#feb602] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(254,182,2,0.35)] hover:bg-[#e29f00]"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Add Branch
      </button>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked ? "bg-[#44b678]" : "bg-[#d5dbe8]"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[12px] bg-[#f5f7fb] p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] text-[#525252]">{label}</p>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
          {icon}
        </span>
      </div>
      <p className="mt-2 text-[20px] font-bold text-[#0a152f]">{value}</p>
    </div>
  );
}

function Donut({
  slices,
  centerLabel,
  centerSub,
}: {
  slices: { name: string; count: number; color: string }[];
  centerLabel: string;
  centerSub: string;
}) {
  const size = 200;
  const stroke = 28;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((s, x) => s + x.count, 0) || 1;
  let acc = 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Branch performance"
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef1f7" strokeWidth={stroke} />
      {slices.map((s) => {
        const len = (s.count / total) * c;
        const dash = `${len} ${c - len}`;
        const rotation = (acc / total) * 360 - 90;
        acc += s.count;
        return (
          <circle
            key={s.name}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={dash}
            transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
          />
        );
      })}
      <text
        x="50%"
        y="46%"
        textAnchor="middle"
        className="fill-[#0a152f]"
        style={{ fontSize: 20, fontWeight: 700 }}
      >
        {centerLabel}
      </text>
      <text x="50%" y="60%" textAnchor="middle" className="fill-[#737373]" style={{ fontSize: 12 }}>
        {centerSub}
      </text>
    </svg>
  );
}

export function BranchDialog({
  open,
  title,
  submitLabel,
  initial,
  onSubmit,
  onClose,
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  initial: BranchFormData;
  onSubmit: (data: BranchFormData) => Promise<void> | void;
  onClose: () => void;
}) {
  const [data, setData] = React.useState<BranchFormData>(initial);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) setData(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Give this location a name and address so you can track loyalty activity per branch.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!data.name.trim()) {
              toast.error("Branch name is required");
              return;
            }
            setSaving(true);
            try {
              await onSubmit(data);
            } finally {
              setSaving(false);
            }
          }}
          className="space-y-3"
        >
          <Field label="Branch name">
            <input
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="Downtown Branch"
              className="h-10 w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
            />
          </Field>
          <Field label="Address">
            <input
              value={data.address}
              onChange={(e) => setData({ ...data, address: e.target.value })}
              placeholder="123 Main Street"
              className="h-10 w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
            />
          </Field>
          <Field label="City">
            <input
              value={data.city}
              onChange={(e) => setData({ ...data, city: e.target.value })}
              placeholder="Toronto"
              className="h-10 w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
            />
          </Field>
          <Field label="Branch email">
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              placeholder="branch@example.com"
              className="h-10 w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
            />
          </Field>
          <Field label="Branch phone number">
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="h-10 w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
            />
          </Field>
          <Field label="Manager name">
            <input
              type="text"
              value={data.manager_name}
              onChange={(e) => setData({ ...data, manager_name: e.target.value })}
              placeholder="Jane Smith"
              className="h-10 w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
            />
          </Field>

          <label className="flex items-center gap-2 pt-1 text-[13px] text-[#0a152f]">
            <input
              type="checkbox"
              checked={data.is_main}
              onChange={(e) => setData({ ...data, is_main: e.target.checked })}
              className="h-4 w-4 rounded border-[#d5dbe8] text-[#feb602] focus:ring-[#feb602]/40"
            />
            Set as main location
          </label>
          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#0a152f] ring-1 ring-[#eef1f7] hover:bg-[#f5f7fb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#feb602] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(254,182,2,0.35)] hover:bg-[#e29f00] disabled:opacity-60"
            >
              {saving ? "Saving…" : submitLabel}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-[#525252]">{label}</span>
      {children}
    </label>
  );
}
