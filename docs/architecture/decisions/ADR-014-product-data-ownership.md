# ADR-014: Product Data Ownership and UI Honesty

## Status

DECIDED

## Context

The authenticated product UI (`/app/*`) advertises metrics and flows that have no backing table, writer, or API: orders/revenue, visit/QR event logs, assigned tiers, per-branch attribution, referrals attribution, redeem vs earn, billing enforcement, header search, and campaign open/automation workers. These gaps are catalogued as **G-01…G-32** in [gaps-and-solutions.md](../../frontend/gaps-and-solutions.md).

[ADR-006](ADR-006-server-boundaries.md) keeps the existing backend as the primary API; Next.js must not become a second backend. [ADR-011](ADR-011-rls-storage-strategy.md) freezes Lovable-era schema/RLS for Phase 1 (frontend migration) and assigns all data/storage access to a **custom Backend and Database program** in Phase 2.

Shipping new product tables from this frontend repo (or writing them from Next BFF handlers) would violate those decisions and expand migration risk.

## Decision

### Ownership

- Any **new table** required to close product gaps — including but not limited to `orders`, `visit_events`, `points_ledger`, `referrals`, `otp_verifications`, `vouchers`, `campaign_jobs` — is owned by the **backend / database program** (ADR-011 Phase 2).
- Any **new column** on existing tables required for the same gaps — including but not limited to `branch_id` on customers/events/redemptions/orders, `customers.tier_id`, `rewards.cost_cents`, `customer_rewards.order_id` — is owned by that same program.
- Agents and engineers **must not** add Supabase migrations for these gaps in this frontend repo, and **must not** introduce Next Route Handlers or Server Actions whose primary job is to own that persistence.
- Authoritative contracts live under [`docs/backend/`](../../backend/README.md): [data-contract.md](../../backend/data-contract.md), [api-contract.md](../../backend/api-contract.md), [remediation-roadmap.md](../../backend/remediation-roadmap.md).
- Phase 2 implements those contracts on **NestJS 11.x + Prisma 7.x + PostgreSQL 18.x** ([ADR-015](ADR-015-backend-stack.md)). Prisma migrations belong to the backend program, not this frontend repo.

### UI honesty policy

Until the backend program delivers the fact behind a widget:

1. Render `"—"` (or an empty/honest empty state), **or** hide/disable the control.
2. Do **not** invent even-split donuts, proxy metrics under misleading labels, or hardcoded zeros that look like measured values.
3. Presentational-only honesty fixes in this repo (relabel, hide, fix copy, fix `at-risk` vs `at_risk` strings) are allowed and owned by Frontend. They do not require schema changes.
4. Closing a gap marked `DEFERRED-BACKEND` requires the backend program to land the contract piece and the frontend to wire to it — not a silent client-side fake.

### Relationship to locked ADRs

- Reinforces [ADR-006](ADR-006-server-boundaries.md): Next orchestrates; it does not own business persistence for these domains.
- Completes the product-side reading of [ADR-011](ADR-011-rls-storage-strategy.md) Phase 2: the remediation roadmap is the approved data initiative trigger for deferred DB redesign / payment work.
- Does not change [ADR-013](ADR-013-campaign-messaging-runtime.md): campaign workers remain outside Next; `campaign_jobs` (or equivalent) belongs to backend/messaging.

## Consequences

- Frontend migration and TanStack/Lovable retirement gates are **unaffected** by this ADR.
- Gap backlog IDs **G-01…G-32** stay stable; Status/Owner/Phase live in [gaps-and-solutions.md](../../frontend/gaps-and-solutions.md).
- Decision matrix rows **D-33** (data model ownership) and **D-34** (UI honesty) track this ADR. **D-35** tracks the Phase 2 stack ([ADR-015](ADR-015-backend-stack.md)).

## Verification

- No migration in `supabase/migrations/` introduces `orders`, `visit_events`, `points_ledger`, `referrals`, or `campaign_jobs` as a frontend-only fix without an explicit user override of this ADR.
- New Next BFF routes for product CRUD only exist where ADR-006 already justifies BFF mediation, and they call backend contracts rather than inventing schema.
- Page docs’ Gaps sections cite G-IDs and link to `docs/backend/` rather than inventing parallel schemas.
