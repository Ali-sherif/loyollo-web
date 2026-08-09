import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SectionHeader } from "@/components/landing/SectionHeader";
import { CountUp } from "@/components/landing/CountUp";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Users,
  Layers,
  LineChart,
  Clock,
  BadgeCheck,
  Upload,
  Star,
  Stamp,
  Trophy,
  Gift,
  Share2,
  QrCode,
  Mail,
  MessageSquare,
  Cake,
  RefreshCcw,
  Bell,
  BarChart3,
  TrendingUp,
  UserPlus,
  Repeat,
  Percent,
  Crown,
  Gauge,
  Building2,
  ShieldCheck,
  UsersRound,
  MapPin,
  Zap,
  CalendarClock,
  Sparkles,
} from "lucide-react";
import iconAsset from "@/assets/loyollo-icon-white.svg.asset.json";
import customerProfileImg from "@/assets/Customers.png.asset.json";
import loyaltyProgramImg from "@/assets/Loyalty_Program.png.asset.json";
import campaignBuilderImg from "@/assets/Campaigns.png.asset.json";
import analyticsAsset from "@/assets/Analytics_-_Overview.png.asset.json";
import branchesAsset from "@/assets/Branches.png.asset.json";
import automationImg from "@/assets/Campaigns-2.png.asset.json";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Loyalty" },
      {
        name: "description",
        content:
          "Explore every tool Loyalty offers to help small businesses grow customer retention, reward loyal customers, and increase repeat revenue.",
      },
      { property: "og:title", content: "Features — Loyalty" },
      {
        property: "og:description",
        content:
          "Customer management, loyalty programs, marketing campaigns, analytics, multi-location and automation — all in one platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeaturesPage,
});

type Feature = { title: string; desc: string };
type FeatureGroup = { label?: string; items: Feature[] };

const customerMgmt: FeatureGroup[] = [
  {
    label: "Profiles & History",
    items: [
      { title: "Customer Profiles", desc: "Rich profiles with contact details, preferences, and full history in one place." },
      { title: "Customer Activity Timeline", desc: "Track every visit, reward, and interaction on a single timeline." },
      { title: "Customer Status", desc: "See who's active, at-risk, or lapsed and act at the right moment." },
    ],
  },
  {
    label: "Data & Insights",
    items: [
      { title: "Customer Segmentation", desc: "Group customers by behavior, spend, or activity to target them precisely." },
      { title: "Customer Insights", desc: "Understand what drives your best customers with clear, actionable data." },
      { title: "Import & Export Customers", desc: "Bring existing lists in and export data whenever you need it." },
    ],
  },
];

const loyaltyPrograms: FeatureGroup[] = [
  {
    label: "Program Types",
    items: [
      { title: "Points Programs", desc: "Reward every purchase with flexible, points-based earning rules." },
      { title: "Stamp Cards", desc: "Classic digital stamp cards — 'buy X, get one free' made effortless." },
      { title: "Reward Tiers", desc: "Create tiers that unlock bigger rewards as customers stay loyal." },
    ],
  },
  {
    label: "Rewards & Growth",
    items: [
      { title: "Custom Rewards", desc: "Design any reward: free items, discounts, exclusive perks, or gifts." },
      { title: "Referral Programs", desc: "Turn happy customers into advocates with built-in referral tools." },
      { title: "QR Code Enrollment", desc: "Customers join instantly by scanning a QR code — no app required." },
    ],
  },
];

const campaigns: FeatureGroup[] = [
  {
    items: [
      { title: "Email Campaigns", desc: "Send beautifully designed emails to the right customer segment." },
      { title: "SMS Campaigns", desc: "Reach customers instantly with high-open-rate SMS messages." },
      { title: "Birthday Campaigns", desc: "Automate birthday rewards that make every customer feel special." },
      { title: "Win-back Campaigns", desc: "Bring lapsed customers back with targeted, timely offers." },
      { title: "Automated Reminders", desc: "Nudge customers about unused rewards or upcoming expirations." },
      { title: "Campaign Analytics", desc: "Measure open, click, and redemption performance in real time." },
    ],
  },
];

