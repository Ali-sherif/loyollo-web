import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import {
  Award,
  Calendar,
  Crown,
  Gift,
  Info,
  Loader2,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AddCustomerDialog, type CustomerFormData } from "./customers.index";

export const Route = createFileRoute("/customers/$customerId")({
  head: () => ({
    meta: [
      { title: "Customer Profile — Loyalty" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomerProfilePage,
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
  created_at: string;
};

function CustomerProfilePage() {
  const { customerId } = Route.useParams();
  const navigate = useNavigate();
  const { user, isVerified, loading, signOut } = useAuth();

  const [firstName, setFirstName] = React.useState("");
  const [ready, setReady] = React.useState(false);
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  const handleEdit = async (data: CustomerFormData) => {
    if (!customer) return;
    const { data: row, error } = await supabase
      .from("customers")
      .update({
        full_name: data.full_name.trim(),
        email: data.email.trim() || null,
        phone: data.phone.trim() || null,
        birth_date: data.birth_date || null,
      })
      .eq("id", customer.id)
      .select(
        "id, full_name, email, phone, birth_date, tier, points, visits, status, last_activity_at, created_at",
      )
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setCustomer(row as Customer);
    setEditOpen(false);
    toast.success("Customer updated");
  };

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
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      const full = (profile?.full_name as string | null)?.trim() ?? "";
      setFirstName(full.split(/\s+/)[0] || (user.email?.split("@")[0] ?? ""));

      const { data: row } = await supabase
        .from("customers")
        .select(
          "id, full_name, email, phone, birth_date, tier, points, visits, status, last_activity_at, created_at",
        )
        .eq("id", customerId)
        .maybeSingle();
      if (!row) {
        setNotFound(true);
      } else {
        setCustomer(row as Customer);
      }
      setReady(true);
    })();
  }, [user, isVerified, loading, navigate, customerId]);

  if (loading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f7]">
        <Loader2 className="h-8 w-8 animate-spin text-[#feb602]" />
      </div>
    );
  }

  if (notFound || !customer) {
    return (
      <DashboardShell firstName={firstName} onSignOut={() => void signOut()}>
        <div className="rounded-2xl bg-white p-10 text-center">
          <p className="text-[16px] text-[#525252]">Customer not found.</p>
          <Link
            to="/customers"
            className="mt-4 inline-block text-[14px] font-medium text-[#0a152f] underline"
          >
            Back to customers
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const c = customer;
  const initials = c.full_name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const memberSince = c.created_at
    ? new Date(c.created_at).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "—";
  const tierLabel = (c.tier ?? "Bronze").replace(/^\w/, (m) => m.toUpperCase());

  // TODO(feature): wire real analytics once transaction/redemption tracking exists.
  const rewardsRedeemed = 0;
  const lifetimeValue = 0;
  const referrals = 0;

  return (
    <DashboardShell firstName={firstName} onSignOut={() => void signOut()}>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-[14px]">
        <Link to="/customers" className="text-[#525252] hover:text-[#0a152f]">
          Customers
        </Link>
        <span className="text-[#8b8b8b]">/</span>
        <span className="font-medium text-[#0a152f]">{c.full_name}</span>
      </div>

      {/* Hero card */}
      <section className="mb-4 rounded-2xl bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#eef1f7] text-[22px] font-semibold text-[#0a152f]">
              {initials || "?"}
              <span
                className={`absolute right-1 bottom-1 h-3 w-3 rounded-full ring-2 ring-white ${
                  c.status === "active" ? "bg-[#22c55e]" : "bg-[#9ca3af]"
                }`}
              />
            </div>
            <div>
              <h1 className="text-[22px] font-semibold text-[#0a152f]">
                {c.full_name}
              </h1>
              <p className="mt-1 text-[14px] text-[#525252]">
                {[c.email, c.phone, `Member since ${memberSince}`]
                  .filter(Boolean)
                  .join("  •  ")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] px-3 py-1.5 text-[13px] font-medium text-[#0a152f]">
              <Crown className="h-4 w-4 text-[#feb602]" aria-hidden />
              {tierLabel}
            </span>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-full bg-[#eef1f7] px-5 py-2.5 text-[14px] font-medium text-[#0a152f] transition hover:bg-[#dfe4ee]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/campaigns" })}
              className="whitespace-nowrap rounded-full bg-[#feb602] px-5 py-2.5 text-[14px] font-semibold text-[#0a152f] transition hover:bg-[#e8a600]"
            >
              Send Campaign
            </button>
          </div>
        </div>
      </section>

      {/* Stat tiles */}
      <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label="Total Points" value={c.points.toLocaleString()} icon={Sparkles} />
        <StatTile label="Total Visits" value={String(c.visits)} icon={TrendingUp} />
        <StatTile label="Rewards Redeemed" value={String(rewardsRedeemed)} icon={Gift} />
        <StatTile label="Lifetime Value" value={`$${lifetimeValue.toLocaleString()}`} icon={Award} />
        <StatTile label="Referrals" value={String(referrals)} icon={UserPlus} />
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
        {/* LEFT column */}
        <div className="flex flex-col gap-4">
          {/* Customer Engagement */}
          <Panel>
            <PanelHeader
              title="Customer Engagement"
              subtitle="Customer's visits Yearly"
            />
            <EmptyPanelBody
              icon={TrendingUp}
              text="No visit data yet. Engagement chart will appear once this customer starts checking in."
              height={260}
            />
          </Panel>

          {/* Recent Transactions */}
          <Panel>
            <PanelHeader
              title="Recent Transactions"
              action={
                <button
                  type="button"
                  onClick={() => toast.info("Coming soon")}
                  className="text-[13px] font-medium text-[#0a152f] underline decoration-[#0a152f]/40 underline-offset-2 hover:text-[#feb602] hover:decoration-[#feb602]"
                >
                  View all
                </button>
              }
            />
            <TableEmpty
              columns={["Date", "Activity", "Points"]}
              text="No transactions yet"
            />
          </Panel>

          {/* Rewards History */}
          <Panel>
            <PanelHeader
              title="Rewards History"
              action={
                <button
                  type="button"
                  onClick={() => toast.info("Coming soon")}
                  className="text-[13px] font-medium text-[#0a152f] underline decoration-[#0a152f]/40 underline-offset-2 hover:text-[#feb602] hover:decoration-[#feb602]"
                >
                  View all
                </button>
              }
            />
            <TableEmpty
              columns={["Date", "Reward", "Points Used"]}
              text="No rewards redeemed yet"
            />
          </Panel>
        </div>

        {/* RIGHT column */}
        <div className="flex flex-col gap-4">
          {/* Loyalty Status */}
          <Panel>
            <div className="p-5">
              <h3 className="text-[16px] font-semibold text-[#0a152f]">
                Loyalty Status
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[13px] text-[#525252]">Current Tier</p>
                  <p className="mt-1 text-[15px] font-semibold text-[#0a152f]">
                    {tierLabel}
                  </p>
                </div>
                <div>
                  <p className="text-[13px] text-[#525252]">Current Points</p>
                  <p className="mt-1 text-[15px] font-semibold text-[#0a152f]">
                    {c.points.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#eef1f7]">
                  <div
                    className="h-full rounded-full bg-[#feb602]"
                    style={{ width: "0%" }}
                  />
                </div>
                <p className="mt-2 text-[12px] text-[#525252]">
                  {/* TODO(feature): tier progression requires next-tier config */}
                  Tier progression coming soon
                </p>
              </div>
              <div className="mt-4 rounded-xl bg-[#fff8e5] p-4">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-5 w-5 text-[#feb602]" aria-hidden />
                  <div>
                    <p className="text-[14px] font-semibold text-[#0a152f]">
                      Loyalty Insights
                    </p>
                    <p className="mt-1 text-[13px] text-[#525252]">
                      Personalized insights will appear as this customer racks up
                      visits and redemptions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          {/* Customer Health */}
          <Panel>
            <div className="p-5">
              <h3 className="text-[16px] font-semibold text-[#0a152f]">
                Customer Health
              </h3>
              <div className="mt-4 rounded-xl bg-[#eef1f7] p-3">
                <p className="text-[14px] font-medium text-[#0a152f]">—</p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-[#22c55e]"
                    style={{ width: "0%" }}
                  />
                </div>
                <p className="mt-2 text-[12px] text-[#525252]">
                  {/* TODO(feature): health score not tracked */}
                  Health score coming soon
                </p>
              </div>
            </div>
          </Panel>

          {/* Recent Activity */}
          <Panel>
            <div className="p-5">
              <h3 className="text-[16px] font-semibold text-[#0a152f]">
                Recent Activity
              </h3>
              <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] p-6 text-center">
                <Calendar className="h-6 w-6 text-[#9ca3af]" aria-hidden />
                <p className="mt-2 text-[13px] text-[#525252]">
                  No recent activity yet
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </section>
      <AddCustomerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
        mode="edit"
        initial={customer}
      />
    </DashboardShell>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#525252]">{label}</p>
        <Icon className="h-5 w-5 text-[#9ca3af]" aria-hidden />
      </div>
      <p className="mt-3 text-[20px] font-semibold text-[#0a152f]">{value}</p>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white">{children}</div>;
}

function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between p-5 pb-3">
      <div>
        <h3 className="text-[16px] font-semibold text-[#0a152f]">{title}</h3>
        {subtitle ? (
          <p className="mt-1 text-[13px] text-[#525252]">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="mt-0.5">{action}</div> : null}
    </div>
  );
}

function EmptyPanelBody({
  icon: Icon,
  text,
  height,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  height: number;
}) {
  return (
    <div
      className="mx-5 mb-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] p-6 text-center"
      style={{ minHeight: height }}
    >
      <Icon className="h-8 w-8 text-[#9ca3af]" aria-hidden />
      <p className="mt-3 max-w-xs text-[13px] text-[#525252]">{text}</p>
    </div>
  );
}

function TableEmpty({
  columns,
  text,
}: {
  columns: string[];
  text: string;
}) {
  return (
    <div className="mx-5 mb-5 overflow-hidden rounded-xl border border-[#eef1f7]">
      <table className="w-full">
        <thead>
          <tr className="bg-[#f8faff]">
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-[13px] font-medium text-[#525252]"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-10 text-center text-[13px] text-[#8b8b8b]"
            >
              <ShoppingBag className="mx-auto h-6 w-6 text-[#9ca3af]" aria-hidden />
              <p className="mt-2">{text}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
