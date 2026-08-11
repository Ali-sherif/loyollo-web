import type { Metadata } from "next";
import FeaturesPage from "@/features/marketing/features-page";

export const metadata: Metadata = {
  title: "Features",
};

export default function Page() {
  return <FeaturesPage />;
}
