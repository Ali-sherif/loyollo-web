"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useRouterState } from "@/lib/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CTA } from "@/components/landing/CTA";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageSquare,
  LifeBuoy,
  Phone,
  Clock,
  ArrowRight,
  MapPin,
  Mail,
  Send,
} from "lucide-react";
import { SupportStatus, SUPPORT_HOURS_DISPLAY } from "@/components/SupportStatus";
import { InteractiveMap } from "@/components/InteractiveMap";

const OFFICE_LOCATION = {
  label: "Vancouver, BC",
  address: "1055 West Georgia St, Suite 1200, Canada",
  lat: 49.2856,
  lng: -123.1206,
};

const supportCards = [
  {
    icon: MessageSquare,
    title: "Live Chat",
    desc: "Chat with our team in real time. Average response under 2 minutes during business hours.",
    meta: "Mon–Fri, 8am–8pm",
    cta: "Start Chat",
    accent: "gold",
  },
  {
    icon: LifeBuoy,
    title: "Help Center",
    desc: "Browse 200+ articles, tutorials, and how-to guides for every feature in the platform.",
    meta: "Always Available",
    cta: "Browse Docs",
    accent: "success",
  },
  {
    icon: Phone,
    title: "Phone Support",
    desc: "Growth and Premium plan customers can reach our team directly by phone.",
    meta: "Mon–Fri, 9am–6pm",
    cta: "Call Us",
    accent: "navy",
  },
] as const;

const accentStyles = {
  gold: "text-gold-500",
  success: "text-success-500",
  navy: "text-navy-800",
} as const;

const circleStyles = {
  gold: "bg-gold-50 border-gold-200",
  success: "bg-success-100 border-success-200",
  navy: "bg-navy-50 border-navy-200",
} as const;