const analytics: FeatureGroup[] = [
  {
    label: "Growth Metrics",
    items: [
      { title: "Revenue Impact", desc: "See exactly how loyalty is driving your top-line revenue." },
      { title: "Customer Growth", desc: "Track new sign-ups and program adoption over time." },
      { title: "Repeat Purchase Rate", desc: "Understand how loyalty translates into repeat visits." },
    ],
  },
  {
    label: "Engagement Metrics",
    items: [
      { title: "Redemption Rate", desc: "Monitor how often rewards are earned and redeemed." },
      { title: "Top Customers", desc: "Identify your VIPs and reward them before they churn." },
      { title: "Performance Dashboard", desc: "All the metrics that matter — beautifully visualized." },
    ],
  },
];

const multiLocation: FeatureGroup[] = [
  {
    label: "Team & Access",
    items: [
      { title: "Branch Management", desc: "Run a single program across every location seamlessly." },
      { title: "Multiple Admins", desc: "Invite team members and collaborate without stepping on toes." },
      { title: "Role Permissions", desc: "Fine-grained access controls for owners, managers, and staff." },
    ],
  },
  {
    label: "Reporting & Rewards",
    items: [
      { title: "Centralized Reporting", desc: "One dashboard, every location — compare performance instantly." },
      { title: "Location Performance", desc: "Drill into any branch to see what's working and what isn't." },
      { title: "Cross-Location Rewards", desc: "Let customers earn at one location and redeem at another." },
    ],
  },
];

const automation: FeatureGroup[] = [
  {
    items: [
      { title: "Automated Rewards", desc: "Trigger rewards based on milestones, spend, or visit count." },
      { title: "Birthday Rewards", desc: "Automatically celebrate every customer on their special day." },
      { title: "Tier Upgrades", desc: "Move customers up tiers the moment they qualify — no manual work." },
      { title: "Points Expiration", desc: "Set fair expiration rules and drive urgency to redeem." },
      { title: "Scheduled Campaigns", desc: "Plan and schedule campaigns weeks or months in advance." },
      { title: "Smart Customer Triggers", desc: "React to customer behavior automatically with smart triggers." },
    ],
  },
];

const stats = [
  { target: 68, suffix: "%", label: "Increase Repeat Visits" },
  { target: 42, suffix: "%", label: "Higher Customer Retention" },
  { target: 3, suffix: "x", label: "Faster Reward Redemption" },
  { target: 35, suffix: "%", label: "Revenue Growth" },
  { target: 92, suffix: "%", label: "Customer Engagement" },
];

type ImageLayout = "split-right" | "split-left" | "banner";

const sections = [
  { id: "customer-management", label: "Customer Management" },
  { id: "loyalty-programs", label: "Loyalty Programs" },
  { id: "campaigns", label: "Campaigns & Marketing" },
  { id: "analytics", label: "Analytics" },
  { id: "multi-location", label: "Multi-Location" },
  { id: "automation", label: "Automation" },
];

