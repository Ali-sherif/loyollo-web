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
| [data-contract.md](data-contract.md) | Target schema (incl. `visit_events`, `orders.paid_at`, `otp_verifications`, `vouchers`, `referrals` + grant/expiry + fraud + OTP, catalog redeem pending/reserve/QR/`expired` job), Shop capability unique `(owner_id, program_type)`, tier DB functions/triggers, visit metric SQL, ROI formula, write rules, glossary. Product model: [program-model.md](../product/program-model.md) |
| [api-contract.md](api-contract.md) | Endpoint shapes (analytics ROI, `POST /api/insights/:key/actions`, catalog redemption lifecycle + scan + expiry worker, Shop QR resolve) |
| [remediation-roadmap.md](remediation-roadmap.md) | Phases 0–7, G-IDs, acceptance criteria (tier automation, visit metrics, ROI, insight nudges) |

## Gap backlog

Indexed UI vs API vs DB gaps (**G-01…G-36**): [../frontend/gaps-and-solutions.md](../frontend/gaps-and-solutions.md).

## Current system (as built)

How pages talk to the API today: [../frontend/system-architecture.md](../frontend/system-architecture.md). **Auth is NestJS from Phase 1** ([ADR-005](../architecture/decisions/ADR-005-authentication.md) Option C). Remaining product data access still follows [ADR-011](../architecture/decisions/ADR-011-rls-storage-strategy.md) until Phase 2 Nest APIs replace direct client Postgres/PostgREST.
