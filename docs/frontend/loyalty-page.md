# Loyalty Program Page (`/app/loyalty`)

Reference for all components, conditions, and edge cases on the Loyalty Program route (create + edit). **Today** this is the owner’s single program. **DECIDED:** a shop will have **many** programs, each `draft` \| `active` \| `disabled` ([multiple programs](#multiple-programs-and-status-decided)). Covers the four tabs, program types, QR join URL, and a [UI / API / DB gap analysis](#gaps-ui--api--db-and-recommended-solutions).

**Jump to:** [route](#route-structure) · [page flow](#high-level-page-flow) · [multiple programs](#multiple-programs-and-status-decided) · [one program today](#one-owner--one-loyalty-program-today) · [tabs](#tabs) · [points](#points-system) · [visit](#visit-based) · [tier](#tier-based) · [save](#save--upsert) · [qr](#qr-on-the-programs-tab) · [rewards](#rewards-tab) · [referrals](#referrals-tab) · [referral rewards](#referral-rewards-decided) · [referral fraud](#referral-fraud-controls-decided) · [otp](#otp-verification-decided) · [customer wallet](#customer-wallet-per-program-decided) · [qr experience](#qr-experience-tab) · [join](#public-join--check-in) · [gaps](#gaps-ui--api--db-and-recommended-solutions)

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
- Related: [customers-page.md](customers-page.md), [analytics-page.md](analytics-page.md), [dashboard-page.md](dashboard-page.md)

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

## Multiple programs and status (DECIDED)

**A shop will have more than one loyalty program.** This is not how the app works today. Schema/API are backend-owned ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)). Gap: [G-35](gaps-and-solutions.md#g-35--shop-is-limited-to-one-loyalty-program-no-program-status).

Each program has a **status**:

| Status | Meaning |
|--------|---------|
| **`draft`** | Saved, not live. Not for members / join until activated. |
| **`active`** | Live. Members can join / check in against this program. |
| **`disabled`** | Turned off. Not live; kept in the shop’s list. |

Stored names: `draft` · `active` · `disabled`. Do not use other spellings (`disable`, `inactive`).

**Today vs intended**

| | Today | Intended |
|--|--------|----------|
| How many programs | One per `owner_id` (`UNIQUE`) | **Many** per shop |
| Status | None (the one row is always “the” program) | `draft` \| `active` \| `disabled` |
| Save | `upsert` on `owner_id` (overwrite) | Insert/update **that** program; do not overwrite siblings |
| Join | `/join/{programId}` already identifies one program | Same URL shape; only **`active`** programs should accept new join/check-in |

Customers, rewards, campaigns, and QR stay **program-scoped** (`loyalty_program_id`). `/app` needs a way to list/select programs (UI not locked).

**Not locked:** whether **more than one** program can be `active` at the same time; default status on create; who besides `admin` can create programs (`staff` has the same `/app` permissions for now).

Product note: [product-manager-meeting-report.md](../product-manager-meeting-report.md).

---

## One owner · one loyalty program (today)

`loyalty_programs.owner_id` is unique. Saves use:

```ts
.upsert(payload, { onConflict: "owner_id" })
```

There is no program switcher, archive, or second program. Changing `program_type` after customers exist is allowed in the UI (“You can change this anytime”) but **does not migrate** points/visits/tiers.

This uniqueness **must be removed** when multiple programs ship (G-35).

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

QR PNG is generated in the browser (`qrcode`) from `{origin}/join/{programId}`.

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

Required: `spendAmount > 0`, `pointsEarned > 0`. Optional: minimum spend, expiry months, grace months, bonus signup points, double points on birthdays.

**What check-in actually uses** (`join-service` `recordCheckIn`):

- Adds `program.points_earned` to `customers.points` (flat, **not** `spend_amount` / ticket size)
- Does **not** enforce `minimum_spend` (no order amount on check-in)
- Does **not** apply expiry, grace, birthday double, or signup bonus

Signup bonus and birthday double are stored flags only.

**Intended (DECIDED):** every **issued** lot in this program writes `points_ledger.expires_at` from this program’s `points_expiry_months` (0 = no expiry, `expires_at` null). Referral lots use `referral_settings.points_expiry_days` instead. Points never mix with another program. Customer view: [customer wallet](#customer-wallet-per-program-decided).

---

## Visit based

Required: `visitsRequired > 0`, `rewardOnCompletion` (select: free item / discount / custom — **string labels**, not a `rewards.id`).

Optional: min spend per visit, card expiry days, max visits per day, after-reward action (`reset` \| `continue`), bonus stamp on signup, double stamp weekends, notify one visit away.

**What check-in actually uses:**

- Increments `customers.visits` (weekend double if `double_stamp_weekends`)
- `max_visits_per_day > 0` blocks a second stamp the same **UTC** day via `last_activity_at`
- When `visits >= visits_required`, inserts `customer_rewards` with `reward_name_snapshot` from `reward_on_completion` (`reward_id` null)
- `after_reward_action === "reset"` subtracts `visits_required` from `visits`

**Not used:** `min_spend_per_visit`, `card_expiry_days`, `bonus_stamp_signup`, `notify_one_visit_away`.

### Visit UI extras (always empty)

| Widget | Data |
|--------|------|
| Visit stats (stamps this month, cards completed, one visit away) | Hardcoded `0` |
| `VisitsProgressSection` | Intentionally returns `[]` — empty telescope state |
| Stamp card preview | Visual only from `visitsRequired` + reward label |

---

## Tier based

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

When `programId` exists: PNG, join URL, Download PNG, Print PDF (popup), Share (`navigator.share` or clipboard).

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

Reward performance dialog: `redeemed_count` is real; **revenue and per-tier redemption counts are 0**. Check-in can insert `customer_rewards` and increment nothing on `rewards.redeemed_count` unless some other path does (join-service earn path does **not** bump `redeemed_count` — it inserts `status: "earned"`, not redeemed).

---

## Referrals tab

Reads/writes `referral_settings` (one row per program): `enabled`, `referrer_bonus_points`, `new_customer_discount_pct`.

**Top referrers** is a hardcoded empty array. Join enroll does **not** accept a referral code or write a referral event. Settings are stored only.

**Intended (DECIDED):** both parties are rewarded; share is a personal **link** or **QR**; points vs discount voucher; both expire. See [referral rewards](#referral-rewards-decided). Schema/API are backend-owned ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)). Gap: [G-14](gaps-and-solutions.md#g-14--referrals-settings-without-attribution).

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

This personal QR is not the shop’s program join QR on the QR Experience tab. The customer sees **this program’s** link and QR on **that program’s wallet card** ([customer wallet](#customer-wallet-per-program-decided)). Pixel layout is **not** locked; the facts are.

**Expiry:** every referral **point lot** and every referral **voucher** has `expires_at`. After that instant, points in that lot cannot be spent and the voucher cannot be redeemed. Durations: `referral_settings.points_expiry_days` and `voucher_expiry_days` (shop-configured; default day counts **not** locked). Non-referral lots in the same program follow `loyalty_programs.points_expiry_months`.

**Integrity:** OTP before any member row; hard database constraints plus device/IP review — see [OTP](#otp-verification-decided) and [referral fraud controls](#referral-fraud-controls-decided). Returning check-in with `?ref=` does not create a referral. `signup_bonus` (program flag) is separate from referral grants if both fire on enroll. Referral grants are **points-wallet or voucher** even when `program_type` is `visit` or `tier` (they do not add stamps).

Shop configures **kind per side** (`points` \| `discount`). Today’s columns map to defaults: referrer → points (`referrer_bonus_points`), referred → discount (`new_customer_discount_pct`). Extra amount columns for the other kind: [data-contract `referral_settings`](../backend/data-contract.md#referral_settings--both-party-kinds--expiry).

Writers: [data-contract write rule 12](../backend/data-contract.md#binding-write-rules) · [write rule 14](../backend/data-contract.md#binding-write-rules). Enroll: [api-contract join](../backend/api-contract.md#join--otp--enroll).

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
| `POST /api/join/otp/request` | `otp_verifications` (`pending`, `code_hash`) + send via messaging contracts |
| `POST /api/join/enroll` with valid OTP | Atomic: verify OTP → `customers` + optional `referrals` + referred grant |
| Invalid / expired OTP | **No** member row |

Owner **Add Customer** does not use this OTP. Returning check-in does not require a new OTP. Channel is `sms` \| `whatsapp`; provider stays adapter-stub until chosen ([17-messaging-templates.md](17-messaging-templates.md)). Challenge TTL and attempt cap are backend-owned (**not** locked).

Shop-customer self-register, login, and lost-access recovery (G-33) use the same OTP gate. Customers never set a password. [Credential recovery](11-authentication-migration.md#credential-recovery-decided).

---

## Customer wallet (per program, DECIDED)

**Status:** DECIDED (not shipped). Exact portal **URL** is still not locked ([G-33](gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows)). What the logged-in **`customer`** sees **is** locked.

Points live on a **membership** (`customers` row with `loyalty_program_id`). They never share a pool with another program.

Example that must stay true: **100** spendable points in program 1 (that program’s expiry, e.g. one month from each lot’s grant) and **200** spendable points in program 2 (that program’s expiry, e.g. one week) are **two wallets**. The UI must **not** show **300**.

### Each program card (required facts)

One card / row per program the account is a member of:

| Fact | Source |
|------|--------|
| Program name | `loyalty_programs` |
| **Spendable points** | Sum of unexpired issued lots minus spends against those lots (`points_ledger` where `expires_at IS NULL OR expires_at > now()`). Not the raw `customers.points` counter unless it is kept equal to this sum |
| **Expiry** | If remaining lots share one `expires_at`, show that date. If mixed (e.g. check-in month vs referral days), group: amount + date per lot group. Never a single date that hides a sooner-expiring lot |
| Vouchers | `vouchers` for that program with `status = active` (referral discount awards). `used` / `expired` = not redeemable; do not count as spendable points |
| Share **link** + **QR** | This membership’s `/join/{programId}?ref={referral_code}` |

Pixel layout (cards vs list vs tabs) is **not** locked. Combining balances across programs **is forbidden**.

Spend inside a program uses unexpired lots **FIFO** ([api-contract redeem](../backend/api-contract.md)).

Schema: [data-contract write rule 13](../backend/data-contract.md#binding-write-rules). Session shape: [api-contract customer wallet](../backend/api-contract.md#customer-wallet-session).

---

## QR Experience tab

Loads/upserts `qr_page_settings` (1:1 with program). Branding colors, copy, form field toggles, logo/cover upload to Storage bucket `qr-branding`.

`getJoinProgram` **does** return `qr` settings to the public join page — this tab **is** wired for branding. Scan **counts** are still missing.

---

## Public join / check-in

Unauthenticated `/join/[programId]`:

1. `GET /api/join/program?programId=` → program + `qr_page_settings` + business name (and invite telemetry if `ref`)
2. **Intended:** `POST /api/join/otp/request` → SMS or WhatsApp OTP (`otp_verifications` only)
3. `POST /api/join/enroll` → **after OTP**, create customer **or** `recordCheckIn` if email/phone already in that program

New customer: `status: "active"`, `points: 0`, `last_activity_at` now, optional birth/gender/city/custom. Owner notification best-effort.

Returning scan: updates points or visits as above; may insert `customer_rewards`; may email customer. **Does not** write `customers.tier`, visit events, or scan events. **Does not** attach `branch_id`.

Rate limit: in-memory per IP (ADR-012). Replace with Redis/Upstash in production.

**Intended (DECIDED):** new enroll requires OTP ([OTP](#otp-verification-decided)). Enroll accepts `ref` (query or body). A **new** member with a valid code is attributed and granted the referred reward **in the OTP-verified transaction**. Same device or same Wi-Fi/IP in the same minute → `pending_review`. Returning scan with `ref` is check-in only — no second attribution. [referral rewards](#referral-rewards-decided) · [fraud controls](#referral-fraud-controls-decided).

**Intended (DECIDED):** shop customers will **register and log in** (role **customer**) so their data is stored on an account and KPIs are **calculated** from that activity — not only from owner **Add Customer**. This join page stays a public capture/check-in path; when customer auth exists, enroll/check-in should attach to that account. Customer login is not `admin` / `staff` `/app` auth. See [11-authentication-migration.md](11-authentication-migration.md#shop-customer-register-and-login-decided) and [G-33](gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows).

---

## Gaps — UI / API / DB and recommended solutions

Indexed backlog + ownership: [gaps-and-solutions.md](gaps-and-solutions.md) · contracts: [data-contract.md](../backend/data-contract.md) · [api-contract.md](../backend/api-contract.md) · [remediation-roadmap.md](../backend/remediation-roadmap.md) · [ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md).

| G-ID | Widget | UI gap | API gap | DB gap | Recommended fix |
|------|--------|--------|---------|--------|-----------------|
| [G-01](gaps-and-solutions.md#g-01--qr-scan-tracking-is-always-0) | **QR scan stats** | Always 0 | Join GET does not log | No scan table | `visit_events` (`source=qr_view` / check-in) |
| [G-02](gaps-and-solutions.md#g-02--visit--stamp-progress-is-always-empty) | **Visit progress / stamp stats** | Empty / 0 | Check-in only bumps `customers.visits` | No stamp ledger | `visit_events`; derive buckets until then |
| [G-03](gaps-and-solutions.md#g-03--customer-tier-is-never-assigned) | **Tier stats / members close to upgrade** | `"0"` / empty | Check-in never sets `tier` | `tier` free text | Assign from `loyalty_program_tiers` |
| [G-10](gaps-and-solutions.md#g-10--check-in-ignores-most-loyalty-rules) / [G-06](gaps-and-solutions.md#g-06--revenue-is-a-dead-column-everywhere) | **Points earn vs spend** | Implies $1 → N from ticket | Flat `points_earned` | No order amount | POS / `orders.amount_cents` |
| [G-10](gaps-and-solutions.md#g-10--check-in-ignores-most-loyalty-rules) | **Min spend, expiry, birthday, signup bonus** | Saved | Unused in join-service | Columns exist | Implement or hide until POS |
| [G-10](gaps-and-solutions.md#g-10--check-in-ignores-most-loyalty-rules) | **Visit min spend / card expiry / notify 1 away** | Saved | Unused | Columns exist | Ticket amount + jobs |
| — | **Reward on completion** | Not tied to `rewards.id` | Snapshot string only | `reward_id` null | FK to catalog reward |
| [G-20](gaps-and-solutions.md#g-20--rewardsredeemed_count-vs-earn) | **`redeemed_count`** | Catalog shows it | Earn ≠ redeem | No redeem API | Redeem endpoint |
| [G-14](gaps-and-solutions.md#g-14--referrals-settings-without-attribution) | **Referrals** | Settings only | Enroll has no OTP/`ref` | No `referrals` / `otp_verifications` / `vouchers` | OTP then atomic enroll; referred grant; referrer on `Invoice.Paid`; CHECK self-invite; UNIQUE `referred_id`; device/IP → `pending_review` |
| [G-31](gaps-and-solutions.md#g-31--program-type-change-after-members-exist) | **Program type change** | Copy says anytime | No migration | One row | Lock or migrate |
| [G-35](gaps-and-solutions.md#g-35--shop-is-limited-to-one-loyalty-program-no-program-status) | **Multiple programs + status** | One upsert row | Unique `owner_id` | No `status` | Many programs; `draft` \| `active` \| `disabled` |
| [G-10](gaps-and-solutions.md#g-10--check-in-ignores-most-loyalty-rules) | **Tier multipliers** | Saved on tier rows | Unused | OK | Apply on earn once orders exist |

---

## Known limitations

1. One program per owner **today** — **DECIDED:** many programs per shop, each `draft` \| `active` \| `disabled` ([multiple programs](#multiple-programs-and-status-decided))
2. Same page is create + edit; save always returns to dashboard
3. Scan / visit / tier member stats are zeros
4. Check-in ignores most saved rules
5. `customers.tier` never assigned
6. Referrals config without attribution — **DECIDED** product rules ([referral rewards](#referral-rewards-decided), [fraud controls](#referral-fraud-controls-decided)); not shipped
7. Reward “redeemed” vs “earned” not distinguished in UI
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
