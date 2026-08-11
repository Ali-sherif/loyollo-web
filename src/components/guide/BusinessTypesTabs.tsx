import { useRef, useState, useEffect, type KeyboardEvent } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUSINESS_CATEGORIES as CATEGORIES } from "@/data/businessTypes";

export function BusinessTypesTabs() {
  const [activeIdx, setActiveIdx] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = CATEGORIES[activeIdx];

  // Ensure the active tab stays visible when it changes (e.g., via keyboard).
  useEffect(() => {
    const el = tabRefs.current[activeIdx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeIdx]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (activeIdx + 1) % CATEGORIES.length;
      setActiveIdx(next);
      tabRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (activeIdx - 1 + CATEGORIES.length) % CATEGORIES.length;
      setActiveIdx(prev);
      tabRefs.current[prev]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIdx(0);
      tabRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      const last = CATEGORIES.length - 1;
      setActiveIdx(last);
      tabRefs.current[last]?.focus();
    }
  };

  return (
    <section className="border-t border-border/60 bg-navy-50/40 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-gold-500">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
            Multiple <span className="text-gold-500">Business Types</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            No matter your industry, you can create rewarding customer experiences and grow customer
            loyalty with ease.
          </p>
        </div>

        {/* Tab bar */}
        <div className="relative mt-10">
          <div
            role="tablist"
            aria-label="Business categories"
            className="flex items-center gap-2 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {CATEGORIES.map((cat, i) => {
              const selected = i === activeIdx;
              return (
                <button
                  key={cat.key}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  role="tab"
                  id={`bt-tab-${cat.key}`}
                  aria-selected={selected}
                  aria-controls={`bt-panel-${cat.key}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveIdx(i)}
                  onKeyDown={onKeyDown}
                  className={cn(
                    "min-h-11 shrink-0 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-colors outline-none",
                    "focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-50",
                    selected
                      ? "bg-gold-500 text-white shadow-[var(--shadow-soft)]"
                      : "text-navy-700 hover:text-navy-900",
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
          {/* Trailing fade */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-navy-50/80 to-transparent"
          />
        </div>

        {/* Content grid */}
        <div
          key={active.key}
          role="tabpanel"
          id={`bt-panel-${active.key}`}
          aria-labelledby={`bt-tab-${active.key}`}
          className="mt-10 grid animate-in fade-in-50 slide-in-from-bottom-2 duration-300 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {active.items.map((b) => (
            <div
              key={b.label}
              className="flex flex-col items-center justify-start gap-4 rounded-2xl bg-navy-50 p-6 text-center"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full border-2 bg-[#FFF9E6] text-gold-500 border-[#FFE48A]">
                <b.icon className="h-6 w-6" />
              </span>
              <span className="text-sm font-semibold text-navy-900">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
