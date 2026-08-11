import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next foundation",
};

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-16">
      <p className="text-sm font-medium text-navy-500">Loyollo</p>
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Next.js foundation</h1>
      <p className="text-muted-foreground">
        Slice 1 scaffold (App Router, Metadata API, Tailwind token parity). Pre-launch:
        first production is this Next app on Vercel; TanStack remains in-repo until
        retirement only. D-28 cookie/SSR auth proof remains open until PASSED.
      </p>
    </main>
  );
}
