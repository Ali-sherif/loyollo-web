import * as React from "react";
import { Link } from "@/lib/navigation";
import {
  Users,
  UserCheck,
  AlertTriangle,
  Gift,
  DollarSign,
  ArrowUpRight,
  Calendar,
  Plus,
  QrCode,
  UserPlus,
  Send,
  ChevronDown,
} from "lucide-react";
import { getAuthSupabase } from "@/integrations/supabase/auth-client";

/**
 * "Setup Complete" dashboard state.
 * Rendered from /dashboard once program + reward + customer + campaign all exist.
 * Data sources: customers, rewards, campaigns, campaign_recipients, loyalty_program_tiers.
 * Metrics without a backing data source are marked TODO(feature).
 */

type Customer = {
  id: string;
  full_name: string;
  email: string | null;
  tier: string | null;
  points: number;
  visits: number;
  status: string;
  last_activity_at: string | null;
  created_at: string;
};

type Reward = {
  id: string;
  name: string;
  point_cost: number | null;
  redeemed_count: number;
};

type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: string;
  audience: string | null;
  sent_count: number;
  opened_count: number;
  revenue_cents: number;
  sent_at: string | null;
};

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function compact(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 1 : 1).replace(/\.0$/, "")}k`;
  return n.toString();
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

const TIER_COLORS: Record<string, string> = {
  vip: "#0a152f",
  gold: "#feb602",
  silver: "#a3a3a3",
  bronze: "#c48a5b",
};
function tierColor(tier: string | null) {
  return TIER_COLORS[(tier ?? "").toLowerCase()] ?? "#344f89";
}

export function SetupCompleteDashboard({
  fullName,
  programId,
}: {
  fullName: string;
  programId: string;
}) {
  const [loading, setLoading] = React.useState(true);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [rewards, setRewards] = React.useState<Reward[]>([]);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);

  React.useEffect(() => {
    (async () => {
      const [{ data: cs }, { data: rs }, { data: cps }] = await Promise.all([
        getAuthSupabase()
          .from("customers")
          .select(
            "id, full_name, email, tier, points, visits, status, last_activity_at, created_at",
          )
          .eq("loyalty_program_id", programId),
        getAuthSupabase()
          .from("rewards")
          .select("id, name, point_cost, redeemed_count")
          .eq("loyalty_program_id", programId),
        getAuthSupabase()
          .from("campaigns")
          .select(
            "id, name, channel, status, audience, sent_count, opened_count, revenue_cents, sent_at",
          )
          .eq("loyalty_program_id", programId)
          .order("sent_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false }),
      ]);
      setCustomers((cs ?? []) as Customer[]);
      setRewards((rs ?? []) as Reward[]);
      setCampaigns((cps ?? []) as Campaign[]);
      setLoading(false);
    })();
  }, [programId]);

  const now = Date.now();
  const RISK_MS = 30 * 24 * 3600 * 1000;

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const atRiskCustomers = customers.filter(
    (c) => c.last_activity_at && now - new Date(c.last_activity_at).getTime() > RISK_MS,
  ).length;
  const pointsRedeemed = rewards.reduce(
    (sum, r) => sum + r.redeemed_count * (r.point_cost ?? 0),
    0,
  );
  // TODO(feature): no per-transaction revenue tracking yet — using campaign revenue only.
  const totalRevenueCents = campaigns.reduce((s, c) => s + (c.revenue_cents ?? 0), 0);

  // Customer growth: last 8 weeks, new customers by created_at.
  // TODO(feature): no "returning customer" event stream yet; series omitted.
  const weeks = React.useMemo(() => {
    const buckets: { label: string; count: number }[] = [];
    const oneWeek = 7 * 24 * 3600 * 1000;
    const start = now - 8 * oneWeek;
    for (let i = 0; i < 8; i++) {
      buckets.push({ label: `W${i + 1}`, count: 0 });
    }
    for (const c of customers) {
      const t = new Date(c.created_at).getTime();
      if (t < start) continue;
      const idx = Math.min(7, Math.floor((t - start) / oneWeek));
      buckets[idx].count += 1;
    }
    return buckets;
  }, [customers, now]);
  const maxWeek = Math.max(1, ...weeks.map((w) => w.count));

  // Redemption breakdown by reward (top 3 + Other).
  const redemptionBreakdown = React.useMemo(() => {
    const withCount = rewards
      .filter((r) => r.redeemed_count > 0)
      .sort((a, b) => b.redeemed_count - a.redeemed_count);
    const totalR = withCount.reduce((s, r) => s + r.redeemed_count, 0);
    if (totalR === 0)
      return {
        total: 0,
        slices: [] as { name: string; count: number; pct: number; color: string }[],
      };
    const palette = ["#44b678", "#feb602", "#344f89", "#c8d1e4"];
    const top = withCount.slice(0, 3);
    const otherCount = withCount.slice(3).reduce((s, r) => s + r.redeemed_count, 0);
    const items = top.map((r, i) => ({
      name: r.name,
      count: r.redeemed_count,
      pct: Math.round((r.redeemed_count / totalR) * 100),
      color: palette[i],
    }));
    if (otherCount > 0) {
      items.push({
        name: "Other",
        count: otherCount,
        pct: Math.round((otherCount / totalR) * 100),
        color: palette[3],
      });
    }
    return { total: totalR, slices: items };
  }, [rewards]);

  const topCustomers = React.useMemo(
    () => [...customers].sort((a, b) => b.points - a.points).slice(0, 5),
    [customers],
  );

  const atRiskList = React.useMemo(
    () =>
      customers
        .filter((c) => c.last_activity_at && now - new Date(c.last_activity_at).getTime() > RISK_MS)
        .sort(
          (a, b) =>
            new Date(a.last_activity_at!).getTime() - new Date(b.last_activity_at!).getTime(),
        )
        .slice(0, 3),
    [customers, now, RISK_MS],
  );

  const activeCampaigns = React.useMemo(
    () =>
      campaigns
        .filter((c) => c.status === "sent" || c.status === "active" || c.status === "scheduled")
        .slice(0, 3),
    [campaigns],
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4 px-1 pb-6 pt-2">
        <div>
          <h1 className="text-[24px] font-bold text-[#0a152f]">
            Welcome Back, {fullName || "there"}
          </h1>
          <p className="mt-1 text-[14px] text-[#525252]">
            Here's how your loyalty program is performing today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-[#0a152f] shadow-[0_1px_2px_rgba(15,28,61,0.04)]"
          >
            <Calendar className="h-4 w-4 text-[#0a152f]" aria-hidden />
            This month
            <ChevronDown className="h-3 w-3 text-[#737373]" aria-hidden />
          </button>
          <Link
            to="/loyalty-program"
            search={{ tab: "rewards" }}
            className="inline-flex items-center gap-2 rounded-full bg-[#feb602] px-5 py-2.5 text-sm font-semibold text-[#0a152f] shadow-[0_4px_14px_rgba(254,182,2,0.35)] hover:bg-[#e29f00]"
          >
            <Plus className="h-4 w-4 text-[#0a152f]" aria-hidden />
            Create Reward
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total Customers"
          value={totalCustomers.toLocaleString()}
          icon={<Users className="h-4 w-4 text-[#344f89]" />}
          delta="—"
        />
        <StatCard
          label="Active Customers"
          value={activeCustomers.toLocaleString()}
          icon={<UserCheck className="h-4 w-4 text-[#44b678]" />}
          delta="—"
        />
        <StatCard
          label="At-Risk Customers"
          value={atRiskCustomers.toLocaleString()}
          icon={<AlertTriangle className="h-4 w-4 text-[#e11d48]" />}
          delta="—"
        />
        <StatCard
          label="Points Redeemed"
          value={compact(pointsRedeemed)}
          icon={<Gift className="h-4 w-4 text-[#feb602]" />}
          delta="—"
        />
        <StatCard
          label="Total Revenue"
          value={CURRENCY.format(totalRevenueCents / 100)}
          icon={<DollarSign className="h-4 w-4 text-[#0a152f]" />}
          delta="—"
        />
      </div>

      {/* Charts row */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <Card>
          <CardHeader
            title="Customer Growth"
            subtitle="New customers joining your loyalty program (last 8 weeks)."
          />
          <div className="mt-6 h-[260px]">
            {totalCustomers === 0 ? (
              <EmptyChart message="No customers yet." />
            ) : (
              <div className="flex h-full items-end gap-2 pb-6">
                {weeks.map((w) => (
                  <div key={w.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-[#0f1c3d]"
                        style={{
                          height: `${(w.count / maxWeek) * 100}%`,
                          minHeight: w.count > 0 ? 4 : 0,
                        }}
                        aria-label={`${w.label}: ${w.count} new`}
                      />
                    </div>
                    <span className="text-[11px] text-[#737373]">{w.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center gap-4 text-[12px] text-[#525252]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-[#0f1c3d]" />
              New Customers
            </span>
            {/* TODO(feature): returning-customer event stream not tracked yet. */}
          </div>
        </Card>

        <Card>
          <CardHeader title="Redemption Breakdown" subtitle="By reward" />
          {redemptionBreakdown.total === 0 ? (
            <div className="mt-6 flex h-[220px] items-center justify-center">
              <EmptyChart message="No redemptions yet." />
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-6">
              <Donut
                slices={redemptionBreakdown.slices}
                centerLabel={compact(redemptionBreakdown.total)}
                centerSub="Redeemed"
              />
              <ul className="w-full space-y-2">
                {redemptionBreakdown.slices.map((s) => (
                  <li key={s.name} className="flex items-center gap-3 text-[13px]">
                    <span className="h-3 w-3 rounded-sm" style={{ background: s.color }} />
                    <span className="min-w-0 flex-1 truncate text-[#0a152f]">{s.name}</span>
                    <span className="text-[#737373]">
                      {s.count} redemptions · {s.pct}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {/* Third row */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
        <div className="flex flex-col gap-4">
          {/* Live activity - TODO(feature): no activity/event log table yet. */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <CardHeader title="Live Activity" subtitle="Last 24 hours" />
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-[#344f89]"
              >
                View All <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            <div className="mt-4 rounded-[12px] border border-dashed border-[#e5e7eb] p-6 text-center text-[13px] text-[#737373]">
              Activity log will appear here as customers scan QR codes, earn points, and redeem
              rewards.
            </div>
          </Card>

          {/* Active campaigns */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <CardHeader
                title="Active campaigns"
                subtitle={`${activeCampaigns.length} running now`}
              />
              <Link
                to="/campaigns"
                className="inline-flex items-center gap-2 rounded-full bg-[#feb602] px-4 py-2 text-sm font-semibold text-[#0a152f] shadow-[0_2px_8px_rgba(254,182,2,0.3)] hover:bg-[#e29f00]"
              >
                <Plus className="h-4 w-4 text-[#0a152f]" aria-hidden />
                Create New
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-[#eef1f7]">
              {activeCampaigns.length === 0 ? (
                <li className="py-6 text-center text-[13px] text-[#737373]">
                  No active campaigns.
                </li>
              ) : (
                activeCampaigns.map((c) => {
                  const openRate =
                    c.sent_count > 0 ? Math.round((c.opened_count / c.sent_count) * 100) : 0;
                  return (
                    <li key={c.id} className="flex items-center gap-4 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef1f7]">
                        <Send className="h-4 w-4 text-[#344f89]" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/campaigns/$campaignId"
                          params={{ campaignId: c.id }}
                          className="block truncate text-[14px] font-semibold text-[#0a152f] hover:underline"
                        >
                          {c.name}
                        </Link>
                        <p className="mt-0.5 truncate text-[13px] text-[#737373]">
                          {c.sent_count} recipients · {c.channel.toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[16px] font-bold text-[#44b678]">{openRate}%</p>
                        <p className="text-[12px] text-[#737373]">Open Rate</p>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {/* Top customers */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <CardHeader title="Top Customers" subtitle="Ranked by points" />
              <Link
                to="/customers"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-[#344f89]"
              >
                View All <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-[#eef1f7]">
              {topCustomers.length === 0 ? (
                <li className="py-6 text-center text-[13px] text-[#737373]">No customers yet.</li>
              ) : (
                topCustomers.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                      style={{ background: tierColor(c.tier) }}
                      aria-hidden
                    >
                      {initials(c.full_name).toUpperCase() || "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/customers/$customerId"
                        params={{ customerId: c.id }}
                        className="block truncate text-[14px] font-semibold text-[#0a152f] hover:underline"
                      >
                        {c.full_name}
                      </Link>
                      <p className="mt-0.5 truncate text-[12px] text-[#737373]">
                        {c.tier ? `${c.tier} Member` : "Member"} · {c.visits} Visits
                      </p>
                    </div>
                    <span className="rounded-full bg-[#fff9e6] px-3 py-1 text-[12px] font-semibold text-[#e29f00]">
                      {c.points.toLocaleString()} pts
                    </span>
                  </li>
                ))
              )}
            </ul>
          </Card>

          {/* Customers at risk */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <CardHeader title="Customers at Risk" subtitle="Haven't visited in 30+ days" />
              <Link
                to="/customers"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-[#344f89]"
              >
                View All <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-[#eef1f7]">
              {atRiskList.length === 0 ? (
                <li className="py-6 text-center text-[13px] text-[#737373]">
                  No at-risk customers 🎉
                </li>
              ) : (
                atRiskList.map((c) => {
                  const days = Math.floor(
                    (now - new Date(c.last_activity_at!).getTime()) / (24 * 3600 * 1000),
                  );
                  return (
                    <li key={c.id} className="flex items-center gap-3 py-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                        style={{ background: tierColor(c.tier) }}
                        aria-hidden
                      >
                        {initials(c.full_name).toUpperCase() || "?"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-[#0a152f]">
                          {c.full_name}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-[#737373]">
                          Last visit {days} days ago
                        </p>
                      </div>
                      <Link
                        to="/campaigns"
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-[#344f89] hover:underline"
                      >
                        Send Campaign <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </Card>
        </div>
      </div>

      {/* Screen-reader hint for the two icon links we mirror in the design */}
      <span className="sr-only">
        <QrCode aria-hidden /> <UserPlus aria-hidden />
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  delta,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  delta: string;
}) {
  return (
    <div className="rounded-[16px] bg-white p-5 shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#525252]">{label}</p>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef1f7]">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[22px] font-bold text-[#0a152f]">{value}</p>
      {/* TODO(feature): month-over-month deltas require historical snapshots. */}
      <p className="mt-2 text-[12px] text-[#737373]">{delta} vs last month</p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] bg-white p-5 shadow-[0_1px_2px_rgba(15,28,61,0.04)] sm:p-6">
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-[16px] font-bold text-[#0a152f]">{title}</h2>
      <p className="mt-1 text-[13px] text-[#737373]">{subtitle}</p>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-[13px] text-[#737373]">
      {message}
    </div>
  );
}

function Donut({
  slices,
  centerLabel,
  centerSub,
}: {
  slices: { name: string; count: number; pct: number; color: string }[];
  centerLabel: string;
  centerSub: string;
}) {
  const size = 180;
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
      aria-label="Redemption breakdown"
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
