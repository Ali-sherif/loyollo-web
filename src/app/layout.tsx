import type { Metadata } from "next";
import { Figtree } from "next/font/google";

import { ogPreviewImage } from "@/assets/hosted";
import "@/styles.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const siteDescription =
  "Create and manage digital loyalty programs in minutes. Reward repeat customers, collect insights, and grow with a QR-based platform built for small businesses.";

const ogImage = ogPreviewImage;

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
