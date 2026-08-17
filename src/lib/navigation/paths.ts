/**
 * Approved App Router paths + legacy URL mapping
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

/** Legacy TanStack URL → approved Next URL (bookmarks / leftover hrefs). */
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
  return true;
}

/**
 * Resolve a path for the Next.js app.
 * Map leftover legacy URLs → approved App Router paths.
 */
export function resolveHref(to: string): string {
  if (!to) return "/";
  const normalized = to.split("?")[0] ?? to;
  const search = to.includes("?") ? to.slice(to.indexOf("?")) : "";

  if (LEGACY_TO_APPROVED[normalized]) {
    return `${LEGACY_TO_APPROVED[normalized]}${search}`;
  }
  for (const [legacy, approved] of Object.entries(LEGACY_TO_APPROVED)) {
    if (normalized.startsWith(`${legacy}/`)) {
      return `${approved}${normalized.slice(legacy.length)}${search}`;
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
