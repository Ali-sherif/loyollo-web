import { type ComponentType, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { SectionHeader } from "@/components/landing/SectionHeader";
import { Footer } from "@/components/landing/Footer";
import { CTA } from "@/components/landing/CTA";
import { CountUp } from "@/components/landing/CountUp";
import { Button } from "@/components/ui/button";
import starbucksLogo from "@/assets/starbucks-logo.webp";
import timHortonsLogo from "@/assets/tim-hortons-logo.webp";
import {
  Store,
  Zap,
  Users,
  Rocket,
  MapPin,
  ShieldCheck,
  ArrowUpRight,
  Coffee,
  Gift,
  Sparkles,
  TrendingUp,
  Heart,
  Quote,
} from "lucide-react";
import missionIllustration from "@/assets/about-mission-illustration.png";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Loyalty" },
      {
        name: "description",
        content:
          "On a mission to make loyalty simple. We help local businesses grow with sophisticated loyalty tools built for the corner shop, not the enterprise.",
      },
      { property: "og:title", content: "About — Loyalty" },
      {
        property: "og:description",
        content:
          "Every small business deserves the same customer retention tools big brands use — without the complexity or the enterprise price tag.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const stats = [
  { target: 1500, suffix: "+", label: "Active Businesses" },
  { target: 500, suffix: "K+", label: "Enrolled Consumers" },
  {
    target: 4.8,
    suffix: <span className="text-[0.85em]">★</span>,
    label: "Average Rating",
    decimals: 1,
  },
];

const values = [
  {
    icon: Store,
    title: "Small Business First",
    desc: "Every decision we make starts with one question: does this make life easier for a small business owner?",
  },
  {
    icon: Zap,
    title: "Radical Simplicity",
    desc: "Loyalty software shouldn't require a manual. We obsess over removing complexity, not adding features.",
  },
  {
    icon: Users,
    title: "Community Over Competition",
    desc: "Small businesses are the backbone of local economies. We're here to strengthen that, not exploit it.",
  },
  {
    icon: Rocket,
    title: "Speed To Value",
    desc: "From sign-up to first involved customer in under 10 minutes. No onboarding calls, no IT team required.",
  },
  {
    icon: MapPin,
    title: "Built For North America",
    desc: "Designed specifically for US and Canadian small businesses — tax rules, tipping culture, and all.",
  },
  {
    icon: ShieldCheck,
    title: "Accountability",
    desc: "We publish our uptime, our NPS, and our roadmap. You deserve to know exactly what you're buying into.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        {/* Hero */}
        <section
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

          <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-16 text-center">
            <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-navy-900 sm:text-5xl md:text-6xl">
              On a <span className="text-gold-500">Mission</span>
              <br />
              to make loyalty simple
            </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-navy-700 sm:text-lg">
            We believe every small business deserves the same customer
            retention tools that big brands use, without the complexity, the
            hardware, or the enterprise price tag.
          </p>
          <Button variant="gold" size="lg" className="mt-8 w-full max-w-xs gap-1.5 rounded-full sm:w-auto sm:max-w-none" asChild>
            <Link to="/signup">
              Start Free Trial
              <ArrowUpRight className="h-5 w-5" />
            </Link>
          </Button>
          </div>
        </section>


        {/* Mission — Supporting Local Business Growth */}
        <section className="bg-background py-16">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center rounded-full bg-gold-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-500">
                Our Mission
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
                Supporting Local Business{" "}
                <span className="text-gold-500">Growth</span>
              </h2>
              <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                <p>
                  We believe every small business deserves the tools to
                  understand its customers, reward loyalty, and create
                  meaningful connections that last.
                </p>
                <p>
                  Big-box retailers and national chains have spent decades
                  building sophisticated loyalty programs that keep customers
                  coming back. Small businesses — the coffee shops, salons, and
                  restaurants that make neighborhoods feel like home — haven't
                  had access to the same tools.
                </p>
                <p>
                  We're changing that. Our system gives every small business
                  owner the same retention superpowers, without the enterprise
                  price tag or the six-month implementation.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src={missionIllustration}
                alt="Illustration of a hand holding a local shop with a growth chart and customer icons"
                width={1024}
                height={896}
                loading="lazy"
                decoding="async"
                className="block h-auto w-full"
              />
            </div>
          </div>
        </section>

        {/* Stats band */}
        <section className="bg-navy-900 py-14 text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  <span className="text-white">
                    <CountUpWhite
                      target={s.target}
                      suffix={s.suffix}
                      decimals={s.decimals ?? 0}
                    />
                  </span>
                </div>
                <div className="mt-2 text-sm font-medium text-navy-200">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Our Story — Why Businesses Choose Us */}
        <section className="relative bg-background py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center rounded-full bg-gold-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-500">
                Our Story
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
                Why Businesses{" "}
                <span className="text-gold-500">Choose Us</span>
              </h2>
              <p className="mt-4 text-sm text-muted-foreground sm:text-base">
                A short story about the fight to win customers back — and the
                simple tool that changes the math.
              </p>
            </div>

            {/* Timeline */}
            <ol className="relative mt-16 space-y-14 md:space-y-20">
              {/* Vertical line — sits inside the fixed-width icon track on mobile, center spine on desktop */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-5 top-2 bottom-2 z-0 w-px -translate-x-1/2 bg-gradient-to-b from-gold-500/40 via-border to-transparent md:left-1/2"
              />

              {/* Chapter 01 — The Challenge */}
              <li className="relative grid gap-6 md:grid-cols-2 md:gap-12">
                <div className="pl-14 md:pl-0 md:pr-12 md:text-right">

                  <ChapterMarker index="01" side="left" icon={TrendingUp} />
                  <h3 className="mt-1 text-xl font-bold text-navy-900 sm:text-2xl">
                    The Challenge
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Salons, single-location restaurants, barbershops, cafes,
                    and independent retail shops work nonstop to win customers
                    — but getting them back is the real struggle. With tight
                    budgets, limited time, and little tech support, most small
                    businesses rely on crowded ad channels (Facebook,
                    Instagram, TikTok) that are costly and increasingly
                    ineffective.
                  </p>
                </div>
                <div className="hidden md:block" />
              </li>

              {/* Chapter 02 — The Inspiration */}
              <li className="relative grid gap-6 md:grid-cols-2 md:gap-12">
                <div className="hidden md:block" />
                <div className="pl-14 md:pl-12">

                  <ChapterMarker index="02" side="right" icon={Sparkles} />
                  <h3 className="mt-1 text-xl font-bold text-navy-900 sm:text-2xl">
                    The Inspiration
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    There's one simple trick most of them aren't using enough:
                    loyalty. Imagine a regular who used to pop in once a month
                    now coming every other week because they're one visit away
                    from a free cut. Or a customer who spends a little more to
                    hit a points milestone and grab a discount.
                  </p>

                  {/* Pull quote */}
                  <figure className="mt-6 rounded-2xl border border-gold-500/30 bg-gold-500/5 p-6">
                    <Quote className="h-5 w-5 text-gold-500" aria-hidden />
                    <blockquote className="mt-3 text-sm font-semibold leading-snug text-navy-900 sm:text-base">
                      That's loyalty — not a gimmick, but a relationship tool
                      that rewards behavior, makes customers feel special, and
                      turns casual shoppers into repeat visitors.
                    </blockquote>
                  </figure>
                </div>
              </li>

              {/* Chapter 03 — What Loyalty Really Means */}
              <li className="relative grid gap-6 md:grid-cols-2 md:gap-12">
                <div className="pl-14 md:pl-0 md:pr-12 md:text-right">

                  <ChapterMarker index="03" side="left" icon={Gift} />
                  <h3 className="mt-1 text-xl font-bold text-navy-900 sm:text-2xl">
                    What Loyalty Really Means
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    What is loyalty — in plain terms? A loyalty program is
                    just a way to say "thanks" every time someone comes back:
                    points for purchases, rewards for referrals, birthday
                    treats, exclusive offers. It's simple psychology — people
                    like getting something extra, and they'll choose the place
                    that recognizes and rewards them.
                  </p>
                </div>
                <div className="hidden md:block" />
              </li>

              {/* Chapter 04 — Proof From The Big Brands (with callout cards) */}
              <li className="relative grid gap-6 md:grid-cols-2 md:gap-12">
                <div className="hidden md:block" />
                <div className="pl-14 md:pl-12">

                  <ChapterMarker index="04" side="right" icon={Coffee} />
                  <h3 className="mt-1 text-xl font-bold text-navy-900 sm:text-2xl">
                    Proof From The Big Brands
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Big brands prove it works. Those companies stopped relying
                    only on noisy ads and created an owned channel that
                    reliably drives revenue.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-white">
                        <img
                          src={starbucksLogo}
                          alt="Starbucks logo"
                          className="h-8 w-8 object-contain"
                          loading="lazy"
                        />
                      </div>
                      <h4 className="mt-4 text-sm font-semibold text-navy-900">
                        Starbucks
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Built habitual buyers with its rewards program;
                        members earn stars often and spend more.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
                      <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white">
                        <img
                          src={timHortonsLogo}
                          alt="Tim Hortons logo"
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <h4 className="mt-4 text-sm font-semibold text-navy-900">
                        Tim Hortons
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Uses targeted offers and points to bring customers
                        back on slow days and increase order size.
                      </p>
                    </div>
                  </div>
                </div>
              </li>

              {/* Chapter 05 — The Same Idea, Scaled Down */}
              <li className="relative grid gap-6 md:grid-cols-2 md:gap-12">
                <div className="pl-14 md:pl-0 md:pr-12 md:text-right">

                  <ChapterMarker index="05" side="left" icon={Heart} />
                  <h3 className="mt-1 text-xl font-bold text-navy-900 sm:text-2xl">
                    The Same Idea, Scaled Down
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    For small businesses it's the same idea, just scaled down.
                    A barber can fill weekday slots with reward offers; a cafe
                    can turn occasional visitors into daily regulars; a salon
                    can boost product sales by adding points to purchases.
                    Loyalty makes revenue more predictable and marketing far
                    cheaper.
                  </p>
                </div>
                <div className="hidden md:block" />
              </li>

              {/* Chapter 06 — Our Solution */}
              <li className="relative grid gap-6 md:grid-cols-2 md:gap-12">
                <div className="hidden md:block" />
                <div className="pl-14 md:pl-12">

                  <ChapterMarker index="06" side="right" icon={Rocket} />
                  <h3 className="mt-1 text-xl font-bold text-navy-900 sm:text-2xl">
                    Our Solution
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    They deserve better. We built a simple, web-based loyalty
                    platform — no app required — to give these businesses the
                    tools that actually drive repeat visits: QR check-ins,
                    points &amp; rewards, automated email &amp; SMS, referral
                    bonuses, and clear analytics. We partner with small
                    business owners through fast onboarding, transparent
                    pricing, and hands-on support.
                  </p>
                  <figure className="mt-6 rounded-2xl border border-gold-500/30 bg-gold-500/5 p-6">
                    <Quote className="h-5 w-5 text-gold-500" aria-hidden />
                    <blockquote className="mt-3 text-sm font-semibold leading-snug text-navy-900 sm:text-base">
                      Reward your customers. Grow steady revenue. We'll handle
                      the rest.
                    </blockquote>
                  </figure>
                </div>
              </li>
            </ol>
          </div>
        </section>


        {/* What We Stand For — Values */}
        <section className="bg-navy-50/40 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeader
              eyebrow="Values"
              title="What We Stand For"
              description="We believe that every small business deserves the opportunity to build lasting customer relationships through simplicity, transparency, and innovation."
            />

            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {values.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-gold-50 text-gold-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-base font-semibold text-navy-900">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

/** White-number variant of CountUp for use on dark backgrounds. */
function CountUpWhite({
  target,
  suffix,
  decimals,
}: {
  target: number;
  suffix: ReactNode;
  decimals: number;
}) {
  return (
    <span className="[&_span]:!text-white">
      <CountUp
        target={target}
        suffix=""
        decimals={decimals}
        startFraction={0.6}
      />
      <span className="!text-gold-500">{suffix}</span>
    </span>
  );
}

/** Timeline chapter marker — a numbered gold node on the vertical spine. */
function ChapterMarker({
  index,
  side,
  icon: Icon,
}: {
  index: string;
  side: "left" | "right";
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <>
      {/* Mobile: absolute-positioned icon in the fixed-width track (center at 20px = line position) */}
      <div className="absolute left-0 top-0 z-10 grid h-10 w-10 place-items-center rounded-full bg-[#FEB602] text-white ring-4 ring-background md:hidden">
        <Icon className="h-4 w-4" />
      </div>

      {/* Desktop: node on the center spine */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1 left-1/2 z-10 hidden -translate-x-1/2 md:block"
      >
        <div className="grid h-11 w-11 place-items-center rounded-full bg-[#FEB602] text-white ring-4 ring-background">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </>
  );
}
