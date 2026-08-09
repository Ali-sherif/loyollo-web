import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


const faqs = [
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

export function FAQ() {
  return (
    <section id="faq" className="bg-[#F5F7FC] px-6 py-24">
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
  );
}

