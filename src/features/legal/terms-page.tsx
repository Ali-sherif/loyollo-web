"use client";

import { Link, useNavigate, useRouterState } from "@/lib/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-muted-foreground">Last updated: July 6, 2026</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-navy-900">
          Terms &amp; Conditions
        </h1>
        <p className="mt-4 text-base text-navy-700">
          Welcome to Loyalty. By creating an account or using our services you agree to the
          following terms. Please read them carefully.
        </p>

        <Section title="1. Using our services">
          You must be at least 18 years old and legally able to enter into a contract to use
          Loyalty. You agree to provide accurate information when signing up and to keep your
          account credentials secure.
        </Section>

        <Section title="2. Your account">
          You are responsible for all activity that occurs under your account. Notify us immediately
          of any unauthorized use. We may suspend or terminate accounts that violate these terms.
        </Section>

        <Section title="3. Acceptable use">
          Do not misuse the platform, attempt to disrupt the service, or use it to send unsolicited
          communications. You are responsible for the content and offers you distribute through
          Loyalty.
        </Section>

        <Section title="4. Billing">
          Paid plans are billed in advance and are non-refundable except where required by law. You
          may cancel at any time from your account settings; cancellation takes effect at the end of
          the current period.
        </Section>

        <Section title="5. Intellectual property">
          Loyalty and its content, features, and functionality remain our property. You retain
          ownership of the customer data and content you upload; you grant us a limited license to
          process it in order to deliver the service.
        </Section>

        <Section title="6. Disclaimers">
          The service is provided "as is" without warranties of any kind. To the maximum extent
          permitted by law, Loyalty is not liable for indirect or consequential damages arising from
          your use of the platform.
        </Section>

        <Section title="7. Changes">
          We may update these terms from time to time. Material changes will be communicated through
          the app or by email. Continued use of the service after changes take effect constitutes
          acceptance.
        </Section>

        <Section title="8. Contact">
          Questions about these terms? Email us at{" "}
          <a href="mailto:hello@loyalty.app" className="font-semibold text-gold-500 underline">
            hello@loyalty.app
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

export default TermsPage;
