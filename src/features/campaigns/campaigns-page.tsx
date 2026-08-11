"use client";

import { assetSrc } from "@/lib/asset-src";

import { Link, useNavigate, useRouterState } from "@/lib/navigation";
// TanStack useServerFn removed — call server modules directly from client with fetch/BFF later
import * as React from "react";
import { sendCampaign } from "@/lib/client/campaigns-api";
import { notifyCampaignCreated } from "@/lib/notify-client";
import { toast } from "sonner";
import {
  Megaphone,
  Mail,
  MessageSquare,
  DollarSign,
  Plus,
  Search,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAuthSupabase } from "@/integrations/supabase/auth-client";
import { cn } from "@/lib/utils";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import telescopeEmpty from "@/assets/telescope-empty-state.png";
import { AutomationsSection } from "@/components/campaigns/AutomationsSection";

export type Campaign = {
  id: string;
  name: string;
  description: string | null;
  channel: string;
  status: string;
  audience: string | null;
  subject: string | null;
  message: string | null;
  sent_count: number;
  opened_count: number;
  revenue_cents: number;
  failed_count: number;
  created_at: string;
};

type StatusTab = "all" | "active" | "scheduled" | "draft" | "completed";

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "all", label: "All Campaigns" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "draft", label: "Drafts" },
  { value: "completed", label: "Completed" },
];

type AudienceOption =
  | "All customers"
  | "Birthday Customers"
  | "At Risk"
  | "VIP Members"
  | "Gold Members"
  | "Silver Members"
  | "New Customers";

const AUDIENCE_OPTIONS: AudienceOption[] = [
  "All customers",
  "Birthday Customers",
  "At Risk",
  "VIP Members",
  "Gold Members",
  "Silver Members",
  "New Customers",
];

type SortOption = "newest" | "oldest" | "name" | "highest" | "lowest";
type TypeFilter = "all" | "email" | "sms";

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
];

const AUDIENCE_FILTER_OPTIONS: { value: "all" | AudienceOption; label: string }[] = [
  { value: "all", label: "All audiences" },
  ...AUDIENCE_OPTIONS.map((opt) => ({ value: opt, label: opt })),
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name (A–Z)" },
  { value: "highest", label: "Highest performance" },
  { value: "lowest", label: "Lowest performance" },
];

export type CampaignFormData = {
  name: string;
  description: string;
  channel: "email" | "sms";
  audience: AudienceOption;
  subject: string;
  message: string;
};

const EMPTY_FORM: CampaignFormData = {
  name: "",
  description: "",
  channel: "email",
  audience: "All customers",
  subject: "",
  message: "",
};

const SELECT_COLS =
  "id, name, description, channel, status, audience, subject, message, sent_count, opened_count, revenue_cents, failed_count, created_at";

const CAMPAIGN_TABLE = "campaigns" as const;

