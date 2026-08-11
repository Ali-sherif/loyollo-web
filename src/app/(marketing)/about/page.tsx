import type { Metadata } from "next";
import AboutPage from "@/features/marketing/about-page";

export const metadata: Metadata = {
  title: "About",
};

export default function Page() {
  return <AboutPage />;
}
