# Incremental Migration Plan

## Locked product constraints

- Keep current visual styles (no redesign).
- Preserve current email/SMS templates and personalization under `src/lib/server/messaging/`.
- Features invoke messaging through provider-agnostic contracts only.
- Withdraw Lovable packages, routes, secrets, and host coupling.
- Initial hosting is Vercel on Node 24 LTS; email/SMS providers are **ACCEPTED RISK** behind messaging adapter stubs.
- Target lines: Next.js 16.3.x, React/React DOM 19.2.x, TypeScript 6.0.x.
- Existing backend remains the primary API; Next.js is not a backend replacement.

## Before coding

1. Approve proposed ADRs 002–007 (or record ACCEPTED RISK) — **done: DECIDED as written**.
2. Production route map **APPROVED** (restructured App Router URLs in [02-route-migration.md](02-route-migration.md)).
3. Email/SMS: **ACCEPTED RISK** with adapter stubs in `src/lib/server/messaging/` (no real provider until later).
4. Canonical package manager selected: npm (`package-lock.json`; remove `bun.lock` at implementation start).
5. Cookie/SSR session spike for auth — **ACCEPTED RISK** / remains **BLOCKED** until proven **after** migration start ([auth-ssr-spike.md](../architecture/spikes/auth-ssr-spike.md)).
6. Characterization / visual / email baselines — **ACCEPTED RISK** minimal ([parity-baselines.md](../architecture/parity-baselines.md)).
7. Go-live/cutover (D-23) — **DECIDED** ([cutover.md](../architecture/cutover.md)); pre-launch, no dual production frontends; rollback owner **ACCEPTED RISK** (not a GO gate).

## Dependency-aware slices

1. Foundation spike: Next 16.3.x, TypeScript 6.0.x, Node 24 / Vercel, Tailwind/assets parity, root layout, `error`/`not-found`/`loading`, Metadata API, environment validation. — **done:** `src/app` (layout/page/error/not-found/loading), `next.config.ts`, `tsconfig.next.json`, `src/config/env.ts` (public + server), PostCSS/Tailwind via `src/styles.css`, `.nvmrc` 24 / `engines.node >=24`, scripts `dev:next` / `build:next` / `typecheck:next` (TanStack `dev`/`build` retained in-repo until retirement — not production coexistence).
2. Vendor/re-host assets currently tied to Lovable/CDN manifests. — **done:** binaries under `src/assets/` (no `*.asset.json` / `__l5e`); OG at `public/og-image.png`; imports use local files; `npm run scan:assets` acceptance.
3. Server infrastructure: backend/Supabase factories, secret isolation, auth proof (route protection + session-aware rendering), portable logging.
4. Messaging skeleton under `src/lib/server/messaging/` that renders existing templates without Lovable SDKs or direct provider coupling.
5. Static marketing/legal routes with visual and SEO metadata parity.
6. Auth and recovery routes, including first-party auth email webhook/preview BFF handlers (not `/lovable/*`).
7. Onboarding.
8. Public join read (RSC) then enrollment via backend or justified BFF handler + rate limits.
9. Protected shell and dashboard (RSC where session permits; TanStack Query for interactive server state).
10. Customers and loyalty.
11. Branches/maps (client islands for maps).
12. Campaigns: UI + Backend API enqueue; **queue workers outside Next** ([ADR-013](../architecture/decisions/ADR-013-campaign-messaging-runtime.md)); messaging contracts; preserve SMS channel content.
13. Analytics and settings/MFA/uploads/account deletion.
14. Remove remaining Lovable packages/env references.
15. SEO, performance, accessibility, visual, and messaging parity regression.

## Go-live and cutover

**DECIDED** — see [cutover.md](../architecture/cutover.md): pre-launch product; **first production** is Next.js on Vercel with the **approved** route map; **no** dual production frontends (TanStack/Lovable may remain as in-repo source until retirement). Replace `/lovable/email/*` with first-party API paths at auth/messaging slices; no dual writes. Named rollback owner is **ACCEPTED RISK** (not a pre-implementation gate); prefer per-slice Next deploy rollback operationally.

## Retirement

Remove TanStack and Lovable code only after all route/API contracts pass production smoke tests, rollback window expires, and the user explicitly approves deletion.
