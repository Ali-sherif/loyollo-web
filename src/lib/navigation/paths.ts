/**
 * Approved App Router paths + legacy TanStack path mapping
 * (docs/frontend/02-route-migration.md).
 */

export const paths = {
  home: "/",
  about: "/about",
  features: "/features",
  pricing: "/pricing",
  guide: "/guide",
  contact: "/contact",
  terms: "/legal/terms",
  privacy: "/legal/privacy",
  signIn: "/auth/sign-in",
  signUp: "/auth/sign-up",
  verify: "/auth/verify",
  verified: "/auth/verified",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  onboarding: "/onboarding",
  onboardingBusinessCategory: "/onboarding/business-category",
  onboardingBusinessType: "/onboarding/business-type",
  onboardingPlan: "/onboarding/plan",
  onboardingSuccess: "/onboarding/success",
  app: "/app",
  dashboard: "/app/dashboard",
  customers: "/app/customers",
  customer: (customerId: string) => `/app/customers/${customerId}`,
  loyalty: "/app/loyalty",
  branches: "/app/branches",
  branch: (branchId: string) => `/app/branches/${branchId}`,
  campaigns: "/app/campaigns",
  campaign: (campaignId: string) => `/app/campaigns/${campaignId}`,
  analytics: "/app/analytics",
  settings: "/app/settings",
  settingsPassword: "/app/settings/password",
  join: (programId: string) => `/join/${programId}`,
} as const;

/** Legacy TanStack URL → approved Next URL */
export const LEGACY_TO_APPROVED: Record<string, string> = {
  "/signin": paths.signIn,
  "/signup": paths.signUp,
  "/verify": paths.verify,
  "/verified": paths.verified,
  "/forgot-password": paths.forgotPassword,
  "/reset-password": paths.resetPassword,
  "/change-password": paths.settingsPassword,
  "/terms": paths.terms,
  "/privacy": paths.privacy,
  "/dashboard": paths.dashboard,
  "/customers": paths.customers,
  "/loyalty-program": paths.loyalty,
  "/branches": paths.branches,
  "/campaigns": paths.campaigns,
  "/analytics": paths.analytics,
  "/settings": paths.settings,
};

export function isNextRuntime(): boolean {
  return (
    process.env.NEXT_PUBLIC_IS_NEXT === "1" ||
    process.env.NEXT_RUNTIME === "nodejs" ||
    process.env.NEXT_RUNTIME === "edge"
  );
}

/**
 * Resolve a path for the active runtime.
 * - Next: map legacy → approved; leave approved/marketing paths alone
 * - TanStack: map approved → legacy where needed so in-repo Vite app keeps working
 */
export function resolveHref(to: string): string {
  if (!to) return "/";
  // Dynamic segments: /customers/$id or /customers/:id → leave structure, map prefix
  const normalized = to.split("?")[0] ?? to;
  const search = to.includes("?") ? to.slice(to.indexOf("?")) : "";

  if (isNextRuntime()) {
    if (LEGACY_TO_APPROVED[normalized]) {
      return `${LEGACY_TO_APPROVED[normalized]}${search}`;
    }
    // /customers/xyz → /app/customers/xyz
    for (const [legacy, approved] of Object.entries(LEGACY_TO_APPROVED)) {
      if (normalized.startsWith(`${legacy}/`)) {
        return `${approved}${normalized.slice(legacy.length)}${search}`;
      }
    }
    return to;
  }

  // TanStack: if someone passes approved paths, map back to legacy
  const APPROVED_TO_LEGACY = Object.fromEntries(
    Object.entries(LEGACY_TO_APPROVED).map(([k, v]) => [v, k]),
  ) as Record<string, string>;
  if (APPROVED_TO_LEGACY[normalized]) {
    return `${APPROVED_TO_LEGACY[normalized]}${search}`;
  }
  for (const [approved, legacy] of Object.entries(APPROVED_TO_LEGACY)) {
    if (normalized.startsWith(`${approved}/`)) {
      return `${legacy}${normalized.slice(approved.length)}${search}`;
    }
  }
  return to;
}

export function buildHref(
  to: string,
  opts?: {
    params?: Record<string, string>;
    search?: Record<string, string | undefined | null>;
  },
): string {
  let path = to;
  if (opts?.params) {
    for (const [key, value] of Object.entries(opts.params)) {
      path = path.replace(`$${key}`, value).replace(`[${key}]`, value);
    }
  }
  const resolved = resolveHref(path);
  if (!opts?.search) return resolved;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(opts.search)) {
    if (v != null && v !== "") qs.set(k, v);
  }
  const q = qs.toString();
  if (!q) return resolved;
  return resolved.includes("?") ? `${resolved}&${q}` : `${resolved}?${q}`;
}