function CampaignsPage() {
  const navigate = useNavigate();
  const { user, isVerified, loading, signOut } = useAuth();

  const [firstName, setFirstName] = React.useState("");
  const [ready, setReady] = React.useState(false);
  const [programId, setProgramId] = React.useState<string | null>(null);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [tab, setTab] = React.useState<StatusTab>("all");
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<SortOption>("newest");
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("all");
  const [audienceFilter, setAudienceFilter] = React.useState<"all" | AudienceOption>("all");
  const [createOpen, setCreateOpen] = React.useState(false);

  const [editTarget, setEditTarget] = React.useState<Campaign | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Campaign | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [launchingId, setLaunchingId] = React.useState<string | null>(null);
  const sendCampaignFn = sendCampaign;

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
      const { data: profile } = await getAuthSupabase()
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

      const { data: program } = await getAuthSupabase()
        .from("loyalty_programs")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      const pid = program?.id ?? null;
      setProgramId(pid);
      if (pid) {
        const { data: rows } = await getAuthSupabase()
          .from(CAMPAIGN_TABLE)
          .select(SELECT_COLS)
          .eq("loyalty_program_id", pid)
          .order("created_at", { ascending: false });
        setCampaigns((rows as Campaign[] | null) ?? []);
      }
      setReady(true);
    })();
  }, [user, isVerified, loading, navigate]);

  const totalCampaigns = campaigns.length;
  const emailsSent = campaigns
    .filter((c) => c.channel === "email")
    .reduce((a, c) => a + (c.sent_count ?? 0), 0);
  const smsSent = campaigns
    .filter((c) => c.channel === "sms")
    .reduce((a, c) => a + (c.sent_count ?? 0), 0);
  const revenue = campaigns.reduce((a, c) => a + (c.revenue_cents ?? 0), 0);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = campaigns.filter((c) => {
      if (tab !== "all" && c.status !== tab) return false;
      if (typeFilter !== "all" && c.channel !== typeFilter) return false;
      if (audienceFilter !== "all" && c.audience !== audienceFilter) return false;
      if (q) {
        const hay = `${c.name} ${c.description ?? ""} ${c.audience ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...out];
    sorted.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "highest" || sort === "lowest") {
        const pa = performancePct(a);
        const pb = performancePct(b);
        return sort === "highest" ? pb - pa : pa - pb;
      }
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sort === "newest" ? tb - ta : ta - tb;
    });
    return sorted;
  }, [campaigns, tab, search, sort, typeFilter, audienceFilter]);

  const runSend = async (campaignId: string) => {
    setLaunchingId(campaignId);
    try {
      const result = await sendCampaignFn({ campaignId });
      // Refetch this one row for accurate stats
      const { data: row } = await getAuthSupabase()
        .from(CAMPAIGN_TABLE)
        .select(SELECT_COLS)
        .eq("id", campaignId)
        .maybeSingle();
      if (row) {
        setCampaigns((prev) => prev.map((x) => (x.id === campaignId ? (row as Campaign) : x)));
      }
      if (result.sentCount > 0 && result.failedCount === 0) {
        toast.success(`Sent to ${result.sentCount} of ${result.total} customers`);
      } else if (result.sentCount > 0) {
        toast.success(
          `Sent to ${result.sentCount} of ${result.total} customers (${result.failedCount} failed)`,
        );
      } else {
        toast.error(`Send failed for all ${result.total} recipients`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to launch campaign";
      toast.error(msg);
    } finally {
      setLaunchingId(null);
    }
  };

  const handleCreate = async (data: CampaignFormData, launch: boolean) => {
    if (!user) return;
    if (!programId) {
      toast.error("Create your loyalty program first", {
        action: {
          label: "Create program",
          onClick: () => navigate({ to: "/loyalty-program" }),
        },
      });
      return;
    }
    const { data: row, error } = await getAuthSupabase()
      .from(CAMPAIGN_TABLE)
      .insert({
        loyalty_program_id: programId,
        owner_id: user.id,
        name: data.name.trim(),
        description: data.description.trim() || null,
        channel: data.channel,
        audience: data.audience.trim() || null,
        subject: data.subject.trim() || null,
        message: data.message.trim() || null,
        status: "draft",
      })
      .select(SELECT_COLS)
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setCampaigns((prev) => [row as Campaign, ...prev]);
    setCreateOpen(false);
    notifyCampaignCreated({
      userId: user.id,
      campaignId: (row as Campaign).id,
      campaignName: (row as Campaign).name,
    });
    if (launch) {
      await runSend((row as Campaign).id);
    } else {
      toast.success("Campaign saved as draft");
    }
  };

  const handleEdit = async (data: CampaignFormData) => {
    if (!editTarget) return;
    const { data: row, error } = await getAuthSupabase()
      .from(CAMPAIGN_TABLE)
      .update({
        name: data.name.trim(),
        description: data.description.trim() || null,
        channel: data.channel,
        audience: data.audience.trim() || null,
        subject: data.subject.trim() || null,
        message: data.message.trim() || null,
      })
      .eq("id", editTarget.id)
      .select(SELECT_COLS)
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setCampaigns((prev) => prev.map((c) => (c.id === editTarget.id ? (row as Campaign) : c)));
    setEditTarget(null);
    toast.success("Campaign updated");
  };

  const updateStatus = async (c: Campaign, status: string, successMsg: string) => {
    const { data: row, error } = await getAuthSupabase()
      .from(CAMPAIGN_TABLE)
      .update({ status })
      .eq("id", c.id)
      .select(SELECT_COLS)
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setCampaigns((prev) => prev.map((x) => (x.id === c.id ? (row as Campaign) : x)));
    toast.success(successMsg);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await getAuthSupabase()
      .from(CAMPAIGN_TABLE)
      .delete()
      .eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCampaigns((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Campaign deleted");
  };

  if (loading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardShell firstName={firstName} onSignOut={signOut}>
      <div className="mx-auto max-w-[1140px] space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-bold leading-[1.2] text-[#0a152f]">Campaigns</h1>
            <p className="mt-2 text-[14px] text-[#737373]">
              Create, manage, and track campaigns that drive customer engagement and repeat visits.
            </p>
          </div>
          {campaigns.length > 0 && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-[#feb602] px-4 py-2.5 text-sm font-semibold text-[#0a152f] shadow-[0_1px_8px_rgba(0,0,0,0.12)] transition hover:bg-[#e29f00]"
            >
              <Plus className="h-4 w-4 text-[#0a152f]" aria-hidden />
              Create Campaign
            </button>
          )}
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total Campaigns"
            value={String(totalCampaigns)}
            icon={Megaphone}
            iconColor="#feb602"
          />
          <StatCard
            label="Emails Sent"
            value={String(emailsSent)}
            icon={Mail}
            iconColor="#344f89"
          />
          <StatCard
            label="SMS Sent"
            value={String(smsSent)}
            icon={MessageSquare}
            iconColor="#44b678"
          />
          <StatCard
            label="Campaign Revenue"
            value={`$${(revenue / 100).toFixed(2)}`}
            icon={DollarSign}
            iconColor="#44b678"
          />
        </section>

        <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
          {/* Status tabs */}
          <div className="flex flex-wrap items-center gap-1 border-b border-[#eef1f7] pb-3">
            {STATUS_TABS.map((t) => {
              const isActive = tab === t.value;
              const count =
                t.value === "all"
                  ? campaigns.length
                  : campaigns.filter((c) => c.status === t.value).length;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTab(t.value)}
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
                placeholder="Search campaigns"
                className="ml-3 w-full bg-transparent text-[14px] text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Type filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-[#eef1f7] text-[13px] font-medium text-[#0a152f] transition hover:bg-[#f7f8fb]"
                  >
                    {TYPE_OPTIONS.find((t) => t.value === typeFilter)?.label ?? "Type"}
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {TYPE_OPTIONS.map((t) => (
                    <DropdownMenuItem key={t.value} onSelect={() => setTypeFilter(t.value)}>
                      {t.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Audience filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-[#eef1f7] text-[13px] font-medium text-[#0a152f] transition hover:bg-[#f7f8fb]"
                  >
                    {AUDIENCE_FILTER_OPTIONS.find((t) => t.value === audienceFilter)?.label ??
                      "Audience"}
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {AUDIENCE_FILTER_OPTIONS.map((t) => (
                    <DropdownMenuItem key={t.value} onSelect={() => setAudienceFilter(t.value)}>
                      {t.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-[#eef1f7] text-[13px] font-medium text-[#0a152f] transition hover:bg-[#f7f8fb]"
                  >
                    Sort: {SORT_OPTIONS.find((s) => s.value === sort)?.label ?? "Sort"}
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

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <img
                src={assetSrc(telescopeEmpty)}
                alt=""
                width={149}
                height={110}
                loading="lazy"
                className="h-[110px] w-[149px] object-contain"
              />
              <div className="max-w-[520px] space-y-2 px-4">
                <h2 className="text-[20px] font-bold text-[#0a152f]">
                  {campaigns.length === 0 ? "No Campaigns Yet!" : "No matching campaigns"}
                </h2>
                <p className="text-[16px] text-[#737373]">
                  {campaigns.length === 0
                    ? "Create your first campaign to engage customers, promote rewards, and bring customers back more often."
                    : "Try a different search or status filter."}
                </p>
              </div>
              {campaigns.length === 0 && (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#feb602] px-4 py-2 text-sm font-semibold text-white shadow-[0_1px_8px_rgba(0,0,0,0.12)] transition hover:bg-[#e29f00]"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Create Campaign
                </button>
              )}
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#f7f8fb] text-[13px] font-semibold text-[#8698bb]">
                    <th className="rounded-l-[8px] px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">Audience</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Performance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="rounded-r-[8px] px-4 py-3 w-[52px]" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-[#eef1f7] text-[14px] text-[#0a152f]">
                      <td className="px-4 py-4 font-semibold">{c.name}</td>
                      <td className="px-4 py-4 text-[#525252]">{c.audience ?? "—"}</td>
                      <td className="px-4 py-4 text-[#525252]">
                        {c.channel === "sms" ? "SMS" : "Email"}
                      </td>
                      <td className="px-4 py-4 text-[#525252]">{formatPerformance(c)}</td>
                      <td className="px-4 py-4">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="px-4 py-4">
                        <RowMenu
                          campaign={c}
                          launching={launchingId === c.id}
                          onView={() =>
                            navigate({ to: "/campaigns/$campaignId", params: { campaignId: c.id } })
                          }
                          onEdit={() => setEditTarget(c)}
                          onDelete={() => setDeleteTarget(c)}
                          onLaunch={() => void runSend(c.id)}
                          onDisable={() => void updateStatus(c, "disabled", "Campaign disabled")}
                          onEnable={() => void updateStatus(c, "active", "Campaign enabled")}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {user && <AutomationsSection ownerId={user.id} />}
      </div>

      <CreateCampaignDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        mode="create"
      />
      <CreateCampaignDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        onSubmit={(data) => handleEdit(data)}
        mode="edit"
        initial={editTarget}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be permanently removed. This can't be undone.
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
              {deleting ? "Deleting…" : "Delete campaign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}

function performancePct(c: Campaign): number {
  if (!c.sent_count) return 0;
  return Math.round(((c.opened_count ?? 0) / c.sent_count) * 100);
}

function formatPerformance(c: Campaign): string {
  const pct = performancePct(c);
  if (!c.sent_count) return "—";
  if (c.channel === "sms") {
    return `${pct}% Redeemed`;
  }
  return `${pct}% Open`;
}

function RowMenu({
  campaign,
  launching,
  onView,
  onEdit,
  onDelete,
  onLaunch,
  onDisable,
  onEnable,
}: {
  campaign: Campaign;
  launching?: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLaunch: () => void;
  onDisable: () => void;
  onEnable: () => void;
}) {
  const isDisabled = campaign.status === "disabled";
  const isDraft = campaign.status === "draft";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Campaign actions"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#8698bb] transition hover:bg-[#eef1f7] hover:text-[#0a152f]"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={onView}>View</DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
        {isDraft && (
          <DropdownMenuItem onSelect={onLaunch} disabled={launching}>
            {launching ? "Launching…" : "Launch Campaign"}
          </DropdownMenuItem>
        )}
        {isDisabled ? (
          <DropdownMenuItem onSelect={onEnable}>Enable</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={onDisable}>Disable</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDelete} className="text-red-600 focus:text-red-600">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; color?: string }>;
  iconColor: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[12px] border border-[#d7ddea] bg-white p-5">
      <div className="flex items-center gap-4">
        <p className="flex-1 text-[14px] text-[#737373]">{label}</p>
        <Icon className="h-5 w-5" color={iconColor} aria-hidden />
      </div>
      <p className="text-[20px] font-semibold text-[#0a152f]">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
    active: { bg: "#effaf4", fg: "#2f9d5b", dot: "#2f9d5b", label: "Active" },
    sending: { bg: "#fff5d6", fg: "#a97a00", dot: "#feb602", label: "Sending" },
    scheduled: { bg: "#fff5d6", fg: "#a97a00", dot: "#feb602", label: "Scheduled" },
    draft: { bg: "#f4f4f5", fg: "#525252", dot: "#a3a3a3", label: "Draft" },
    completed: { bg: "#e8f0ff", fg: "#344f89", dot: "#344f89", label: "Completed" },
    failed: { bg: "#fdecec", fg: "#b42318", dot: "#b42318", label: "Failed" },
    disabled: { bg: "#fdecec", fg: "#b42318", dot: "#b42318", label: "Disabled" },
  };
  const s = map[status] ?? map.draft;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {s.label}
    </span>
  );
}

export function CreateCampaignDialog({
  open,
  onOpenChange,
  onSubmit,
  mode,
  initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (data: CampaignFormData, launch: boolean) => Promise<void>;
  mode: "create" | "edit";
  initial?: Campaign | null;
}) {
  const [form, setForm] = React.useState<CampaignFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setForm({
        name: initial.name,
        description: initial.description ?? "",
        channel: initial.channel === "sms" ? "sms" : "email",
        audience: AUDIENCE_OPTIONS.includes(initial.audience as AudienceOption)
          ? (initial.audience as AudienceOption)
          : "All customers",
        subject: initial.subject ?? "",
        message: initial.message ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, mode, initial]);

  const canSubmit = form.name.trim().length > 0 && form.message.trim().length > 0;

  const handle = async (launch: boolean) => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit(form, launch);
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = mode === "edit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update campaign details. Status is managed from the row menu."
              : "Send a message to your customers to bring them back."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="camp-name">Campaign name</Label>
            <Input
              id="camp-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Spring promo"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camp-desc">Description (optional)</Label>
            <Input
              id="camp-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short internal note"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select
                value={form.channel}
                onValueChange={(v) =>
                  setForm({ ...form, channel: v as CampaignFormData["channel"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="camp-aud">Audience</Label>
              <Select
                value={form.audience}
                onValueChange={(v) => setForm({ ...form, audience: v as AudienceOption })}
              >
                <SelectTrigger id="camp-aud">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.channel === "email" && (
            <div className="space-y-1.5">
              <Label htmlFor="camp-subj">Subject</Label>
              <Input
                id="camp-subj"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Email subject line"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="camp-msg">Message</Label>
            <Textarea
              id="camp-msg"
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Write your message…"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isEdit ? (
            <button
              type="button"
              onClick={() => void handle(false)}
              disabled={!canSubmit || submitting}
              className="rounded-full bg-[#feb602] px-4 py-2 text-sm font-semibold text-[#0a152f] shadow-[0_1px_8px_rgba(0,0,0,0.12)] transition hover:bg-[#e29f00] disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save changes"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void handle(false)}
                disabled={!canSubmit || submitting}
                className="rounded-full border border-[#d7ddea] bg-white px-4 py-2 text-sm font-semibold text-[#0a152f] disabled:opacity-50"
              >
                Save as draft
              </button>
              <button
                type="button"
                onClick={() => void handle(true)}
                disabled={!canSubmit || submitting}
                className="rounded-full bg-[#feb602] px-4 py-2 text-sm font-semibold text-white shadow-[0_1px_8px_rgba(0,0,0,0.12)] transition hover:bg-[#e29f00] disabled:opacity-50"
              >
                {submitting ? "Launching…" : "Launch campaign"}
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CampaignsPage;
