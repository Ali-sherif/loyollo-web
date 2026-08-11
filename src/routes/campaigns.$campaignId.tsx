import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import { Mail, MessageSquare, Users, Gift, DollarSign, Pencil, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { cn } from "@/lib/utils";
import { CreateCampaignDialog, type CampaignFormData } from "./campaigns.index";

export const Route = createFileRoute("/campaigns/$campaignId")({
  head: () => ({
    meta: [
      { title: "Campaign details — Loyalty" },
      { name: "description", content: "Track how your campaign performed across recipients." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CampaignDetailsPage,
});

type Campaign = {
  id: string;
  loyalty_program_id: string;
  owner_id: string;
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
  sent_at: string | null;
};

type RecipientRow = {
  id: string;
  status: string;
  sent_at: string | null;
  customer_id: string;
  customers: { full_name: string | null; email: string | null; tier: string | null } | null;
};

const TIER_COLORS: Record<string, string> = {
  silver: "#20386b",
  gold: "#feb602",
  vip: "#a3a3a3",
};

function CampaignDetailsPage() {
  const { campaignId } = Route.useParams();
  const navigate = useNavigate();
  const { user, isVerified, loading, signOut } = useAuth();

  const [firstName, setFirstName] = React.useState("");
  const [ready, setReady] = React.useState(false);
  const [campaign, setCampaign] = React.useState<Campaign | null>(null);
  const [recipients, setRecipients] = React.useState<RecipientRow[]>([]);
  const [notFound, setNotFound] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  const CAMPAIGN_COLS =
    "id, loyalty_program_id, owner_id, name, description, channel, status, audience, subject, message, sent_count, opened_count, revenue_cents, failed_count, created_at, sent_at";

  const handleEditSubmit = async (data: CampaignFormData) => {
    if (!campaign) return;
    const { data: row, error } = await supabase
      .from("campaigns")
      .update({
        name: data.name.trim(),
        description: data.description.trim() || null,
        channel: data.channel,
        audience: data.audience.trim() || null,
        subject: data.subject.trim() || null,
        message: data.message.trim() || null,
      })
      .eq("id", campaign.id)
      .select(CAMPAIGN_COLS)
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setCampaign(row as Campaign);
    setEditOpen(false);
    toast.success("Campaign updated");
  };

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/signin", replace: true });
      return;
    }
    if (!isVerified) {
      navigate({ to: "/verify", search: { email: user.email ?? "" }, replace: true });
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

      const { data: c } = await supabase
        .from("campaigns")
        .select(
          "id, loyalty_program_id, owner_id, name, description, channel, status, audience, subject, message, sent_count, opened_count, revenue_cents, failed_count, created_at, sent_at",
        )
        .eq("id", campaignId)
        .maybeSingle();

      if (!c) {
        setNotFound(true);
        setReady(true);
        return;
      }
      setCampaign(c as Campaign);

      const { data: recs } = await supabase
        .from("campaign_recipients")
        .select("id, status, sent_at, customer_id, customers(full_name, email, tier)")
        .eq("campaign_id", campaignId);
      setRecipients((recs as RecipientRow[] | null) ?? []);
      setReady(true);
    })();
  }, [user, isVerified, loading, navigate, campaignId]);

  const toggleActive = async () => {
    if (!campaign) return;
    const next = campaign.status === "disabled" ? "active" : "disabled";
    const { data } = await supabase
      .from("campaigns")
      .update({ status: next })
      .eq("id", campaign.id)
      .select(
        "id, loyalty_program_id, owner_id, name, description, channel, status, audience, subject, message, sent_count, opened_count, revenue_cents, failed_count, created_at, sent_at",
      )
      .single();
    if (data) setCampaign(data as Campaign);
  };

  if (loading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <DashboardShell firstName={firstName} onSignOut={signOut}>
        <div className="mx-auto max-w-[1140px] space-y-4">
          <Link
            to="/campaigns"
            className="inline-flex items-center gap-1 text-sm text-[#525252] hover:text-[#0a152f]"
          >
            <ChevronLeft className="h-4 w-4" /> Back to campaigns
          </Link>
          <div className="rounded-[12px] bg-white p-8 text-center ring-1 ring-[#eef1f7]">
            <p className="text-[16px] font-semibold text-[#0a152f]">Campaign not found</p>
            <p className="mt-1 text-[13px] text-[#737373]">
              It may have been deleted or you don't have access.
            </p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // Sent recipients drive "customers reached"
  const sent = recipients.filter((r) => r.status === "sent");
  const total = sent.length;
  const tierCounts = { silver: 0, gold: 0, vip: 0, other: 0 };
  for (const r of sent) {
    const t = (r.customers?.tier ?? "").toLowerCase();
    if (t === "silver") tierCounts.silver++;
    else if (t === "gold") tierCounts.gold++;
    else if (t === "vip") tierCounts.vip++;
    else tierCounts.other++;
  }

  // TODO(feature): open/click tracking, revenue attribution, and per-customer
  // engagement scoring are not implemented. Values default to 0 / empty here.
  const revenueInfluenced = campaign.revenue_cents ?? 0;
  const rewardsRedeemed = 0;
  const topEngaged: RecipientRow[] = []; // no engagement signal available yet

  const isEmail = campaign.channel !== "sms";
  const created = new Date(campaign.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const lastSent = campaign.sent_at
    ? new Date(campaign.sent_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const isActive = campaign.status === "active" || campaign.status === "sending";

  return (
    <DashboardShell firstName={firstName} onSignOut={signOut}>
      <div className="mx-auto max-w-[1140px] space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-[14px]">
          <Link to="/campaigns" className="text-[#737373] hover:text-[#0a152f]">
            Campaigns
          </Link>
          <span className="text-[#737373]">/</span>
          <span className="font-semibold text-[#0a152f]">{campaign.name}</span>
        </div>

        {/* Header card */}
        <section className="rounded-[12px] border border-[#d7ddea] bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-4">
                <h1 className="min-w-0 flex-1 break-words text-[20px] font-semibold leading-tight text-[#0a152f] sm:text-[24px]">
                  {campaign.name}
                </h1>
                <button
                  type="button"
                  onClick={() => void toggleActive()}
                  aria-label={isActive ? "Disable campaign" : "Enable campaign"}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full p-0.5 transition",
                    isActive ? "bg-[#44b678]" : "bg-[#d4d4d4]",
                  )}
                >
                  <span
                    className={cn(
                      "block h-4 w-4 rounded-full bg-white shadow transition",
                      isActive ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
              <p className="text-[14px] text-[#737373]">
                Created: {created} • Last Sent: {lastSent}
              </p>
              <div className="flex flex-wrap gap-6 pt-1">
                <span className="inline-flex items-center gap-1.5 text-[14px] text-[#737373]">
                  {isEmail ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  {isEmail ? "Email" : "SMS"}
                </span>
                {campaign.audience && (
                  <span className="inline-flex items-center gap-1.5 text-[14px] text-[#737373]">
                    <Users className="h-4 w-4" />
                    {campaign.audience}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-8 py-2 text-[14px] font-semibold text-[#0a152f] shadow-[0_2px_4px_rgba(0,0,0,0.04)] ring-1 ring-[#eef1f7] transition hover:bg-[#f7f8fb]"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          </div>
        </section>

        {/* Reached + Stats */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_564px]">
          {/* Customers Reached */}
          <section className="rounded-[12px] border border-[#d7ddea] bg-white p-5">
            <h2 className="text-[20px] font-semibold text-[#0a152f]">Customers Reached</h2>
            <div className="mt-6 flex justify-center">
              <TierDonut total={total} tierCounts={tierCounts} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <TierLegend color={TIER_COLORS.silver} label="Silver" value={tierCounts.silver} />
              <TierLegend color={TIER_COLORS.gold} label="Gold" value={tierCounts.gold} />
              <TierLegend color={TIER_COLORS.vip} label="VIP" value={tierCounts.vip} />
              {tierCounts.other > 0 && (
                <TierLegend color="#d4d4d4" label="Other" value={tierCounts.other} />
              )}
            </div>
          </section>

          {/* Campaign Stats */}
          <section className="rounded-[12px] border border-[#d7ddea] bg-white p-5">
            <h2 className="text-[20px] font-semibold text-[#0a152f]">Campaign Stats</h2>
            <div className="mt-4 space-y-3">
              {total > 0 && (
                <div className="rounded-[8px] bg-[#effaf4] px-4 py-3 text-[13px] text-[#2f7a54]">
                  Delivered to {total} recipient{total === 1 ? "" : "s"}
                  {campaign.failed_count ? ` (${campaign.failed_count} failed)` : ""}.
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <StatTile
                  label="Recipients"
                  value={total.toLocaleString()}
                  icon={Users}
                  color="#feb602"
                />
                <StatTile
                  label="Revenue Influenced"
                  value={`$${(revenueInfluenced / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
                  icon={DollarSign}
                  color="#feb602"
                />
                <StatTile
                  label="Rewards Redeemed"
                  value={rewardsRedeemed.toLocaleString()}
                  icon={Gift}
                  color="#feb602"
                  className="col-span-2"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Top Engaged + Message */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_450px]">
          <section className="rounded-[12px] border border-[#d7ddea] bg-white p-5">
            <h2 className="text-[20px] font-semibold text-[#0a152f]">Top Engaged Customers</h2>
            {topEngaged.length === 0 ? (
              <div className="mt-6 rounded-[8px] bg-[#f7f8fb] px-4 py-8 text-center text-[13px] text-[#737373]">
                Engagement tracking isn't available yet. Once open and click tracking is wired up,
                the most engaged recipients will appear here.
              </div>
            ) : (
              <div className="mt-4 space-y-2">{/* future: top engaged list */}</div>
            )}
          </section>

          <section className="rounded-[12px] border border-[#d7ddea] bg-white p-5">
            <h2 className="text-[20px] font-semibold text-[#0a152f]">Campaign Message</h2>
            {isEmail && campaign.subject && (
              <p className="mt-4 text-[14px] text-[#525252]">
                Subject: <span className="font-semibold text-[#0a152f]">{campaign.subject}</span>
              </p>
            )}
            <p className="mt-4 text-[13px] font-medium text-[#737373]">Message Preview:</p>
            <div className="mt-2 rounded-[8px] bg-[#f7f8fb] p-4">
              <p className="whitespace-pre-wrap text-[14px] leading-[1.55] text-[#0a152f]">
                {campaign.message?.trim() || "No message content."}
              </p>
            </div>
          </section>
        </div>
      </div>

      <CreateCampaignDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={(data) => handleEditSubmit(data)}
        mode="edit"
        initial={campaign}
      />
    </DashboardShell>
  );
}

function TierDonut({
  total,
  tierCounts,
}: {
  total: number;
  tierCounts: { silver: number; gold: number; vip: number; other: number };
}) {
  const size = 200;
  const stroke = 32;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  const segments = [
    { key: "silver", value: tierCounts.silver, color: TIER_COLORS.silver },
    { key: "gold", value: tierCounts.gold, color: TIER_COLORS.gold },
    { key: "vip", value: tierCounts.vip, color: TIER_COLORS.vip },
    { key: "other", value: tierCounts.other, color: "#d4d4d4" },
  ];

  let offset = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef1f7" strokeWidth={stroke} />
        {total > 0 &&
          segments.map((s) => {
            if (s.value === 0) return null;
            const length = (s.value / total) * circ;
            const el = (
              <circle
                key={s.key}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${length} ${circ - length}`}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[20px] font-semibold text-[#0a152f]">{total.toLocaleString()}</p>
        <p className="text-[14px] text-[#737373]">Total customers</p>
      </div>
    </div>
  );
}

function TierLegend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 p-1">
      <span className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: color }} />
      <span className="flex-1 text-[12px] text-[#737373]">{label}</span>
      <span className="text-[12px] font-semibold text-[#0a152f]">{value.toLocaleString()}</span>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  color,
  className,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; color?: string }>;
  color: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[8px] border border-[#eef1f7] p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#737373]">{label}</p>
        <Icon className="h-4 w-4" color={color} />
      </div>
      <p className="mt-2 text-[18px] font-semibold text-[#0a152f]">{value}</p>
    </div>
  );
}
