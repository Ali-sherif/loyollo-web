import { UserX, Database, Users2, Megaphone } from "lucide-react";

const items = [
  {
    icon: UserX,
    title: "Customers rarely return",
    desc: "Visitors come once and never come back, making it hard to build a loyal base that supports your growth.",
  },
  {
    icon: Database,
    title: "No customer database",
    desc: "No way to track who your customers are or how often they visit, leaving you guessing about your best patrons.",
  },
  {
    icon: Users2,
    title: "Difficult to track rewards",
    desc: "Unable to identify and reward your most valuable repeat customers without a messy, manual system.",
  },
  {
    icon: Megaphone,
    title: "Promotions don't create loyalty",
    desc: "Discounts and offers reach the wrong people or go unnoticed entirely, failing to spark long-term relationships.",
  },
];

export function Challenges() {
  return (
    <section className="relative overflow-hidden bg-navy-25 pt-24 pb-12">
      <div className="mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-block rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gold-500">
            The Problem
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl md:text-5xl">
            Challenges Small Businesses Face
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Many local businesses struggle to retain customer behavior, making it harder to drive
            repeat business and sustainable growth.
          </p>
        </div>

        {/* Journey Path */}
        <div className="relative mt-20">
          {/* Central dashed connector */}
          <div
            aria-hidden
            className="absolute left-1/2 top-0 bottom-0 hidden -translate-x-1/2 border-l-2 border-dashed border-gold-500/40 md:block"
          />

          <div className="relative space-y-8 md:space-y-0">
            {items.map(({ icon: Icon, title, desc }, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div
                  key={title}
                  className={`group w-full items-center justify-between md:flex ${
                    i > 0 ? "md:-mt-5" : ""
                  }`}
                >
                  {/* Left slot */}
                  <div className={`hidden md:block md:w-[45%] ${isLeft ? "md:text-left" : ""}`}>
                    {isLeft && (
                      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-soft)] sm:p-8">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-500">
                            <Icon className="h-5 w-5" />
                          </div>
                          <h3 className="text-lg font-bold text-navy-900">{title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground sm:text-base">{desc}</p>
                      </div>
                    )}
                  </div>

                  {/* Center node */}
                  <div className="relative z-10 my-4 hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500 font-bold text-white shadow-[0_0_0_8px_hsl(var(--navy-25))] ring-8 ring-navy-25 transition-transform duration-300 group-hover:scale-110 md:flex">
                    {i + 1}
                  </div>

                  {/* Right slot */}
                  <div className={`hidden md:block md:w-[45%] ${!isLeft ? "md:text-left" : ""}`}>
                    {!isLeft && (
                      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-soft)] sm:p-8">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-500">
                            <Icon className="h-5 w-5" />
                          </div>
                          <h3 className="text-lg font-bold text-navy-900">{title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground sm:text-base">{desc}</p>
                      </div>
                    )}
                  </div>

                  {/* Mobile-only card (single column) */}
                  <div className="md:hidden">
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-500">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-navy-900">{title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
