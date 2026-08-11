import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pre-launch D-23: first production is Next on Vercel; TanStack remains in-repo
  // as migration source only (not a dual production surface). App under src/app (ADR-007).
  reactStrictMode: true,
  typescript: {
    tsconfigPath: "tsconfig.next.json",
  },
};

export default nextConfig;
