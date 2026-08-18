# Backend contracts (product data remediation)

> **Scope warning:** This folder is a **specification for a separate Backend / Database program** ([ADR-011](../architecture/decisions/ADR-011-rls-storage-strategy.md) Phase 2, [ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md), [ADR-015](../architecture/decisions/ADR-015-backend-stack.md)). It is **not** Next.js migration work and does **not** authorize migrations or BFF persistence in this frontend repo. Implementation lives in the sibling **`loyollo-backend`** repo.

## Target stack (DECIDED)

Latest **stable** lines for the backend program. Use the latest stable patch within each line at implementation. Do not adopt pre-release majors (NestJS 12 alpha, Prisma 8 RC, PostgreSQL 19 beta) until [ADR-015](../architecture/decisions/ADR-015-backend-stack.md) is revised.

| Concern | Target | Latest stable as of 2026-08-16 |
| ------- | ------ | ------------------------------ |
| API framework | NestJS 11.x | 11.2.x |
| ORM | Prisma 7.x | 7.9.x |
| Database | PostgreSQL 18.x | 18.6 |
| Node.js (Nest process) | 24 LTS when practical | same as [ADR-001](../architecture/decisions/ADR-001-nextjs-version.md) |

Prisma 7 requires a PostgreSQL driver adapter (for example `@prisma/adapter-pg`). Schema and HTTP shapes stay in the contracts below; Prisma/Nest live in the backend program, not this frontend repo.

## Documents

| Doc | Purpose |
|-----|---------|
| [data-contract.md](data-contract.md) | Target schema (independent programs, `customer_program_memberships` two counters, `reward_snapshot` / versions, visit_events, orders + invoice/currency, **`profiles.role` + `profiles.account_status`** (S-01), **`profiles.currency` locked at onboarding**, OTP PM-06, vouchers, referrals, catalog redeem + PM-04, mutation guards, PM-08 tier functions, write rules, glossary). Product model: [program-model.md](../product/program-model.md) · [ADR-016](../architecture/decisions/ADR-016-independent-programs.md) |
| [api-contract.md](api-contract.md) | Error envelope; **auth/session JWT claims** (`role`, `account_status`); programs activate/archive; staff POS scan/transactions; OTP send/verify; enroll UX-75; catalog redemption + scan; campaign automations 503 |
| [remediation-roadmap.md](remediation-roadmap.md) | Phases **P0a** (role + account status) and 0–7, G-IDs, acceptance criteria (PM-08 tier writer, visit metrics, ROI, staff POS, PM-04 expiry) |
| [customer-lifecycle.md](customer-lifecycle.md) | **G-08** — mutually exclusive `lifecycle_state` (`new` / `active` / `at_risk`); DB function, shared module, frontend + campaign targeting spec (**DECIDED, not shipped**) |

## Gap backlog

Indexed UI vs API vs DB gaps (**G-01…G-36**): [../frontend/gaps-and-solutions.md](../frontend/gaps-and-solutions.md).

## Current system (as built)

How pages talk to the API today: [../frontend/system-architecture.md](../frontend/system-architecture.md). **Auth is NestJS from Product MVP (Ship 1)** ([ADR-005](../architecture/decisions/ADR-005-authentication.md) Option C). Remaining product data access still follows [ADR-011](../architecture/decisions/ADR-011-rls-storage-strategy.md) until Frontend Migration Phase 2 Nest APIs replace direct client Postgres/PostgREST. Scope: [phase-1-scope.md](../product/phase-1-scope.md) · remediation: [remediation-roadmap.md](remediation-roadmap.md).
