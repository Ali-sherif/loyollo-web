import type { Metadata } from "next";
import ContactPage from "@/features/marketing/contact-page";

export const metadata: Metadata = {
  title: "Contact",
};

export default function Page() {
  return <ContactPage />;
}
