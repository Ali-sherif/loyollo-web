import type { Metadata } from "next";

import { requireUser } from "@/lib/server/auth/guards";

export const metadata: Metadata = {
  title: "App",
};

export const dynamic = "force-dynamic";

/**
 * Authenticated app shell placeholder (slice 3).
 * Full dashboard chrome lands in later slices; this proves SSR `getUser()` gating.
 */
export default async function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUser();
  return <>{children}</>;
}
