import type { Metadata } from "next";
import PricingPage from "@/features/marketing/pricing-page";

export const metadata: Metadata = {
  title: "Pricing",
};

export default function Page() {
  return <PricingPage />;
}
