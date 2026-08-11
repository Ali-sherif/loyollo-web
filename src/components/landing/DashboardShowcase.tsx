import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { hostedAssets } from "@/assets/hosted";

const dashboardHero = hostedAssets.dashboard2;
const bgAsset = hostedAssets.frame7Bg;

export function DashboardShowcase() {
  return (
    <section className="relative overflow-hidden bg-navy-900 py-24 text-white">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgAsset.url})` }}
      />
      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-glass-border bg-glass p-2 shadow-2xl backdrop-blur-2xl">
          <img
            src={dashboardHero.url}
            alt="Loyalty analytics dashboard"
            className="block w-full rounded-xl"
            loading="lazy"
          />
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button variant="gold" size="lg" asChild>
            <Link to="/signup">
              Try Now <ArrowUpRight />
            </Link>
          </Button>
          <Button variant="ghostLight" size="lg">Book a demo</Button>
        </div>
      </div>
    </section>
  );
}
