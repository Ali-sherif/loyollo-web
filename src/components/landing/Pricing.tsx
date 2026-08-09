import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

type BillingPeriod = "monthly" | "yearly";

type Plan = {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
  accent: "gold" | "success" | "navy";
};

const plans: Plan[] = [
  {
    name: "Starter",
    monthlyPrice: "$99",
    yearlyPrice: "$990",
    description: "Up to 1 location, 1 admin",
    accent: "gold",
    cta: "Start Free Trial",
    features: [
      "5,000 scans",
      "1,000 customer database",
      "Basic points program, single reward tier",
      "Email notifications + basic templates — 5,000 emails/month",
      "SMS campaigns — 1000 SMS/month",
      "Monthly reporting dashboard",
      "Email support (48-hr response)",
    ],
  },
  {
    name: "Growth",
    monthlyPrice: "$299",
    yearlyPrice: "$2,990",
    description: "Up to 3 locations, 3 admins",
    accent: "success",
    featured: true,
    cta: "Start Free Trial",
    features: [
      "25,000 scans",
      "10,000 customer database",
      "Multi-tier points & rewards, referral bonuses",
      "Email campaigns — 25,000 emails/month",
      "SMS campaigns — 10,000 SMS/month",
      "Advanced analytics & segmentation",
      "Priority email + chat support (24-hr response)",
    ],
  },
  {
    name: "Premium",
    monthlyPrice: "$499",
    yearlyPrice: "$4,990",
    description: "Up to 8 locations, 8 admins (any additional location for $99/per month)",
    accent: "navy",
    cta: "Start Free Trial",
    features: [
      "100,000 scans",
      "50,000 customer database",
      "Custom rewards, tiers, targeted campaigns",
      "Email campaigns — 100,000 emails/month",
      "SMS campaigns — 50,000 SMS/month",
      "Dedicated account manager + phone support",
      "Advanced reporting, A/B testing, automation",
    ],
  },
];

const accentStyles = {
  gold: "text-gold-600",
  success: "text-success-500",
  navy: "text-navy-800",
} as const;

const hoverRingStyles = {
  gold: "hover:ring-[#FEB602]",
  success: "hover:ring-[#44B678]",
  navy: "hover:ring-[#0F1C3D]",
} as const;


function BillingToggle({
  period,
  onChange,
}: {
  period: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="inline-flex items-center rounded-full border border-border bg-muted p-1">
        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={cn(
            "rounded-full px-5 py-2 text-sm font-medium transition-colors",
            period === "monthly"
              ? "bg-card text-navy-900 shadow-sm"
              : "text-muted-foreground hover:text-navy-900",
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange("yearly")}
          className={cn(
            "rounded-full px-5 py-2 text-sm font-medium transition-colors",
            period === "yearly"
              ? "bg-card text-navy-900 shadow-sm"
              : "text-muted-foreground hover:text-navy-900",
          )}
        >
          Yearly
          <span className="ml-1.5 rounded-full bg-success-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success-700">
            (SAVE 20%)
          </span>
        </button>
      </div>
    </div>
  );
}

export function Pricing() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <section id="pricing" className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="sticky top-20 z-30 -mx-6 flex justify-center bg-background/85 py-3 backdrop-blur md:static md:mx-0 md:bg-transparent md:py-0 md:backdrop-blur-none">
          <BillingToggle period={period} onChange={setPeriod} />
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
          {plans.map((plan, idx) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-2",
                hoverRingStyles[plan.accent],
                plan.featured
                  ? "order-first border-success-500/40 bg-card shadow-[var(--shadow-card)] ring-2 ring-success-500/40 md:order-none md:-translate-y-3 md:ring-0 md:hover:ring-2"
                  : "border-border bg-card",
                idx === 0 && !plan.featured && "md:order-first",
              )}

            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-success-500 px-3 py-1 text-xs font-semibold text-white shadow">
                  Most popular
                </span>
              )}
              <h3 className={cn("text-lg font-semibold", accentStyles[plan.accent])}>
                {plan.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-navy-900">
                  {period === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                </span>
                <span className="text-sm text-muted-foreground">
                  {period === "monthly" ? "/month" : "/year"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-navy-800">
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        accentStyles[plan.accent],
                      )}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Button
                  variant={plan.accent === "success" ? "success" : plan.accent === "navy" ? "navy" : "gold"}
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <Link to="/signup" search={{ plan: plan.name.toLowerCase() }}>
                    {plan.cta}
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          All plans include a 14-day free trial. Yearly plans are billed once per year.
        </p>
      </div>
    </section>
  );
}
