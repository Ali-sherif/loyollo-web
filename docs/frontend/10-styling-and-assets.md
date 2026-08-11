# Styling and Assets

## Decision

**DECIDED:** Keep the current visual design. Migration is framework-only; no redesign.

See [ADR-010](../architecture/decisions/ADR-010-style-and-template-parity.md).

## Preserve exactly

- Tailwind CSS 4 design tokens and global styles in `src/styles.css`.
- Radix/shadcn primitives, class-variance-authority, `clsx`, and `tailwind-merge`.
- Figtree typography, brand navy/gold tokens, spacing, radii, and component look.
- Lucide icons and current logo/sidebar/sign-in/sign-up variants.
- Marketing and dashboard imagery under `public/assets/` (URL map: `src/assets/hosted.ts`).
- Leaflet map presentation and existing chart/UI chrome.

## Must change for Next.js, without visual drift

- Replace Vite CSS URL import with root layout CSS import.
- Audit `components.json` (`rsc: false`) and `"use client"` placement without restyling.
- Vendor or re-host Lovable/CDN-backed assets so the UI no longer depends on Lovable hosting ([ADR-009](../architecture/decisions/ADR-009-lovable-withdrawal.md)). **DONE (slice 2)** — files in `public/assets/` + `public/og/`; see [deferred-decisions.md](../architecture/deferred-decisions.md).
- Configure `next/image` remote patterns only if remote hosting is chosen later; default to local `/assets` and `/og` paths.
- Keep Leaflet CSS/client loading isolated.

## Acceptance

- No intentional color, typography, spacing, or layout redesign.
- Side-by-side visual checks for marketing, auth, onboarding, and dashboard shells.
- Broken-image scan after Lovable asset withdrawal.
