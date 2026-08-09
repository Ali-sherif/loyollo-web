import { UserPlus, CreditCard, Gift, TrendingUp, ArrowUpRight } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: UserPlus,
    step: "Step 1",
    title: "Sign Up",
    desc: "Create your account using your business email and set up your loyalty program with ease.",
  },
  {
    icon: CreditCard,
    step: "Step 2",
    title: "Choose a subscription plan",
    desc: "Select the plan that fits your business size and needs.",
  },
  {
    icon: Gift,
    step: "Step 3",
    title: "Create a Loyalty Program",
    desc: "Customize your rewards structure and enrollment process.",
  },
  {
    icon: TrendingUp,
    step: "Step 4",
    title: "Reward Customers & Track Growth",
    desc: "Watch your customer base grow and retention improve.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-white py-24 text-navy-900">
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="How It Works"
          title="How It Works"
          description="Launch your loyalty program in minutes and start building stronger customer relationships in just a few simple steps."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {steps.map(({ icon: Icon, step, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/10 bg-navy-900 p-7 transition-colors hover:border-gold-500/40 hover:bg-navy-800"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold-500/15 text-gold-300">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300">
                  {step}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm text-navy-100">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-row flex-wrap items-center justify-center gap-3">
          <Button variant="gold" size="lg" className="w-auto">
            See it Live
            <ArrowUpRight aria-hidden />
          </Button>
          <Button variant="ghostNavy" size="lg" className="w-auto">Book a demo</Button>
        </div>
      </div>
    </section>
  );
}
