import type { Metadata } from "next";
import LandingPage from "@/features/marketing/landing-page";

export const metadata: Metadata = {
  title: "Loyalty — Grow customer loyalty & repeat business",
};

export default function Page() {
  return <LandingPage />;
}
