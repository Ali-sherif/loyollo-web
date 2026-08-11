import type { Metadata } from "next";
import { Figtree } from "next/font/google";

import "@/styles.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const siteDescription =
  "Create and manage digital loyalty programs in minutes. Reward repeat customers, collect insights, and grow with a QR-based platform built for small businesses.";

/** Lovable CDN preview image — re-host in slice 2 (ADR-009 asset vendoring). */
const ogImage =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d23c0332-e946-41c7-9ad8-d715ab147903/id-preview-20c25e52--2c648ce2-4a61-45d6-a815-4d462b8f85c7.lovable.app-1782933086464.png";

export const metadata: Metadata = {
  title: {
    default: "Loyalty — Grow customer loyalty & repeat business",
    template: "%s · Loyalty",
  },
  description: siteDescription,
  authors: [{ name: "Loyalty" }],
  openGraph: {
    title: "Loyalty — Grow customer loyalty & repeat business",
    description: siteDescription,
    type: "website",
    images: [{ url: ogImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Loyalty — Grow customer loyalty & repeat business",
    description: siteDescription,
    images: [ogImage],
  },
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${figtree.className} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
