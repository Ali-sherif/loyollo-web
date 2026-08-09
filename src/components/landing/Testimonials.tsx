import { Star } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const testimonials = [
  {
    name: "Mary Richards",
    role: "Owner, Beanhouse Coffee",
    quote:
      "This platform transformed how we retain customers. Our repeat visits increased by 45% in just three months.",
    initials: "MR",
  },
  {
    name: "Bob Simons",
    role: "Owner, Simons Barbershop",
    quote:
      "The QR code system is brilliant. Customers love how easy it is to join and track their rewards. Setup took less than an hour.",
    initials: "BS",
  },
  {
    name: "James Ruskin",
    role: "Manager, Ruskin & Co.",
    quote:
      "Finally, we have real data about our customers. The insights help us create better promotions and the ROI has been incredible.",
    initials: "JR",
  },
  {
    name: "Lena Ortiz",
    role: "Owner, Ortiz Bakery",
    quote:
      "Our regulars love checking their points and the automatic reminders bring back customers we had not seen in weeks. It basically runs itself.",
    initials: "LO",
  },
  {
    name: "David Chen",
    role: "Founder, Chen's Noodles",
    quote:
      "We replaced paper punch cards with this and never looked back. Customers actually use it, and the staff finds it super simple to manage.",
    initials: "DC",
  },
  {
    name: "Sofia Martinez",
    role: "Co-owner, Martinez Hair Studio",
    quote:
      "The loyalty program alone paid for itself in the first month. Clients book more often because they want to reach their next reward.",
    initials: "SM",
  },
];

export function Testimonials() {
  const loop = [...testimonials, ...testimonials];
  return (
    <section className="bg-navy-900 py-24 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Testimonials"
          title="What Our Users Say"
          description="Hear from business owners who have transformed the way they engage and retain customers."
          invert
        />
      </div>
      <div className="group relative mt-14 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
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
    </section>
  );
}
