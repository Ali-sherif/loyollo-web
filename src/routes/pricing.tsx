import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Mail, MessageSquare, Star } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { SectionHeader } from "@/components/landing/SectionHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Loyalty" },
      {
        name: "description",
        content:
          "Simple, transparent pricing for Loyalty. Choose Starter, Growth, or Premium, plus email & SMS add-on packs to scale as you grow.",
      },
      { property: "og:title", content: "Pricing — Loyalty" },
      {
        property: "og:description",
        content: "Starter, Growth, and Premium plans plus flexible email & SMS add-on packs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

type Pack = { name: string; qty: string; price: string };

const emailPacks: Pack[] = [
  { name: "Small", qty: "5,000 emails", price: "$29" },
  { name: "Medium", qty: "25,000 emails", price: "$49" },
  { name: "Large", qty: "100,000 emails", price: "$99" },
];

const smsPacks: Pack[] = [
  { name: "Small", qty: "1,000 SMS", price: "$49" },
  { name: "Medium", qty: "5,000 SMS", price: "$99" },
  { name: "Large", qty: "10,000 SMS", price: "$199" },
];

function PackGroup({
  title,
  icon: Icon,
  packs,
  accent,
}: {
  title: string;
  icon: typeof Mail;
  packs: Pack[];
  accent: "gold" | "success";
}) {
  const accentText = accent === "gold" ? "text-gold-600" : "text-success-500";
  const accentBg = accent === "gold" ? "bg-gold-500/15" : "bg-success-500/15";
  const iconColor = accent === "gold" ? "#FEB602" : "#44B678";
  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-3">
        <span className={cn("grid h-10 w-10 place-items-center rounded-lg", accentBg, accentText)}>
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </span>
        <h3 className="text-lg font-semibold text-navy-900">{title}</h3>
      </div>
      <ul className="mt-6 divide-y divide-border">
        {packs.map((p) => (
          <li key={p.name} className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-semibold text-navy-900">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.qty}</p>
            </div>
            <div className="flex items-center gap-2">
              <Check className={cn("h-4 w-4", accentText)} />
              <span className="text-lg font-bold text-navy-900">{p.price}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddOnPacks() {
  return (
    <section className="bg-navy-50/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Add-ons"
          title="Add-on Packs"
          description="Need more capacity? Top up email or SMS credits any time — no plan change required."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <PackGroup title="Email Add-on Packs" icon={Mail} packs={emailPacks} accent="gold" />
          <PackGroup
            title="SMS Add-on Packs"
            icon={MessageSquare}
            packs={smsPacks}
            accent="success"
          />
        </div>

        <div className="mt-12 flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)] sm:flex-row sm:justify-between sm:text-left">
          <div className="max-w-xl">
            <h3 className="text-lg font-semibold text-navy-900">Need a custom plan?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Talk to our team about tailored pricing, high-volume add-ons, or multi-location
              setups.
            </p>
          </div>
          <Button
            variant="gold"
            size="lg"
            className="w-full gap-2 sm:w-auto"
            onClick={() => (window.location.href = "mailto:hello@loyalty.app")}
          >
            Contact us <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

const TRUSTED_BUSINESS_COUNT = "500+";

const testimonials = [
  {
    initials: "MR",
    name: "Mary Richards",
    role: "Owner, Beanhouse Coffee",
    quote: "Repeat visits increased by 45% in just three months.",
  },
  {
    initials: "BS",
    name: "Bob Simons",
    role: "Owner, Simons Barbershop",
    quote: "Setup took less than an hour and customers love the QR rewards.",
  },
  {
    initials: "JR",
    name: "James Ruskin",
    role: "Manager, Ruskin & Co.",
    quote: "We finally have real data to create better promotions.",
  },
];

function SocialProof() {
  const loop = [...testimonials, ...testimonials];
  return (
    <section className="bg-navy-900 py-16 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold-500/15 px-4 py-2 text-sm font-semibold text-gold-300">
            <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
            Trusted by {TRUSTED_BUSINESS_COUNT} local businesses
          </span>
        </div>

        <div className="group relative mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-marquee gap-6 pl-6 group-hover:[animation-play-state:paused]">
            {loop.map((t, idx) => (
              <figure
                key={`${t.name}-${idx}`}
                className="flex w-[85vw] max-w-sm shrink-0 flex-col rounded-2xl border border-white/10 bg-navy-800/60 p-7 shadow-none transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 sm:w-96"
              >
                <div className="flex gap-1" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold-500 text-gold-500" />
                  ))}
                </div>
                <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-navy-100">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gold-500/20 text-sm font-semibold text-gold-300">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-navy-200">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingHero() {
  return (
    <section
      id="pricing-hero"
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
          Simple&nbsp;Pricing&nbsp;for Growing Businesses
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-navy-700 sm:text-lg">
          Choose a plan that fits your business needs and start building stronger customer
          relationships with a loyalty platform designed for local businesses.
        </p>
      </div>
    </section>
  );
}

function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <PricingHero />
        <Pricing />
        <AddOnPacks />
        <SocialProof />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
