import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App Router under src/app (ADR-007). First production is Next on Vercel (ADR-008).
  reactStrictMode: true,
  typescript: {
    tsconfigPath: "tsconfig.next.json",
  },
  env: {
    // Lets shared navigation / auth pick Next approved URLs (docs/frontend/02-route-migration.md).
    NEXT_PUBLIC_IS_NEXT: "1",
    // Map leftover Vite env names for Next client bundles (docs/deployment/env.md).
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
