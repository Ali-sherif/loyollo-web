import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import {
  Users,
  Activity,
  UserPlus,
  Crown,
  UserCog,
  AlertTriangle,
  Plus,
  Loader2,
  MoreHorizontal,
  Award,
  Search,
  ChevronDown,
  Calendar as CalendarIcon,
  X,
  Download,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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
import customersEmpty from "@/assets/customers-empty-illustration.png";

export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [
      { title: "Customers — Loyalty" },
      {
        name: "description",
        content: "Manage your loyalty members, track activity, and reach out directly.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomersPage,
});

type Customer = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  tier: string | null;
  points: number;
  visits: number;
  status: string;
  last_activity_at: string | null;
};

type CustomerFormData = {
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
};

function CustomersPage() {
  const navigate = useNavigate();
  const { user, isVerified, loading, signOut } = useAuth();

  const [firstName, setFirstName] = React.useState("");
  const [ready, setReady] = React.useState(false);
  const [programId, setProgramId] = React.useState<string | null>(null);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Customer | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const [search, setSearch] = React.useState("");
  const [tier, setTier] = React.useState<TierFilter>("all");
  const [status, setStatus] = React.useState<StatusTab>("all");
  const [sort, setSort] = React.useState<SortKey>("name_asc");
  const [dateRange, setDateRange] = React.useState<{
    from?: Date;
    to?: Date;
  }>({});

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = customers.filter((c) => {
      if (q) {
        const hay = `${c.full_name} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (tier !== "all" && (c.tier ?? "").toLowerCase() !== tier) return false;
      if (status !== "all" && c.status !== status) return false;
      if (dateRange.from || dateRange.to) {
        if (!c.last_activity_at) return false;
        const t = new Date(c.last_activity_at).getTime();
        if (Number.isNaN(t)) return false;
        if (dateRange.from && t < dateRange.from.setHours(0, 0, 0, 0)) return false;
        if (dateRange.to && t > new Date(dateRange.to).setHours(23, 59, 59, 999)) return false;
      }
      return true;
    });

    const sorted = [...out];
    sorted.sort((a, b) => {
      switch (sort) {
        case "name_asc":
          return a.full_name.localeCompare(b.full_name);
        case "name_desc":
          return b.full_name.localeCompare(a.full_name);
        // TODO(feature): revenue tracking not yet wired — sort by points as proxy
        case "revenue_desc":
        case "points_desc":
          return b.points - a.points;
        case "revenue_asc":
        case "points_asc":
          return a.points - b.points;
        default:
          return 0;
      }
    });
    return sorted;
  }, [customers, search, tier, status, sort, dateRange]);

  const exportCsv = React.useCallback(() => {
    if (filtered.length === 0) {
      toast.info("No customers to export.");
      return;
    }
    const rows = [
      [
        "Name",
        "Email",
        "Phone",
        "Tier",
        "Points",
        "Visits",
        "Status",
        "Last Visit Date",
        "Birth Date",
      ],
      ...filtered.map((c) => [
        c.full_name,
        c.email ?? "",
        c.phone ?? "",
        c.tier ?? "",
        c.points,
        c.visits,
        c.status,
        c.last_activity_at ? format(new Date(c.last_activity_at), "yyyy-MM-dd") : "",
        c.birth_date ?? "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [filtered]);

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
        .select("full_name, onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile?.onboarding_completed) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      const full = (profile?.full_name as string | null)?.trim() ?? "";
      setFirstName(full.split(/\s+/)[0] || (user.email?.split("@")[0] ?? ""));

      const { data: program } = await supabase
        .from("loyalty_programs")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      const pid = program?.id ?? null;
      setProgramId(pid);
      if (pid) {
        const { data: rows } = await supabase
          .from("customers")
          .select(
            "id, full_name, email, phone, birth_date, tier, points, visits, status, last_activity_at",
          )
          .eq("loyalty_program_id", pid)
          .order("created_at", { ascending: false });
        setCustomers((rows as Customer[] | null) ?? []);
      }
      setReady(true);
    })();
  }, [user, isVerified, loading, navigate]);

  const total = customers.length;
  const active = customers.filter((c) => c.status === "active").length;
  const goldVip = customers.filter(
    (c) => (c.tier ?? "").toLowerCase() === "gold" || (c.tier ?? "").toLowerCase() === "vip",
  ).length;
  const silver = customers.filter((c) => (c.tier ?? "").toLowerCase() === "silver").length;
  const atRisk = customers.filter((c) => c.status === "at_risk").length;

  const handleAdd = async (data: CustomerFormData) => {
    if (!programId) {
      toast.error("Create your loyalty program first", {
        action: {
          label: "Create program",
          onClick: () => navigate({ to: "/loyalty-program" }),
        },
      });
      return;
    }
    const { data: row, error } = await supabase
      .from("customers")
      .insert({
        loyalty_program_id: programId,
        full_name: data.full_name.trim(),
        email: data.email.trim() || null,
        phone: data.phone.trim() || null,
        birth_date: data.birth_date || null,
        status: "active",
      })
      .select(
        "id, full_name, email, phone, birth_date, tier, points, visits, status, last_activity_at",
      )
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setCustomers((prev) => [row as Customer, ...prev]);
    setAddOpen(false);
    toast.success("Customer added");
  };

  const handleEdit = async (data: CustomerFormData) => {
    if (!editTarget) return;
    const { data: row, error } = await supabase
      .from("customers")
      .update({
        full_name: data.full_name.trim(),
        email: data.email.trim() || null,
        phone: data.phone.trim() || null,
        birth_date: data.birth_date || null,
      })
      .eq("id", editTarget.id)
      .select(
        "id, full_name, email, phone, birth_date, tier, points, visits, status, last_activity_at",
      )
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setCustomers((prev) => prev.map((c) => (c.id === editTarget.id ? (row as Customer) : c)));
    setEditTarget(null);
    toast.success("Customer updated");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("customers").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Customer deleted");
  };

  if (loading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
      </div>
    );
  }

  const isEmpty = customers.length === 0;

  return (
    <DashboardShell firstName={firstName} onSignOut={signOut}>
      <div className="mx-auto max-w-[1140px] space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-bold leading-[1.2] text-[#0a152f]">Customers</h1>
            <p className="mt-2 text-[14px] text-[#737373]">
              Manage your loyalty members, track activity, and reach out directly
            </p>
          </div>
          {!isEmpty && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#0a152f] ring-1 ring-[#d7ddea] transition hover:bg-[#f7f8fb]"
              >
                <Download className="h-4 w-4 text-[#0a152f]" aria-hidden />
                Export
              </button>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-[#feb602] px-4 py-2.5 text-sm font-semibold text-[#0a152f] shadow-[0_1px_8px_rgba(0,0,0,0.12)] transition hover:bg-[#e29f00]"
              >
                <Plus className="h-4 w-4 text-[#0a152f]" aria-hidden />
                Add Customer
              </button>
            </div>
          )}
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total Customers" value={total} icon={Users} iconColor="#344f89" />
          <StatCard label="Active Customers" value={active} icon={Activity} iconColor="#44b678" />
          <StatCard label="New this month" value={goldVip} icon={UserPlus} iconColor="#feb602" />
          <StatCard label="Returning Rate" value={silver} icon={UserCog} iconColor="#a3a3a3" />
          <StatCard
            label="At-Risk Customers"
            value={atRisk}
            icon={AlertTriangle}
            iconColor="#e53935"
          />
        </section>

        {isEmpty ? (
          <section className="flex flex-col items-center gap-6 rounded-[16px] bg-white px-8 py-12 text-center shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
            <img
              src={customersEmpty}
              alt=""
              width={177}
              height={150}
              loading="lazy"
              className="h-[150px] w-[177px] object-contain"
            />
            <div className="max-w-[520px] space-y-2">
              <h2 className="text-[24px] font-bold leading-[1.2] text-[#0a152f]">
                Build Your Customer Community!
              </h2>
              <p className="text-[16px] text-[#737373]">
                Start enrolling customers through QR codes or manual entry to grow your loyalty
                program.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#feb602] px-6 py-3 text-sm font-semibold text-white shadow-[0_1px_8px_rgba(0,0,0,0.12)] transition hover:bg-[#e29f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add Customer
            </button>
          </section>
        ) : (
          <CustomersTable
            customers={customers}
            filtered={filtered}
            search={search}
            setSearch={setSearch}
            tier={tier}
            setTier={setTier}
            status={status}
            setStatus={setStatus}
            sort={sort}
            setSort={setSort}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onEdit={(c) => setEditTarget(c)}
            onDelete={(c) => setDeleteTarget(c)}
          />
        )}
      </div>

      <AddCustomerDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAdd} mode="add" />
      <AddCustomerDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        onSubmit={handleEdit}
        mode="edit"
        initial={editTarget}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this customer?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.full_name}" will be permanently removed from your loyalty program
              along with their points and activity history.
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
              {deleting ? "Removing…" : "Delete customer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}

type SortKey =
  "name_asc" | "name_desc" | "revenue_desc" | "revenue_asc" | "points_desc" | "points_asc";

type TierFilter = "all" | "vip" | "gold" | "silver" | "bronze";
type StatusTab = "all" | "active" | "at_risk" | "churned";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name_asc", label: "A – Z" },
  { value: "name_desc", label: "Z – A" },
  { value: "revenue_desc", label: "Highest revenue" },
  { value: "revenue_asc", label: "Lowest revenue" },
  { value: "points_desc", label: "Highest points" },
  { value: "points_asc", label: "Lowest points" },
];

const TIER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: "all", label: "All tiers" },
  { value: "vip", label: "VIP" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "bronze", label: "Bronze" },
];

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "at_risk", label: "At-Risk" },
  { value: "churned", label: "Churned" },
];

function CustomersTable({
  customers,
  filtered,
  search,
  setSearch,
  tier,
  setTier,
  status,
  setStatus,
  sort,
  setSort,
  dateRange,
  setDateRange,
  onEdit,
  onDelete,
}: {
  customers: Customer[];
  filtered: Customer[];
  search: string;
  setSearch: (v: string) => void;
  tier: TierFilter;
  setTier: (v: TierFilter) => void;
  status: StatusTab;
  setStatus: (v: StatusTab) => void;
  sort: SortKey;
  setSort: (v: SortKey) => void;
  dateRange: { from?: Date; to?: Date };
  setDateRange: (v: { from?: Date; to?: Date }) => void;
  onEdit: (c: Customer) => void;
  onDelete: (c: Customer) => void;
}) {
  const navigate = useNavigate();

  const activeSortLabel = SORT_OPTIONS.find((s) => s.value === sort)?.label ?? "Sort";
  const activeTierLabel = TIER_OPTIONS.find((t) => t.value === tier)?.label ?? "All tiers";

  const dateLabel = (() => {
    if (dateRange.from && dateRange.to)
      return `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}`;
    if (dateRange.from) return `From ${format(dateRange.from, "MMM d, yyyy")}`;
    if (dateRange.to) return `Until ${format(dateRange.to, "MMM d, yyyy")}`;
    return "Last visit";
  })();

  return (
    <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#eef1f7] pb-3">
        {STATUS_TABS.map((t) => {
          const isActive = status === t.value;
          const count =
            t.value === "all"
              ? customers.length
              : customers.filter((c) => c.status === t.value).length;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setStatus(t.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition",
                isActive
                  ? "bg-[#0a152f] text-white"
                  : "text-[#525252] hover:bg-[#eef1f7] hover:text-[#0a152f]",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  isActive ? "bg-white/15 text-white" : "bg-[#eef1f7] text-[#525252]",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + filters + sort */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex h-11 w-full max-w-[372px] items-center rounded-full bg-[#fafafa] px-4 ring-1 ring-[#eef1f7] focus-within:ring-2 focus-within:ring-[#feb602]">
          <Search className="h-4 w-4 text-[#8698bb]" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone"
            className="ml-3 w-full bg-transparent text-[14px] text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tier filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-[#eef1f7] text-[13px] font-medium text-[#0a152f] transition hover:bg-[#f7f8fb]"
              >
                {activeTierLabel}
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {TIER_OPTIONS.map((t) => (
                <DropdownMenuItem key={t.value} onSelect={() => setTier(t.value)}>
                  {t.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Last visit date range */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-[#eef1f7] text-[13px] font-medium text-[#0a152f] transition hover:bg-[#f7f8fb]"
              >
                <CalendarIcon className="h-4 w-4" aria-hidden />
                {dateLabel}
                {(dateRange.from || dateRange.to) && (
                  <span
                    role="button"
                    aria-label="Clear date filter"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateRange({});
                    }}
                    className="ml-1 rounded-full p-0.5 hover:bg-[#eef1f7]"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(r) => setDateRange({ from: r?.from, to: r?.to })}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-[#eef1f7] text-[13px] font-medium text-[#0a152f] transition hover:bg-[#f7f8fb]"
              >
                Sort: {activeSortLabel}
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {SORT_OPTIONS.map((s) => (
                <DropdownMenuItem key={s.value} onSelect={() => setSort(s.value)}>
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1060px] border-collapse text-left">
          <thead>
            <tr className="text-[13px] font-medium text-[#525252]">
              <Th className="w-[253px]">Customer</Th>
              <Th className="w-[121px]">Phone</Th>
              <Th className="w-[120px]">Tier</Th>
              <Th className="w-[108px]">Points</Th>
              <Th className="w-[117px]">Revenue</Th>
              <Th className="w-[95px]">Visits</Th>
              <Th className="w-[122px]">Last Visit</Th>
              <Th className="w-[120px]">Status</Th>
              <Th className="w-[44px]"> </Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-[13px] text-[#737373]">
                  No customers match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-t border-[#eef1f7] text-[14px] text-[#0a152f]">
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.full_name} />
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold text-[#0a152f]">
                          {c.full_name}
                        </div>
                        <div className="truncate text-[13px] text-[#737373]">{c.email ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-[13px] text-[#525252]">{c.phone ?? "—"}</td>
                  <td className="px-3 py-4">
                    <TierBadge tier={c.tier} />
                  </td>
                  <td className="px-3 py-4 text-[13px] font-semibold text-[#0a152f]">
                    {c.points.toLocaleString()}
                  </td>
                  <td className="px-3 py-4 text-[13px] font-semibold text-[#0a152f]">
                    {/* TODO(feature): revenue tracking not yet wired */}—
                  </td>
                  <td className="px-3 py-4 text-[13px] text-[#0a152f]">{c.visits}</td>
                  <td className="px-3 py-4 text-[13px] text-[#525252]">
                    {formatLastVisit(c.last_activity_at)}
                  </td>
                  <td className="px-3 py-4">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-3 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Actions for ${c.full_name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#525252] transition hover:bg-[#eef1f7] hover:text-[#0a152f]"
                        >
                          <MoreHorizontal className="h-5 w-5" aria-hidden />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onSelect={() =>
                            navigate({
                              to: "/customers/$customerId",
                              params: { customerId: c.id },
                            })
                          }
                        >
                          View profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onEdit(c)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate({ to: "/campaigns" })}>
                          Send Campaign
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => onDelete(c)}
                          className="text-red-600 focus:text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-4 text-left text-[13px] font-medium text-[#525252] ${className}`}>
      {children}
    </th>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = React.useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);
  return (
    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#eef1f7] text-[12px] font-semibold text-[#344f89]">
      {initials}
    </div>
  );
}

