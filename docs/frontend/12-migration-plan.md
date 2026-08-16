# Incremental Migration Plan

## Locked product constraints

- Keep current visual styles (no redesign).
- Preserve current email/SMS templates and personalization under `src/lib/server/messaging/`.
- Features invoke messaging through provider-agnostic contracts only.
- Withdraw Lovable packages, routes, secrets, and host coupling.
- Initial hosting is Vercel on Node 24 LTS; email/SMS providers are **ACCEPTED RISK** behind messaging adapter stubs.
- Target lines: Next.js 16.3.x, React/React DOM 19.2.x, TypeScript 6.0.x.
- Existing backend remains the primary API; Next.js is not a backend replacement.
- Phase 2 backend stack (separate program): NestJS 11.x, Prisma 7.x, PostgreSQL 18.x ([ADR-015](../architecture/decisions/ADR-015-backend-stack.md)). Not a migration slice.

## Before coding

1. Approve proposed ADRs 002ΓÇô007 (or record ACCEPTED RISK) ΓÇö **done: DECIDED as written**.
2. Production route map **APPROVED** (restructured App Router URLs in [02-route-migration.md](02-route-migration.md)).
3. Email/SMS: **ACCEPTED RISK** with adapter stubs in `src/lib/server/messaging/` (no real provider until later).
4. Canonical package manager selected: npm (`package-lock.json`; remove `bun.lock` at implementation start).
5. Cookie/SSR session spike for auth ΓÇö **ACCEPTED RISK** / remains **BLOCKED** until proven **after** migration start ([auth-ssr-spike.md](../architecture/spikes/auth-ssr-spike.md)).
6. Characterization / visual / email baselines ΓÇö **ACCEPTED RISK** minimal ([parity-baselines.md](../architecture/parity-baselines.md)).
7. Go-live/cutover (D-23) ΓÇö **DECIDED** ([cutover.md](../architecture/cutover.md)); pre-launch, no dual production frontends; rollback owner **ACCEPTED RISK** (not a GO gate).

## Multi-model / multi-agent

Multiple AI models may execute this plan. Rules and parallelization map: [multi-agent-workflow.md](../architecture/multi-agent-workflow.md). **Do not** invent a second slice order. **Current parallel start:** slice 5 (marketing/legal); optional second lane = D-28 spike **or** auth email BFF (slice 6). Slices 1–4 baselines exist.

## Dependency-aware slices

1. Foundation spike: Next 16.3.x, TypeScript 6.0.x, Node 24 / Vercel, Tailwind/assets parity, root layout, `error`/`not-found`/`loading`, Metadata API, environment validation. ΓÇö **done:** `src/app` (layout/page/error/not-found/loading), `next.config.ts`, `tsconfig.next.json`, `src/config/env.ts` (public + server), PostCSS/Tailwind via `src/styles.css`, `.nvmrc` 24 / `engines.node >=24`, scripts `dev:next` / `build:next` / `typecheck:next` (TanStack `dev`/`build` retained in-repo until retirement ΓÇö not production coexistence).
2. Vendor/re-host assets currently tied to Lovable/CDN manifests. ΓÇö **done:** binaries under `src/assets/` (no `*.asset.json` / `__l5e`); OG at `public/og-image.png`; imports use local files; `npm run scan:assets` acceptance.
3. Server infrastructure: backend/Supabase factories, secret isolation, auth proof (route protection + session-aware rendering), portable logging. ΓÇö **done (scaffolding):** `@supabase/ssr` browser/server/admin factories; `src/proxy.ts` session refresh + `/app` coarse gate; `requireUser` / `getCurrentUser`; portable `logger`; D-28 remains **BLOCKED** until confirmed cookie session proven.
4. Messaging skeleton under `src/lib/server/messaging/` that renders existing templates without Lovable SDKs or direct provider coupling. ΓÇö **done:** contracts + render + transport stubs (email refuses silently-success; SMS fails explicitly); auth templates under `templates/auth/` (legacy `src/lib/email-templates/*` re-exports); campaign personalize/HTML helpers.
5. Static marketing/legal routes with visual and SEO metadata parity. — **done:** `(marketing)/*`, `/legal/*` via feature pages + Metadata API.
6. Auth and recovery routes, including first-party auth email webhook/preview BFF handlers (not `/lovable/*`). — **done:** `/auth/*` + `/api/email/auth/{webhook,preview}` + `/api/email/queue/process`.
7. Onboarding. — **done:** `/onboarding/*` with authenticated layout.
8. Public join read (RSC) then enrollment via backend or justified BFF handler + rate limits. — **done:** `/join/[programId]` + `/api/join/{program,enroll}` with in-memory 429 rate limit (ADR-012 baseline).
9. Protected shell and dashboard (RSC where session permits; TanStack Query for interactive server state). — **done:** `/app/(shell)/*` + `requireUser` + DashboardShell parity pages.
10. Customers and loyalty. — **done:** `/app/customers`, `/app/customers/[customerId]`, `/app/loyalty`.
11. Branches/maps (client islands for maps). — **done:** `/app/branches`, `/app/branches/[branchId]`.
12. Campaigns: UI + Backend API enqueue; **queue workers outside Next** ([ADR-013](../architecture/decisions/ADR-013-campaign-messaging-runtime.md)); messaging contracts; preserve SMS channel content. — **done:** `/app/campaigns*` + `/api/campaigns/send` via messaging stubs.
13. Analytics and settings/MFA/uploads/account deletion. — **done:** `/app/analytics`, `/app/settings`, `/app/settings/password` + account delete/password-changed APIs.
14. Remove remaining Lovable packages/env references. — **partial:** Next no longer routes through `/lovable/*` (first-party `/api/email/*`); Lovable packages remain for in-repo TanStack source until explicit retirement approval.
15. SEO, performance, accessibility, visual, and messaging parity regression. — **baseline:** `npm run typecheck:next` + `npm run build` green; production smoke + visual/email HTML parity still required before TanStack deletion.

## Go-live and cutover

**DECIDED** ΓÇö see [cutover.md](../architecture/cutover.md): pre-launch product; **first production** is Next.js on Vercel with the **approved** route map; **no** dual production frontends (TanStack/Lovable may remain as in-repo source until retirement). Replace `/lovable/email/*` with first-party API paths at auth/messaging slices; no dual writes. Named rollback owner is **ACCEPTED RISK** (not a pre-implementation gate); prefer per-slice Next deploy rollback operationally.

## Retirement

Remove TanStack and Lovable code only after all route/API contracts pass production smoke tests, rollback window expires, and the user explicitly approves deletion.

## Out of scope for this plan

Product UI/API/DB gaps (**G-01…G-32**: orders, visit events, tiers, branch attribution, referrals, redeem, billing, etc.) are **not** migration slices. They are owned by the backend program under [ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md) and [docs/backend/](../backend/README.md) (stack: [ADR-015](../architecture/decisions/ADR-015-backend-stack.md)). Closing them does **not** gate TanStack/Lovable retirement. Presentational honesty fixes (Phase 0) may land in the frontend without schema changes.
