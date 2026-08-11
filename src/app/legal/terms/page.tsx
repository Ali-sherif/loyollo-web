import type { Metadata } from "next";
import TermsPage from "@/features/legal/terms-page";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function Page() {
  return <TermsPage />;
}
