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
