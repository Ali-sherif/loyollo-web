# Architecture Audit

**Audit date:** 2026-08-10  
**Scope:** documentation only; no migration implementation is authorized.

## Executive summary

- **OBSERVED:** Loyollo is a TanStack Start SSR application, not a client-only React SPA. It uses React 19.2, TanStack Router, Vite 8, Nitro, Supabase, six TanStack Server Functions, and three server route handlers.
- **OBSERVED:** The generated route tree contains 31 page URLs, three API URLs, and two structural modules (`__root` and the onboarding layout).
- **DECIDED:** Withdraw Lovable packages, routes, secrets, asset coupling, and host hooks from the project. See [ADR-009](decisions/ADR-009-lovable-withdrawal.md).
- **DECIDED:** Keep current visual styles and current email/SMS message templates. Email/SMS delivery providers remain open. See [ADR-010](decisions/ADR-010-style-and-template-parity.md).
- **DECIDED:** Initial hosting target is Vercel. See [ADR-008](decisions/ADR-008-deployment.md).
- **DECIDED:** Target Next.js 16.3.x, React/React DOM 19.2.x, TypeScript 6.0.x, and Node.js 24 LTS for Node-based deployments. Cloudflare Workers (if used) target `workerd` via OpenNext with separate Node compatibility validation. See [ADR-001](decisions/ADR-001-nextjs-version.md).
- **RECOMMENDED:** Preserve Supabase schema and contracts. Move privileged access behind server-only modules and classify each existing server function individually.
- **PROPOSED:** Use Server Components for initial reads, small Client Component islands for interaction, Route Handlers for public/external/long-running HTTP workflows, and Server Actions only for first-party authenticated UI mutations.
- **NEEDS INVESTIGATION / APPROVAL:** Concrete email/SMS provider, canonical package manager, production runtime configuration, RLS/storage policy behavior, and queue scheduling.

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

## Recommended decision order

`Email/SMS provider → package manager → auth session model → messaging adapter → server boundaries → rendering/cache → data/state → project structure → migration slices`

## Indices

- [Decision matrix](decision-matrix.md)
- [Decision dependencies](decision-dependencies.md)
- [Deferred decisions](deferred-decisions.md)
- [Pre-implementation checklist](pre-implementation-checklist.md)
- [Frontend blueprint](../frontend/README.md)
