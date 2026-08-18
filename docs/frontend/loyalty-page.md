# Loyalty Program Page (`/app/loyalty`)

Reference for all components, conditions, and edge cases on the Loyalty Program route (create + edit). **Today** this is the owner’s single `loyalty_programs` row (`UNIQUE owner_id`). **DECIDED (2026-08-18):** **independent programs** — many programs per Shop, **at most one `ACTIVE`**, customer locked to `enrolled_program` until deferred POS migration ([program-model.md](../product/program-model.md) · [ADR-016](../architecture/decisions/ADR-016-independent-programs.md)). **Supersedes** the 2026-08-17 Shop-capability lock. Counter QR + `?ref=` resolve **only** to ACTIVE. **DECIDED:** catalog redeem is pending + `reward_snapshot` + reserved points + staff **QR verification** ([redemption](#reward-redemption-lifecycle-decided)); §14.1 snapshot and PM-04 lot expiry are **closed**. Covers the four tabs, program types, QR join URL, and a [UI / API / DB gap analysis](#gaps-ui--api--db-and-recommended-solutions).

**Jump to:** [route](#route-structure) · [page flow](#high-level-page-flow) · [independent programs](#independent-programs-decided) · [counter QR](#counter-qr--shop-membership-decided) · [one program today](#one-owner--one-loyalty-program-today) · [tabs](#tabs) · [points](#points-system) · [visit](#visit-based) · [tier](#tier-based) · [save](#save--upsert) · [qr](#qr-on-the-programs-tab) · [rewards](#rewards-tab) · [referrals](#referrals-tab) · [referral rewards](#referral-rewards-decided) · [signup vs referral](#signup-bonus-vs-referral-bonus-decided) · [referral fraud](#referral-fraud-controls-decided) · [otp](#otp-verification-decided) · [customer wallet](#customer-wallet-per-shop-decided) · [reward progress](#reward-progress-on-the-card-decided) · [redemption](#reward-redemption-lifecycle-decided) · [qr experience](#qr-experience-tab) · [join](#public-join--check-in) · [gaps](#gaps-ui--api--db-and-recommended-solutions)

**Source files:**

- Route entry: `src/app/app/(shell)/loyalty/page.tsx`
- Feature implementation: `src/features/loyalty/loyalty-page.tsx`
- Tiers: `src/components/loyalty/TierBasedFlow.tsx`, `src/components/loyalty/TierSection.tsx`
- Visit UI: `src/components/loyalty/VisitsProgressSection.tsx`, `src/components/loyalty/StampCardPreview.tsx`
- Rewards: `src/components/loyalty/RewardsSection.tsx`
- Referrals: `src/components/loyalty/ReferralsSection.tsx`
- QR page builder: `src/components/loyalty/QRExperienceSection.tsx`
- Public join: `src/features/join/join-page.tsx`, `src/lib/server/join-service.ts`, `/api/join/program`, `/api/join/enroll`
- Unique owner constraint: `supabase/migrations/20260713174353_034cd3b0-2acb-430d-b1d9-14efe9174840.sql`
- Related: [customers-page.md](customers-page.md), [analytics-page.md](analytics-page.md), [dashboard-page.md](dashboard-page.md), [program-model.md](../product/program-model.md), [counter-qr-and-program-membership.md](../product/counter-qr-and-program-membership.md), [reward-redemption-flow.md](../product/reward-redemption-flow.md)

---

## Route structure

```tsx
// src/app/app/(shell)/loyalty/page.tsx
"use client";

import LoyaltyPage from "@/features/loyalty/loyalty-page";

export default function Page() {
  return <LoyaltyPage />;
}
```

Approved URL: `/app/loyalty`. Legacy `/loyalty-program` maps here. Tab is a query string (`?tab=rewards`), parsed client-side from `window.location.search` (not Next `searchParams`).

Valid tabs: `programs` (default) \| `rewards` \| `referrals` \| `qr-experience`.

---

## High-level page flow

```mermaid
flowchart TD
  A[Server: requireUser] --> B[Client: LoyaltyPage mounts]
  B --> C{loading?}
  C -->|yes| D[Spinner]
  C -->|no| E{user?}
  E -->|no| F[Redirect /signin]
  E -->|yes| G{isVerified?}
  G -->|no| H[Redirect /verify]
  G -->|yes| I[Fetch profile]
  I --> J{onboarding_completed?}
  J -->|no| K[Redirect /onboarding]
  J -->|yes| L[loyalty_programs where owner_id]
  L --> M{row exists?}
  M -->|no| N[Blank create form, programId=null]
  M -->|yes| O[Prefill all fields, programId set]
  N --> P[DashboardShell + tabs]
  O --> P
```

The same page is **create and edit**. There is no dedicated management overview (TODO in source).

---

## Independent programs (DECIDED)

**A Shop may own many independent programs.** **At most one is `ACTIVE` (the default).** Canonical: [program-model.md](../product/program-model.md) · [ADR-016](../architecture/decisions/ADR-016-independent-programs.md). Schema/API are backend-owned ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)). Gap: [G-35](gaps-and-solutions.md#g-35--shop-loyalty-is-one-row-not-one-config-per-capability).

This **supersedes** the 2026-08-17 Shop-capability lock (at most one Points / Visit / Tier config; `UNIQUE (owner_id, program_type)`).

Program statuses: `draft` · `active` · `archived` · `disabled` · `expired` · later `soft_deleted`. Join/check-in is available when the Shop has an **`active`** program. Counter QR and `?ref=` resolve **only** to ACTIVE.

**Today vs intended**

| | Today | Intended |
|--|--------|----------|
| How many rows | One per `owner_id` (`UNIQUE`) | **Many** per Shop. **Partial unique:** one `status = 'active'` per `owner_id`. **Do not** use `UNIQUE (owner_id, program_type)` |
| Status | None (the one row is always “the” program) | `draft` \| `active` \| `archived` \| `disabled` \| `expired` |
| Save | `upsert` on `owner_id` (overwrite) | Insert/update **that** program; activating B **archives** previous ACTIVE (allowed with members) |
| Join | `/join/{programId}` identifies the one row | Shop QR → **ACTIVE** program. Customer **locked** to `enrolled_program` until POS migrate. [counter QR](#counter-qr--shop-membership-decided) |

Customers have **one identity per Shop**. Catalog, wallet, ledger, earn, referrals = **program-scoped**. Campaigns stay Shop-scoped. `/app/loyalty` is a **program list** (UX-10/UX-13), not three capability toggles.

**Create-flow guidance (admin UI):** create independent programs (two Points programs over time is valid). Only one may be ACTIVE. Mutation guards + 409 Wait vs Archive: [program-model.md](../product/program-model.md). Happy Hour–style multipliers remain **earning rules inside a Points program**.

**Not locked:** who besides `admin` can edit programs (`staff` has the same `/app` permissions for now); exact Shop QR path (`/join/shop/{shopSlug}` vs keep today’s UUID); how earning **rules** are stored (backend-owned). Staff subtypes remain open.

Product note: [program-model.md](../product/program-model.md) · [product-manager-meeting-report.md](../product-manager-meeting-report.md) · [counter-qr-and-program-membership.md](../product/counter-qr-and-program-membership.md).

---

## Counter QR + Shop membership (DECIDED)

**Status:** independent programs + deferred POS migration (not shipped). Shop QR **always** resolves to the Shop’s **current ACTIVE** program — there is **no picker**. **Full lock:** [counter-qr-and-program-membership.md](../product/counter-qr-and-program-membership.md). Schema/API/Next routes are backend-owned ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

| Scope | What it identifies | What it must not do |
| ----- | ------------------ | ------------------- |
| **Shop QR** | The Shop’s **ACTIVE** program | Enroll into archived/draft; show a program picker |
| **Membership** | Customer identity per Shop + **locked** `enrolled_program` | Mix balances **across Shops**; convert archived points into ACTIVE |

Scan Shop QR → land on **ACTIVE** → enroll or check in. If no program is `active` → unavailable. First scan of a Shop the account is not in → create identity + enroll ACTIVE. Returning scan → check-in (and cashier POS migrate check when enrolled ≠ ACTIVE).

Rewards on the Rewards tab stay **that program’s catalog**. Catalog redeem is pending → staff QR scan (verification, not approval) with point reservation ([redemption](#reward-redemption-lifecycle-decided)).

Personal `?ref=` shares use the Shop’s **ACTIVE** join URL. Referral never creates a second Shop identity (`UNIQUE (referred_id)` lifetime).

---

## One owner · one loyalty program (today)

`loyalty_programs.owner_id` is unique. Saves use:

```ts
.upsert(payload, { onConflict: "owner_id" })
```

There is no program list, archive, or second type. Changing `program_type` after customers exist is allowed in the UI (“You can change this anytime”) but **does not migrate** points/visits/tiers.

**Target:** drop `UNIQUE (owner_id)` and **do not** add `UNIQUE (owner_id, program_type)`. Partial unique one ACTIVE per Shop (G-35).

---

## `LoyaltyPage` — root component

### State (high level)

| Area | State |
|------|--------|
| Identity | `firstName`, `businessName`, `ready`, `programId` |
| Type | `programType`: `"points"` \| `"visit"` \| `"tier"` |
| Points rules | `spendAmount`, `pointsEarned`, `minSpend`, `pointsExpiry`, `gracePeriod`, `bonusSignup`, `doubleBirthdays` |
| Visit rules | `visitsRequired`, `rewardOnCompletion`, `minSpendPerVisit`, `cardExpiryDays`, `maxVisitsPerDay`, `afterRewardAction`, `bonusStampSignup`, `doubleStampWeekends`, `notifyOneVisitAway` |
| Tier rules | `tierMeasuredBy`, `tierResetPeriod`, `notifyTierUpgrade`, `tierDowngradeProtection`, `tiers[]` |
| QR | `qrDataUrl`, `totalScans`, `scansThisWeek` (always 0) |
| Visit stats | `stampsIssuedThisMonth`, `cardsCompleted`, `customersOneVisitAway` (always 0) |

### Data loading

1. `profiles` — `full_name, business_name, onboarding_completed`
2. `loyalty_programs.select("*")` where `owner_id = user.id`
3. If found, copy every column into form state
4. `reloadTiers()` — `loyalty_program_tiers` ordered by `points_threshold`

QR PNG is generated in the browser (`qrcode`) from `{origin}/join/{programId}` (**today** — the only row’s id). Intended: Shop / door QR identifies the **Shop** ([counter QR](#counter-qr--shop-membership-decided)). Exact URL is backend-owned.

Scan and visit analytics effects **set zeros** and never query (TODOs in source).

---

## Tabs

| Tab | Content |
|-----|---------|
| Programs | Type picker + rules form + QR sidebar + type-specific extras |
| Rewards | `RewardsSection` catalog CRUD |
| Referrals | `ReferralsSection` settings + empty leaderboard |
| QR Experience | `QRExperienceSection` join-page branding |

Rewards / Referrals / QR call `ensureProgramSaved()` so a **tier** program can be auto-inserted (minimal `program_type: "tier"` upsert) before those tabs write child rows. Points/visit programs are **not** auto-saved that way unless the owner already has a row.

---

## Points system

**Intended (DECIDED, v1 in-store):** the Shop’s **Points capability** is a numeric balance earned via a **currency-to-point** conversion rate (example: every 100 EGP = 10 points) and **spent** on the Shop’s catalog rewards. Points require a purchase amount from a paid invoice / POS / cashier-entered purchase. Time-of-day / category multipliers (e.g. Happy Hour 3x) are **earning rules inside Points**, sharing one balance — not a second Points config ([program-model.md](../product/program-model.md)). No delivery / online channel logic in v1.

Required: `spendAmount > 0`, `pointsEarned > 0`. Optional: minimum spend, expiry months, grace months, bonus signup points, double points on birthdays.

**Minimum spend to earn (`minimum_spend`) — product intent:** ticket floor for Points. No points awarded when the paid invoice is **below** this amount. Parallel Visit gate: [Minimum invoice amount](../product/program-model.md#qualifying-visit--minimum-invoice-amount-min_spend_per_visit).

**What check-in actually uses** (`join-service` `recordCheckIn`):

- Adds `program.points_earned` to `customers.points` (flat, **not** `spend_amount` / ticket size)
- Does **not** enforce `minimum_spend` (no order amount on check-in)
- Does **not** apply expiry, grace, birthday double, or signup bonus

Signup bonus and birthday double are stored flags only.

**Intended (DECIDED):** every **issued** lot for this Shop writes `points_ledger.expires_at` from the Points capability’s `points_expiry_months` (0 = no expiry, `expires_at` null). Referral lots use `referral_settings.points_expiry_days` instead. Points never mix with another Shop. Customer view: [customer wallet](#customer-wallet-per-shop-decided).

---

## Visit based

**Intended (DECIDED, v1 in-store):** the Shop’s **Visit capability** is a counter incremented per qualifying in-store visit / check-in. **It does not require Points.** At the target count (e.g. 10 visits = free item) the Shop **grants a reward and the counter resets**. A Shop has **one** Visit config — not two punch cards as two programs ([program-model.md](../product/program-model.md)). No delivery / online channel logic in v1.

Required: `visitsRequired > 0`, `rewardOnCompletion` (select: free item / discount / custom — **string labels**, not a `rewards.id`).

Optional: **Minimum invoice amount** (`min_spend_per_visit`; UI label today “Minimum spend per visit”), card expiry days, max visits per day, after-reward action (`reset` \| `continue`), bonus stamp on signup, double stamp weekends, notify one visit away.

**Minimum invoice amount — product intent:**

| Setting | Effect |
| ------- | ------ |
| none / `0` | QR/check-in alone → +1 Visit |
| `> 0` (e.g. 200 EGP) | QR/check-in **and** purchase ≥ minimum → +1 Visit. Purchase below → no Visit |

Full lock: [program-model.md](../product/program-model.md#visit). Max visits per day and weekend multipliers remain configurable.

**Intended v1:** at the target count the counter **resets** (see above). Today’s `after_reward_action === "continue"` is stored UI, **not** the v1 product lock.

**What check-in actually uses:**

- Increments `customers.visits` (weekend double if `double_stamp_weekends`)
- `max_visits_per_day > 0` blocks a second stamp the same **UTC** day via `last_activity_at`
- When `visits >= visits_required`, inserts `customer_rewards` with `reward_name_snapshot` from `reward_on_completion` (`reward_id` null)
- `after_reward_action === "reset"` subtracts `visits_required` from `visits`

**Not used:** `min_spend_per_visit` (Minimum invoice amount — saved, **not** enforced until ticket amount exists), `card_expiry_days`, `bonus_stamp_signup`, `notify_one_visit_away`.

### Visit UI extras (always empty)

| Widget | Data |
|--------|------|
| Visit stats (stamps this month, cards completed, one visit away) | Hardcoded `0` |
| `VisitsProgressSection` | Intentionally returns `[]` — empty telescope state |
| Stamp card preview | Visual only from `visitsRequired` + reward label |

---

## Tier based

**Intended (DECIDED, v1 in-store, PM-08):** an independent **Tier program** is time-bound **milestones** (Bronze / Silver / Gold) with **one-time payouts**, not standing VIP / grace / `tierDowngradeProtection`. Ladder reads **`period_points_earned` only**, never spendable. Redeem does not decrement the period counter. `tier_reset_period` job zeros the period counter + displayed milestone — **not** spendable, **not** a POS migrate. Hitting Gold does **not** migrate the member. Canonical: [program-model.md PM-08](../product/program-model.md#pm-08--tier-metric-two-counters).

**Screen 1** (`tiers.length === 0`): `TierBasedFlow` template picker. Selecting a template or “custom” calls `ensureProgramSaved()` then inserts `loyalty_program_tiers` rows.

**Screen 2**: rules (`tier_measured_by`, `tier_reset_period`, notify upgrade, downgrade protection) + `TierSection` CRUD + QR sidebar + **Tier stats** (each tier member count hardcoded `"0"`).

`MembersCloseToUpgradingPanel` uses an empty array; **Send Upgrade Nudge** would toast success if the list were non-empty.

**What check-in actually does for `program_type === "tier"`:** treats it like **visit** (increment visits, maybe earn `reward_on_completion`). It does **not**:

- Read `loyalty_program_tiers`
- Write `customers.tier`
- Apply `points_multiplier` / `bonus_percentage`
- Honor `tier_measured_by` or reset period

---

## Save / upsert

`buildProgramPayload()` zeros out columns that do not belong to the selected type, then upserts on `owner_id`. First save toasts “Your QR code is ready” and navigates to `/dashboard`. Later saves toast “Program updated” and also navigate to `/dashboard`.

Validation: points and visit required fields; **tier type has `canSubmit === true`** with no extra field checks (tiers live in a child table).

---

## QR on the Programs tab

When `programId` exists: PNG, join URL, Download PNG, Print PDF (popup), Share (`navigator.share` or clipboard). **Today** that URL is `/join/{programId}` (the one row). Intended Shop / door QR identifies the Shop ([counter QR](#counter-qr--shop-membership-decided)).

`Total scans` / `Scans this week` are always `"0"`. There is no `qr_scan_events` table. Opening `/join/{id}` does not increment a counter.

---

## Rewards tab

`RewardsSection` loads `rewards` for `programId`. CRUD: name, description, icon, `point_cost`, `monthly_limit`, `status` (`live` / paused), `sort_order`, `redeemed_count`.

| Action | DB |
|--------|-----|
| Create / edit | `insert` / `update` |
| Pause / live | `status` update |
| Delete | `delete` |
| Export PDF | Client `jspdf` of the catalog |

Reward performance dialog: `redeemed_count` is real; **revenue and per-tier redemption counts are 0**. Check-in can insert `customer_rewards` and increment nothing on `rewards.redeemed_count` unless some other path does (join-service earn path does **not** bump `redeemed_count` — it inserts `status: "earned"`, not redeemed). **Intended:** catalog redeem is `pending` → `completed` (staff QR scan) / `expired` (10-minute job) ([redemption](#reward-redemption-lifecycle-decided)); only `completed` increments `redeemed_count`. **Gap:** no lifecycle shipped; previous spec was staff approve/reject — do not implement that.

---

## Referrals tab

Reads/writes `referral_settings` (one row per Shop): `enabled`, `referrer_bonus_points`, `new_customer_discount_pct`.

**Top referrers** is a hardcoded empty array. Join enroll does **not** accept a referral code or write a referral event. Settings are stored only.

**Intended (DECIDED):** both parties are rewarded; share is a personal **link** or **QR**; points vs **voucher**; both expire. See [referral rewards](#referral-rewards-decided). **PM-07:** `points` kind only when ACTIVE is a points program. Schema/API are backend-owned ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)). Gap: [G-14](gaps-and-solutions.md#g-14--referrals-settings-without-attribution).

---

## Referral rewards (DECIDED)

**Status:** DECIDED (not shipped). **Today** the Referrals tab only saves settings; enroll ignores `ref`.

Both the **referred** (new) member and the **referrer** (existing) member receive a reward. Timing and form are fixed:

| Party | When granted | If kind = **points** | If kind = **discount** |
|-------|----------------|----------------------|------------------------|
| **Referred** (new) | Successful **new** enroll/register **after OTP verify** with a valid `?ref=` / code | Credit wallet **immediately** (`points_ledger`, `expires_at` required) | Issue a **`vouchers`** row (`active`, `expires_at`) they redeem later — not an automatic % on join or the current cart |
| **Referrer** (existing) | Referred member’s **first paid invoice** (`Invoice.Paid` / `orders.paid_at`) | Credit wallet **then** (same lot rules) | Issue a **`vouchers`** row **then** (same redeem-later rules) |

**Share mechanic:** each member has a stable `customers.referral_code`. They share:

- a **link** `/join/{programId}?ref={referral_code}`, or
- a **QR code** that encodes that same URL

This personal QR is not the shop’s **counter** QR and is not a substitute for the Shop join QR. The customer sees **this Shop’s** link and QR on **that Shop’s wallet card** ([customer wallet](#customer-wallet-per-shop-decided)). Pixel layout is **not** locked; the facts are.

**Expiry:** every referral **point lot** and every referral **voucher** has `expires_at`. After that instant, points in that lot cannot be spent and the voucher cannot be redeemed. Durations: `referral_settings.points_expiry_days` and `voucher_expiry_days` (shop-configured; default day counts **not** locked). Non-referral lots in the same program follow `loyalty_programs.points_expiry_months`.

**Integrity:** OTP before any member row; hard database constraints plus device/IP review — see [OTP](#otp-verification-decided) and [referral fraud controls](#referral-fraud-controls-decided). Returning check-in with `?ref=` does not create a referral. Signup Bonus vs Referral Bonus: [section below](#signup-bonus-vs-referral-bonus-decided). Referral grants are **points-wallet or voucher**. **PM-07:** `referral_reward_type == 'points' AND !is_points_enabled` → **400** `REFERRAL_POINTS_REQUIRES_POINTS_ENABLED`. Non-points ACTIVE: **`voucher` only**.

Shop configures **kind per side** (`points` \| `voucher`; writer enum supersedes `discount`). Today’s columns map to defaults: referrer → points (`referrer_bonus_points`), referred → voucher (`new_customer_discount_pct`). Extra amount columns: [data-contract `referral_settings`](../backend/data-contract.md#referral_settings--both-party-kinds--expiry).

Writers: [data-contract write rule 12](../backend/data-contract.md#binding-write-rules) · [write rule 14](../backend/data-contract.md#binding-write-rules). Enroll: [api-contract join](../backend/api-contract.md#join--otp--enroll).

---

## Signup Bonus vs Referral Bonus (DECIDED)

**Status:** DECIDED (not shipped). Confirms and tightens the existing `signup_bonus` vs referral split. Canonical program scope: [program-model.md](../product/program-model.md). Referral timing, kinds, fraud, and `Invoice.Paid` referrer grant stay in [referral rewards](#referral-rewards-decided) — this section does not replace them.

Both bonuses are **Shop-scoped**. They never credit another Shop’s wallet.

| Bonus | When it fires | Independent of |
| ----- | ------------- | -------------- |
| **Signup Bonus** | **Each new program enrollment** (including POS migrate onto ACTIVE), not once per Shop | Referral. Fires whether or not `?ref=` was present, **if** that program has Signup Bonus configured |
| **Referral Bonus** | Requires a valid referral link/code (`?ref=`) **and** successful **OTP** verification | Signup. Referred-party grant is in the OTP-verified enroll transaction; **referrer** grant still waits for first **paid** invoice ([referral rewards](#referral-rewards-decided)) |

**Stacking:** if both are configured **and intentional**, they **can stack** on the same first join (Signup Bonus + referred-party Referral Bonus). Do not treat stacking as a bug. Returning check-in never fires either.

If **both** Points signup bonus **and** Visit signup stamp are configured, they **can both fire** on that first Shop join ([program-model.md](../product/program-model.md#5-signup-bonus-when-several-capabilities-are-enabled)).

**Welcome screens are UX only.** An existing customer joining a **new Shop** (UX-76 “Welcome & link Shop”) does **not** imply a bonus. Grant Signup Bonus only when **that Shop’s** Signup Bonus is configured. Pixel welcome copy must not promise points/stamps that the Shop does not award.

Today `bonus_signup_points` / `bonus_stamp_signup` are stored flags; join-service does not apply them (G-10). Intended writers still follow [write rule 12](../backend/data-contract.md#binding-write-rules) / ledger `reason = signup_bonus`.

---

## Referral fraud controls (DECIDED)

**Status:** DECIDED (not shipped). Backend-owned ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)). Schema: [data-contract `referrals`](../backend/data-contract.md#referrals).

These rules stack. OTP blocks fake numbers. The first-**paid**-invoice grant is the main economic control. DB constraints stop self-invite and duplicate attribution. Device/IP flags same-minute self-joins.

### 1. Referrer reward only after a real paid invoice

The **existing** member (referrer) is **not** granted at enroll. Points (or the referrer voucher) land **only** when the new member’s **first paid invoice** is recorded (`Invoice.Paid` sets `orders.paid_at`). An unpaid / draft `orders` row does **not** grant.

That condition alone removes most fake-referral value: the cheater does not profit until someone pays a real order. The referred (new) member can still receive their enroll grant immediately **after OTP**, as in [referral rewards](#referral-rewards-decided).

### 2. Database constraints (hard reject — no row)

The database **must refuse** the insert. Application code must not write a `rejected` row as a substitute.

| Constraint | Rule |
|------------|------|
| `CHECK (referrer_id <> referred_id)` | `referrer_id` (who invited) **cannot** be the same as `referred_id` (who was invited). Self-referral is impossible at the DB. |
| `UNIQUE (referred_id)` | A customer is attributed as referred **once in their lifetime**. They cannot be invited again. |

Returning check-in with `?ref=` still does not insert (already a member). Unique `referred_id` covers a second enroll attempt with a different code.

### 3. Device / IP matching → Pending Review

If the **invite** (join page opened with `?ref=`, or equivalent share open) and the **registration** (enroll/register) happen from the **same device** or the **same Wi-Fi / public IP**, **in the same minute**, the backend **does not treat the referral as clean**. It inserts the row with `status = pending_review` (**Pending Review**).

| Signal | How it is judged |
|--------|------------------|
| Same device | Enroll device fingerprint hash equals the invite-open (or referrer’s last known) device hash |
| Same Wi-Fi / network | Enroll hashed public IP equals the invite-open (or referrer’s last known) IP hash |
| Same minute | `date_trunc('minute', invite_at) = date_trunc('minute', enroll_at)` (UTC) |

Store **hashes** of IP and device fingerprint — not raw IPs in product logs. Fingerprint algorithm is backend-owned.

**While `pending_review`:** do **not** grant the **referrer**. A later first **paid** invoice must not auto-complete the grant. A reviewer (backend/admin; merchant UI **not** locked) either clears the row to `pending` (eligible — grant on first paid invoice, or immediately if `first_order_id` is already a paid order) or sets `rejected` (no referrer grant). The referred enroll grant is unchanged unless the reviewer rejects before it was issued.

Writers: [data-contract write rule 12](../backend/data-contract.md#binding-write-rules).

---

## OTP verification (DECIDED)

**Status:** DECIDED (not shipped). Backend-owned. Schema: [data-contract `otp_verifications`](../backend/data-contract.md#otp_verifications). APIs: [api-contract join](../backend/api-contract.md#join--otp--enroll).

A **new** customer (including a referred join) **must** complete OTP via **SMS** or **WhatsApp** during registration **before** any of these rows are finalized: `customers`, `referrals`, `points_ledger`, `vouchers`. Failed or skipped OTP → no member, no referral, no reward.

| Step | Allowed writes |
|------|----------------|
| Open `/join/{programId}?ref=` | Invite telemetry hashes only |
| `POST /auth/otp/send` (alias `POST /api/join/otp/request`) | Insert `otp_verifications` only. **PM-06:** 180s TTL; 60s resend; 5 sends / 24h per **phone** |
| `POST /auth/otp/verify` | 3 failed guesses → **400** `OTP_MAX_ATTEMPTS_EXCEEDED`; invalidate challenge |
| `POST /api/join/enroll` with valid OTP | Atomic: verify OTP → **UX-75** `full_name` + `email` + `birth_date` → `customers` + optional `referrals` + referred grant |
| Invalid / expired OTP | **No** member row |

Owner **Add Customer** does not use this OTP but **should collect** the same three UX-75 fields; phone may still be omitted. Returning check-in does not require a new OTP. Channel is `sms` \| `whatsapp`; provider stays adapter-stub until chosen ([17-messaging-templates.md](17-messaging-templates.md)). UI timers from `retry_after_seconds` — **do not hardcode** 60s / 180s. ADR-012 IP limits may coexist with phone caps.

Shop-customer self-register, login, and lost-access recovery (G-33) use the same OTP gate. Customers never set a password. [Credential recovery](11-authentication-migration.md#credential-recovery-decided).

---

## Customer wallet (per Shop, DECIDED)

**Status:** DECIDED (not shipped). Exact portal **URL** is still not locked ([G-33](gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows)). What the logged-in **`customer`** sees **is** locked.

Points, visits, and tier live on the **enrolled program** membership for that Shop. They never share a pool with **another Shop**. A customer may belong to **several Shops**; the wallet lists **one card per Shop** (enrolled program + **Archived History**) — never aggregate across Shops. Archived leftover balances are **non-spendable**.

Example that must stay true: **100** spendable points at Shop A and **200** spendable points at Shop B are **two wallets**. The UI must **not** show **300**. Archived points from a previous program on Shop A must **not** add into ACTIVE spendable.

### Each Shop card (required facts)

One card / row per Shop the account is a member of:

| Fact | Source |
|------|--------|
| Shop / business name | `profiles.business_name` (Shop identity) |
| **Spendable / available points** | Unexpired issued lots minus spends **minus points reserved by `pending` redemptions** for the **enrolled program**. `Available = Total − Reserved`. Distinct from **`period_points_earned`** (PM-08 ladder). Shown for points programs. |
| **Expiry** | If remaining lots share one `expires_at`, show that date. If mixed (e.g. check-in month vs referral days), group: amount + date per lot group. Never a single date that hides a sooner-expiring lot |
| Vouchers | `vouchers` for that program with `status = active`. `used` / `expired` = not redeemable; do not count as spendable points |
| Share **link** + **QR** | This Shop’s **ACTIVE** join URL with `?ref={referral_code}` |
| **Archived History** | Leftover balances from archived programs — **non-spendable**, not converted |
| **Reward progress** | Enrolled program only. Points: numeric **available** + progress to next catalog cost. Visit: stamps. Tier: highest **milestone this period** + remaining (PM-08). [customer-reward-progress.md](../product/customer-reward-progress.md) |

Pixel layout (sections vs tabs on the card; bar vs stamp row) is **not** locked. Combining balances or **progress** across Shops **is forbidden**. Do not use the merchant stamp-card preview as the customer view (it always fills 3 stamps).

Spend inside a Shop uses unexpired lots **FIFO** after reservations ([api-contract redeem](../backend/api-contract.md)). A `pending` redemption must not let available go negative.

Schema: [data-contract write rule 13](../backend/data-contract.md#binding-write-rules). Session shape: [api-contract customer wallet](../backend/api-contract.md#customer-wallet-session).

### Reward progress on the card (DECIDED)

**Status:** DECIDED (not shipped). Full lock: [customer-reward-progress.md](../product/customer-reward-progress.md).

The customer sees progress **on this Shop’s wallet card**, not as a mixed tracker across Shops.

| Capability | Numerator | Target | Primary copy |
|------|-----------|--------|--------------|
| Visit | Membership stamps (`customers.visits` until a stamp ledger exists) | `visits_required` | Stamp icons: `3 / 8` toward this Shop’s completion reward |
| Points | **Available** unexpired lots (total − pending reserved) | Next unearned `live` catalog `rewards.point_cost` (lowest cost) | Numeric balance + `120 / 200 · 80 to {name}` |
| Tier | Progress toward next `loyalty_program_tiers` threshold | Next tier | `{current} · {n} to {next}` (status, not spendable) |

No live reward configured → honest empty. Several catalog rewards → one primary on the card + optional “See all” **for this Shop**. Check-in success (journey B) shows the **same** figures plus this-visit delta. `visit_events` is not required for this customer view.

---

## Reward redemption lifecycle (DECIDED)

**Status:** DECIDED for Product MVP (Ship 1) lifecycle and agreed edge cases (not shipped). Five items remain pending owner decision. **Full lock:** [reward-redemption-flow.md](../product/reward-redemption-flow.md). Schema/API are backend-owned ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)). Gap: [G-20](gaps-and-solutions.md#g-20--rewardsredeemed_count-vs-earn).

Catalog redeem is **not** an immediate point burn (physical / in-person handoff). The customer taps Redeem **on the enrolled program**; if `Available < snapshot cost` the request is refused with a clear error (no row). If valid, persist **`reward_snapshot`**, start `pending`, **reserve** snapshot cost, issue a **single-use QR** (10-minute expiry). Staff **scans** → atomic `PENDING → COMPLETED` using the snapshot (PM-04: even if lot `expires_at` passed during the window). Unscanned QRs expire via a **scheduled job** (`expired`, release Reserved, **purge** expired reserved lots). Earn ≠ redeem still holds. Purely digital catalog rewards may complete instantly ([§16](../product/reward-redemption-flow.md#16-digital-rewards-exception)).

```text
Select this Shop’s reward → PENDING + reserve + QR → Staff scan (COMPLETED) or job (EXPIRED)
```

Locked (Product MVP (Ship 1)):

- Redeem only rewards on the membership’s Shop. The row stays on that Shop forever — joining Shop B must not transfer it or spend Shop B points.
- `Available = Total − Reserved`. Combined pending cost cannot exceed available. Concurrent Redeems check Available, not Total. Reservation happens at Redeem time, not at staff-scan time.
- Create is idempotent (double-click / tabs / devices / retry return the same row; do not reserve twice or issue a second QR). Viewing the same pending QR on two devices is allowed.
- Scan is one Backend transaction: `UPDATE … WHERE status = 'pending'` (QR still valid) with affected rows = 1 → `COMPLETED` + consume reserved. Already `COMPLETED` → error **“already redeemed”**. `EXPIRED` / past `qr_expires_at` → error **“expired”**. Frontend button disable / countdown is UX only.
- A scheduled job marks `pending` past 10 minutes as `expired` and releases Reserved. Do not rely on client-side / lazy expiry.
- Staff cannot reject a valid, unexpired, un-redeemed QR. Do not implement staff Approve/Reject for physical catalog rewards (previous spec — superseded; [Gaps](../product/reward-redemption-flow.md#gaps-design-vs-implementation)).
- Earn events (check-in / POS / `Invoice.Paid`) are idempotent on a unique business reference. Concurrent earn and redeem use the same consistency model (no negative balance, lost update, or double deduct).
- Reward eligibility / expiry is snapshotted **at create**. Live catalog PATCHes are **prospective only**. Material cuts → new **reward version**. QR TTL (10 minutes) is independent of lot `expires_at` (**PM-04**).
- Authz is **Shop-level**: `staff.branch.shop_id === redemption.shop_id` (today: owner of the capability rows). Any authorized Staff from any Branch of that Shop may scan. Staff from another Shop must not. Backend enforces independently of Frontend.
- Product MVP (Ship 1): any existing Staff or Admin role may perform Redemption scan/verify. Do not add extra role restrictions unless decided later.
- Refund / reversal is **out of Product MVP (Ship 1)**.

**Closed (implement):** snapshot at create; program/reward edits prospective; PM-04 reserved-lot expiry; Product MVP (Ship 1) mutation guards. **Out of Product MVP (Ship 1):** emergency cancel+refund. [§14.1](../product/reward-redemption-flow.md#141-reward-snapshot-prospective-edits-versions).

---

## QR Experience tab

Loads/upserts `qr_page_settings` (1:1 with program). Branding colors, copy, form field toggles, logo/cover upload to Storage bucket `qr-branding`.

`getJoinProgram` **does** return `qr` settings to the public join page — this tab **is** wired for branding. Scan **counts** are still missing.

---

## Public join / check-in

**Intended entry:** Shop QR always resolves to **ACTIVE** ([counter QR](#counter-qr--shop-membership-decided)). Enroll/check-in creates or uses **one identity per Shop**, locked to `enrolled_program`. Existing account, first time at this Shop → enroll ACTIVE; already a member → check-in (cashier may migrate).

Unauthenticated `/join/[programId]` (**today**; intended Shop QR may use a shop slug — backend-owned):

1. `GET /api/join/program?programId=` → program + `qr_page_settings` + business name (and invite telemetry if `ref`)
2. **Intended:** `POST /api/join/otp/request` → SMS or WhatsApp OTP (`otp_verifications` only)
3. `POST /api/join/enroll` → **after OTP**, create customer **or** `recordCheckIn` if email/phone already in that program

New customer: `status: "active"`, `points: 0`, `last_activity_at` now, optional birth/gender/city/custom. Owner notification best-effort.

Returning scan: updates points or visits as above; may insert `customer_rewards`; may email customer. **Does not** write `customers.tier`, visit events, or scan events. **Does not** attach `branch_id`.

Rate limit: in-memory per IP (ADR-012). Replace with Redis/Upstash in production.

**Intended (DECIDED):** new enroll requires OTP ([OTP](#otp-verification-decided)). Enroll accepts `ref` (query or body). A **new** member with a valid code is attributed and granted the referred reward **in the OTP-verified transaction**. Same device or same Wi-Fi/IP in the same minute → `pending_review`. Returning scan with `ref` is check-in only — no second attribution. [referral rewards](#referral-rewards-decided) · [fraud controls](#referral-fraud-controls-decided).

**Intended (DECIDED):** shop customers will **register and log in** (role **customer**) so their data is stored on an account and KPIs are **calculated** from that activity — not only from owner **Add Customer**. This join page stays a public capture/check-in path; when customer auth exists, enroll/check-in should attach to that account. Customer login is not `admin` / `staff` `/app` auth. See [11-authentication-migration.md](11-authentication-migration.md#shop-customer-register-and-login-decided) and [G-33](gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows).

Do **not** treat this page as the portal login diagram. Opening the **customer portal** always uses OTP. A returning scan **at this Shop** is check-in only. Success copy must show **this Shop’s** reward progress (stamps and/or spendable vs next reward), not a mixed total across Shops. Case map: [customer-portal-journey.md](../product/customer-portal-journey.md). Shop-door scan is journey B.

---

## Gaps — UI / API / DB and recommended solutions

Indexed backlog + ownership: [gaps-and-solutions.md](gaps-and-solutions.md) · contracts: [data-contract.md](../backend/data-contract.md) · [api-contract.md](../backend/api-contract.md) · [remediation-roadmap.md](../backend/remediation-roadmap.md) · [ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md).

| G-ID | Widget | UI gap | API gap | DB gap | Recommended fix |
|------|--------|--------|---------|--------|-----------------|
| [G-01](gaps-and-solutions.md#g-01--qr-scan-tracking-is-always-0) | **QR scan stats** | Always 0 | Join GET does not log | No scan table | `visit_events` (`source=qr_view` / check-in) |
| [G-02](gaps-and-solutions.md#g-02--visit--stamp-progress-is-always-empty) | **Visit progress / stamp stats** | Empty / 0 | Check-in only bumps `customers.visits` | No stamp ledger | `visit_events`; derive buckets until then |
| [G-03](gaps-and-solutions.md#g-03--customer-tier-is-never-assigned) | **Tier stats / members close to upgrade** | `"0"` / empty | Check-in never sets `tier` | `tier` free text | Assign from `period_points_earned` + `tier_milestone_grants` (PM-08) |
| [G-10](gaps-and-solutions.md#g-10--check-in-ignores-most-loyalty-rules) / [G-06](gaps-and-solutions.md#g-06--revenue-is-a-dead-column-everywhere) | **Points earn vs spend** | Implies $1 → N from ticket | Flat `points_earned` | No order amount | Staff POS / `orders.amount_cents` + `invoice_number` |
| [G-10](gaps-and-solutions.md#g-10--check-in-ignores-most-loyalty-rules) | **Min spend, expiry, birthday, signup bonus** | Saved | Unused in join-service | Columns exist | Implement or hide until POS; signup bonus **per enrollment** |
| [G-10](gaps-and-solutions.md#g-10--check-in-ignores-most-loyalty-rules) | **Visit min spend / card expiry / notify 1 away** | Saved | Unused | Columns exist | Ticket amount + jobs |
| — | **Reward on completion** | Not tied to `rewards.id` | Snapshot string only | `reward_id` null | FK to catalog reward |
| [G-20](gaps-and-solutions.md#g-20--rewardsredeemed_count-vs-earn) | **`redeemed_count` / catalog redeem** | Catalog shows it | Earn ≠ redeem; no pending/reserve/QR | No redeem lifecycle | Pending + **`reward_snapshot`** + reserve + QR scan; PM-04 expiry job |
| [G-14](gaps-and-solutions.md#g-14--referrals-settings-without-attribution) | **Referrals** | Settings only | Enroll has no OTP/`ref` | No `referrals` / `otp_verifications` / `vouchers` | OTP PM-06 then atomic enroll; UX-75; PM-07 voucher; referrer on `Invoice.Paid` |
| [G-31](gaps-and-solutions.md#g-31--program-type-change-after-members-exist) | **Program type change** | Copy says anytime | No migration | One row | Independent programs + deferred POS migrate; mutation guards |
| [G-35](gaps-and-solutions.md#g-35--shop-loyalty-is-one-row-not-one-config-per-capability) | **Independent programs + ACTIVE** | One upsert row; door QR is program UUID | Unique `owner_id` | No `status` | Many programs; partial unique one ACTIVE; QR → ACTIVE ([program-model.md](../product/program-model.md) · [counter QR](../product/counter-qr-and-program-membership.md)) |
| [G-10](gaps-and-solutions.md#g-10--check-in-ignores-most-loyalty-rules) | **Tier multipliers** | Saved on tier rows | Unused | OK | Apply on earn once orders exist |

---

## Known limitations

1. One program row per owner **today** — **DECIDED:** independent programs; partial unique one ACTIVE per Shop. Shop QR → ACTIVE ([independent programs](#independent-programs-decided), [program-model.md](../product/program-model.md), [counter QR](#counter-qr--shop-membership-decided))
2. Same page is create + edit; save always returns to dashboard
3. Scan / visit / tier member stats are zeros
4. Check-in ignores most saved rules
5. `customers.tier` never assigned
6. Referrals config without attribution — **DECIDED** product rules ([referral rewards](#referral-rewards-decided), [fraud controls](#referral-fraud-controls-decided)); not shipped
7. Reward “redeemed” vs “earned” not distinguished in UI — **DECIDED:** catalog redeem is `pending` → `completed` (QR scan) / `expired` (job) with reservation ([redemption](#reward-redemption-lifecycle-decided)); not shipped. **Gap:** previous spec was staff approve/reject — do not implement that.
8. Tab query parsed from `window.location.search` (not typed Next searchParams)

---

## Component tree

```
Page (loyalty/page.tsx)
└── LoyaltyPage
    ├── [loading] Spinner
    └── DashboardShell
        ├── Title
        ├── Tab bar (Programs | Rewards | Referrals | QR Experience)
        ├── Programs
        │   ├── Program type radios
        │   ├── [points] spend/points rules + QR sidebar
        │   ├── [visit] visit rules + StampCardPreview + VisitsProgressSection (empty)
        │   ├── [tier, no rows] TierBasedFlow screen 1
        │   └── [tier, has rows] TierBasedFlow screen 2 + QR + Tier stats (0)
        ├── Rewards → RewardsSection
        ├── Referrals → ReferralsSection
        └── QR Experience → QRExperienceSection
```
