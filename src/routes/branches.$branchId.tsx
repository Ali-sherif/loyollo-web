import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronDown,
  Edit3,
  Gift,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
  User as UserIcon,
  Users as UsersIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BranchDialog, type BranchFormData } from "./branches.index";


export const Route = createFileRoute("/branches/$branchId")({
  head: () => ({
    meta: [
      { title: "Branch Details — Loyalty" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BranchDetailsPage,
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

function BranchDetailsPage() {
  const { branchId } = Route.useParams();
  const navigate = useNavigate();
  const { user, isVerified, loading, signOut } = useAuth();

  const [fullName, setFullName] = React.useState("");
  const [ready, setReady] = React.useState(false);
  const [branch, setBranch] = React.useState<Branch | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [toggling, setToggling] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);


  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!isVerified) {
      navigate({ to: "/verify" });
      return;
    }
    let cancel = false;
    (async () => {
      const [{ data: p }, { data: b, error }] = await Promise.all([
        supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
        supabase
          .from("branches")
          .select(
            "id, name, address, city, email, phone, manager_name, is_main, is_active, created_at",
          )
          .eq("id", branchId)
          .maybeSingle(),
      ]);
      if (cancel) return;
      if (p) setFullName((p.full_name || p.email || "").trim());
      if (error) {
        toast.error(error.message);
        setNotFound(true);
      } else if (!b) {
        setNotFound(true);
      } else {
        setBranch(b as Branch);
      }
      setReady(true);
    })();
    return () => {
      cancel = true;
    };
  }, [user, isVerified, loading, navigate, branchId]);

  const toggleActive = async (next: boolean) => {
    if (!branch) return;
    setToggling(true);
    const { error } = await supabase
      .from("branches")
      .update({ is_active: next })
      .eq("id", branch.id);
    setToggling(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBranch({ ...branch, is_active: next });
    toast.success(next ? "Branch activated" : "Branch deactivated");
  };
  const handleEdit = async (data: BranchFormData) => {
    if (!branch || !user) return;
    if (data.is_main && !branch.is_main) {
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
      .eq("id", branch.id)
      .select(
        "id, name, address, city, email, phone, manager_name, is_main, is_active, created_at",
      )
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setBranch(row as Branch);
    setEditOpen(false);
    toast.success("Branch updated");
  };


  if (loading || !ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#eef1f7] text-sm text-[#737373]">
        Loading…
      </div>
    );
  }
  if (notFound || !branch) {
    return (
      <DashboardShell
        firstName={fullName || (user?.email ?? "")} onSignOut={signOut}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
          <h1 className="text-lg font-bold text-[#0a152f]">Branch not found</h1>
          <p className="text-sm text-[#737373]">
            This branch may have been removed or you don't have access.
          </p>
          <Link
            to="/branches"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#feb602] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Branches
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      firstName={fullName || (user?.email ?? "")} onSignOut={signOut}
    >
      <div className="space-y-6 pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-[13px]" aria-label="Breadcrumb">
          <Link to="/branches" className="text-[#737373] hover:text-[#0a152f]">
            Branches
          </Link>
          <span className="text-[#737373]">/</span>
          <span className="font-semibold text-[#0a152f]">{branch.name}</span>
        </nav>

        {/* Header card */}
        <section className="rounded-[12px] border border-[#d7ddea] bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[24px] font-bold text-[#0a152f]">{branch.name}</h1>
                <Toggle checked={branch.is_active} disabled={toggling} onChange={toggleActive} />
                {branch.is_main ? (
                  <span className="rounded-full bg-[#fff9e6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#e29f00]">
                    Main
                  </span>
                ) : null}
              </div>
              <p className="text-[14px] text-[#737373]">
                {[branch.phone, branch.email].filter(Boolean).join(" • ") || "No contact info"}
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-[#737373]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#a3a3a3]" aria-hidden />
                  {branch.city || branch.address || "—"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserIcon className="h-4 w-4 text-[#a3a3a3]" aria-hidden />
                  {branch.manager_name || "No manager"}
                </span>
                {branch.email ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-[#a3a3a3]" aria-hidden />
                    {branch.email}
                  </span>
                ) : null}
                {branch.phone ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-[#a3a3a3]" aria-hidden />
                    {branch.phone}
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex h-10 items-center gap-2 self-start rounded-full bg-[#f5f7fb] px-6 text-sm font-semibold text-[#0a152f] hover:bg-[#eef1f7]"
            >
              <Edit3 className="h-4 w-4" aria-hidden />
              Edit
            </button>

          </div>
        </section>

        {/* Engagement + Stats */}
        <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,410px)]">
          {/* Customer Engagement Chart */}
          <div className="rounded-[12px] border border-[#d7ddea] bg-white p-5">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start sm:gap-3">
              <div className="min-w-0">
                <h2 className="text-[20px] font-semibold text-[#0a152f]">
                  Customer Engagement
                </h2>
                <p className="mt-1 text-[14px] text-[#737373]">
                  Customer's visits monthly
                </p>
              </div>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[12px] border border-[#d7ddea] bg-[#fafafa] px-4 py-2.5 text-[14px] text-[#0a152f]"
              >
                <CalendarIcon className="h-4 w-4" aria-hidden />
                This month
                <ChevronDown className="h-3 w-3 text-[#737373]" aria-hidden />
              </button>
            </div>
            <EngagementChartPlaceholder />
            {/* TODO(feature): per-branch visits require branch_id on customer transactions. */}
          </div>

          {/* Branch Stats */}
          <div className="rounded-[12px] border border-[#d7ddea] bg-white p-5">
            <h2 className="text-[20px] font-semibold text-[#0a152f]">Branch Stats</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <StatTile label="Customers" value="—" icon={<UsersIcon className="h-5 w-5 text-[#344f89]" />} />
              <StatTile label="Total Visits" value="—" icon={<TrendingUp className="h-5 w-5 text-[#344f89]" />} />
            </div>
            <div className="mt-3 grid gap-3">
              <StatTile
                label="Rewards Redeemed"
                value="—"
                icon={<Gift className="h-5 w-5 text-[#feb602]" />}
                full
              />
              <StatTile
                label="Revenue Influenced"
                value="—"
                icon={<TrendingUp className="h-5 w-5 text-[#44b678]" />}
                full
              />
            </div>
            {/* TODO(feature): branch-level metrics require branch_id linkage on customers/transactions/redemptions. */}
          </div>
        </section>

        {/* Top Customers */}
        <section className="rounded-[12px] border border-[#d7ddea] bg-white p-5">
          <div className="space-y-1">
            <h2 className="text-[20px] font-semibold text-[#0a152f]">Top Customers</h2>
            <p className="text-[14px] text-[#737373]">
              Most loyal and engaged customers based on visits and points earned.
            </p>
          </div>

          <div className="mt-5 overflow-hidden rounded-[16px] border border-[#d7ddea]">
            <div className="overflow-x-auto">
              <div className="grid min-w-[520px] grid-cols-[68px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center bg-[#eef1f7] text-[14px] font-semibold text-[#5d74a2]">
                <div className="p-4">Rank</div>
                <div className="p-4">Customer</div>
                <div className="p-4 text-center">Visits</div>
                <div className="p-4">Points Earned</div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 bg-white px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef1f7]">
                <UsersIcon className="h-5 w-5 text-[#344f89]" aria-hidden />
              </span>
              <p className="text-[14px] font-semibold text-[#0a152f]">
                No branch-linked customers yet
              </p>
              <p className="max-w-[420px] text-[13px] text-[#737373]">
                Once customers are enrolled at this branch, their visits and
                points will appear here.
              </p>
              {/* TODO(feature): top customers per branch requires branch_id on customer enrollment. */}
            </div>
          </div>
        </section>

        {/* Top Rewards */}
        <section className="rounded-[12px] border border-[#d7ddea] bg-white p-5">
          <div className="space-y-1">
            <h2 className="text-[20px] font-semibold text-[#0a152f]">Top Rewards</h2>
            <p className="text-[14px] text-[#737373]">
              Most redeemed rewards and their point value.
            </p>
          </div>

          <div className="mt-5 overflow-hidden rounded-[16px] border border-[#d7ddea]">
            <div className="overflow-x-auto">
              <div className="grid min-w-[520px] grid-cols-[68px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center bg-[#eef1f7] text-[14px] font-semibold text-[#5d74a2]">
                <div className="p-4">Rank</div>
                <div className="p-4">Reward</div>
                <div className="p-4 text-center">Redemptions</div>
                <div className="p-4">Points cost</div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 bg-white px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef1f7]">
                <Gift className="h-5 w-5 text-[#feb602]" aria-hidden />
              </span>
              <p className="text-[14px] font-semibold text-[#0a152f]">
                No branch-linked reward data yet
              </p>
              <p className="max-w-[420px] text-[13px] text-[#737373]">
                Redemptions made at this branch and their point costs will appear
                here once rewards are linked to a branch.
              </p>
              {/* TODO(feature): top rewards per branch requires branch_id on redemptions once that exists. */}
            </div>
          </div>
        </section>
      </div>

      <BranchDialog
        open={editOpen}
        title="Edit Branch"
        submitLabel="Save changes"
        initial={{
          name: branch.name,
          address: branch.address ?? "",
          city: branch.city ?? "",
          email: branch.email ?? "",
          phone: branch.phone ?? "",
          manager_name: branch.manager_name ?? "",
          is_main: branch.is_main,
        }}
        onSubmit={handleEdit}
        onClose={() => setEditOpen(false)}
      />
    </DashboardShell>
  );
}


function StatTile({
  label,
  value,
  icon,
  full,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div
      className={`rounded-[12px] border border-[#d7ddea] bg-white p-4 ${
        full ? "w-full" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[14px] text-[#737373]">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-[20px] font-semibold text-[#0a152f]">{value}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
        checked ? "bg-[#44b678]" : "bg-[#d4d4d4]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

function EngagementChartPlaceholder() {
  // Deterministic placeholder heights so the chart isn't blank while we wait
  // on real per-branch visit tracking.
  const heights = [45, 55, 85, 60, 50, 75, 55, 50];
  const labels = ["Jan 01", "Jan 02", "Jan 03", "Jan 04", "Jan 05", "Jan 06", "Jan 07", "Jan 08"];
  return (
    <div className="mt-5">
      <div className="flex h-[220px] items-end gap-2 border-b border-[#e5e5e5] px-2 sm:gap-6">
        {heights.map((h, i) => (
          <div key={i} className="flex flex-1 items-end">
            <div
              className="w-full rounded-t-[12px] bg-[#e5e7eb]"
              style={{ height: `${h}%` }}
              aria-hidden
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 px-2 sm:gap-6">
        {labels.map((l) => (
          <p key={l} className="flex-1 text-center text-[11px] leading-tight text-[#737373] sm:text-[12px]">
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}