function TierBadge({ tier }: { tier: string | null }) {
  const key = (tier ?? "").toLowerCase();
  const config: Record<string, { label: string; bg: string; fg: string; icon: React.ReactNode }> = {
    vip: {
      label: "VIP",
      bg: "#f3ecff",
      fg: "#6b3fa0",
      icon: <Crown className="h-[14px] w-[14px]" aria-hidden />,
    },
    gold: {
      label: "Gold",
      bg: "#fff4d6",
      fg: "#8a6100",
      icon: <Crown className="h-[14px] w-[14px]" aria-hidden />,
    },
    silver: {
      label: "Silver",
      bg: "#eef1f7",
      fg: "#525252",
      icon: <Award className="h-[14px] w-[14px]" aria-hidden />,
    },
    bronze: {
      label: "Bronze",
      bg: "#fde8d7",
      fg: "#8a4a00",
      icon: <Award className="h-[14px] w-[14px]" aria-hidden />,
    },
  };
  const c = config[key];
  if (!c) {
    return <span className="text-[13px] text-[#737373]">—</span>;
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; fg: string; dot: string }> = {
    active: { label: "Active", bg: "#e6f6ee", fg: "#116d3c", dot: "#22a566" },
    at_risk: { label: "At-Risk", bg: "#fff4d6", fg: "#8a6100", dot: "#feb602" },
    churned: { label: "Churned", bg: "#fde2e2", fg: "#a3231f", dot: "#e53935" },
  };
  const c = config[status] ?? {
    label: status.replace(/_/g, " "),
    bg: "#eef1f7",
    fg: "#525252",
    dot: "#a3a3a3",
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium capitalize"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.dot }} aria-hidden />
      {c.label}
    </span>
  );
}

