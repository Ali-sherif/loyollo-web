"use client";

import { Link, useNavigate, useRouterState } from "@/lib/navigation";
import * as React from "react";
import {
  Users,
  Gift,
  Coins,
  RefreshCw,
  Calendar as CalendarIcon,
  ChevronDown,
  Download,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  Coffee,
  Percent,
  Cookie,
  Crown,
  Trophy,
  UserPlus,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Clock,
  Bell,
  Send,
  Award,
  QrCode,
  Activity,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { getAuthSupabase } from "@/integrations/supabase/auth-client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

type TabKey = "overview" | "engagement" | "revenue";

type Customer = {
  id: string;
  full_name: string | null;
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
  icon: string | null;
  point_cost: number | null;
  redeemed_count: number;
};

function AnalyticsPage() {
  const navigate = useNavigate();
  const { user, isVerified, loading, signOut } = useAuth();
  const [fullName, setFullName] = React.useState("");
  const [programId, setProgramId] = React.useState<string | null>(null);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [rewards, setRewards] = React.useState<Reward[]>([]);
  const [ready, setReady] = React.useState(false);
  const [tab, setTab] = React.useState<TabKey>("overview");

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
      setFullName(
        (profile.full_name as string | null)?.trim() || (user.email?.split("@")[0] ?? ""),
      );
      const { data: program } = await getAuthSupabase()
        .from("loyalty_programs")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!program) {
        setReady(true);
        return;
      }
      setProgramId(program.id);
      const [{ data: cs }, { data: rs }] = await Promise.all([
        getAuthSupabase()
          .from("customers")
          .select(
            "id, full_name, email, tier, points, visits, status, last_activity_at, created_at",
          )
          .eq("loyalty_program_id", program.id),
        getAuthSupabase()
          .from("rewards")
          .select("id, name, icon, point_cost, redeemed_count")
          .eq("loyalty_program_id", program.id),
      ]);
      setCustomers((cs ?? []) as Customer[]);
      setRewards((rs ?? []) as Reward[]);
      setReady(true);
    })();
  }, [user, isVerified, loading, navigate]);

  if (loading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardShell firstName={fullName} onSignOut={signOut}>
      <div className="mx-auto max-w-[1180px]">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 px-1 pb-6 pt-2">
          <div>
            <h1 className="text-[24px] font-bold text-[#0a152f]">Analytics</h1>
            <p className="mt-1 text-[14px] text-[#525252]">
              A deeper look at engagement, retention, and revenue impact
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-[#0a152f] shadow-[0_1px_2px_rgba(15,28,61,0.04)]"
            >
              <CalendarIcon className="h-4 w-4 text-[#0a152f]" aria-hidden />
              This month
              <ChevronDown className="h-3 w-3 text-[#737373]" aria-hidden />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-[#0a152f] shadow-[0_1px_2px_rgba(15,28,61,0.04)]"
            >
              <Download className="h-4 w-4" aria-hidden />
              Export
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Analytics sections"
          className="mb-6 inline-flex items-center gap-1 rounded-[12px] bg-white p-1 shadow-[0_1px_3px_rgba(10,13,18,0.1)]"
        >
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "engagement", label: "Engagement" },
              { id: "revenue", label: "Revenue Impact" },
            ] as { id: TabKey; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-[8px] px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 ${
                tab === t.id ? "bg-[#feb602] text-white" : "text-[#0a152f] hover:bg-[#eef1f7]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <OverviewTab customers={customers} rewards={rewards} hasProgram={!!programId} />
        ) : tab === "engagement" ? (
          <EngagementTab customers={customers} hasProgram={!!programId} />
        ) : (
          <RevenueTab />
        )}
      </div>
    </DashboardShell>
  );
}

/* ---------------- Overview Tab ---------------- */

