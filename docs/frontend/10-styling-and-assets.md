# Styling and Assets

## Decision

**DECIDED:** Keep the current visual design. Migration is framework-only; no redesign.

See [ADR-010](../architecture/decisions/ADR-010-style-and-template-parity.md).

## Preserve exactly

- Tailwind CSS 4 design tokens and global styles in `src/styles.css`.
- Radix/shadcn primitives, class-variance-authority, `clsx`, and `tailwind-merge`.
- Figtree typography, brand navy/gold tokens, spacing, radii, and component look.
- Lucide icons and current logo/sidebar/sign-in/sign-up variants.
- Marketing and dashboard imagery as local files under `src/assets/` (vendored in slice 2; no Lovable `*.asset.json` / `__l5e` dependency).
- Leaflet map presentation and existing chart/UI chrome.

## Must change for Next.js, without visual drift

- Replace Vite CSS URL import with root layout CSS import.
- Audit `components.json` (`rsc: false`) and `"use client"` placement without restyling.
- Vendor or re-host Lovable/CDN-backed assets so the UI no longer depends on Lovable hosting ([ADR-009](../architecture/decisions/ADR-009-lovable-withdrawal.md)). **Done (slice 2):** local `src/assets/*` + `public/og-image.png`; run `npm run scan:assets`.
- Configure `next/image` remote patterns only if remote hosting is chosen later; default remains first-party local files.
- Keep Leaflet CSS/client loading isolated.

## Acceptance

- No intentional color, typography, spacing, or layout redesign.
- Side-by-side visual checks for marketing, auth, onboarding, and dashboard shells.
- Broken-image scan after Lovable asset withdrawal.
