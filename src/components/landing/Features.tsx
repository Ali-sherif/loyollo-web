import { QrCode, Users, Gift, LineChart, Mail, BarChart3 } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const features = [
  {
    icon: QrCode,
    title: "QR Code Enrollment",
    desc: "Customers scan QR codes to join your loyalty program instantly.",
  },
  {
    icon: Users,
    title: "Customer Database",
    desc: "Build and manage a complete database of customer profiles and history.",
  },
  {
    icon: Gift,
    title: "Loyalty Points & Rewards",
    desc: "Create custom point systems and reward structures for your business.",
  },
  {
    icon: LineChart,
    title: "Customer Insights",
    desc: "Understand customer behavior with detailed analytics and reports.",
  },
  {
    icon: Mail,
    title: "Marketing Campaigns",
    desc: "Send targeted campaigns to specific customer segments.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Track performance metrics and ROI in real-time.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-navy-50/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Features"
          title="Designed To Help Your Business Grow"
          description="Everything you need to create stronger customer relationships in one platform."
        />
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
            >
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gold-50 text-gold-500">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 text-base font-semibold text-navy-900">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
