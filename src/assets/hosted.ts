/**
 * Locally hosted marketing/app assets (slice 2 / ADR-009).
 * Files live under `public/assets/`; URLs are stable for TanStack and Next.
 */
export const hostedAssets = {
  analyticsOverview: { url: "/assets/Analytics_-_Overview.png" },
  branches: { url: "/assets/Branches.png" },
  campaigns: { url: "/assets/Campaigns.png" },
  campaigns2: { url: "/assets/Campaigns-2.png" },
  customers: { url: "/assets/Customers.png" },
  dashboard2: { url: "/assets/Dashboard-2.png" },
  dashboardHero: { url: "/assets/dashboard-hero.png" },
  frame7Bg: { url: "/assets/frame-7-bg.png" },
  jonFinanceIllustration: { url: "/assets/jon-finance-man-and-more-money_1.svg" },
  loyaltyProgram: { url: "/assets/Loyalty_Program.png" },
  loyolloIconWhite: { url: "/assets/loyollo-icon-white.svg" },
  loyolloLogo: { url: "/assets/loyollo-logo.svg" },
  loyolloLogoSignin: { url: "/assets/loyollo-logo-signin.svg" },
  loyolloLogoSignup: { url: "/assets/loyollo-logo-signup.svg" },
  loyolloLogoWhite: { url: "/assets/loyollo-logo-white.svg" },
  loyolloLogoWhiteSidebar: { url: "/assets/loyollo-logo-white-sidebar.svg" },
  starbucksLogo: { url: "/assets/starbucks-logo.webp" },
  timHortonsLogo: { url: "/assets/tim-hortons-logo.webp" },
} as const;

/** Site OG / Twitter preview image under `public/og/`. */
export const ogPreviewImage = "/og/og-preview.png";
