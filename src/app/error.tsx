"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold text-navy-900">Something went wrong</h1>
      <p className="text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
      <button
        type="button"
        onClick={reset}
        className="w-fit rounded-lg bg-navy-900 px-4 py-2 text-sm text-white"
      >
        Try again
      </button>
    </main>
  );
}
