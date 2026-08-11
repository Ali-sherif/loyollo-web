"use client";

import { Link, useNavigate, useRouterState } from "@/lib/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { ChoosePlanIllustration } from "@/components/guide/ChoosePlanIllustration";
import { SetupProgramIllustration } from "@/components/guide/SetupProgramIllustration";
import { QrCodeIllustration } from "@/components/guide/QrCodeIllustration";
import { CustomerEnrollIllustration } from "@/components/guide/CustomerEnrollIllustration";
import { RewardCustomersIllustration } from "@/components/guide/RewardCustomersIllustration";
import { TrackGrowthIllustration } from "@/components/guide/TrackGrowthIllustration";
import { BusinessTypesTabs } from "@/components/guide/BusinessTypesTabs";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Sparkles,
  UserPlus,
  QrCode,
  Users,
  Settings,
  Palette,
  Smartphone,
  Gift,
  BarChart3,
  ShoppingCart,
  Store,
  Pill,
  Building2,
  PawPrint,
  Sparkle,
  Smartphone as PhoneIcon,
  Sofa,
  Dumbbell,
  BookOpen,
  Clock,
} from "lucide-react";

/* ---------------- data ---------------- */

const shortSteps = [
  { icon: UserPlus, title: "Step 1", desc: "Sign up & configure your program" },
  { icon: QrCode, title: "Step 2", desc: "Place your QR code at your business" },
  { icon: Users, title: "Step 3", desc: "Customers enroll, earn, and return" },
];

const bigSteps = [
  {
    n: "01",
    icon: Settings,
    title: "Choose Your Plan",
    desc: "Pick the plan that matches your business size. All plans include a 14-day free trial — no credit card required to start. You can upgrade anytime as you grow.",
    bullets: [
      "Starter: up to 1 location, 1 admin",
      "Growth: up to 3 locations, 3 admins",
      "Premium: up to 8 locations, 8 admins",
    ],
  },
  {
    n: "02",
    icon: Palette,
    title: "Set Up Your Loyalty Program",
    desc: "Use our setup wizard to define your rewards structure in minutes. Set point values, choose reward thresholds, and configure enrollment options — no technical knowledge required.",
    bullets: [
      "Name your program and upload your logo",
      "Set point-per-dollar earn rate",
      "Define reward tiers and redemption rules",
    ],
  },
  {
    n: "03",
    icon: QrCode,
    title: "Generate & Place Your QR Code",
    desc: "Your unique QR code is ready the moment your program is live. Print it for your counter, add it to receipts, or display it digitally on a tablet — wherever customers can scan.",
    bullets: [
      "Download print-ready PDF or PNG",
      "One QR code per location",
      "Track scans per placement",
    ],
  },
  {
    n: "04",
    icon: Smartphone,
    title: "Customers Enroll in Seconds",
    desc: "Customers scan the QR code with any smartphone camera — no app download needed. A simple web form captures their name and email. They're enrolled and earning points immediately.",
    bullets: [
      "Works on any smartphone, no app required",
      "Optional custom fields (birthday, preferences)",
      "Instant confirmation sent by email or SMS",
    ],
  },
  {
    n: "05",
    icon: Gift,
    title: "Reward Your Loyal Customers",
    desc: "Customers accumulate points with every visit or purchase. When they hit a threshold, they receive an automated reward notification. Redemption happens right at your counter.",
    bullets: [
      "Automated reward alerts via email or SMS",
      "Merchant app to verify and redeem rewards",
      "Point history visible to customers anytime",
    ],
  },
  {
    n: "06",
    icon: BarChart3,
    title: "Track Growth & Optimize",
    desc: "Your analytics dashboard updates in real time. See who's visiting, how often, and what's working. Use built-in campaign tools to re-engage lapsed customers or reward your top spenders.",
    bullets: [
      "Live enrollment and visit-frequency charts",
      "Automated win-back campaigns",
      "Weekly performance digest emailed to you",
    ],
  },
];

const businessTypes = [
  { icon: ShoppingCart, label: "Grocery / Supermarket" },
  { icon: Store, label: "Convenience store" },
  { icon: Pill, label: "Pharmacy / Drugstore" },
  { icon: Building2, label: "Department store" },
  { icon: PawPrint, label: "Pet supplies" },
  { icon: Sparkle, label: "Specialty retail" },
  { icon: PhoneIcon, label: "Electronics / Mobile phone store" },
  { icon: Sofa, label: "Home goods / Furniture" },
  { icon: Dumbbell, label: "Sporting goods / Outdoors" },
  { icon: BookOpen, label: "Books / Stationery" },
];

const milestones = [
  { when: "Minute 1", title: "Sign Up & Choose Your Plan" },
  { when: "Minute 3", title: "Name Your Program & Set Your Reward Rules" },
  { when: "Minute 6", title: "Download & Print Your QR Code" },
  { when: "Minute 10", title: "First Customer Enrolled & Earning Points" },
  { when: "Week 1", title: "Review Your First Enrollment Report" },
  { when: "Month 1", title: "Launch Your First Re-engagement Campaign" },
];

/* ---------------- page ---------------- */

function GuidePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        {/* Hero */}
        <section
          id="guide-hero"
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
              Simple Setup,{" "}
              <span className="text-gold-500">Powerful Results</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-navy-700 sm:text-lg">
              From account creation to customer rewards, our platform is designed
              to help small businesses build loyalty with minimal effort.
            </p>
          </div>
        </section>


        {/* The Short Version */}
        <section className="border-b border-border/60 bg-background py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">
                The Short Version
              </span>
            </div>
            <div className="relative mt-10">
              {/* connector line (desktop only) */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-[16.7%] right-[16.7%] top-11 hidden h-px bg-navy-200 md:block"
              />
              <ol className="relative grid gap-10 md:grid-cols-3 md:gap-6">
                {shortSteps.map((s) => (
                  <li key={s.title} className="flex flex-col items-center text-center">
                    <span className="grid h-[88px] w-[88px] place-items-center rounded-full bg-navy-900 text-white shadow-[var(--shadow-soft)]">
                      <s.icon className="h-10 w-10" />
                    </span>
                    <div className="mt-6 text-sm font-semibold uppercase tracking-wider text-gold-500">
                      {s.title}
                    </div>
                    <div className="mt-1 text-base font-semibold text-navy-900">
                      {s.desc}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Step by Step */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-block rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-500">
                Step by Step
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
                See How Easy It Is To{" "}
                <span className="text-gold-500">Get Started</span>
              </h2>
              <p className="mt-4 text-base text-muted-foreground">
                Create your loyalty program, engage your customers, and start
                tracking results in just a few simple steps — no technical
                expertise required.
              </p>
            </div>

            <div className="mt-14 space-y-16 md:space-y-24">
              {bigSteps.map((s, i) => {
                const flip = i % 2 === 1;
                return (
                  <div
                    key={s.n}
                    className="grid items-center gap-10 md:grid-cols-2 md:gap-16"
                  >
                    {/* Illustration */}
                    <div className={cn("order-2 md:order-1", flip && "md:order-2")}>
                      {s.n === "01" ? (
                        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
                          <ChoosePlanIllustration className="block h-auto w-full" />
                        </div>
                      ) : s.n === "02" ? (
                        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
                          <SetupProgramIllustration className="block h-auto w-full" />
                        </div>
                      ) : s.n === "03" ? (
                        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
                          <QrCodeIllustration className="block h-auto w-full" />
                        </div>
                      ) : s.n === "04" ? (
                        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
                          <CustomerEnrollIllustration className="block h-auto w-full" />
                        </div>
                      ) : s.n === "05" ? (
                        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
                          <RewardCustomersIllustration className="block h-auto w-full" />
                        </div>
                      ) : (
                        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
                          <TrackGrowthIllustration className="block h-auto w-full" />
                        </div>
                      )}
                    </div>
                    {/* Text */}
                    <div className={cn("order-1 md:order-2", flip && "md:order-1")}>
                      <div className="text-5xl font-black tracking-tight text-navy-900/15 sm:text-6xl">
                        {s.n}
                      </div>
                      <h3 className="mt-3 text-2xl font-bold tracking-tight text-navy-900">
                        {s.title}
                      </h3>
                      <p className="mt-3 text-base text-muted-foreground">
                        {s.desc}
                      </p>
                      <ul className="mt-6 space-y-3">
                        {s.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-3 text-sm text-foreground">
                            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success-500/15 text-success-500">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Multiple Business Types */}
        <BusinessTypesTabs />


        {/* Time to Value */}
        <section className="bg-white py-24 text-navy-900">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-gold-500/15 text-gold-500">
                Time to Value
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
                From Sign-Up to Your First Loyal Customer
              </h2>
            </div>
            <ul className="mt-14 grid gap-5 md:grid-cols-2">
              {milestones.map((m) => (
                <li
                  key={m.when}
                  className="group rounded-2xl border border-white/10 bg-navy-900 p-7 transition-colors hover:border-gold-500/40 hover:bg-navy-800"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold-500/15 text-gold-300">
                      <Clock className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300">
                      {m.when}
                    </span>
                  </div>
                  <div className="mt-6 text-lg font-semibold text-white">
                    {m.title}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div
              className="relative overflow-hidden rounded-3xl border border-gold-500/20 px-8 py-12 shadow-[var(--shadow-soft)] sm:px-12"
              style={{ background: "var(--gradient-navy)" }}
            >
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl" />
                <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />
              </div>
              <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl text-white">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Ready when you are
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Start Building Customer{" "}
                    <span className="text-gold-400">Loyalty</span> Today
                  </h3>
                  <p className="mt-3 text-base text-navy-100">
                    Create meaningful customer relationships and keep customers
                    coming back with an easy-to-manage loyalty platform.
                  </p>
                  <p className="mt-4 text-xs text-navy-200">
                    No credit card required • 14-day free trial • Cancel anytime
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto">
                  <Button variant="gold" size="lg" className="w-full sm:w-52" asChild>
                    <Link to="/signup">
                      Start Free Trial
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:w-52"
                    asChild
                  >
                    <a href="/contact">Book a Demo</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}


export default GuidePage;
