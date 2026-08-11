import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { CountUp } from "@/components/landing/CountUp";
import { hostedAssets } from "@/assets/hosted";

const dashboardHero = hostedAssets.dashboardHero.url;

const stats = [
  { target: 250, label: "Businesses Served" },
  { target: 18500, label: "Loyalty Members" },
  { target: 145000, label: "Rewards Redeemed" },
];

const valuePills = [
  "No App to Download",
  "Capture Customer Data",
  "Launch in Minutes",
  "Real-Time Repeat Insights",
  "Works on Any Phone",
];

export function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Decorative background layer */}
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

        <div className="absolute top-24 left-[12%] h-2 w-2 rounded-full bg-gold-500/70 animate-hero-float" />
        <div className="absolute top-40 right-[14%] h-1.5 w-1.5 rounded-full bg-navy-500/60 animate-hero-float-slow" />
        <div className="absolute top-72 left-[8%] h-1.5 w-1.5 rounded-full bg-success-500/70 animate-hero-float-slower" />
        <div className="absolute bottom-40 right-[10%] h-2 w-2 rounded-full bg-gold-500/60 animate-hero-float-slow" />

        <svg className="absolute top-16 right-[22%] h-4 w-4 text-gold-500/50 animate-hero-float-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M2 12h20" />
        </svg>
        <svg className="absolute bottom-56 left-[18%] h-3 w-3 text-navy-500/40 animate-hero-float" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M2 12h20" />
        </svg>

        <svg
          className="absolute inset-x-0 top-[45%] mx-auto h-40 w-full max-w-6xl opacity-[0.08]"
          viewBox="0 0 1200 200"
          fill="none"
          preserveAspectRatio="none"
        >
          <path d="M0 120 C 300 20, 900 220, 1200 60" stroke="#0A152F" strokeWidth="1.5" strokeDasharray="4 6" />
        </svg>

        <div className="absolute top-[46%] left-[4%] hidden items-center gap-2 rounded-xl border border-border bg-card/90 px-3 py-2 shadow-[var(--shadow-soft)] backdrop-blur md:flex animate-hero-float-card-slow">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500/15 text-xs">★</span>
          <div className="text-left">
            <div className="text-[10px] font-semibold leading-none text-navy-900">+250 pts</div>
            <div className="mt-0.5 text-[9px] leading-none text-muted-foreground">Reward earned</div>
          </div>
        </div>
        <div className="absolute top-[52%] right-[4%] hidden items-center gap-2 rounded-xl border border-border bg-card/90 px-3 py-2 shadow-[var(--shadow-soft)] backdrop-blur md:flex animate-hero-float-card">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-500/15 text-xs">🎁</span>
          <div className="text-left">
            <div className="text-[10px] font-semibold leading-none text-navy-900">New reward</div>
            <div className="mt-0.5 text-[9px] leading-none text-muted-foreground">Free coffee</div>
          </div>
        </div>
        <div className="absolute top-[72%] left-[3%] hidden items-center gap-2 rounded-xl border border-border bg-card/90 px-3 py-2 shadow-[var(--shadow-soft)] backdrop-blur lg:flex animate-hero-float-card-slower">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-navy-900 text-[10px] font-semibold text-white">QR</span>
          <div className="text-left">
            <div className="text-[10px] font-semibold leading-none text-navy-900">Scan check-in</div>
            <div className="mt-0.5 text-[9px] leading-none text-muted-foreground">Visit #12</div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-10 text-center">
        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-navy-900 sm:text-5xl md:text-6xl">
          Turn First-Time Visitors Into <span className="text-gold-500">Regulars</span>&nbsp;— In Minutes
        </h1>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {valuePills.map((pill) => (
            <span
              key={pill}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-navy-800 shadow-[var(--shadow-soft)]"
            >
              <Check className="h-3.5 w-3.5 text-gold-500" />
              {pill}
            </span>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-base text-navy-700 sm:text-lg">
          Replace paper loyalty cards with a digital loyalty experience in minutes. Reward repeat customers, 
          collect valuable customer insights, and grow your business with a simple QR-based 
          loyalty platform built for small businesses.
        </p>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button variant="gold" size="xl" className="w-full sm:w-auto" asChild>
            <Link to="/signup">
              Start free trial
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghostNavy" size="xl" className="w-full sm:w-auto">
            Book a Demo
          </Button>
        </div>

        <div className="relative mx-auto mt-14 w-full max-w-4xl">
          <div className="absolute inset-x-8 -bottom-6 h-16 rounded-full bg-navy-900/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/30 p-2 shadow-[var(--shadow-card)] backdrop-blur-md">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <img
                src={dashboardHero}
                alt="Loyalty program dashboard preview"
                className="block w-full"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-card py-10 shadow-[var(--shadow-soft)] sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
          {stats.map((s, i) => (
            <div key={s.label} className="px-4 text-center">
              <div className="text-3xl font-bold text-navy-900 sm:text-4xl">
                <CountUp target={s.target} delay={i * 150} />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
