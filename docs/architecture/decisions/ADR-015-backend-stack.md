# ADR-015: Backend Stack — NestJS, Prisma, PostgreSQL

## Status

DECIDED

## Context

[ADR-011](ADR-011-rls-storage-strategy.md) Phase 2 and [ADR-014](ADR-014-product-data-ownership.md) assign product persistence and APIs to a separate Backend / Database program. Framework, ORM, and database engine were previously listed as deferred. Product owner direction (2026-08-16): use the **latest stable** NestJS, Prisma, and PostgreSQL — not pre-release lines.

As of 2026-08-16:

- PostgreSQL **18.6** is the latest stable major (`18.x`). PostgreSQL 19 is beta.
- Prisma ORM **7.9.x** is the latest generally available release. Prisma 8 is a release candidate.
- NestJS **11.2.x** is the latest stable (`@nestjs/core`). NestJS 12 is alpha.

## Options

1. Latest stable major of each: NestJS 11.x, Prisma 7.x, PostgreSQL 18.x.
2. Pre-release lines (NestJS 12 alpha, Prisma 8 RC, PostgreSQL 19 beta) — rejected for a production backend.
3. Keep Supabase PostgREST as the long-term API — rejected for Phase 2; custom Backend APIs own data/storage access ([ADR-011](ADR-011-rls-storage-strategy.md)).

## Decision

Pin these lines for the Backend / Database program (ADR-011 Phase 2). Use the **latest stable patch** within each line when implementation begins.

| Component | Target line | Latest stable as of 2026-08-16 |
| --------- | ----------- | ------------------------------ |
| NestJS (`@nestjs/core` and matching `@nestjs/*`) | 11.x | 11.2.x |
| Prisma ORM (`prisma`, `@prisma/client`) | 7.x | 7.9.x |
| PostgreSQL | 18.x | 18.6 |

Do **not** adopt NestJS 12, Prisma 8, or PostgreSQL 19 until they are generally available stable releases **and** this ADR is revised.

This stack lives in the **backend program**, not this frontend repo. Next.js remains the App Router frontend ([ADR-001](ADR-001-nextjs-version.md)); it must not become a second backend ([ADR-006](ADR-006-server-boundaries.md)). Prisma schema and Nest modules implement [data-contract.md](../../backend/data-contract.md) and [api-contract.md](../../backend/api-contract.md). Prisma migrations and Nest services are **not** added in this frontend repo without an explicit override of ADR-014.

Prisma 7 requires a driver adapter for direct PostgreSQL connections (for example `@prisma/adapter-pg`). Node.js for the Nest process should align with **Node 24 LTS** when practical ([ADR-001](ADR-001-nextjs-version.md)), independently of the Vercel frontend host.

## Consequences

- **Auth is in NestJS from Product MVP (Ship 1).** Do not keep Supabase Auth as the IdP during Frontend Migration ([ADR-005](ADR-005-authentication.md) Option C). NestJS issues local JWTs and natively handles admin temp-passwords/resets and customer OTP.
- Frontend Migration may still use existing data contracts for non-auth domains until Frontend Migration Phase 2 cutover ([ADR-011](ADR-011-rls-storage-strategy.md)).
- Phase 2 cutover: the frontend calls NestJS APIs for remaining domains; direct client Postgres / PostgREST traffic is retired.
- Schema execution remains backend-owned.
- Campaign workers remain outside Next.js ([ADR-013](ADR-013-campaign-messaging-runtime.md)); they may run as Nest processes. Queue **product** remains deferred.

## Verification

- Backend program installs NestJS 11.x, Prisma 7.x, and PostgreSQL 18.x (no alpha / beta / RC tags).
- Contracts in [`docs/backend/`](../../backend/README.md) remain the API and schema source of truth.

## Sources

- https://www.postgresql.org/support/versioning/
- https://www.postgresql.org/about/news/postgresql-186-1711-1615-1519-1424-and-19-beta-3-released-3365/
- https://www.prisma.io/docs
- https://www.npmjs.com/package/@nestjs/core
