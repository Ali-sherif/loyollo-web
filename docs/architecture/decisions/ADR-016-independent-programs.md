# ADR-016: Independent Programs (one ACTIVE default)

## Status

DECIDED (2026-08-18)

## Context

On 2026-08-17 the product lock was **Shop-capability**: one loyalty system per Shop with at most one Points, one Visit, and one Tier config (`UNIQUE (owner_id, program_type)`), one membership/wallet/catalog per Shop, and a Shop QR with no program picker. That superseded a 2026-08-16 pending item that allowed multiple ACTIVE programs.

Product Owner (2026-08-18) **overturned** that capability lock (Option B). A Shop may own **many independent programs**. Exactly one may be `ACTIVE` (the default). Counter QR and referral links resolve only to that ACTIVE program. Existing members stay **locked** on `enrolled_program` until deferred POS migration fires.

Related Product Owner locks in the same pass (documented in [program-model.md](../../product/program-model.md), not duplicated as separate ADRs):

- **PM-08** — tier metric is `period_points_earned`, not spendable wallet
- **PM-07** — referral `points` forbidden unless `is_points_enabled`
- **PM-04** — reserved lots locked for the 10-minute QR TTL
- **PM-06** — customer OTP 3 / 60s / 5 per 24h / 180s
- **PM-18** — hide campaign automations in **Product MVP (Ship 1)**
- **UX-75** — `full_name`, `email`, `birth_date` required on new-phone enroll
- **§14.1** — `reward_snapshot` at Redeem create; program edits prospective; material catalog changes = new reward version

## Options

1. Keep Shop-capability (one of each type, one membership per Shop) — **rejected**.
2. Independent programs, one ACTIVE default, deferred member migration — **chosen**.
3. Immediate force-migrate every member when the merchant switches ACTIVE — **rejected**.

## Decision

- Drop target `UNIQUE (owner_id, program_type)` and today’s `UNIQUE (owner_id)`.
- Partial unique: **at most one** `loyalty_programs` row with `status = 'active'` per Shop (`owner_id`).
- Statuses: `draft` | `active` | `archived` | `disabled` | `expired` | `soft_deleted` (soft_deleted = later-phase emergency only).
- Activating program B atomically archives the previous ACTIVE (allowed with members). `archived` is not disable/draft/delete.
- Customer identity remains one per Shop (phone unique when present). Membership is **program-scoped**; at most one active membership per customer per Shop.
- Schema, APIs, and Prisma migrations remain backend-owned ([ADR-014](ADR-014-product-data-ownership.md)). This ADR does **not** authorize frontend-repo migrations.

Canonical product: [program-model.md](../../product/program-model.md). QR / POS: [counter-qr-and-program-membership.md](../../product/counter-qr-and-program-membership.md). Contracts: [data-contract.md](../../backend/data-contract.md), [api-contract.md](../../backend/api-contract.md).

## Consequences

- `/app/loyalty` is a **program list** with one Default/ACTIVE, not three capability sections (overturns UX-10 “not a program list” and G-35 as previously framed).
- Catalog, wallet, ledger, earn, and referrals are **program-scoped**. Campaigns stay Shop-scoped.
- Signup bonus fires on **each new program enrollment** (including post-migration), not once per Shop lifetime.
- Next.js migration ADRs 001–015 are unchanged. D-36 tracks this ADR in the decision matrix.

## Verification

- No remaining “DECIDED: Shop capabilities / UNIQUE (owner_id, program_type) / one membership per Shop” as the **current** lock (historical 2026-08-17 text may be marked superseded).
- Partial unique one ACTIVE per Shop is specified in the data contract.
- Deferred-decisions rows for capability model, tier metric, tier downgrade, referral-points-when-off, and redemption §14 are flipped to DECIDED or rejected as in [deferred-decisions.md](../deferred-decisions.md).
