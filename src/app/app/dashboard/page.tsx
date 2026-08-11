import { getCurrentUser } from "@/lib/server/auth/session";

export const dynamic = "force-dynamic";

/**
 * Minimal session-aware placeholder until the dashboard domain slice ports UI.
 * Visual parity is intentionally deferred (ADR-010 applies when UI is ported).
 */
export default async function AppDashboardPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-3 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Dashboard
      </h1>
      <p className="text-sm text-muted-foreground">
        Server session gate is active. Full dashboard UI migrates in a later
        slice. D-28 cookie/SSR remains blocked until a confirmed session is
        proven end-to-end.
      </p>
      <p className="text-sm text-muted-foreground">
        Signed in as:{" "}
        <span className="font-medium text-foreground">
          {user?.email ?? user?.id ?? "unknown"}
        </span>
      </p>
    </main>
  );
}
