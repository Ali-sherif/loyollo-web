import type { Metadata } from "next";

import { getPublicEnv, getServerEnv } from "@/config/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Next foundation",
  robots: { index: false, follow: false },
};

export default function HomePage() {
  const publicEnv = getPublicEnv();
  const serverEnv = getServerEnv();

  const checks = [
    {
      label: "NEXT_PUBLIC_SUPABASE_URL",
      ok: Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_URL),
    },
    {
      label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      ok: Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    {
      label: "SUPABASE_URL (server)",
      ok: Boolean(serverEnv.SUPABASE_URL),
    },
    {
      label: "SUPABASE_PUBLISHABLE_KEY (server)",
      ok: Boolean(serverEnv.SUPABASE_PUBLISHABLE_KEY),
    },
    {
      label: "SUPABASE_SERVICE_ROLE_KEY (server)",
      ok: Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY),
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium text-navy-500">Loyollo</p>
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900">
          Next.js foundation
        </h1>
        <p className="text-muted-foreground">
          Slice 1: App Router, Metadata API, Tailwind token parity via{" "}
          <code className="text-sm text-foreground">src/styles.css</code>, Node
          24 / Vercel target, and env validation. TanStack remains in-repo until
          retirement. D-28 cookie/SSR proof stays open until PASSED.
        </p>
      </div>

      <section className="space-y-3" aria-label="Environment validation">
        <h2 className="text-sm font-semibold text-navy-900">Env checks</h2>
        <ul className="space-y-2 text-sm">
          {checks.map(({ label, ok }) => (
            <li key={label} className="flex items-center justify-between gap-4">
              <span className="font-mono text-muted-foreground">{label}</span>
              <span className={ok ? "text-success-600" : "text-orange-500"}>
                {ok ? "set" : "missing"}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Values are never rendered. Confirm Dev / Preview / Production in the
          Vercel UI before deploy — see docs/deployment/env.md.
        </p>
      </section>
    </main>
  );
}
