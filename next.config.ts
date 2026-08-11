import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pre-launch D-23: first production is Next on Vercel; TanStack remains in-repo
  // as migration source only (not a dual production surface). App under src/app (ADR-007).
  reactStrictMode: true,
  typescript: {
    tsconfigPath: "tsconfig.next.json",
  },
  env: {
    // Lets shared navigation / auth pick Next approved URLs (docs/frontend/02-route-migration.md).
    NEXT_PUBLIC_IS_NEXT: "1",
    // Map TanStack/Vite env names for Next client bundles (docs/deployment/env.md).
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.VITE_SUPABASE_URL ??
      process.env.SUPABASE_URL ??
      "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      "",
  },
  images: {
    // Match Vite asset URL string imports for visual-parity migration (ADR-010).
    disableStaticImages: true,
    remotePatterns: [],
  },
  turbopack: {
    rules: {
      "*.svg": {
        type: "asset",
      },
      "*.png": {
        type: "asset",
      },
      "*.jpg": {
        type: "asset",
      },
      "*.jpeg": {
        type: "asset",
      },
      "*.webp": {
        type: "asset",
      },
    },
  },
};

export default nextConfig;
