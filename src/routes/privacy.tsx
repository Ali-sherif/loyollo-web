import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Loyalty" },
      {
        name: "description",
        content:
          "How Loyalty collects, uses, and protects your personal and business data.",
      },
      { property: "og:title", content: "Privacy Policy — Loyalty" },
      {
        property: "og:description",
        content: "How we collect, use, and protect your data at Loyalty.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-muted-foreground">Last updated: July 6, 2026</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-navy-900">
          Privacy Policy
        </h1>
        <p className="mt-4 text-base text-navy-700">
          This policy explains what information we collect, how we use it, and
          the choices you have. We aim to be clear and to collect only what we
          need to run the service.
        </p>

        <Section title="Information we collect">
          Account details you provide (name, business name, email, phone),
          content you upload (loyalty program configuration, customer records),
          and technical data (device, browser, IP address, usage events).
        </Section>

        <Section title="How we use information">
          To provide and improve the service, personalize your experience,
          process payments, send transactional and — with your consent —
          marketing communications, and comply with legal obligations.
        </Section>

        <Section title="Sharing">
          We share data with vetted processors that help us run the service
          (hosting, analytics, email delivery, payments) under strict
          confidentiality. We do not sell your personal information.
        </Section>

        <Section title="Data retention">
          We retain personal data for as long as your account is active or as
          needed to provide the service. You can request deletion at any time
          and we will honor the request except where retention is required by
          law.
        </Section>

        <Section title="Your rights">
          Depending on your region you may have the right to access, correct,
          export, or delete your data, and to object to certain processing.
          Contact us to exercise these rights.
        </Section>

        <Section title="Security">
          We use industry-standard measures — encryption in transit, encrypted
          storage, access controls, and continuous monitoring — to protect your
          data. No system is perfectly secure; we work to address issues
          promptly if they arise.
        </Section>

        <Section title="International transfers">
          Your data may be processed in countries other than your own. Where
          required, we rely on approved transfer mechanisms to protect it.
        </Section>

        <Section title="Contact">
          Privacy questions? Email{" "}
          <a
            href="mailto:privacy@loyalty.app"
            className="font-semibold text-gold-500 underline"
          >
            privacy@loyalty.app
          </a>
          .
        </Section>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-navy-900">{title}</h2>
      <p className="mt-3 text-base leading-relaxed text-navy-700">{children}</p>
    </section>
  );
}
