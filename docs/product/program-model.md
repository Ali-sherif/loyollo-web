# Program model (independent programs)

**Date:** 2026-08-18  
**Status:** DECIDED — independent programs, one `ACTIVE` default, deferred POS migration (not shipped). **Supersedes** the 2026-08-17 Shop-capability lock (at most one Points / Visit / Tier config, one membership per Shop).  
**Audience:** Product, UI/UX, QA, backend  
**Does not authorize** schema, APIs, or Next.js implementation ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md), [ADR-016](../architecture/decisions/ADR-016-independent-programs.md)).

**Sources of truth to keep in sync:** [counter-qr-and-program-membership.md](./counter-qr-and-program-membership.md) · [reward-redemption-flow.md](./reward-redemption-flow.md) · [loyalty-page.md](../frontend/loyalty-page.md) · [data-contract.md](../backend/data-contract.md) · [api-contract.md](../backend/api-contract.md)

Cross-ref (do not duplicate full state machines here):

- Catalog redeem: [reward-redemption-flow.md](./reward-redemption-flow.md)
- Signup vs Referral: [loyalty-page.md](../frontend/loyalty-page.md#signup-bonus-vs-referral-bonus-decided)

---

## 1. Shop vs program

A **Shop** is the merchant (`owner_id` / `profiles` today — **no** `shops` table from this file). A Shop may own **many independent loyalty programs**.

**At most one program is `ACTIVE` (the default)** at a time. Counter QR and referral invitation links resolve **only** to that ACTIVE program.

A **program** is a full loyalty configuration with its own type, rules, catalog, and wallets:

| `program_type` | What it is |
| -------------- | ---------- |
| `points` | Numeric balance via a **currency-to-point earn rate**; spent on that program’s catalog |
| `visit` | Stamp counter toward a completion reward |
| `tier` | Time-bound **milestones** (Bronze / Silver / Gold) with one-time payouts — [PM-08](#pm-08--tier-metric-two-counters) |

These **are** independent programs (two Points programs over time is valid). Only one may be `active`. Others are `draft`, `archived`, `disabled`, `expired`, or later `soft_deleted`.

```text
Shop  (owner_id / profiles)
├── Program A  archived  (locked members still on it until migrate/expiry)
├── Program B  ACTIVE    ← counter QR + referral links
└── Program C  draft
```

**Storage (backend-owned):** keep `loyalty_programs` rows as programs. **Drop** `UNIQUE (owner_id)` and **do not** use `UNIQUE (owner_id, program_type)`. Target: **partial unique one ACTIVE per Shop** — `UNIQUE (owner_id) WHERE status = 'active'`. Treat `shop_id` in indexes as `owner_id` until a formal shop row exists.

---

## 2. Program statuses

Stored names: `draft` · `active` · `archived` · `disabled` · `expired` · `soft_deleted`. Do not use other spellings.

| Status | Meaning |
|--------|---------|
| **`draft`** | Not live. New customers cannot join. |
| **`active`** | The Shop default. QR and `?ref=` land here. At most one per Shop. |
| **`archived`** | Hidden from new customers. Existing enrolled members + PENDING claims stay functional. Switching default ACTIVE archives the previous ACTIVE (allowed with members). |
| **`disabled`** | Turned off. Blocked while members/PENDING/unexpired — [mutation guards](#7-mutation-guards-phase-1). |
| **`expired`** | `expires_at` lapsed (program end-of-life). Distinct from in-program **tier period** reset. |
| **`soft_deleted`** | Emergency later-phase only — not Phase 1. |

`archived` is **not** disable/draft/delete.

---

## 3. Program types (v1)

**v1 scope:** in-store transactions only. Do not design delivery / online earning in this phase.

### Points

Earned from a **purchase amount** on a paid invoice / POS / cashier-entered purchase, using the program’s conversion rate (example: every 100 spend units = 10 points). Integer division; remainder backend-owned.

Points **require** a purchase amount. A QR/check-in with no ticket does **not** award points.

**Minimum spend to earn:** ticket floor. No points when the paid invoice is below this amount.

**Earn vs display currency:** the conversion rate is a **program rule**. Shop `profiles.currency` is **display metadata only** (symbol/label). Changing shop currency must **not** convert historical `*_cents`, points, or vouchers. Each `orders` / `points_ledger` row stores `currency_code` at write time.

**Prospective edits:** changing the earn rate applies to **new** transactions only ([§14.1 snapshot](./reward-redemption-flow.md#141-reward-snapshot-prospective-edits-versions)).

### Visit

Stamp counter per qualifying in-store visit. Optional **minimum invoice** floor. At the target count the program grants a completion reward and the counter **resets** (v1). Configurable: `max_visits_per_day`, weekend multipliers.

### Tier (time-bound milestones)

Not standing VIP. Not continuous perks. Not grace / downgrade protection (`tierDowngradeProtection` is **not** a product flag).

Merchant sets **`tier_reset_period`** (e.g. 6 months, 1 year). Bronze / Silver / Gold are **thresholds**. Hitting a threshold in the current period pays that tier’s **one-time** voucher or bonus points (once per period). Display “highest milestone this period” as progress only.

**Hard reset** at period end (scheduled job, not POS-gated): `period_points_earned` and displayed milestone → `0`; new period on the **same** program. Does **not** zero `spendable_points`. Does **not** migrate the member to a different ACTIVE program.

**Period reset vs program end-of-life**

| Event | Effect |
| ----- | ------ |
| Campaign **period** ends (`tier_reset_period`) | Hard reset **inside** this program; members stay enrolled |
| Program **expires / archived** and Shop has a different `ACTIVE` | Deferred POS **migration** ([counter QR](./counter-qr-and-program-membership.md)) |

---

## PM-08 — Tier metric (two counters)

**RESOLVED.** Ladder reads **`period_points_earned` only**.

| Counter | Field | Earn (POS / invoice) | Redeem / voucher | Period end (`tier_reset_period`) |
| ------- | ----- | -------------------- | ---------------- | -------------------------------- |
| Ladder input | `period_points_earned` | **Increment** | **Unchanged** | Reset to `0` (with tier status) |
| Wallet | `spendable_points` | Increment (issued lots) | **Decrement** (reserve then consume) | **Not** cleared by the tier period job |

**Forbidden:** `assign_customer_tier` (or any ladder writer) reading `spendable_points`, Available, or Reserved. Redeem cannot cause a mid-period downgrade because the period counter never falls.

Do not use lifetime-across-periods totals.

---

## 4. Customer membership and wallet

- One **customer identity** per Shop (phone unique per Shop when present; [soft-delete](#8-customer-soft-delete--phone)).
- **`enrolled_program_id`:** the locked program. Changing Shop ACTIVE does **not** move them.
- At most one **active** membership per customer per Shop. Legacy programs: membership `archived`; balances **ARCHIVED** (non-spendable, visible under Archived History). Unused points/stamps are **not** converted into the new program.
- After POS migration: new program starts at **0** + that program’s **Sign-up Bonus** if enabled.

Wallet: current enrolled program card + Archived History. Never mix balances across Shops.

**Signup Bonus:** once per **program enrollment** (including auto-migrate), not once per Shop lifetime. Referral (`?ref=` + OTP) can stack on that enroll. Referrer grant still waits for first **paid** invoice.

---

## 5. Deferred POS migration

Trigger is **cashier scan of the customer QR**, not the merchant flipping ACTIVE.

Migrate in one transaction when **both**:

1. Shop `ACTIVE` ≠ `enrolled_program`, **and**
2. **(target met and that redemption `completed`)** **or** **`enrolled_program.expires_at <= now()`**

**Target (write explicitly):**

- **Visit:** stamp goal reached **and** completion redemption `completed`.
- **Points:** `goal_reward_id` redemption `completed` if set; otherwise migrate on **program expiry only**.
- **Tier:** program expiry / archive only. Hitting Gold does **not** migrate off the program.

Then: archive leftover balances (non-spendable) → enroll into current ACTIVE at 0 → Sign-up Bonus if enabled → continue cashier bill + invoice on the **new** program.

If not eligible: award using **locked enrolled program** rules.

---

## 6. In-store cashier (Phase 1 staff POS)

Not Square/Clover/Toast (those stay deferred — UX-19). Phase 1 is the **staff POS app**:

1. Cashier scans **customer QR**.
2. Indexed check `(owner_id, program_id, is_active)` + migration eligibility.
3. Load profile (migrate only if eligible).
4. Cashier enters **Bill Amount** and **Invoice Number**.
5. Calculate points/stamps from the **locked** program (after migrate decision), update ledger, success.

Idempotency: `idempotency_key` and/or `(shop_id, invoice_number)`.

---

## 7. Mutation guards (Phase 1)

**Block `DELETE`, `DISABLE`, and `DRAFT`** on a program or reward when any of:

1. Incomplete participating members **and** program not expired
2. `expires_at` is null or in the future **and** members exist
3. `EXISTS` pending claims (`customer_rewards.status = 'pending'`)

**Allow** only if no PENDING claims **and** (`members == 0` **or** expiration lapsed **or** 100% completed target and fully redeemed). After expiry, archive remaining memberships in the same transaction before delete.

**Allowed without that bar:** `ARCHIVE`. Switching default ACTIVE archives the previous program.

UI on 409: counts (`pending_claims`, `incomplete_members`, `expires_at`) and **Wait** vs **Archive/Deactivate**.

**Later phase (specified, not Phase 1):** force `soft_deleted` → cancel PENDING → auto-refund reserved points → notify. Not a general `COMPLETED → REVERSED` path.

---

## PM-07 — Referral reward type when Points is off

**RESOLVED.** `is_points_enabled` is true iff the Shop’s current **ACTIVE** program has `program_type = 'points'`. Archived points programs do not count.

```text
IF referral_reward_type == 'points' AND is_points_enabled == false
  → HTTP 400 { code: REFERRAL_POINTS_REQUIRES_POINTS_ENABLED }
```

Applies independently to referrer and referee. When points are off, both sides must be **`voucher`** (supersedes enroll kind `discount` as the writer enum). Activating a non-points program while stored kinds include `points` is the same 400.

---

## PM-06 — Customer OTP security limits

**RESOLVED.** Customer SMS/WhatsApp OTP (join, login, recovery):

| Control | Value | On breach |
| ------- | ----- | --------- |
| Failed guesses per challenge | **3** | Invalidate OTP; **400** `OTP_MAX_ATTEMPTS_EXCEEDED` |
| Resend cooldown | **60s** per phone | **429** `OTP_RESEND_COOLDOWN` + `retry_after_seconds` |
| Daily send cap | **5 / 24h rolling** per phone | **429** `DAILY_OTP_LIMIT_REACHED` + `retry_after_seconds` |
| Challenge TTL | **180 seconds** | Verify after TTL → expired; do not count as a guess on a dead challenge |

Keyed by E.164 **phone**, not IP. [ADR-012](../architecture/decisions/ADR-012-public-enrollment-rate-limiting.md) IP limits may coexist. UI **must** use `retry_after_seconds` / `expires_at` — no hardcoded 60s or 3 min.

Canonical: `POST /auth/otp/send`, `POST /auth/otp/verify`. `POST /api/join/otp/request` is an alias.

---

## PM-18 — Hide Scheduled Automations (Phase 1)

**RESOLVED (Phase 1 Scope: Hidden)** with DG-10 and the G-09 **automations** bullet. Hide Scheduled Automations on `/app/campaigns`. Writes to `campaign_automations` → **503** `AUTOMATIONS_NOT_AVAILABLE_PHASE1` (or 404). Do **not** hide campaign list / Launch. G-09 send/opens stay deferred.

---

## UX-75 — New-phone onboarding required fields

**RESOLVED (Strict Requirement Model).** After successful OTP for a **new** phone:

| Field | Rule |
| ----- | ---- |
| `full_name` | Required, non-empty (enroll `name` is an alias) |
| `email` | Required, valid format |
| `birth_date` | Required, ISO date |

Merchant settings cannot mark these optional. Enroll **400** `ENROLL_VALIDATION_FAILED` with per-field `details`. UI: asterisks + stay on form. `gender` / `city` / `custom_field_value` stay optional (G-17). Returning check-in and UX-76 (profile already complete) skip this form.

---

## 8. Customer soft-delete & phone

Never **HARD DELETE** customer accounts or referral rows. Soft-delete: `status = deleted` (member `churned` remains an engagement label, not this path).

Retain **phone E.164** to block delete/re-register referral abuse (`UNIQUE (referred_id)` stays lifetime). GDPR erasure: purge profile fields; store phone as salted **SHA-256** `phone_hash`; keep uniqueness.

---

## 9. Related locks (do not duplicate)

| Topic | Canonical doc |
| ----- | ------------- |
| Independent programs / one ACTIVE / ADR-016 | This file · [ADR-016](../architecture/decisions/ADR-016-independent-programs.md) |
| Counter QR, POS migrate, cashier | [counter-qr-and-program-membership.md](./counter-qr-and-program-membership.md) |
| Redeem + snapshot + PM-04 | [reward-redemption-flow.md](./reward-redemption-flow.md) |
| Schema / write rules | [data-contract.md](../backend/data-contract.md) |
| HTTP | [api-contract.md](../backend/api-contract.md) |
