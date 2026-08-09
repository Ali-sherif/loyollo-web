import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import iconAsset from "@/assets/loyollo-icon-white.svg.asset.json";

export function CTA() {
  return (
    <section className="bg-background px-6 py-20">
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
            <img
              src={iconAsset.url}
              alt="Loyollo"
              className="h-6 w-auto object-contain"
            />
          </div>
          <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Start Building Customer <span className="text-gold-300">Loyalty</span> Today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-navy-100 sm:text-base">
            Create meaningful customer relationships and keep customers coming back with an
            easy-to-manage loyalty platform.
          </p>
          <div className="mx-auto mt-8 flex max-w-sm flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center">
            <Button variant="gold" size="lg" className="w-full sm:w-auto" asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
            <Button variant="ghostLight" size="lg" className="w-full sm:w-auto">Book a demo</Button>
          </div>
          <p className="mt-6 text-xs text-navy-200">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
