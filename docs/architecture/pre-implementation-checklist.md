# Pre-Implementation Gate

- [x] Current framework and runtime architecture documented
- [x] 31 page routes, three API routes, and two structural modules inventoried
- [x] Major domains identified
- [x] Six TanStack Server Functions classified
- [x] Three Lovable email handlers classified for replacement
- [x] Client/browser-only boundaries inventoried
- [x] Data, state, styling, assets, auth, risks, and dependencies documented
- [x] Lovable withdrawal decided (packages, routes, secrets, host hooks)
- [x] Visual style parity decided (no redesign)
- [x] Email/SMS template preservation decided and inventoried
- [x] Hosting target approved: Vercel (outside Lovable); Cloudflare/OpenNext secondary
- [x] Email delivery provider: **ACCEPTED RISK** ΓÇö concrete provider deferred; use `src/lib/server/messaging/` adapter stubs until a provider is chosen
- [x] SMS provider: **ACCEPTED RISK** ΓÇö channel and templates preserved; stub transport fails explicitly until a provider is chosen
- [x] Node version approved: 24 LTS for Node deploys; workerd via OpenNext if Cloudflare
- [x] Canonical package manager approved: npm (`package-lock.json`; retire `bun.lock` at implementation start)
- [x] Next.js / React / TypeScript lines approved (16.3.x / 19.2.x / 6.0.x); exact patches at implementation start
- [x] App Router architecture decisions approved (ADR-002 through ADR-007)
- [x] Approved production route map (see `docs/frontend/02-route-migration.md`; restructured App Router URLs)
- [x] Auth IdP: **DECIDED** — NestJS independent auth, local JWT, all roles; **no Supabase Auth** even during Frontend Migration ([ADR-005](decisions/ADR-005-authentication.md) Option C)
- [x] Nest JWT HTTP-only cookie / SSR session: **ACCEPTED RISK** — prove Next proxy + RSC validation; remains **BLOCKED** until PASSED. The `@supabase/ssr` spike ([spikes/auth-ssr-spike.md](spikes/auth-ssr-spike.md)) is **superseded** and must not be used as the remaining proof.
- [x] RLS and storage policies: **DECIDED / APPROVED** for migration scope — retain existing Lovable RLS/Storage as-is during Frontend Migration (ADR-011 Phase 1); Frontend Migration Phase 2 custom Backend APIs own all data/storage access ([ADR-011](decisions/ADR-011-rls-storage-strategy.md))
- [x] Phase 2 backend stack: **DECIDED** ΓÇö NestJS 11.x, Prisma 7.x, PostgreSQL 18.x (latest stable patches at implementation); **not** a frontend-migration GO item ([ADR-015](decisions/ADR-015-backend-stack.md))
- [x] Server-function ΓåÆ backend/BFF mapping revised to backend-primary boundary model ΓÇö **DECIDED / APPROVED** (decision tree + per-function rows in [15-server-function-mapping.md](../frontend/15-server-function-mapping.md); [ADR-006](decisions/ADR-006-server-boundaries.md))
- [x] Public enrollment rate-limit/abuse controls: **DECIDED / APPROVED** ΓÇö edge/server rate limit (Vercel / Cloudflare / Upstash Redis) on public signup & enrollment; HTTP 429; frontend graceful UX ([ADR-012](decisions/ADR-012-public-enrollment-rate-limiting.md))
- [x] Campaign execution runtime/queue strategy without Lovable transport: **DECIDED / APPROVED** ΓÇö background processing outside Next.js (backend/messaging infra); queue product chosen later by workload ([ADR-013](decisions/ADR-013-campaign-messaging-runtime.md))
- [x] Asset vendoring plan: **DONE (slice 2)** ΓÇö local `src/assets/*` + `public/og-image.png`; Lovable `*.asset.json` / `__l5e` removed; `npm run scan:assets` ([10-styling-and-assets.md](../frontend/10-styling-and-assets.md); [deferred-decisions.md](deferred-decisions.md))
- [x] Environment inventory: **ACCEPTED RISK** ΓÇö inventory documented in [docs/deployment/env.md](../deployment/env.md); **remains open until you confirm** values in Vercel UI (Dev / Preview / Production) without exposing secrets in git ([deferred-decisions.md](deferred-decisions.md))
- [x] Characterization, visual, and email HTML parity baseline: **ACCEPTED RISK** ΓÇö minimal smoke checklist + visual parity note + email template inventory at implementation start; no formal suite required before coding ([parity-baselines.md](parity-baselines.md))
- [x] Go-live/cutover mechanism (D-23): **DECIDED** ΓÇö pre-launch; first production is Next on Vercel with approved route map; **no** dual production frontends; TanStack may remain in-repo until retirement; first-party email BFF replaces `/lovable/email/*` at auth/messaging slices; no dual writes ([cutover.md](cutover.md))
- [x] Rollback owner and production acceptance criteria: **ACCEPTED RISK** ΓÇö not required as a pre-implementation gate (ignored for GO); per-slice deploy rollback remains available operationally

Migration implementation may begin when all Critical items are `DECIDED` or explicitly `ACCEPTED RISK`.
