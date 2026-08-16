# Architecture Audit

**Audit date:** 2026-08-10 (gates updated 2026-08-11)  
**Scope:** architecture + frontend blueprint; Critical gates cleared ΓÇö migration slices authorized (GO).

## Executive summary

- **OBSERVED:** Loyollo is a TanStack Start SSR application, not a client-only React SPA. It uses React 19.2, TanStack Router, Vite 8, Nitro, Supabase, six TanStack Server Functions, and three server route handlers.
- **OBSERVED:** The generated route tree contains 31 page URLs, three API URLs, and two structural modules (`__root` and the onboarding layout).
- **DECIDED:** Withdraw Lovable packages, routes, secrets, asset coupling, and host hooks from the project. See [ADR-009](decisions/ADR-009-lovable-withdrawal.md).
- **DECIDED:** Keep current visual styles and current email/SMS message templates. See [ADR-010](decisions/ADR-010-style-and-template-parity.md).
- **ACCEPTED RISK:** Concrete email/SMS providers deferred; use `src/lib/server/messaging/` adapter stubs (SMS fails explicitly until configured).
- **DECIDED:** Initial hosting target is Vercel. See [ADR-008](decisions/ADR-008-deployment.md).
- **DECIDED:** Target Next.js 16.3.x, React/React DOM 19.2.x, TypeScript 6.0.x, and Node.js 24 LTS for Node-based deployments. Cloudflare Workers (if used) target `workerd` via OpenNext with separate Node compatibility validation. See [ADR-001](decisions/ADR-001-nextjs-version.md).
- **RECOMMENDED:** Preserve Supabase schema and contracts. Keep the existing backend as the primary API; Next.js orchestrates and protects routes but does not replace backend ownership.
- **DECIDED:** Authentication ownership in the backend ([ADR-005](decisions/ADR-005-authentication.md)). Locked roles: **`admin`** (buyer / owner), **`staff`** (same permissions as admin for now), **`customer`** (shop member login).
- **DECIDED:** Canonical package manager is npm (`package-lock.json`); remove `bun.lock` at implementation start.
- **DECIDED:** Production route map approved and restructured ΓÇö [02-route-migration.md](../frontend/02-route-migration.md).
- **DECIDED:** RLS/storage for this migration ΓÇö retain existing Lovable policies in Phase 1; Phase 2 custom Backend APIs own all data/storage access. See [ADR-011](decisions/ADR-011-rls-storage-strategy.md).
- **DECIDED:** Phase 2 backend stack is NestJS 11.x, Prisma 7.x, and PostgreSQL 18.x (latest stable patches at implementation). Not a frontend-migration slice. See [ADR-015](decisions/ADR-015-backend-stack.md).
- **DECIDED:** Go-live/cutover (D-23) ΓÇö pre-launch; first prod is Next on Vercel; no dual production frontends; first-party email BFF; no dual writes. See [cutover.md](cutover.md).
- **ACCEPTED RISK:** Cookie/SSR session spike (**BLOCKED** until proven after migration start ΓÇö [spikes/auth-ssr-spike.md](spikes/auth-ssr-spike.md)); minimal parity baselines ([parity-baselines.md](parity-baselines.md)); **Vercel env confirm** (open until UI check) ΓÇö see [deferred-decisions.md](deferred-decisions.md); rollback owner not a GO gate. **DONE:** asset vendoring (slice 2); server infra scaffolding + messaging stubs (slices 3–4).
- **Go / No-Go:** **GO** for migration implementation and root Next.js app creation. D-28 remains documented open/BLOCKED until PASSED.

## Critical decisions

1. Next.js release and Node runtime: [ADR-001](decisions/ADR-001-nextjs-version.md)
2. App Router: [ADR-002](decisions/ADR-002-app-router.md)
3. Rendering and caching: [ADR-003](decisions/ADR-003-rendering-strategy.md)
4. Data and state: [ADR-004](decisions/ADR-004-data-and-state.md)
5. Authentication: [ADR-005](decisions/ADR-005-authentication.md)
6. Server/API boundaries: [ADR-006](decisions/ADR-006-server-boundaries.md)
7. Project structure: [ADR-007](decisions/ADR-007-project-structure.md)
8. Deployment: [ADR-008](decisions/ADR-008-deployment.md)
9. Lovable withdrawal: [ADR-009](decisions/ADR-009-lovable-withdrawal.md)
10. Style and template parity: [ADR-010](decisions/ADR-010-style-and-template-parity.md)
11. RLS / storage transitional strategy: [ADR-011](decisions/ADR-011-rls-storage-strategy.md)
12. Public enrollment rate limiting: [ADR-012](decisions/ADR-012-public-enrollment-rate-limiting.md)
13. Campaign / messaging background runtime: [ADR-013](decisions/ADR-013-campaign-messaging-runtime.md)
14. Product data ownership + UI honesty: [ADR-014](decisions/ADR-014-product-data-ownership.md) (backend contracts under [`docs/backend/`](../backend/README.md); not a migration slice)
15. Backend stack (NestJS / Prisma / PostgreSQL): [ADR-015](decisions/ADR-015-backend-stack.md) (Phase 2 backend program; not a migration slice)

## Recommended decision order

`Messaging adapter stubs (at implementation) ΓåÆ migration slices; prove cookie/SSR session (D-28) during foundation / server-infra / auth (remains open until PASSED)`

(Server-function ΓåÆ Backend API / Server Action / BFF mapping is **DECIDED** ΓÇö [15-server-function-mapping.md](../frontend/15-server-function-mapping.md).)

## Indices

- [Decision matrix](decision-matrix.md)
- [Decision dependencies](decision-dependencies.md)
- [Deferred decisions](deferred-decisions.md)
- [Pre-implementation checklist](pre-implementation-checklist.md)
- [Parity baselines](parity-baselines.md)
- [Go-live / cutover](cutover.md)
- [Multi-model / multi-agent workflow](multi-agent-workflow.md)
- [Spikes ΓÇö Auth Cookie/SSR](spikes/auth-ssr-spike.md)
- [Frontend blueprint](../frontend/README.md)
- [Backend product-data contracts](../backend/README.md) (ADR-014 / ADR-015; not migration work)