function OverviewTab({
  customers,
  rewards,
  hasProgram,
}: {
  customers: Customer[];
  rewards: Reward[];
  hasProgram: boolean;
}) {
  const now = Date.now();
  const DAY = 24 * 3600 * 1000;

  const activeMembers = customers.filter((c) => c.status === "active").length;
  const totalPointsIssued = customers.reduce((s, c) => s + (c.points || 0), 0);
  const pointsRedeemed = rewards.reduce((s, r) => s + r.redeemed_count * (r.point_cost ?? 0), 0);
  const redemptionRate =
    totalPointsIssued + pointsRedeemed > 0
      ? (pointsRedeemed / (totalPointsIssued + pointsRedeemed)) * 100
      : 0;
  const avgLiability = activeMembers > 0 ? Math.round(totalPointsIssued / activeMembers) : 0;
  const repeaters = customers.filter((c) => c.visits >= 2).length;
  const repeatRate = customers.length > 0 ? Math.round((repeaters / customers.length) * 100) : 0;

  // Members by tier
  const tierBreakdown = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const c of customers) {
      const key = (c.tier ?? "Untiered").trim() || "Untiered";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const total = customers.length;
    const palette = ["#a3a3a3", "#feb602", "#0a152f", "#344f89", "#c48a5b"];
    const slices = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        name,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
        color: palette[i % palette.length],
      }));
    return { total, slices };
  }, [customers]);

  // Top rewards
  const topRewards = React.useMemo(
    () =>
      [...rewards]
        .filter((r) => r.redeemed_count > 0)
        .sort((a, b) => b.redeemed_count - a.redeemed_count)
        .slice(0, 5),
    [rewards],
  );

  // Segments
  const newMembers = customers.filter(
    (c) => now - new Date(c.created_at).getTime() < 30 * DAY,
  ).length;
  const atRisk = customers.filter(
    (c) => c.last_activity_at && now - new Date(c.last_activity_at).getTime() > 60 * DAY,
  ).length;
  const champions = customers.filter((c) => c.visits >= 10).length;
  const loyalRegulars = customers.filter((c) => c.visits >= 3 && c.visits < 10).length;
  const totalCust = Math.max(1, customers.length);
  const segments = [
    {
      key: "champions",
      icon: Trophy,
      color: "#feb602",
      title: "Champions",
      subtitle: "Visit often, redeem regularly",
      count: champions,
    },
    {
      key: "loyal",
      icon: Crown,
      color: "#44b678",
      title: "Loyal regulars",
      subtitle: "Consistent, moderate spend",
      count: loyalRegulars,
    },
    {
      key: "new",
      icon: UserPlus,
      color: "#344f89",
      title: "New members",
      subtitle: "Joined in the last 30 days",
      count: newMembers,
    },
    {
      key: "risk",
      icon: AlertTriangle,
      color: "#e11d48",
      title: "At risk",
      subtitle: "No visit in 60+ days",
      count: atRisk,
    },
  ];

  // Points issued vs redeemed by week (last 8 weeks) — from customers.created_at (issued proxy).
  // TODO(feature): no per-transaction points ledger; redeemed series requires event tracking.
  const weeks = React.useMemo(() => {
    const oneWeek = 7 * DAY;
    const start = now - 8 * oneWeek;
    const buckets: { label: string; issued: number; redeemed: number }[] = [];
    for (let i = 0; i < 8; i++) buckets.push({ label: `W${i + 1}`, issued: 0, redeemed: 0 });
    for (const c of customers) {
      const t = new Date(c.created_at).getTime();
      if (t < start) continue;
      const idx = Math.min(7, Math.floor((t - start) / oneWeek));
      buckets[idx].issued += c.points || 0;
    }
    return buckets;
  }, [customers, now, DAY]);
  const maxBar = Math.max(1, ...weeks.map((w) => Math.max(w.issued, w.redeemed)));

  if (!hasProgram) {
    return (
      <div className="rounded-[16px] bg-white p-10 text-center shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
        <p className="text-[14px] text-[#737373]">
          Create a loyalty program to start seeing analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5 text-[#344f89]" />}
          label="Active members"
          value={activeMembers.toLocaleString()}
          delta="—"
          deltaHint="No prior period yet"
        />
        <StatCard
          icon={<RefreshCw className="h-5 w-5 text-[#44b678]" />}
          label="Redemption rate"
          value={`${redemptionRate.toFixed(1)}%`}
          delta="—"
          deltaHint="No prior period yet"
        />
        <StatCard
          icon={<Coins className="h-5 w-5 text-[#feb602]" />}
          label="Avg. points liability"
          value={avgLiability.toLocaleString()}
          delta="—"
          deltaHint="Per active member"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-[#0a152f]" />}
          label="Repeat purchase rate"
          value={`${repeatRate}%`}
          delta="—"
          deltaHint="≥2 visits"
        />
      </div>

      {/* Chart + donut */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <Card>
          <CardHeader
            title="Points issued vs. redeemed"
            subtitle="Weekly totals across all programs (last 8 weeks)"
          />
          {customers.length === 0 && pointsRedeemed === 0 ? (
            <EmptyChart message="No point activity yet." />
          ) : (
            <>
              <div className="mt-6 h-[260px]">
                <div className="flex h-full items-end gap-3 pb-6">
                  {weeks.map((w) => (
                    <div key={w.label} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex w-full flex-1 items-end justify-center gap-1">
                        <div
                          className="w-1/2 rounded-t-md bg-[#0f1c3d]"
                          style={{
                            height: `${(w.issued / maxBar) * 100}%`,
                            minHeight: w.issued > 0 ? 3 : 0,
                          }}
                          aria-label={`${w.label} issued: ${w.issued}`}
                        />
                        <div
                          className="w-1/2 rounded-t-md bg-[#feb602]"
                          style={{
                            height: `${(w.redeemed / maxBar) * 100}%`,
                            minHeight: w.redeemed > 0 ? 3 : 0,
                          }}
                          aria-label={`${w.label} redeemed: ${w.redeemed}`}
                        />
                      </div>
                      <span className="text-[11px] text-[#737373]">{w.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-[12px] text-[#525252]">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-[#0f1c3d]" /> Issued
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-[#feb602]" /> Redeemed
                </span>
                {/* TODO(feature): per-transaction points ledger not tracked yet; series are proxies. */}
              </div>
            </>
          )}
        </Card>

        <Card>
          <CardHeader title="Members by tier" subtitle="Distribution across tiers" />
          {tierBreakdown.total === 0 ? (
            <EmptyChart message="No members yet." />
          ) : (
            <div className="mt-2 flex flex-col items-center gap-6">
              <Donut
                slices={tierBreakdown.slices.map((s) => ({
                  name: s.name,
                  count: s.count,
                  color: s.color,
                  pct: s.pct,
                }))}
                centerLabel={tierBreakdown.total.toLocaleString()}
                centerSub="Total customers"
              />
              <ul className="w-full space-y-2">
                {tierBreakdown.slices.map((s) => (
                  <li key={s.name} className="flex items-center gap-3 text-[13px]">
                    <span className="h-3 w-3 rounded-sm" style={{ background: s.color }} />
                    <span className="min-w-0 flex-1 truncate text-[#0a152f]">{s.name}</span>
                    <span className="text-[#737373]">
                      {s.count} · {s.pct}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {/* Top rewards + segments */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Top redeemed rewards"
            subtitle="By number of redemptions this period"
          />
          <ul className="mt-4 divide-y divide-[#eef1f7]">
            {topRewards.length === 0 ? (
              <li className="py-10 text-center text-[13px] text-[#737373]">No redemptions yet.</li>
            ) : (
              topRewards.map((r, i) => (
                <li key={r.id} className="flex items-center gap-4 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff9e6]">
                    <RewardIcon name={r.name} icon={r.icon} index={i} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-[#0a152f]">{r.name}</p>
                    {r.point_cost != null ? (
                      <p className="mt-0.5 text-[12px] text-[#737373]">
                        {r.point_cost.toLocaleString()} pts each
                      </p>
                    ) : null}
                  </div>
                  <span className="text-[15px] font-semibold text-[#0a152f]">
                    {r.redeemed_count.toLocaleString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Customer segments"
            subtitle="Grouped by recency and frequency of visits"
          />
          <ul className="mt-4 divide-y divide-[#eef1f7]">
            {segments.map((s) => {
              const Icon = s.icon;
              const pct = Math.round((s.count / totalCust) * 100);
              return (
                <li key={s.key} className="flex items-center gap-4 py-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ background: `${s.color}1a` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: s.color }} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-[#0a152f]">{s.title}</p>
                    <p className="mt-0.5 text-[12px] text-[#737373]">{s.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-bold text-[#0a152f]">
                      {customers.length === 0 ? "—" : `${pct}%`}
                    </p>
                    <p className="text-[12px] text-[#737373]">{s.count}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Revenue impact */}
      <Card>
        <CardHeader title="Revenue impact" subtitle="Avg. order value, loyalty vs. non-members" />
        {/* TODO(feature): no transaction/order data source yet. */}
        <div className="mt-4 flex items-center gap-3 rounded-[12px] bg-[#eff8f3] px-4 py-3 text-[13px] text-[#0a152f]">
          <Sparkles className="h-4 w-4 text-[#44b678]" aria-hidden />
          Revenue tracking will appear here once orders are linked to loyalty members.
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-[12px] border border-[#eef1f7] p-5">
            <p className="text-[13px] text-[#737373]">Loyalty members</p>
            <p className="mt-2 text-[20px] font-bold text-[#0a152f]">—</p>
          </div>
          <div className="rounded-[12px] border border-[#eef1f7] p-5">
            <p className="text-[13px] text-[#737373]">Non-members</p>
            <p className="mt-2 text-[20px] font-bold text-[#0a152f]">—</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Engagement Tab ---------------- */

function EngagementTab({ customers, hasProgram }: { customers: Customer[]; hasProgram: boolean }) {
  const now = Date.now();
  const DAY = 24 * 3600 * 1000;

  const totalMembers = customers.length;
  const totalVisits = customers.reduce((s, c) => s + (c.visits || 0), 0);
  const avgVisits = totalMembers > 0 ? totalVisits / totalMembers : 0;

  const eligibleForRetention = customers.filter(
    (c) => now - new Date(c.created_at).getTime() >= 30 * DAY,
  );
  const retained = eligibleForRetention.filter(
    (c) => c.last_activity_at && now - new Date(c.last_activity_at).getTime() <= 30 * DAY,
  ).length;
  const retentionRate =
    eligibleForRetention.length > 0
      ? Math.round((retained / eligibleForRetention.length) * 100)
      : 0;

  const daysSince = (iso: string | null) =>
    iso ? (now - new Date(iso).getTime()) / DAY : Infinity;

  const champions = customers.filter((c) => c.visits >= 10 && daysSince(c.last_activity_at) <= 30);
  const loyal = customers.filter(
    (c) => c.visits >= 5 && c.visits < 10 && daysSince(c.last_activity_at) <= 30,
  );
  const occasional = customers.filter(
    (c) => c.visits >= 2 && c.visits < 5 && daysSince(c.last_activity_at) <= 60,
  );
  const atRisk = customers.filter((c) => {
    const d = daysSince(c.last_activity_at);
    return d > 20 && d <= 60;
  });
  const dormant = customers.filter((c) => daysSince(c.last_activity_at) > 60);

  const levels = [
    { key: "champions", label: "Champions", count: champions.length, color: "#feb602" },
    { key: "loyal", label: "Loyal", count: loyal.length, color: "#44b678" },
    { key: "occasional", label: "Occasional", count: occasional.length, color: "#344f89" },
    { key: "risk", label: "At risk", count: atRisk.length, color: "#e11d48" },
    { key: "dormant", label: "Dormant", count: dormant.length, color: "#a3a3a3" },
  ];
  const levelsMax = Math.max(1, ...levels.map((l) => l.count));

  const championAvg =
    champions.length > 0
      ? (champions.reduce((s, c) => s + c.visits, 0) / champions.length).toFixed(1)
      : "—";
  const occasionalAvg =
    occasional.length > 0
      ? (occasional.reduce((s, c) => s + c.visits, 0) / occasional.length).toFixed(1)
      : "—";
  const dormantLastSeen = React.useMemo(() => {
    if (dormant.length === 0) return "—";
    const mostRecent = dormant
      .map((c) => (c.last_activity_at ? new Date(c.last_activity_at).getTime() : 0))
      .reduce((a, b) => Math.max(a, b), 0);
    if (!mostRecent) return "Never active";
    const d = Math.floor((now - mostRecent) / DAY);
    return `${d}+ days ago`;
  }, [dormant, now, DAY]);

  const mostEngaged = [...customers]
    .sort((a, b) => (b.visits || 0) - (a.visits || 0) || (b.points || 0) - (a.points || 0))
    .slice(0, 5);

  const oneAwayFromReward = customers.filter((c) => c.visits > 0 && c.visits % 5 === 4).length;
  const insights = [
    {
      key: "at-risk",
      icon: AlertTriangle,
      tone: "#e11d48",
      title: `${atRisk.length} member${atRisk.length === 1 ? "" : "s"} at risk of churning`,
      body: "No visit in 20–60 days. Win-back campaign recommended.",
      cta: "Send",
      Cta: Send,
    },
    {
      key: "nudge",
      icon: Bell,
      tone: "#feb602",
      title: `${oneAwayFromReward} member${oneAwayFromReward === 1 ? "" : "s"} 1 visit from a reward`,
      body: "A reminder nudge now could drive high-value visits this week.",
      cta: "Nudge",
      Cta: ArrowUpRight,
    },
    // TODO(feature): peak hour requires a scans/visits event ledger with timestamps.
    {
      key: "peak",
      icon: Clock,
      tone: "#344f89",
      title: "Peak hour insights coming soon",
      body: "Once visit timestamps are tracked, we'll surface your busiest windows.",
      cta: "Explore",
      Cta: ArrowUpRight,
    },
    // TODO(feature): "close to next tier" requires per-program tier thresholds joined to members.
    {
      key: "tier",
      icon: Award,
      tone: "#44b678",
      title: "Tier upgrade nudges coming soon",
      body: "We'll flag members within reach of their next tier once thresholds are wired.",
      cta: "Create",
      Cta: ArrowUpRight,
    },
  ];

  if (!hasProgram) {
    return (
      <div className="rounded-[16px] bg-white p-10 text-center shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
        <p className="text-[14px] text-[#737373]">
          Create a loyalty program to start seeing engagement analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Activity className="h-5 w-5 text-[#344f89]" />}
          label="Avg. visits per member"
          value={totalMembers > 0 ? `${avgVisits.toFixed(1)}x` : "—"}
          delta="—"
          deltaHint="All-time average"
        />
        <StatCard
          icon={<QrCode className="h-5 w-5 text-[#feb602]" />}
          label="QR scans this period"
          value="—"
          delta="—"
          deltaHint="Scan tracking not wired yet"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-[#0a152f]" />}
          label="Avg. days between visits"
          value="—"
          delta="—"
          deltaHint="Requires visit event log"
        />
        <StatCard
          icon={<RefreshCw className="h-5 w-5 text-[#44b678]" />}
          label="30-day retention rate"
          value={eligibleForRetention.length > 0 ? `${retentionRate}%` : "—"}
          delta="—"
          deltaHint={
            eligibleForRetention.length > 0
              ? `Of ${eligibleForRetention.length} eligible`
              : "Needs members ≥30 days old"
          }
        />
      </div>

      {/* Chart + insights */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,490px)]">
        <Card>
          <CardHeader
            title="Visit frequency over time"
            subtitle="First-time vs. returning visits per week"
          />
          {/* TODO(feature): per-scan visit ledger not tracked; chart requires timestamped events. */}
          <EmptyChart message="Visit-level tracking coming soon — data will appear once scans are logged." />
          <div className="mt-4 flex items-center gap-4 text-[12px] text-[#525252]">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#0f1c3d]" /> Returning
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#feb602]" /> First-time
            </span>
          </div>
        </Card>

        <Card>
          <CardHeader title="Engagement insights" subtitle="Actions you can take right now" />
          <ul className="mt-4 space-y-3">
            {insights.map((it) => {
              const Icon = it.icon;
              const Cta = it.Cta;
              return (
                <li
                  key={it.key}
                  className="flex items-start gap-3 rounded-[12px] border border-[#eef1f7] p-4"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ background: `${it.tone}1a` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: it.tone }} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-[#0a152f]">{it.title}</p>
                    <p className="mt-1 text-[12px] leading-[1.4] text-[#737373]">{it.body}</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#0a152f] hover:underline"
                  >
                    {it.cta}
                    <Cta className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Most engaged + Engagement levels */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,410px)]">
        <Card>
          <CardHeader title="Most engaged members" subtitle="Ranked by visits" />
          {mostEngaged.length === 0 ? (
            <EmptyChart message="No members yet." />
          ) : (
            <div className="mt-4">
              <div className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,1fr)] gap-2 border-b border-[#eef1f7] pb-3 text-[12px] font-semibold uppercase tracking-wide text-[#737373]">
                <span>Customer</span>
                <span>Tier</span>
                <span>Visits</span>
                <span>Points Earned</span>
              </div>
              <ul className="divide-y divide-[#eef1f7]">
                {mostEngaged.map((c) => (
                  <li
                    key={c.id}
                    className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,1fr)] items-center gap-2 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef1f7] text-[12px] font-semibold text-[#0a152f]">
                        {initials(c.full_name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-[#0a152f]">
                          {c.full_name?.trim() || "Unnamed"}
                        </p>
                        {c.email ? (
                          <p className="mt-0.5 truncate text-[12px] text-[#737373]">{c.email}</p>
                        ) : null}
                      </div>
                    </div>
                    <TierPill tier={c.tier} />
                    <span className="text-[14px] text-[#0a152f]">{c.visits.toLocaleString()}</span>
                    <span className="text-[14px] font-semibold text-[#0a152f]">
                      {(c.points || 0).toLocaleString()} pts
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Engagement levels" subtitle="Members grouped by activity" />
          {totalMembers === 0 ? (
            <EmptyChart message="No members yet." />
          ) : (
            <>
              <ul className="mt-6 space-y-4">
                {levels.map((l) => {
                  const pct = totalMembers > 0 ? Math.round((l.count / totalMembers) * 100) : 0;
                  const barPct = (l.count / levelsMax) * 100;
                  return (
                    <li
                      key={l.key}
                      className="grid grid-cols-[80px_minmax(0,1fr)_90px] items-center gap-3"
                    >
                      <span className="text-[13px] text-[#0a152f]">{l.label}</span>
                      <span className="h-2 overflow-hidden rounded-full bg-[#eef1f7]">
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${barPct}%`, background: l.color }}
                        />
                      </span>
                      <span className="text-right text-[12px] text-[#737373]">
                        {l.count} · {pct}%
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="my-6 h-px bg-[#eef1f7]" />
              <ul className="space-y-3 text-[13px]">
                <li className="flex items-center justify-between">
                  <span className="text-[#525252]">Champion avg. visits</span>
                  <span className="font-semibold text-[#0a152f]">
                    {championAvg === "—" ? "—" : `${championAvg} / member`}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-[#525252]">Occasional avg. visits</span>
                  <span className="font-semibold text-[#0a152f]">
                    {occasionalAvg === "—" ? "—" : `${occasionalAvg} / member`}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-[#525252]">Dormant last seen</span>
                  <span className="font-semibold text-[#0a152f]">{dormantLastSeen}</span>
                </li>
              </ul>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function initials(name: string | null) {
  const n = (name ?? "").trim();
  if (!n) return "?";
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function TierPill({ tier }: { tier: string | null }) {
  const t = (tier ?? "").trim();
  if (!t) return <span className="text-[13px] text-[#a3a3a3]">—</span>;
  const key = t.toLowerCase();
  const palette: Record<string, { bg: string; fg: string }> = {
    vip: { bg: "#f5eaff", fg: "#6c2bd9" },
    gold: { bg: "#fff5d6", fg: "#8a6100" },
    silver: { bg: "#eef1f7", fg: "#525252" },
    bronze: { bg: "#f7ece0", fg: "#8a5a2b" },
  };
  const c = palette[key] ?? { bg: "#eef1f7", fg: "#0a152f" };
  return (
    <span
      className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      <Crown className="h-3 w-3" aria-hidden />
      {t}
    </span>
  );
}

/* ---------------- Building blocks ---------------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] bg-white p-5 shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-[#0a152f]">{title}</h3>
      {subtitle ? <p className="mt-1 text-[13px] text-[#737373]">{subtitle}</p> : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  delta,
  deltaHint,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  deltaHint?: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="rounded-[16px] bg-white p-5 shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-[#525252]">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef1f7]">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[20px] font-bold text-[#0a152f]">{value}</p>
      <div className="mt-2 flex items-center gap-1 text-[12px] text-[#737373]">
        {trend === "up" ? (
          <ArrowUp className="h-3 w-3 text-[#44b678]" aria-hidden />
        ) : trend === "down" ? (
          <ArrowDown className="h-3 w-3 text-[#e11d48]" aria-hidden />
        ) : null}
        <span>{delta}</span>
        {deltaHint ? <span className="text-[#a3a3a3]">· {deltaHint}</span> : null}
      </div>
      {/* TODO(feature): month-over-month deltas require historical snapshots. */}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="mt-4 flex h-[220px] items-center justify-center rounded-[12px] border border-dashed border-[#e5e7eb] text-[13px] text-[#737373]">
      {message}
    </div>
  );
}

function Donut({
  slices,
  centerLabel,
  centerSub,
}: {
  slices: { name: string; count: number; color: string; pct: number }[];
  centerLabel: string;
  centerSub: string;
}) {
  const size = 200;
  const r = 80;
  const stroke = 28;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((s, x) => s + x.count, 0) || 1;
  let offset = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#eef1f7"
          strokeWidth={stroke}
        />
        {slices.map((s) => {
          const len = (s.count / total) * c;
          const el = (
            <circle
              key={s.name}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[20px] font-bold text-[#0a152f]">{centerLabel}</p>
        <p className="text-[12px] text-[#737373]">{centerSub}</p>
      </div>
    </div>
  );
}

function RewardIcon({ name, icon, index }: { name: string; icon: string | null; index: number }) {
  const fallbacks = [Coffee, Percent, Cookie, Gift, Crown];
  const Icon = fallbacks[index % fallbacks.length];
  if (icon && icon.length <= 2) {
    return (
      <span className="text-[16px]" aria-label={name}>
        {icon}
      </span>
    );
  }
  return <Icon className="h-4 w-4 text-[#e29f00]" aria-hidden />;
}

function RevenueTab() {
  // TODO(feature): no orders/transactions table exists yet, linked to customers.
  // Every metric below is a placeholder until purchase data is tracked and joined to loyalty members.
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          icon={<Coins className="h-5 w-5 text-[#feb602]" />}
          label="Total Revenue Generated"
          value="—"
          delta="—"
          deltaHint="Requires order data"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-[#44b678]" />}
          label="Loyalty-Driven Revenue"
          value="—"
          delta="—"
          deltaHint="No transaction source yet"
        />
        <StatCard
          icon={<Percent className="h-5 w-5 text-[#344f89]" />}
          label="ROI from Rewards"
          value="—"
          delta="—"
          deltaHint="Requires reward cost + revenue link"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-[#0a152f]" />}
          label="Avg. revenue per member"
          value="—"
          delta="—"
          deltaHint="Requires order data"
        />
        <StatCard
          icon={<Gift className="h-5 w-5 text-[#e29f00]" />}
          label="Rewards redeemed revenue"
          value="—"
          delta="—"
          deltaHint="Requires order data"
        />
        <StatCard
          icon={<Crown className="h-5 w-5 text-[#6c2bd9]" />}
          label="Top-spending member"
          value="—"
          delta="—"
          deltaHint="Requires order data"
        />
      </div>
      <Card>
        <CardHeader title="Revenue over time" subtitle="Monthly revenue trend" />
        <EmptyChart message="Revenue tracking coming soon — link orders to loyalty members to see this chart." />
      </Card>
      <Card>
        <CardHeader title="Revenue by channel" subtitle="Where loyalty-driven revenue comes from" />
        <EmptyChart message="Revenue tracking coming soon — link orders to loyalty members to see this chart." />
      </Card>
      <Card>
        <CardHeader title="Revenue by reward tier" subtitle="Which tiers drive the most spend" />
        <div className="mt-4 overflow-hidden rounded-[16px] border border-[#eef1f7]">
          <div className="grid grid-cols-3 bg-[#eef1f7] text-[12px] font-semibold uppercase tracking-wide text-[#737373]">
            <div className="p-3">Tier</div>
            <div className="p-3">Members</div>
            <div className="p-3">Revenue</div>
          </div>
          <div className="p-8 text-center text-[13px] text-[#737373]">No revenue data yet.</div>
        </div>
      </Card>
    </div>
  );
}

export default AnalyticsPage;