function AnchorNav({ active }: { active: string }) {
  return (
    <div className="sticky top-20 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6">
        <nav
          aria-label="Feature sections"
          className="scrollbar-none -mx-2 flex justify-center gap-1 overflow-x-auto px-2 py-3"
        >
          {sections.map((s) => {
            const isActive = active === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-navy-900 text-white"
                    : "text-muted-foreground hover:bg-navy-50 hover:text-navy-900",
                )}
              >
                {s.label}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function Frame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <img
        src={src}
        alt={alt}
        width={1280}
        height={896}
        loading="lazy"
        decoding="async"
        className="block h-auto w-full"
      />
    </div>
  );
}

function Checklist({ groups }: { groups: FeatureGroup[] }) {
  const grouped = groups.length > 1 && groups.some((g) => g.label);
  if (grouped) {
    return (
      <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {groups.map((g, i) => (
          <div key={i}>
            {g.label && (
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-900/70">
                {g.label}
              </div>
            )}
            <ul className="space-y-3">
              {g.items.map((item) => (
                <li key={item.title} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-gold-500" />
                  <span>
                    <span className="font-medium text-foreground">{item.title}</span>
                    {" — "}
                    {item.desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }
  const items = groups.flatMap((g) => g.items);
  return (
    <ul className="mt-8 grid gap-x-10 gap-y-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.title} className="flex items-start gap-3 text-sm text-muted-foreground">
          <Check className="mt-1 h-4 w-4 shrink-0 text-gold-500" />
          <span>
            <span className="font-medium text-foreground">{item.title}</span>
            {" — "}
            {item.desc}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SectionHead({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      <span className="inline-block rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-500">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base text-muted-foreground">{description}</p>
    </div>
  );
}

function FeatureSection({
  id,
  eyebrow,
  title,
  description,
  groups,
  image,
  imageAlt,
  imageLayout,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  groups: FeatureGroup[];
  image: string;
  imageAlt: string;
  imageLayout: ImageLayout;
}) {
  if (imageLayout === "banner") {
    return (
      <section id={id} className="scroll-mt-36 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead eyebrow={eyebrow} title={title} description={description} align="center" />
          <div className="mx-auto mt-10 max-w-5xl">
            <Frame src={image} alt={imageAlt} />
          </div>
          <div className="mx-auto max-w-4xl">
            <Checklist groups={groups} />
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id={id} className="scroll-mt-36 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className={imageLayout === "split-left" ? "lg:order-2" : ""}>
            <SectionHead eyebrow={eyebrow} title={title} description={description} />
            <Checklist groups={groups} />
          </div>
          <div className={cn("lg:sticky lg:top-40", imageLayout === "split-left" ? "lg:order-1" : "")}>
            <Frame src={image} alt={imageAlt} />
          </div>
        </div>
      </div>
    </section>
  );
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = React.useState(ids[0]);
  React.useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

function MidPageCTA() {
  return (
    <section className="px-6 py-12">
      <div
        className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-gold-500/20 bg-navy-50/60 px-8 py-10 shadow-[var(--shadow-soft)]"
      >
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-500">
              <Sparkles className="h-3.5 w-3.5" />
              Seen enough?
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
              Start rewarding your customers today.
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Set up your loyalty program in minutes — no credit card required.
            </p>
          </div>
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button variant="gold" size="lg" className="w-full sm:w-auto" asChild>
              <Link to="/signup">
                Start Free Trial
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghostNavy" size="lg" className="w-full sm:w-auto" asChild>
              <a href="/#pricing">View Pricing</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesPage() {
  const active = useActiveSection(sections.map((s) => s.id));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        {/* Hero */}
        <section
          id="features-hero"
          className="relative overflow-hidden"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #0A152F 1px, transparent 1px), linear-gradient(to bottom, #0A152F 1px, transparent 1px)",
                backgroundSize: "48px 48px",
                maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
                WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
              }}
            />
            <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gold-500/20 blur-3xl" />
            <div className="absolute top-40 -right-32 h-96 w-96 rounded-full bg-navy-500/10 blur-3xl" />
            <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-success-500/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-10 text-center">
            <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-navy-900 sm:text-5xl md:text-6xl">
              Everything You Need to Build{" "}
              <span className="text-gold-500">Customer Loyalty</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-navy-700 sm:text-lg">
              Manage loyalty programs, customer data, rewards, and analytics with a
              platform built specifically for local businesses.
            </p>

            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button variant="gold" size="xl" className="w-full sm:w-auto" asChild>
                <Link to="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghostNavy" size="xl" className="w-full sm:w-auto" asChild>
                <a href="/#pricing">View Pricing</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Anchor navigation */}
        <AnchorNav active={active} />

        {/* 1. Customer Management — split-right */}
        <FeatureSection
          id="customer-management"
          eyebrow="Customer Management"
          title="Know Every Customer, Personally"
          description="Build deep customer relationships with tools designed to understand, segment, and grow your audience."
          groups={customerMgmt}
          image={customerProfileImg.url}
          imageAlt="Customer profile view showing lifetime value, tier status, and activity timeline"
          imageLayout="split-right"
        />

        {/* 2. Loyalty Programs — split-left, tinted */}
        <div className="bg-navy-50/40">
          <FeatureSection
            id="loyalty-programs"
            eyebrow="Loyalty Programs"
            title="Rewards That Keep Customers Coming Back"
            description="Choose the loyalty model that fits your business — points, stamps, tiers, or referrals."
            groups={loyaltyPrograms}
            image={loyaltyProgramImg.url}
            imageAlt="Points program builder with reward tiers and a live stamp card preview"
            imageLayout="split-left"
          />
        </div>

        {/* 3. Campaigns — banner (full-width visual) */}
        <FeatureSection
          id="campaigns"
          eyebrow="Campaigns & Marketing"
          title="Reach the Right Customer at the Right Time"
          description="Launch beautiful campaigns that drive real visits, redemptions, and revenue."
          groups={campaigns}
          image={campaignBuilderImg.url}
          imageAlt="Email campaign builder with a live preview of a designed win-back email"
          imageLayout="banner"
        />

        {/* 4. Analytics — split-right, tinted */}
        <div className="bg-navy-50/40">
          <FeatureSection
            id="analytics"
            eyebrow="Analytics"
            title="See What's Working — and What Isn't"
            description="Turn every visit, reward, and campaign into insight you can act on."
            groups={analytics}
            image={analyticsAsset.url}
            imageAlt="Analytics dashboard with revenue trend, customer segments, and top rewards charts"
            imageLayout="split-right"
          />
        </div>

        {/* Mid-page conversion CTA */}
        <MidPageCTA />

        {/* 5. Multi-Location — split-left */}
        <FeatureSection
          id="multi-location"
          eyebrow="Multi-Location Management"
          title="One Platform for Every Location"
          description="Run a consistent loyalty program across every branch, with the visibility to manage it all."
          groups={multiLocation}
          image={branchesAsset.url}
          imageAlt="Multi-location dashboard comparing branch performance with a location map"
          imageLayout="split-left"
        />

        {/* 6. Automation — banner, tinted */}
        <div className="bg-navy-50/40">
          <FeatureSection
            id="automation"
            eyebrow="Automation"
            title="Let Loyalty Run Itself"
            description="Automate the moments that matter so your team can focus on running the business."
            groups={automation}
            image={automationImg.url}
            imageAlt="Automation workflow builder showing a birthday rewards flow with scheduled automations"
            imageLayout="banner"
          />
        </div>

        {/* Stats */}
        <section className="bg-background py-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeader
              eyebrow="Why Businesses Choose Loyalty"
              title="Results That Speak for Themselves"
              description="Businesses using Loyalty consistently see stronger retention, more repeat visits, and measurable revenue growth."
            />
            <div className="mt-14 grid grid-cols-2 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={cn(
                    "rounded-2xl border border-border bg-card p-7 text-center shadow-[var(--shadow-soft)]",
                    i === stats.length - 1 && "col-span-2 sm:col-span-2 md:col-span-1 lg:col-span-1",
                  )}
                >
                  <div className="text-3xl font-bold text-navy-900 sm:text-4xl">
                    <CountUp target={s.target} delay={i * 120} suffix={s.suffix} />
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-background px-6 pb-20">
          <div
            className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl px-6 py-16 text-center text-white"
            style={{ background: "var(--gradient-navy)" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl"
            />
            <div className="relative">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#15264F] text-gold-300">
                <img src={iconAsset.url} alt="Loyollo" className="h-6 w-auto object-contain" />
              </div>
              <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to Turn First-Time Customers Into{" "}
                <span className="text-gold-300">Loyal Customers?</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm text-navy-100 sm:text-base">
                Start your loyalty program in minutes and begin rewarding every visit.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button variant="gold" size="lg" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
                <Button variant="ghostLight" size="lg" asChild>
                  <Link to="/" hash="pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
