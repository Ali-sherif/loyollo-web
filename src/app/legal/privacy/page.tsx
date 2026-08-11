import type { Metadata } from "next";
import PrivacyPage from "@/features/legal/privacy-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function Page() {
  return <PrivacyPage />;
}
