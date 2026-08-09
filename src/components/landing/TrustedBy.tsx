import { Coffee, UtensilsCrossed, Scissors, Sparkles, Wrench, ShoppingBag } from "lucide-react";

const industries = [
  { Icon: Coffee, label: "Coffee Shops" },
  { Icon: UtensilsCrossed, label: "Restaurants" },
  { Icon: Scissors, label: "Barbershops" },
  { Icon: Sparkles, label: "Salons" },
  { Icon: Wrench, label: "Home Services" },
  { Icon: ShoppingBag, label: "Retail Stores" },
];

export function TrustedBy() {
  const loop = [...industries, ...industries];
  return (
    <section className="border-y border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <p className="text-center text-sm font-medium text-muted-foreground">
          Perfect for small businesses across North America
        </p>
        <div className="group mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-marquee gap-12 group-hover:[animation-play-state:paused] sm:gap-16 md:gap-20">
            {loop.map((i, idx) => (
              <div
                key={`${i.label}-${idx}`}
                className="group/item flex shrink-0 flex-col items-center justify-center gap-3 py-4 text-center"
              >
                <i.Icon
                  className="h-9 w-9 text-slate-400 transition-colors duration-200 ease-out group-hover/item:text-gold-500"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="text-sm font-semibold text-navy-800 transition-colors duration-200 ease-out group-hover/item:text-gold-500">
                  {i.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