function formatLastVisit(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diffMs = Date.now() - then;
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 60) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  return `${Math.floor(months / 12)} years ago`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconColor: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[12px] border border-[#d7ddea] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] text-[#737373]">{label}</span>
        <Icon className="h-5 w-5" style={{ color: iconColor }} aria-hidden />
      </div>
      <span className="text-[20px] font-semibold text-[#0a152f]">{value}</span>
    </div>
  );
}

export type { CustomerFormData, Customer };
export function AddCustomerDialog({
  open,
  onOpenChange,
  onSubmit,
  mode,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  mode: "add" | "edit";
  initial?: Customer | null;
}) {
  const [full_name, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [birth_date, setBirthDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setFullName(initial?.full_name ?? "");
      setEmail(initial?.email ?? "");
      setPhone(initial?.phone ?? "");
      setBirthDate(initial?.birth_date ?? "");
      setSaving(false);
    }
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!full_name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ full_name, email, phone, birth_date });
    } finally {
      setSaving(false);
    }
  };

  const isEdit = mode === "edit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Customer" : "Add Customer"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this member's contact details."
              : "Manually enroll a new member into your loyalty program."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name" required>
            <input
              autoFocus
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 w-full rounded-[12px] border border-[#d7ddea] bg-white px-3 text-sm text-[#0a152f] focus:border-[#feb602] focus:outline-none"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-[12px] border border-[#d7ddea] bg-white px-3 text-sm text-[#0a152f] focus:border-[#feb602] focus:outline-none"
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 w-full rounded-[12px] border border-[#d7ddea] bg-white px-3 text-sm text-[#0a152f] focus:border-[#feb602] focus:outline-none"
            />
          </Field>
          <Field label="Birth date">
            <input
              type="date"
              value={birth_date}
              onChange={(e) => setBirthDate(e.target.value)}
              className="h-10 w-full rounded-[12px] border border-[#d7ddea] bg-white px-3 text-sm text-[#0a152f] focus:border-[#feb602] focus:outline-none"
            />
          </Field>
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full px-4 py-2 text-sm font-medium text-[#525252] hover:text-[#0a152f]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#feb602] px-5 py-2 text-sm font-semibold text-[#0a152f] shadow-[0_1px_8px_rgba(0,0,0,0.12)] transition hover:bg-[#e29f00] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin text-[#0a152f]" aria-hidden />}
              {isEdit ? "Save changes" : "Add Customer"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-[#0a152f]">
        {label}
        {required && <span className="text-[#e53935]"> *</span>}
      </span>
      {children}
    </label>
  );
}
