#!/usr/bin/env node
/**
 * Extract TanStack route page bodies into Next-ready client page modules
 * and emit thin App Router wrappers (docs/frontend/02-route-migration.md).
 *
 * Does not delete TanStack routes — keeps dual in-repo coexistence.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

/** @type {{ routeFile: string, featureFile: string, appPage: string, params?: string[], search?: string[], title?: string, componentName: string }[]} */
const MAP = [
  // Marketing / legal (slice 5)
  { routeFile: "src/routes/index.tsx", featureFile: "src/features/marketing/landing-page.tsx", appPage: "src/app/(marketing)/page.tsx", componentName: "LandingPage", title: "Loyalty — Grow customer loyalty & repeat business" },
  { routeFile: "src/routes/about.tsx", featureFile: "src/features/marketing/about-page.tsx", appPage: "src/app/(marketing)/about/page.tsx", componentName: "AboutPage", title: "About" },
  { routeFile: "src/routes/features.tsx", featureFile: "src/features/marketing/features-page.tsx", appPage: "src/app/(marketing)/features/page.tsx", componentName: "FeaturesPage", title: "Features" },
  { routeFile: "src/routes/pricing.tsx", featureFile: "src/features/marketing/pricing-page.tsx", appPage: "src/app/(marketing)/pricing/page.tsx", componentName: "PricingPage", title: "Pricing" },
  { routeFile: "src/routes/guide.tsx", featureFile: "src/features/marketing/guide-page.tsx", appPage: "src/app/(marketing)/guide/page.tsx", componentName: "GuidePage", title: "Guide" },
  { routeFile: "src/routes/contact.tsx", featureFile: "src/features/marketing/contact-page.tsx", appPage: "src/app/(marketing)/contact/page.tsx", componentName: "ContactPage", title: "Contact" },
  { routeFile: "src/routes/terms.tsx", featureFile: "src/features/legal/terms-page.tsx", appPage: "src/app/legal/terms/page.tsx", componentName: "TermsPage", title: "Terms of Service" },
  { routeFile: "src/routes/privacy.tsx", featureFile: "src/features/legal/privacy-page.tsx", appPage: "src/app/legal/privacy/page.tsx", componentName: "PrivacyPage", title: "Privacy Policy" },

  // Auth (slice 6)
  { routeFile: "src/routes/signin.tsx", featureFile: "src/features/auth/sign-in-page.tsx", appPage: "src/app/auth/sign-in/page.tsx", componentName: "SignInPage", title: "Sign in" },
  { routeFile: "src/routes/signup.tsx", featureFile: "src/features/auth/sign-up-page.tsx", appPage: "src/app/auth/sign-up/page.tsx", componentName: "SignUpPage", title: "Sign up", search: ["plan"] },
  { routeFile: "src/routes/verify.tsx", featureFile: "src/features/auth/verify-page.tsx", appPage: "src/app/auth/verify/page.tsx", componentName: "VerifyPage", title: "Verify email", search: ["email"] },
  { routeFile: "src/routes/verified.tsx", featureFile: "src/features/auth/verified-page.tsx", appPage: "src/app/auth/verified/page.tsx", componentName: "VerifiedPage", title: "Email verified" },
  { routeFile: "src/routes/forgot-password.tsx", featureFile: "src/features/auth/forgot-password-page.tsx", appPage: "src/app/auth/forgot-password/page.tsx", componentName: "ForgotPasswordPage", title: "Forgot password" },
  { routeFile: "src/routes/reset-password.tsx", featureFile: "src/features/auth/reset-password-page.tsx", appPage: "src/app/auth/reset-password/page.tsx", componentName: "ResetPasswordPage", title: "Reset password" },

  // Onboarding (slice 7)
  { routeFile: "src/routes/onboarding.index.tsx", featureFile: "src/features/onboarding/onboarding-index-page.tsx", appPage: "src/app/onboarding/page.tsx", componentName: "OnboardingIndexPage", title: "Onboarding" },
  { routeFile: "src/routes/onboarding.business-category.tsx", featureFile: "src/features/onboarding/business-category-page.tsx", appPage: "src/app/onboarding/business-category/page.tsx", componentName: "BusinessCategoryPage", title: "Business category" },
  { routeFile: "src/routes/onboarding.business-type.tsx", featureFile: "src/features/onboarding/business-type-page.tsx", appPage: "src/app/onboarding/business-type/page.tsx", componentName: "BusinessTypePage", title: "Business type" },
  { routeFile: "src/routes/onboarding.plan.tsx", featureFile: "src/features/onboarding/plan-page.tsx", appPage: "src/app/onboarding/plan/page.tsx", componentName: "OnboardingPlanPage", title: "Choose plan" },
  { routeFile: "src/routes/onboarding.success.tsx", featureFile: "src/features/onboarding/success-page.tsx", appPage: "src/app/onboarding/success/page.tsx", componentName: "OnboardingSuccessPage", title: "Onboarding complete", search: ["justCompleted"] },

  // Join (slice 8)
  { routeFile: "src/routes/join.$programId.tsx", featureFile: "src/features/join/join-page.tsx", appPage: "src/app/join/[programId]/page.tsx", componentName: "JoinPage", title: "Join loyalty program", params: ["programId"] },

  // App shell pages (slices 9–13)
  { routeFile: "src/routes/dashboard.tsx", featureFile: "src/features/dashboard/dashboard-page.tsx", appPage: "src/app/app/(shell)/dashboard/page.tsx", componentName: "DashboardPage", title: "Dashboard" },
  { routeFile: "src/routes/customers.index.tsx", featureFile: "src/features/customers/customers-page.tsx", appPage: "src/app/app/(shell)/customers/page.tsx", componentName: "CustomersPage", title: "Customers" },
  { routeFile: "src/routes/customers.$customerId.tsx", featureFile: "src/features/customers/customer-detail-page.tsx", appPage: "src/app/app/(shell)/customers/[customerId]/page.tsx", componentName: "CustomerDetailPage", title: "Customer", params: ["customerId"] },
  { routeFile: "src/routes/loyalty-program.tsx", featureFile: "src/features/loyalty/loyalty-page.tsx", appPage: "src/app/app/(shell)/loyalty/page.tsx", componentName: "LoyaltyPage", title: "Loyalty program", search: ["tab"] },
  { routeFile: "src/routes/branches.index.tsx", featureFile: "src/features/branches/branches-page.tsx", appPage: "src/app/app/(shell)/branches/page.tsx", componentName: "BranchesPage", title: "Branches" },
  { routeFile: "src/routes/branches.$branchId.tsx", featureFile: "src/features/branches/branch-detail-page.tsx", appPage: "src/app/app/(shell)/branches/[branchId]/page.tsx", componentName: "BranchDetailPage", title: "Branch", params: ["branchId"] },
  { routeFile: "src/routes/campaigns.index.tsx", featureFile: "src/features/campaigns/campaigns-page.tsx", appPage: "src/app/app/(shell)/campaigns/page.tsx", componentName: "CampaignsPage", title: "Campaigns" },
  { routeFile: "src/routes/campaigns.$campaignId.tsx", featureFile: "src/features/campaigns/campaign-detail-page.tsx", appPage: "src/app/app/(shell)/campaigns/[campaignId]/page.tsx", componentName: "CampaignDetailPage", title: "Campaign", params: ["campaignId"] },
  { routeFile: "src/routes/analytics.tsx", featureFile: "src/features/analytics/analytics-page.tsx", appPage: "src/app/app/(shell)/analytics/page.tsx", componentName: "AnalyticsPage", title: "Analytics" },
  { routeFile: "src/routes/settings.tsx", featureFile: "src/features/settings/settings-page.tsx", appPage: "src/app/app/(shell)/settings/page.tsx", componentName: "SettingsPage", title: "Settings" },
  { routeFile: "src/routes/change-password.tsx", featureFile: "src/features/settings/password-page.tsx", appPage: "src/app/app/(shell)/settings/password/page.tsx", componentName: "ChangePasswordPage", title: "Change password" },
];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function transformSource(src, meta) {
  let out = src;

  // Drop createFileRoute import and Route export blocks (multiline heuristic)
  out = out.replace(
    /import\s*\{[^}]*\}\s*from\s*["']@tanstack\/react-router["'];?\n?/g,
    `import { Link, useNavigate, useRouterState } from "@/lib/navigation";\n`,
  );
  out = out.replace(
    /import\s*\{[^}]*\}\s*from\s*["']@tanstack\/react-start["'];?\n?/g,
    `// TanStack useServerFn removed — call server modules directly from client with fetch/BFF later\n`,
  );

  // Remove `export const Route = createFileRoute(...)({...});`
  out = out.replace(
    /export\s+const\s+Route\s*=\s*createFileRoute\([^)]*\)\s*\(\s*\{[\s\S]*?\}\s*\);\s*/m,
    "",
  );

  // Replace Route.useParams()
  if (meta.params?.length) {
    for (const p of meta.params) {
      out = out.replaceAll(`Route.useParams().${p}`, p);
      out = out.replace(
        /const\s+\{\s*([^}]+)\s*\}\s*=\s*Route\.useParams\(\);?/,
        (match, keys) => {
          return `/* params from props */`;
        },
      );
    }
    out = out.replace(/Route\.useParams\(\)/g, `({ ${meta.params.join(", ")} })`);
  }

  // Replace Route.useSearch()
  if (meta.search?.length) {
    out = out.replace(
      /const\s+(\w+)\s*=\s*Route\.useSearch\(\);?/g,
      `const $1 = useSearchParamsCompat();`,
    );
    out = out.replace(/Route\.useSearch\(\)/g, "useSearchParamsCompat()");
  }

  // useRouterState from tanstack already remapped via import rewrite if bundled with Link
  out = out.replaceAll(
    'from "@/integrations/supabase/client"',
    'from "@/integrations/supabase/auth-client"',
  );
  out = out.replaceAll(
    "from '@/integrations/supabase/client'",
    "from '@/integrations/supabase/auth-client'",
  );
  out = out.replaceAll(
    /import\s*\{\s*supabase\s*\}\s*from\s*["']@\/integrations\/supabase\/auth-client["']/g,
    'import { getAuthSupabase } from "@/integrations/supabase/auth-client"',
  );

  // If we still have `supabase.` usages without import, inject getAuthSupabase
  if (/\bsupabase\./.test(out) && !/getAuthSupabase/.test(out)) {
    out = `import { getAuthSupabase } from "@/integrations/supabase/auth-client";\n` + out;
  }
  if (/\bsupabase\./.test(out) && /getAuthSupabase/.test(out)) {
    // Add local const in component is hard; replace supabase. with getAuthSupabase().
    out = out.replace(/\bsupabase\./g, "getAuthSupabase().");
  }

  // Ensure client directive
  if (!out.trimStart().startsWith('"use client"') && !out.trimStart().startsWith("'use client'")) {
    out = `"use client";\n\n${out}`;
  }

  // Add search params helper if needed
  if (meta.search?.length && !out.includes("useSearchParamsCompat")) {
    out = out.replace(
      `"use client";`,
      `"use client";\n\nfunction useSearchParamsCompat(): Record<string, string | undefined> {\n  if (typeof window === "undefined") return {};\n  const sp = new URLSearchParams(window.location.search);\n  const out: Record<string, string | undefined> = {};\n  sp.forEach((v, k) => {\n    out[k] = v;\n  });\n  return out;\n}\n`,
    );
  }

  // Wrap default export: find function ComponentName or function XxxPage
  // Ensure named export exists matching componentName
  if (!new RegExp(`function\\s+${meta.componentName}\\b`).test(out) && !new RegExp(`const\\s+${meta.componentName}\\b`).test(out)) {
    // Try to rename common patterns like function SignIn / function SigninPage
    const fnMatch = out.match(/function\s+([A-Z][A-Za-z0-9]*)\s*\(/);
    if (fnMatch && fnMatch[1] !== meta.componentName) {
      out = out.replace(new RegExp(`\\b${fnMatch[1]}\\b`, "g"), meta.componentName);
    }
  }

  // Params: convert component to accept props
  if (meta.params?.length) {
    const propsType = `{ ${meta.params.map((p) => `${p}: string`).join("; ")} }`;
    out = out.replace(
      new RegExp(`function\\s+${meta.componentName}\\s*\\(\\s*\\)`),
      `function ${meta.componentName}({ ${meta.params.join(", ")} }: ${propsType})`,
    );
  }

  if (!out.includes(`export default ${meta.componentName}`) && !out.includes(`export { ${meta.componentName}`)) {
    out += `\n\nexport default ${meta.componentName};\n`;
  }

  // Clean unused Link import noise if Link not used — leave as is (tsc may allow unused with skip)
  return out;
}

function emitAppPage(meta) {
  const importPath = "@/" + meta.featureFile.replace(/^src\//, "").replace(/\.tsx$/, "");
  if (meta.params?.length) {
    return `"use client";

import ${meta.componentName} from "${importPath}";
import { use } from "react";

export default function Page({
  params,
}: {
  params: Promise<{ ${meta.params.map((p) => `${p}: string`).join("; ")} }>;
}) {
  const resolved = use(params);
  return <${meta.componentName} ${meta.params.map((p) => `${p}={resolved.${p}}`).join(" ")} />;
}
`;
  }
  return `"use client";

import ${meta.componentName} from "${importPath}";

export default function Page() {
  return <${meta.componentName} />;
}
`;
}

function emitMetadataPage(meta, clientImport) {
  // For marketing we want server metadata + client page. Use a server page that imports client.
  if (meta.appPage.includes("(marketing)") || meta.appPage.includes("legal/")) {
    return `import type { Metadata } from "next";
import ${meta.componentName} from "${clientImport}";

export const metadata: Metadata = {
  title: ${JSON.stringify(meta.title ?? meta.componentName)},
};

export default function Page() {
  return <${meta.componentName} />;
}
`;
  }
  return emitAppPage(meta);
}

let ok = 0;
for (const meta of MAP) {
  const absRoute = path.join(root, meta.routeFile);
  if (!fs.existsSync(absRoute)) {
    console.warn("missing route", meta.routeFile);
    continue;
  }
  const raw = fs.readFileSync(absRoute, "utf8");
  const feature = transformSource(raw, meta);
  const featureAbs = path.join(root, meta.featureFile);
  ensureDir(featureAbs);
  fs.writeFileSync(featureAbs, feature);

  const appAbs = path.join(root, meta.appPage);
  ensureDir(appAbs);
  const importPath = "@/" + meta.featureFile.replace(/^src\//, "").replace(/\.tsx$/, "");
  fs.writeFileSync(appAbs, emitMetadataPage(meta, importPath));
  ok += 1;
  console.log("ported", meta.routeFile, "->", meta.appPage);
}
console.log(`done: ${ok}/${MAP.length}`);
