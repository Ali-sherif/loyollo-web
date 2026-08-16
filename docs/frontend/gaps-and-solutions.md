# Gaps and solutions — UI vs API vs DB

Prioritized backlog of what the **current UI promises** versus what **API + Postgres** actually support. Page-level detail lives in each route doc; this file is the cross-cutting index.

**Ownership:** schema/API closure is the **backend program** ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)) on NestJS 11.x + Prisma 7.x + PostgreSQL 18.x ([ADR-015](../architecture/decisions/ADR-015-backend-stack.md)). Presentational honesty fixes are Frontend.

**Contracts (moved out of this file):** [data-contract.md](../backend/data-contract.md) · [api-contract.md](../backend/api-contract.md) · [remediation-roadmap.md](../backend/remediation-roadmap.md)

**Jump to:** [critical](#critical) · [high](#high) · [medium](#medium) · [low](#low) · [already exists](#what-already-exists-do-not-rebuild) · [colliding labels](#colliding-labels-do-not-mix)

**Page references:** [dashboard-page.md](dashboard-page.md) · [customers-page.md](customers-page.md) · [loyalty-page.md](loyalty-page.md) · [branches-page.md](branches-page.md) · [settings-page.md](settings-page.md) · [campaigns-page.md](campaigns-page.md) · [analytics-page.md](analytics-page.md) · [system-architecture.md](system-architecture.md)

**Status values:** `DEFERRED-BACKEND` · `FRONTEND-FIXABLE` · `SPEC-READY` · `WONTFIX`

Each item: **G-ID** · Gap · Where · Blocked by · Solution · Status · Owner · Phase.

---

## Critical

These widgets are visible in production UI and systematically show **zero, even split, or the wrong metric**. They train owners to distrust the product.

### G-01 — QR scan tracking is always 0

| Field | Value |
|-------|--------|
| **Where** | Loyalty Programs tab “Total scans” / “Scans this week”; Analytics QR / visit-frequency empty states |
| **Blocked by** | No `visit_events` / `qr_scan_events`; `GET /api/join/program` does not log |
| **Solution** | Insert `visit_events` on join view and enroll/check-in; see [data-contract](../backend/data-contract.md) |
| **Status** | `DEFERRED-BACKEND` |
| **Owner** | Backend program |
| **Phase** | 2 |

### G-02 — Visit / stamp progress is always empty

| Field | Value |
|-------|--------|
| **Where** | Loyalty visit stats, `VisitsProgressSection`, Analytics visit chart / “1 visit from a reward”; customer stamp progress (wallet) |
| **Blocked by** | Only denormalized `customers.visits`; no stamp/event ledger |
| **Solution** | **Customer card:** derive `visits` vs `visits_required` (and spendable vs next catalog reward) — [customer-reward-progress.md](../product/customer-reward-progress.md). **Merchant charts / “stamps this month”:** `visit_events`; until then derive buckets from `visits` vs `visits_required` (honesty) |
| **Status** | `DEFERRED-BACKEND` (derive buckets: `FRONTEND-FIXABLE`) |
| **Owner** | Backend program |
| **Phase** | 2 |

### G-03 — Customer tier is never assigned

| Field | Value |
|-------|--------|
| **Where** | Customers tier column/filter; Dashboard top-customer colors; Analytics donut; Loyalty tier stats `"0"`; Campaigns VIP/Gold |
| **Blocked by** | Ladder saved; enroll/check-in never write `customers.tier` |
| **Solution** | Shared assign function on enroll + check-in (`tier` or `tier_id`) |
| **Status** | `DEFERRED-BACKEND` |
| **Owner** | Backend program |
| **Phase** | 1 |

### G-04 — Branch metrics are even splits / em dashes

| Field | Value |
|-------|--------|
| **Where** | Branch cards, Performance donut 1/N %, detail `"—"`, fake engagement bars |
| **Blocked by** | No `branch_id` on customers / rewards / orders / events |
| **Solution** | Nullable `branch_id` + writers; until then `"—"` honestly (Phase 0) |
| **Status** | `DEFERRED-BACKEND` (honesty: `FRONTEND-FIXABLE`) |
| **Owner** | Backend program |
| **Phase** | 4 (honesty: 0) |

---

## High

### G-05 — Header Search does nothing

| Field | Value |
|-------|--------|
| **Where** | `DashboardShell` on every `/app/*` page |
| **Blocked by** | No search endpoint |
| **Solution** | Hide until ready, or `GET /api/search?q=` ([api-contract](../backend/api-contract.md)) |
| **Status** | `DEFERRED-BACKEND` (hide: `FRONTEND-FIXABLE`) |
| **Owner** | Backend program / Frontend hide |
| **Phase** | 6 (hide: 0) |

### G-06 — Revenue is a dead column everywhere

| Field | Value |
|-------|--------|
| **Where** | Customers Revenue; Dashboard Total Revenue; Analytics Revenue tab; Branch by revenue; Campaigns `$0.00` |
| **Blocked by** | **No `orders` table**; `campaigns.revenue_cents` is not GMV |
| **Solution** | `orders` + attribution; rollup campaign revenue; hide until first order |
| **Status** | `DEFERRED-BACKEND` |
| **Owner** | Backend program |
| **Phase** | 5 (hide: 0) |

### G-07 — Plan limits are UI-only; billing is a placeholder

| Field | Value |
|-------|--------|
| **Where** | Branches Add at cap; Settings Billing writes `profiles.plan` with “no payment will be charged” |
| **Blocked by** | No Stripe customer; no server cap on inserts |
| **Solution** | Checkout + webhook sole writer of plan; enforce caps on insert |
| **Status** | `DEFERRED-BACKEND` |
| **Owner** | Backend program |
| **Phase** | 5 |

### G-08 — Three “at risk” definitions

| Field | Value |
|-------|--------|
| **Where** | Dashboard 30-day; Customers `status`; Analytics buckets; Campaigns `"at-risk"` vs `"at_risk"` |
| **Blocked by** | No shared rules; `status` never written for at-risk |
| **Solution** | One rules module + glossary; fix hyphen immediately (Frontend) |
| **Status** | `DEFERRED-BACKEND` (hyphen: `FRONTEND-FIXABLE`) |
| **Owner** | Backend program / Frontend string |
| **Phase** | 3 (string: 0) |

### G-09 — Campaign send / opens / automations

| Field | Value |
|-------|--------|
| **Where** | Campaigns performance, Dashboard open rate, Automations Enable |
| **Blocked by** | Fan-out in Next request (ADR-013); `opened_count` unused; automations CRUD only |
| **Solution** | `campaign_jobs` + worker; ESP webhooks; automation runner. **Lifecycle DECIDED (2026-08-14):** campaigns start as Draft (never Active); Active = send in progress (working); when all emails/SMS are processed write `completed` (`sent_count > 0`) or `failed` (`sent_count === 0`). Enable must not write `active` without sending (restore draft). Do not drop the Completed tab. Performance (`% Open` / `% Redeemed`) is a results column, not a status — see [campaigns-page.md](campaigns-page.md#product-meanings-decided) |
| **Status** | `DEFERRED-BACKEND` |
| **Owner** | Backend program |
| **Phase** | 6 |

### G-10 — Check-in ignores most Loyalty rules

| Field | Value |
|-------|--------|
| **Where** | Points/Visit/Tier advanced fields |
| **Blocked by** | Columns exist; `recordCheckIn` uses a small subset; often needs `orders` |
| **Solution** | Implement against orders/events, or hide unused fields until POS. Issued point lots must stamp `expires_at` from `points_expiry_months` (G-10 expiry). Customer wallet is per-program. |
| **Status** | `DEFERRED-BACKEND` (hide unused: `FRONTEND-FIXABLE`) |
| **Owner** | Backend program |
| **Phase** | 5 |

---

## Medium

### G-11 — Customer list will not scale

| Field | Value |
|-------|--------|
| **Where** | Customers / Analytics / Dashboard complete view `select` all rows |
| **Blocked by** | No paginated list API |
| **Solution** | `GET /api/customers?cursor=` ([api-contract](../backend/api-contract.md)) |
| **Status** | `DEFERRED-BACKEND` |
| **Owner** | Backend program |
| **Phase** | 7 |

### G-12 — Stat card label bugs on Customers

| Field | Value |
|-------|--------|
| **Where** | “New this month” = Gold+VIP; “Returning Rate” = Silver count |
| **Blocked by** | Wrong client formulas (return rate also needs events long-term) |
| **Solution** | Relabel or compute correctly; events for real return rate |
| **Status** | `FRONTEND-FIXABLE` (full return rate: `DEFERRED-BACKEND`) |
| **Owner** | Frontend |
| **Phase** | 0 |

### G-13 — Detail pages are shells

| Field | Value |
|-------|--------|
| **Where** | Customer detail (rewards/LTV/referrals = 0); Branch detail `"—"` |
| **Blocked by** | Detail never queries `customer_rewards`; no LTV/referrals/`branch_id` |
| **Solution** | Query rewards; LTV from orders; referrals table; branch after `branch_id` |
| **Status** | `DEFERRED-BACKEND` (query existing rewards: partial Frontend) |
| **Owner** | Backend program |
| **Phase** | 4–6 |

### G-14 — Referrals settings without attribution

| Field | Value |
|-------|--------|
| **Where** | Loyalty Referrals tab; Customer detail Referrals = 0 |
| **Blocked by** | `referral_settings` only; no `referrals` events |
| **Solution** | `otp_verifications` then atomic enroll; `referrals` + `?ref=` / personal QR; both-party grants (referred after OTP, referrer **only** on first **paid** invoice / `Invoice.Paid`); discount → `vouchers` (`active`/`used`/`expired`); `CHECK (referrer_id <> referred_id)`; `UNIQUE (referred_id)`; same device/IP in the same minute → `pending_review`. [DECIDED](loyalty-page.md#referral-rewards-decided) · [fraud](loyalty-page.md#referral-fraud-controls-decided) · [OTP](loyalty-page.md#otp-verification-decided). Schema: [data-contract](../backend/data-contract.md#referrals) |
| **Status** | `DEFERRED-BACKEND` (product **DECIDED**, not shipped) |
| **Owner** | Backend program |
| **Phase** | 6 |

### G-15 — Notification preferences are mostly cosmetic

| Field | Value |
|-------|--------|
| **Where** | Settings → Notifications; bell fills from every insert |
| **Blocked by** | `/api/notifications/owner` ignores prefs; weekly/monthly RPCs not cron’d |
| **Solution** | Gate insert + email; schedule RPCs |
| **Status** | `DEFERRED-BACKEND` |
| **Owner** | Backend program |
| **Phase** | 6 |

### G-16 — Avatar signed URLs expire

| Field | Value |
|-------|--------|
| **Where** | Settings upload; DashboardShell header |
| **Blocked by** | Signed URL lifetime |
| **Solution** | Public bucket + RLS, or store path and sign on read |
| **Status** | `DEFERRED-BACKEND` |
| **Owner** | Backend program |
| **Phase** | — (ops; not on critical path) |

### G-17 — Join-only customer fields hidden from owner

| Field | Value |
|-------|--------|
| **Where** | Enroll writes `gender`, `city`, `custom_field_value`; owner UI hides them |
| **Blocked by** | UI only |
| **Solution** | Show on detail / add dialog |
| **Status** | `FRONTEND-FIXABLE` |
| **Owner** | Frontend |
| **Phase** | 0 |

### G-18 — Rate limit is in-memory

| Field | Value |
|-------|--------|
| **Where** | `/api/join/enroll`, `/api/join/otp/request`, `/api/join/program` |
| **Blocked by** | In-memory `Map` per instance |
| **Solution** | Redis/Upstash on program GET, OTP request, and enroll (ADR-012) |
| **Status** | `DEFERRED-BACKEND` |
| **Owner** | Backend / infra |
| **Phase** | Before multi-instance prod |

### G-19 — Integrations never connect

| Field | Value |
|-------|--------|
| **Where** | Settings → Integrations → `status=pending` |
| **Blocked by** | No OAuth/API keys; POS is orders write path |
| **Solution** | Per-provider connect; keep honest modal until then |
| **Status** | `DEFERRED-BACKEND` |
| **Owner** | Backend program |
| **Phase** | 5 |

### G-20 — `rewards.redeemed_count` vs earn

| Field | Value |
|-------|--------|
| **Where** | Dashboard redemption donut; Loyalty catalog; customer wallet redeem |
| **Blocked by** | Check-in inserts `earned`; no redeem lifecycle (pending / reserve / QR scan). Previous spec described staff approve/reject — **superseded**; do not implement that path. |
| **Solution** | Customer Redeem → if Available < cost, error (no row); else `pending` + reserve + single-use QR (10 min). Staff **scan** atomically (`UPDATE … WHERE status = 'pending'`, affected rows = 1) → `completed` + consume reserved. Already completed → “already redeemed”; expired → “expired”. Scheduled job marks past-due `pending` as `expired` and releases Reserved (not client-side only). `Available = Total − Reserved`; concurrent Redeems check Available. Idempotent create and earn (unique business reference); concurrent earn+redeem same consistency model; Shop-level scan authz; Phase 1 any Staff/Admin; eligibility at create. Digital catalog rewards may complete instantly. Donut uses `completed` events. Do not implement staff Approve/Reject for physical rewards, pending PO items, or Phase 1 reverse. [reward-redemption-flow.md](../product/reward-redemption-flow.md) · [loyalty-page.md](loyalty-page.md#reward-redemption-lifecycle-decided) |
| **Status** | `DEFERRED-BACKEND` (product **DECIDED** 2026-08-16 for Phase 1 lifecycle; pending PO items in [redemption §14](../product/reward-redemption-flow.md#14-pending-owner-decisions-do-not-implement-yet)) |
| **Owner** | Backend program |
| **Phase** | 4 |

---

## Low

### G-21 — Birthday stored, automation unused

| Field | Value |
|-------|--------|
| **Where** | `birth_date`; campaign birthday audience |
| **Blocked by** | No automation worker; check-in ignores birthday double |
| **Solution** | Worker + honor `double_points_birthdays` |
| **Status** | `DEFERRED-BACKEND` |
| **Owner** | Backend program |
| **Phase** | 6 |

### G-22 — Header avatar goes to Dashboard, not Settings

| Field | Value |
|-------|--------|
| **Where** | `DashboardShell` |
| **Blocked by** | Link target |
| **Solution** | Link to `/settings` |
| **Status** | `FRONTEND-FIXABLE` |
| **Owner** | Frontend |
| **Phase** | 0 |

### G-23 — Settings tabs not in the URL; onboarding not gated

| Field | Value |
|-------|--------|
| **Where** | Settings |
| **Blocked by** | UX only |
| **Solution** | `?tab=`; onboarding redirect like other app pages |
| **Status** | `FRONTEND-FIXABLE` |
| **Owner** | Frontend |
| **Phase** | 0 |

### G-24 — Settings field labels vs columns

| Field | Value |
|-------|--------|
| **Where** | “Business Type” → `business_category`; “Industry” → `business_type` |
| **Blocked by** | Label mismatch |
| **Solution** | Align labels; expose or drop `industry` |
| **Status** | `FRONTEND-FIXABLE` |
| **Owner** | Frontend |
| **Phase** | 0 |

### G-25 — Two password UIs

| Field | Value |
|-------|--------|
| **Where** | Settings Security vs `/app/settings/password` |
| **Blocked by** | Duplicate flows; password page may skip mail |
| **Solution** | One flow; always enqueue mail |
| **Status** | `FRONTEND-FIXABLE` |
| **Owner** | Frontend |
| **Phase** | 0 |

### G-26 — MFA enroll vs login challenge

| Field | Value |
|-------|--------|
| **Where** | Settings 2FA real; sign-in may skip AAL2 |
| **Blocked by** | Sign-in MFA challenge incomplete |
| **Solution** | Handle `mfa_challenge` on `/auth/sign-in` |
| **Status** | `FRONTEND-FIXABLE` |
| **Owner** | Frontend |
| **Phase** | 0 |

### G-27 — Delete account cleanup

| Field | Value |
|-------|--------|
| **Where** | `auth.admin.deleteUser` only |
| **Blocked by** | Cascades / storage / suppressions unclear |
| **Solution** | Confirm FK cascades; delete storage; suppress email |
| **Status** | `DEFERRED-BACKEND` |
| **Owner** | Backend program |
| **Phase** | — |

### G-28 — Main branch uniqueness / delete

| Field | Value |
|-------|--------|
| **Where** | Client unsets other mains; delete of main allowed |
| **Blocked by** | No partial unique index; no server rule |
| **Solution** | Partial unique index; block delete or force reassign |
| **Status** | `DEFERRED-BACKEND` |
| **Owner** | Backend program |
| **Phase** | 4 |

### G-29 — Search placeholder on Branches

| Field | Value |
|-------|--------|
| **Where** | Copy says email/phone; filter is name/city/address |
| **Blocked by** | Copy only |
| **Solution** | Match copy to filter |
| **Status** | `FRONTEND-FIXABLE` |
| **Owner** | Frontend |
| **Phase** | 0 |

### G-30 — Suppressions have no owner UI

| Field | Value |
|-------|--------|
| **Where** | `suppressed_emails`, `email_unsubscribe_tokens` |
| **Blocked by** | No Settings UI |
| **Solution** | Optional read-only list |
| **Status** | `FRONTEND-FIXABLE` (optional) |
| **Owner** | Frontend |
| **Phase** | — |

### G-31 — Program type change after members exist

| Field | Value |
|-------|--------|
| **Where** | Loyalty copy “change anytime” |
| **Blocked by** | No lock / migration path |
| **Solution** | Lock after first customer, or migrate counters |
| **Status** | `DEFERRED-BACKEND` (copy: `FRONTEND-FIXABLE`) |
| **Owner** | Backend program |
| **Phase** | — |

### G-32 — Contact / admin plan limits unused

| Field | Value |
|-------|--------|
| **Where** | `PLAN_CONTACT_LIMITS`, `PLAN_ADMIN_LIMITS`; Settings mentions team |
| **Blocked by** | Limits unused; no team UI |
| **Solution** | Enforce contact/branch caps on enroll + add. Merchant `/app` roles: **`admin`** (buyer) and **`staff`** (**same permissions as `admin` for now**). Shop members are **`customer`**. [locked role matrix](11-authentication-migration.md#locked-role-matrix) |
| **Status** | `DEFERRED-BACKEND` |
| **Owner** | Backend program |
| **Phase** | 5 |

### G-33 — Shop customers have no register/login; KPIs rely on owner-typed rows

| Field | Value |
|-------|--------|
| **Where** | `/app/customers` Add Customer; public `/join/[programId]`; Dashboard / Analytics KPIs |
| **Blocked by** | No shop-customer auth. Rows are owner-created or anonymous join. KPIs use denormalized / owner-typed fields |
| **Solution** | Customer **register/login** (role **customer**, not `admin` / `staff` `/app`). **Passwordless:** register, login, and recovery never use a password. Public new register uses **OTP** (SMS/WhatsApp) before the member row is finalized. Lost access = **new OTP** (same channel), never `/auth/forgot-password` or the merchant `recovery` email. After OTP: inactive → generic block; existing in this shop → wallet; existing **first time in this shop** → link program; new phone → profile (name / email / DOB). Store customer-owned profile + activity. **Calculate KPIs** from that data. Owner manual add remains (no OTP). Wallet: **one card per program** (spendable points + expiry groups + `vouchers` + share link/QR + **reward progress for that program**); never a cross-program total or shop-wide progress. Routes not locked. [customer-portal-journey.md](../product/customer-portal-journey.md) · [customer-reward-progress.md](../product/customer-reward-progress.md) · [11-authentication-migration.md](11-authentication-migration.md#shop-customer-register-and-login-decided) · [credential recovery](11-authentication-migration.md#credential-recovery-decided) · [loyalty-page.md](loyalty-page.md#customer-wallet-per-program-decided) · [OTP](loyalty-page.md#otp-verification-decided) |
| **Status** | `DEFERRED-BACKEND` (product **DECIDED** 2026-08-14) |
| **Owner** | Backend program |
| **Phase** | Later (customer portal; not product Phase 1 merchant roles) |

### G-34 — Admin cannot create admin/staff with emailed temp password

| Field | Value |
|-------|--------|
| **Where** | Intended `/app` team form (route not locked; likely Settings). No UI today |
| **Blocked by** | No create-teammate API; no random password + credential email |
| **Solution** | `admin` form: profile + role `admin` \| `staff` → create `/app` user → random temp password → email (added + email + temp password) via messaging contracts. **First login must change that password** before `/app`. After the account exists, forgotten password is the **same owner recovery** (`/auth/forgot-password` → `RecoveryEmail` → `/auth/reset-password`). Admin may **re-issue a temp password** when locked out; do not treat current `invite` accept-link as reset. [11-authentication-migration.md](11-authentication-migration.md#admin-adds-admin-or-staff-decided) · [credential recovery](11-authentication-migration.md#credential-recovery-decided) |
| **Status** | `DEFERRED-BACKEND` (product **DECIDED** 2026-08-14) |
| **Owner** | Backend program |
| **Phase** | Later (merchant team; after role names) |

### G-35 — Shop is limited to one loyalty program; no program status

| Field | Value |
|-------|--------|
| **Where** | `/app/loyalty` upsert; Dashboard / Customers / Campaigns / Analytics `maybeSingle` |
| **Blocked by** | `UNIQUE (owner_id)` on `loyalty_programs`; no `status` column |
| **Solution** | Many programs per shop. Status **`draft` \| `active` \| `disabled`**. Drop unique-on-owner; stop overwrite-upsert. Join/check-in only for **`active`**. Membership/points/stamps/wallet/rewards/redemptions stay `loyalty_program_id`. Selecting one Program never auto-joins siblings. **Pending Business Owner:** whether more than one may be `active` at once, and therefore Shop QR (one-active → `/join/{programId}`; multiple-active → selection then `/join/{programId}`). Do not finalize Shop QR until that decision. [loyalty-page.md](loyalty-page.md#multiple-programs-and-status-decided) · [counter QR §15](../product/counter-qr-and-program-membership.md#15-shop-qr--multiple-active-programs-pending) |
| **Status** | `DEFERRED-BACKEND` (many programs + status **DECIDED** 2026-08-14; Shop QR / multiple ACTIVE **pending Business Owner**) |
| **Owner** | Backend program |
| **Phase** | Later (multi-program) |

### G-36 — No admin account list or active/inactive for staff/customer

| Field | Value |
|-------|--------|
| **Where** | Intended `/app` account page (route not locked) |
| **Blocked by** | No account `active`/`inactive`; no list API with role/email/name/phone filters |
| **Solution** | `admin` sets **`staff`** and **`customer`** account status `active` \| `inactive`. **One page, two tabs:** **Team** (`admin` + `staff`) and **Customers** (`customer`). Both tabs: active/inactive + filters **email**, **name**, **phone**. Team tab also filters **role** (`admin` \| `staff`). `admin` rows appear on Team; toggling another `admin` is still out. Distinct from `customers.status` (at_risk/churned) and program status. Inactive `staff` must not get `/app` after password reset; inactive `customer` must not get a session from a new OTP. [11-authentication-migration.md](11-authentication-migration.md#account-active--inactive-decided) · [credential recovery](11-authentication-migration.md#credential-recovery-decided) |
| **Status** | `DEFERRED-BACKEND` (product **DECIDED** 2026-08-14) |
| **Owner** | Backend program |
| **Phase** | Later (merchant team + customer auth) |

---

## Recommended shared data model / API / delivery order

**Moved** to backend contracts (do not maintain a second copy here):

- Schema + glossary → [data-contract.md](../backend/data-contract.md)
- Endpoints → [api-contract.md](../backend/api-contract.md)
- Phases 0–7 → [remediation-roadmap.md](../backend/remediation-roadmap.md)

---

## What already exists (do not rebuild)

| Exists | Use for |
|--------|---------|
| `customers` (points, visits, last_activity_at, created_at, status, tier, birth_date, city, gender, custom_field_value) | List, proxies, join fields |
| `loyalty_programs` + type-specific columns | Rules config (runtime still partial) |
| `loyalty_program_tiers` | Ladder to **assign** `customers.tier` |
| `rewards` + `point_cost` + `redeemed_count` | Catalog; count only until redeem lifecycle (G-20 **DECIDED**) |
| `customer_rewards` (earned_at, redeemed_at) | Earn events; wire detail + pending/completed redeem |
| `qr_page_settings` + join BFF | Branding **is** wired |
| `referral_settings` | Config; needs event table + grant writers (G-14 **DECIDED**) |
| `branches` + `profiles.plan` | Locations + intended caps |
| `notification_preferences` + `notifications` | Prefs + bell; gate the BFF |
| `integrations` | Intent rows; POS later |
| Join `recordCheckIn` | **Write path** for events + tier + visits |
| Email RPCs (`enqueue_email`, weekly/monthly) | Transactional + reports |
| Messaging contracts | Campaign/auth templates — send should use them |

---

## Colliding labels (do not mix)

Canonical glossary: [data-contract.md § Unified glossary](../backend/data-contract.md#unified-glossary). History:

| Phrase | Dashboard | Customers | Analytics | Campaigns |
|--------|-----------|-----------|-----------|-----------|
| At risk | 30-day `last_activity_at` | `status === "at_risk"` | Recency buckets (different cutoffs) | Audience string `"at-risk"` |
| Champion / Gold / VIP | Avatar color from `tier` text | Filter on `tier` text | Segments vs engagement levels vs `tier` | Audience by `tier` |
| Revenue | Sum of campaign cents | Column `"—"` | Empty tab | `revenue_cents` unused |
| Active | `status === "active"` | Same | Mix of status and recency | **Campaign status:** Active = currently sending (working); Completed = all messages processed. Unrelated to member `active`. See [campaigns-page.md](campaigns-page.md#product-meanings-decided) |
| Owner / admin | Signed-in `/app` user | Same | Same | Role **`admin`** (buyer). **`staff`** is a different name with **the same permissions for now**. Not a loyalty customer. [locked role matrix](11-authentication-migration.md#locked-role-matrix) |

Pick one glossary and one writer before adding more UI.