const faqs = [
  {
    q: "How does the QR enrollment work?",
    a: "Customers simply scan a unique QR code at your business to instantly join your loyalty program. They can track points and rewards through their mobile device.",
  },
  {
    q: "What types of business can use this platform?",
    a: "Any customer-facing small business — coffee shops, restaurants, salons, barbershops, retail stores, and home services. If you have repeat customers, this platform is built for you.",
  },
  {
    q: "Is there a free trial available?",
    a: "Yes. Every plan includes a 14-day free trial. No credit card is required to get started.",
  },
  {
    q: "Can I customize my loyalty program structure?",
    a: "Absolutely. Configure points-per-visit, points-per-dollar, tiered rewards, punch-card style programs, and more — all from your dashboard.",
  },
  {
    q: "How do customers redeem their rewards?",
    a: "Customers scan a QR code at checkout. Your staff confirms the reward on the dashboard and the balance updates instantly.",
  },
  {
    q: "What kind of customer data can I collect?",
    a: "Names, contact info, visit frequency, purchase history, favorite items, and any custom fields you configure — always with explicit customer consent.",
  },
];

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      (e.currentTarget as HTMLFormElement).reset();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
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

        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-16 text-center">
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-navy-900 sm:text-5xl md:text-6xl">
            We're Here To <span className="text-gold-500">Help</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-navy-700 sm:text-lg">
            Whether you're exploring our platform or looking for support, we'd love to hear from you
            and answer any questions you may have.
          </p>

          {/* Support cards */}
          <div className="mx-auto mt-14 grid max-w-6xl gap-6 text-left md:grid-cols-3">
            {supportCards.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="flex flex-col rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-[var(--shadow-soft)]"
                >
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full border",
                      circleStyles[c.accent],
                    )}
                  >
                    <Icon className={cn("h-6 w-6", accentStyles[c.accent])} />
                  </div>
                  <h3 className={cn("mt-4 text-xl font-semibold", accentStyles[c.accent])}>
                    {c.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.desc}</p>
                  <div className="mt-5 border-t border-border pt-4" />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{c.meta}</span>
                    </div>
                    <Button
                      variant={
                        c.accent === "success" ? "success" : c.accent === "navy" ? "navy" : "gold"
                      }
                      size="sm"
                      className={cn("gap-1.5 rounded-full", c.accent === "gold" && "text-white")}
                    >
                      {c.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Send a message */}
      <section className="bg-[#F5F7FC] px-6 py-16">
        <div className="mx-auto max-w-6xl space-y-12">
          {/* Form */}
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
              Send a <span className="text-gold-500">Message</span>
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              We're here to help. Send us a message and we'll respond as quickly as we can.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldLabel label="Full Name" required>
                  <Input
                    required
                    name="fullName"
                    maxLength={100}
                    placeholder="Jane Smith"
                    className="h-12 rounded-xl border-[#B0BCD4] bg-white text-base"
                  />
                </FieldLabel>
                <FieldLabel label="Work Email" required>
                  <Input
                    required
                    type="email"
                    name="email"
                    maxLength={255}
                    placeholder="jane@mybusiness.com"
                    className="h-12 rounded-xl border-[#B0BCD4] bg-white text-base"
                  />
                </FieldLabel>
              </div>
              <FieldLabel label="Business Name" required>
                <Input
                  required
                  name="business"
                  maxLength={120}
                  placeholder="My coffee shop"
                  className="h-12 rounded-xl border-[#B0BCD4] bg-white text-base"
                />
              </FieldLabel>
              <FieldLabel label="Department" required>
                <Select name="department" required>
                  <SelectTrigger className="h-12 w-full rounded-xl border-[#B0BCD4] bg-white text-base data-[placeholder]:text-[#A3A3A3]">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="partnerships">Partnerships</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FieldLabel>
              <FieldLabel label="Message" required>
                <Textarea
                  required
                  name="message"
                  maxLength={1000}
                  placeholder="Tell us how can we help..."
                  className="min-h-[140px] rounded-xl border-[#B0BCD4] bg-white text-base"
                />
              </FieldLabel>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                disabled={submitting}
                className="h-14 w-full rounded-full text-base"
              >
                <Send className="h-5 w-5" />
                {submitting ? "Sending..." : "Send Message"}
                <ArrowRight className="h-5 w-5" />
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                By submitting this form you agree to our Privacy Policy. We never share your data.
              </p>
            </form>
          </div>

          {/* Sidebar */}
          <aside className="grid gap-6 md:grid-cols-2">
            <div className="h-full flex flex-col">
              <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#A3A3A3]">
                Our Office
              </div>
              <div className="h-full rounded-2xl border border-[#D7DDEA] bg-white p-6">
                <div className="text-lg font-semibold text-navy-900">Vancouver, BC</div>
                <div className="my-5 h-px w-full bg-[#D7DDEA]" />
                <ul className="space-y-4 text-sm">
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-500" />
                    <span>1055 West Georgia St, Suite 1200, Canada</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="h-5 w-5 shrink-0 text-gold-500" />
                    <span>+1 (604) 555-0182</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="h-5 w-5 shrink-0 text-gold-500" />
                    <span>hello@loyaltyloop.com</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="h-full flex flex-col">
              <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#A3A3A3]">
                Business Hours
              </div>
              <div className="h-full flex flex-col justify-center rounded-2xl border border-[#D7DDEA] bg-white p-6">
                <ul className="space-y-3 text-sm">
                  {SUPPORT_HOURS_DISPLAY.map((row) => (
                    <li key={row.label} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span
                        className={cn(
                          "font-medium",
                          row.closed ? "text-[#E53935]" : "text-navy-900",
                        )}
                      >
                        {row.value}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="my-5 h-px w-full bg-[#D7DDEA]" />
                <SupportStatus />
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Map */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <InteractiveMap
            lat={OFFICE_LOCATION.lat}
            lng={OFFICE_LOCATION.lng}
            label={OFFICE_LOCATION.label}
            address={OFFICE_LOCATION.address}
            zoom={15}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#F5F7FC] px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
              Frequently Asked <span className="text-gold-500">Questions</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
              Have questions? Find the answers here.
            </p>
          </div>
          <Accordion type="single" collapsible className="mt-10 space-y-4">
            {faqs.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="overflow-hidden rounded-2xl border border-[#D7DDEA] bg-white px-6"
              >
                <AccordionTrigger className="py-5 text-left text-base font-semibold text-navy-900 hover:no-underline sm:text-lg">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <CTA />
      <Footer />
    </div>
  );
}

function FieldLabel({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-bold text-navy-900">
        {label}
        {required && <span className="ml-0.5 text-[#E53935]">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default ContactPage;
