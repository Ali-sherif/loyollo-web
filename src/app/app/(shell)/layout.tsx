import { requireUser } from "@/lib/server/auth/guards";

export const dynamic = "force-dynamic";

/**
 * Authenticated product shell (ADR-005).
 * Full chrome remains inside each page via DashboardShell for visual parity.
 */
export default async function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUser();
  return <>{children}</>;
}
