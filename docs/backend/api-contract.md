# Backend API contract

**Status:** SPEC-READY (docs-only). Paths below are the **backend program** surface (or BFF that only forwards). Next.js must not become the system of record ([ADR-006](../architecture/decisions/ADR-006-server-boundaries.md), [ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

**Stack (DECIDED):** NestJS 11.x + Prisma 7.x + PostgreSQL 18.x ([ADR-015](../architecture/decisions/ADR-015-backend-stack.md), [README.md](README.md#target-stack-decided)). **Auth is NestJS from Product MVP (Ship 1)** (local JWT for `admin` / `staff` / `customer`; no Supabase Auth — [ADR-005](../architecture/decisions/ADR-005-authentication.md) Option C). Other paths below are Nest HTTP contracts; remaining non-auth domains may still follow the **Frontend Migration Phase 2** cutover in [ADR-011](../architecture/decisions/ADR-011-rls-storage-strategy.md).

**Related:** [data-contract.md](data-contract.md) · [remediation-roadmap.md](remediation-roadmap.md) · [gaps-and-solutions.md](../frontend/gaps-and-solutions.md) · [program-model.md](../product/program-model.md) · [phase-1-scope.md](../product/phase-1-scope.md) · [ADR-016](../architecture/decisions/ADR-016-independent-programs.md)

Authz unless noted: **owner session** = **`admin`** (buyer of Loyollo; [data-contract glossary](data-contract.md#unified-glossary)). **`staff`** uses the same `/app` APIs with **the same permissions as `admin` for now**. Scope to the caller’s Shop (`owner_id`). Service-role only in workers and public enroll.

**Shop-customer session (DECIDED, portal not shipped):** register/login for role **customer** is a separate authz plane from `admin` / `staff`. It must not authorize `/app` merchant APIs. **Passwordless:** login and lost access use OTP (SMS/WhatsApp), never merchant `/auth/forgot-password`. **Product MVP (Ship 1):** public enroll OTP + wallet QR only ([phase-1-scope.md](../product/phase-1-scope.md#otp-vs-staff-pos--resolved-split)). Portal sessions deferred ([G-33](../frontend/gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows)).

### Error envelope

Mutation, POS, OTP, and enroll errors use:

```json
{
  "code": "PROGRAM_MUTATION_BLOCKED_PENDING_CLAIMS",
  "message": "human-readable",
  "details": {}
}
```

**Product MVP (Ship 1) error codes:** `PROGRAM_MUTATION_BLOCKED_PENDING_CLAIMS`, `PROGRAM_MUTATION_BLOCKED_ACTIVE_MEMBERS`, `PROGRAM_MUTATION_BLOCKED_NOT_EXPIRED`, `REWARD_MUTATION_BLOCKED_PENDING_CLAIMS`, `PROGRAM_ACTIVE_LIMIT`, `INVOICE_DUPLICATE`, `REFERRAL_POINTS_REQUIRES_POINTS_ENABLED`, `OTP_MAX_ATTEMPTS_EXCEEDED`, `OTP_RESEND_COOLDOWN`, `DAILY_OTP_LIMIT_REACHED`, `AUTOMATIONS_NOT_AVAILABLE_PHASE1`, `SMS_CAMPAIGNS_NOT_AVAILABLE_PHASE1`, `ENROLL_VALIDATION_FAILED`, `FORBIDDEN_ROLE`, `ACCOUNT_NOT_ACTIVE`, `PLAN_DOWNGRADE_FORBIDDEN`. OTP 429 bodies include `retry_after_seconds` (in `details` or top-level — UI must not hardcode timers).

---

## Auth / session

NestJS is the sole IdP ([ADR-005](../architecture/decisions/ADR-005-authentication.md) Option C). Every successful auth response and refreshed session **must** include `role` and `account_status` from `profiles` ([data-contract](data-contract.md#profiles--role-and-account-status-s-01-g-33-g-34-g-36)). Closes **S-01** / **G-33**, **G-34**, **G-36**.

### JWT claims (access token)

| Claim | Type | Required | Notes |
|-------|------|----------|-------|
| `sub` | uuid | yes | `profiles.id` |
| `role` | string | yes | `admin` \| `staff` \| `customer` |
| `account_status` | string | yes | `active` \| `inactive` \| `pending` |
| `owner_id` | uuid | yes for merchant | Shop scope for `admin` / `staff`; `admin` → own `profiles.id`; `staff` → employing Shop’s `owner_id` |
| `email` | string | yes for merchant | Omitted or hashed for customer OTP sessions if product chooses |
| `exp` / `iat` | number | yes | Standard JWT |

Nest middleware / guards reject merchant handlers when `role === 'customer'` or `account_status !== 'active'` → **403** with `FORBIDDEN_ROLE` or `ACCOUNT_NOT_ACTIVE`.

### Session user shape (login, refresh, `GET /auth/me`)

All auth endpoints below return this user object (inside `{ user, … }`):

```json
{
  "id": "uuid",
  "email": "string|null",
  "role": "admin",
  "account_status": "active",
  "owner_id": "uuid",
  "must_change_password": false
}
```

| Field | Notes |
|-------|-------|
| `role` | From `profiles.role` — never inferred from “has `/app` login” |
| `account_status` | From `profiles.account_status` |
| `owner_id` | Merchant Shop scope; for `admin`, equals `id` |
| `must_change_password` | `true` when `account_status === 'pending'` (teammate temp password); frontend redirects to force-change before `/app` |

HTTP-only cookies on the Next.js host carry the access/refresh pair; Next forwards the JWT to Nest on BFF calls. Do not store tokens in `localStorage` in the target architecture.

### Auth endpoints

| Method | Path | Purpose | Request | Response | Unlocks |
|--------|------|---------|---------|----------|---------|
| POST | `/auth/sign-up` | Merchant self-register | `{ email, password, … }` | `{ user, access_token, refresh_token }` — `user.role = admin`, `account_status = active` | G-34 |
| POST | `/auth/sign-in` | Merchant email/password | `{ email, password }` | `{ user, access_token, refresh_token }` or **403** `ACCOUNT_NOT_ACTIVE` / `FORBIDDEN_ROLE` | S-01 |
| POST | `/auth/sign-out` | Clear session | — | `204` | — |
| POST | `/auth/refresh` | Rotate access token | Cookie or `{ refresh_token }` | `{ user, access_token }` — re-read `role` + `account_status` from DB | S-01 |
| GET | `/auth/me` | Current session | Cookie / Bearer | `{ user }` | S-01 |
| POST | `/auth/forgot-password` | Merchant reset request | `{ email }` | `{ ok: true }` | G-34 |
| POST | `/auth/reset-password` | Merchant reset confirm | `{ token, password }` | `{ user, access_token, refresh_token }` — still blocked if `account_status !== 'active'` | G-34 |
| POST | `/auth/change-password` | First-login or voluntary change | `{ current_password, new_password }` | `{ user }` — sets `account_status = active` when leaving `pending` | G-34 |
| POST | `/auth/team` | Admin creates teammate | `{ name, email, role: "admin"\|"staff" }` | `{ user }` — `account_status = pending`, emails temp password | G-34 |
| PATCH | `/auth/accounts/:id/status` | Admin sets active/inactive | `{ account_status: "active"\|"inactive" }` | `{ user }` — `staff` and `customer` only | G-36 |

Customer OTP register/login endpoints (portal, deferred) use the same JWT claim shape with `role = customer`. They must **not** authorize any `/app` or merchant `/api/*` path.

---

## Endpoints

### Customers

| Method | Path | Purpose | Request | Response (shape) | Unlocks |
|--------|------|---------|---------|------------------|---------|
| GET | `/api/customers` | Paginated list + server filters | Query: `cursor`, `q`, `status`, `tier`, `limit` | `{ items: CustomerSummary[], next_cursor? }` | G-11, G-12 scale |
| GET | `/api/customers/:id` | Detail with rewards + activity | Path id (ownership check) | `{ customer, rewards[], visits_summary, ltv_cents?, referrals_count, referral_code, enrolled_program }` | G-13, G-14 |
| POST | `/api/customers` | Owner Add Customer | Body: `full_name`, `email`, `birth_date` required (UX-75); `phone` optional until filled | `{ customer }` or `400` `ENROLL_VALIDATION_FAILED` | UX-75 |
| POST | `/api/customers/:id/erase` | GDPR purge + retain `phone_hash`; `status=deleted` | — | `{ customer_id, status: "deleted" }` | soft-delete |
| DELETE | `/api/customers/:id` | Soft-delete only (erase-lite). **405/409** if a hard delete is attempted | — | `204` or error | never HARD DELETE |
| POST | `/api/customers/:id/redeem` | Staff-facing alias for **scan/verify** of a catalog redemption **in that customer’s enrolled program**. Prefer `POST /api/redemptions/scan` below. Not a discretionary approve/reject. | Body: `{ qr_code, branch_id?, order_id?, amount_cents?, idempotency_key }` | `{ customer_reward, redeemed_count, order? }` or specific error (`already_redeemed` / `expired`) | G-20, ROI |
| GET | `/api/customers/export` | CSV export (optional BFF) | Same filters as list | `text/csv` stream | G-11 |

**Redeem write rules** (see [data-contract](data-contract.md#binding-write-rules) · [reward-redemption-flow.md](../product/reward-redemption-flow.md)):

1. Customer creates a catalog redemption **on their enrolled program only**. Snapshot live reward into `reward_snapshot`. If `Available < snapshot cost`: **refuse immediately** with a clear error — no row, no reservation. If valid: status `pending`, **reserve** snapshot `points_cost`, issue a **single-use QR** with `qr_expires_at = now + 10 minutes`. Do **not** permanently deduct until staff scan (physical) or instant complete (digital exception).
2. `Available = Total − Reserved`. Concurrent creates must check **Available**, not Total. Refuse create when required cost > available, or when a disallowed duplicate `pending` already exists for customer+program+reward.
3. Same `idempotency_key` / business operation returns the existing redemption; do not insert a second row, do not reserve points again, and do not issue a second QR (double-click, tabs, devices, network retry). Viewing the same pending row (same QR) from multiple devices is allowed.
4. Staff **scan / verify** is one transaction: still `pending` **and** `qr_expires_at > now()` → consume reserved using **`reward_snapshot`** (ignore live `point_cost` if it diverged) → `completed`, set `redeemed_at`, increment `rewards.redeemed_count`, optional `branch_id` / `order_id`. **PM-04:** complete even if reserved lot `expires_at` passed during the QR window. The write **must** be `UPDATE … WHERE status = 'pending'` (and QR still valid) with **affected row count = 1**. Already `completed` → reject with **“already redeemed”**. `expired` or past `qr_expires_at` → reject with **“expired”**. Staff scanning is **verification**, not discretionary approval — do not ship `approve` / `reject` for a valid physical QR.
5. A **scheduled job** finds `pending` rows with `qr_expires_at <= now()`, marks them `expired`, **releases** Reserved, then **purges** lots with `expires_at <= now()` (not returned to Available). Live lots return to Available. Do not decrement `period_points_earned`.
6. When a ticket exists on complete: create or attach `orders` and set `customer_rewards.order_id` in the **same** scan/complete transaction. Rows without `order_id` are valid operationally but **excluded from ROI** until linked.
7. Authz is **Shop-level**: `staff.branch.shop_id === redemption.shop_id`. Any authorized Staff from any Branch of that Shop may scan. Staff from another Shop must not. Do not authorize on `redemption_id` or `qr_code` alone. Frontend exposes a scanner; Backend enforces independently. Product MVP (Ship 1): any existing Staff or Admin role may perform Redemption scan/verify.
8. Reward eligibility / expiry is evaluated **at create** and stored in `reward_snapshot`. Later live `rewards` PATCHes must not rewrite PENDING. QR TTL (10 minutes) is independent of lot `expires_at` (PM-04).
9. Referral **voucher** redeem is `POST /api/vouchers/:id/redeem` on `vouchers` (`active` only; refuse `used` / `expired` / `now() >= expires_at`). Do not auto-apply to a cart. Not this catalog state machine.
10. **Digital exception:** a purely digital catalog reward may complete in the create transaction (no QR, no staff scan). Physical / in-person handoff uses the QR path. [§16](../product/reward-redemption-flow.md#16-digital-rewards-exception).
11. **Out of Product MVP (Ship 1):** refund / reverse; emergency cancel+refund (`cancelled`). **Do not implement** staff Approve/Reject for physical catalog rewards (previous spec — superseded). Snapshot / PM-04 / mutation guards are **DECIDED** — implement them.

### Catalog redemption lifecycle (DECIDED, not shipped)

Paths are illustrative (backend-owned). Shop-**`customer`** session for create; `admin` / `staff` for **scan/verify**, **Shop-scoped**. Product MVP (Ship 1): any existing Staff or Admin role may scan. Staff cannot reject a valid, unexpired, un-redeemed QR.

| Method | Path | Purpose | Request | Response |
|--------|------|---------|---------|----------|
| POST | `/api/me/shops/:shopId/redemptions` | Customer Redeem; persist `reward_snapshot`; if Available ≥ snapshot cost: `pending` + reserve + single-use QR (`qr_expires_at` +10 min). If Available < cost: error, no row | `{ reward_id, idempotency_key }` | `{ redemption }` including `qr_code`, `qr_expires_at`, `status`, `reward_snapshot` (same row on retry). `4xx` when Available < cost |
| GET | `/api/me/redemptions/:id` | Customer reconcile (QR + remaining TTL) | — | `{ redemption }` (`pending` / `completed` / `expired`) |
| POST | `/api/redemptions/scan` | Staff verification; atomic `PENDING → COMPLETED` | `{ qr_code, branch_id?, order_id?, idempotency_key }` | `{ redemption }` on success. Specific errors: `already_redeemed`, `expired`, wrong shop/program, QR unknown |
| — | (worker) `expire-pending-redemptions` | Find `pending` with `qr_expires_at <= now()`; mark `expired`; release Reserved | — | `{ expired_count }` |

**Superseded (do not implement for physical catalog rewards):** `POST /api/redemptions/:id/approve` and `POST /api/redemptions/:id/reject` as discretionary staff actions. Scan verifies; expiry is the job. `rejected` is not a staff choice on a valid QR.

**Out of Product MVP (Ship 1):** do not ship `POST /api/redemptions/:id/reverse`. Refund / reversal is deferred.

### Branches

| Method | Path | Purpose | Request | Response | Unlocks |
|--------|------|---------|---------|----------|---------|
| POST | `/api/branches` | Create with plan cap + main uniqueness | Body: branch fields | `{ branch }` or `403` at plan cap | G-07, G-28 |
| PATCH | `/api/branches/:id` | Update; enforce single `is_main` | Body | `{ branch }` | G-28 |
| DELETE | `/api/branches/:id` | Block delete of main or force reassign | — | `204` or `409` | G-28 |

### Analytics / search

| Method | Path | Purpose | Request | Response (shape) | Unlocks |
|--------|------|---------|---------|------------------|---------|
| GET | `/api/analytics/overview` | Aggregates for Dashboard + Analytics | Query: `from`, `to`, `tz?` | See [response contract](#analytics-overview-response) | G-01, G-02, G-06, ROI, scale Phase 7 |
| GET | `/api/search` | Header search | Query: `q` | `{ customers[], campaigns[], branches[] }` | G-05 |

#### Analytics overview response

`GET /api/analytics/overview` **must** compute from event/order facts (not fabricated even splits). Required fields once underlying tables exist:

| Field | Source | Notes |
|-------|--------|-------|
| `members` / series | `customers` | |
| `visits` / peak hours / avg days between / weekly return vs first-time | `visit_events` | Canonical SQL in [data-contract § visit_events](data-contract.md#standard-analytics-sql-visit_events) |
| `redemptions` | `customer_rewards` where `redeemed_at` set | Not earn-only inserts |
| `revenue_cents` / revenue by channel | `orders.amount_cents`, `orders.attributed_channel` | |
| `roi_from_rewards` | Formula below | `null` → UI `"—"` when investment is 0 |

**ROI from Rewards (required):**

```text
ROI % = (Attributed Revenue − Total Reward Cost) / Total Reward Cost × 100
```

- **Attributed Revenue** = `SUM(orders.amount_cents)` joined via `customer_rewards.order_id`
- **Total Reward Cost** = `SUM(rewards.cost_cents)` for those redemption rows
- Use the [canonical SQL](data-contract.md#reward-roi-formula--sql) in the data contract
- Response shape:

```json
{
  "roi_from_rewards": {
    "roi_percentage": 300.0,
    "attributed_revenue_cents": 80000,
    "total_reward_cost_cents": 20000
  }
}
```

Omit numeric `roi_percentage` or set it `null` when `total_reward_cost_cents === 0`.

Visit metrics in the same response (or nested under `engagement`) must use the Peak Hours / Average Days Between Visits / Weekly Return vs First-Time queries from the data contract — **never** derive them solely from `customers.visits`.

### Campaigns

| Method | Path | Purpose | Request | Response | Unlocks |
|--------|------|---------|---------|----------|---------|
| POST | `/api/campaigns/:id/send` | Enqueue send (**202**). **DG-08:** if `channel === "sms"` → **503** `SMS_CAMPAIGNS_NOT_AVAILABLE_PHASE1` (no job, campaign stays draft) | Body optional | `{ job_id }` on email; `{ code, message }` on SMS trial refuse — worker outside Next ([ADR-013](../architecture/decisions/ADR-013-campaign-messaging-runtime.md)) | G-09 send (opens still deferred); DG-08 |
| POST/PATCH/DELETE | `/api/campaign_automations` … | **PM-18:** hidden in **Product MVP (Ship 1)**. Writes return **503** `AUTOMATIONS_NOT_AVAILABLE_PHASE1` (or omit routes → 404). Do **not** hide campaign list / Launch | — | `{ code, message }` | DG-10 |

Do **not** hide campaign list or Launch. **DG-08:** do **not** hide SMS channel. G-09 **automations** = resolved hidden; G-09 send/opens stay deferred.

### Insights / nudge automation

Analytics Engagement insight cards expose CTAs (**Send**, **Nudge**, **Create**). Those buttons must **not** be dead UI. They call this endpoint, which materializes an audience from the insight’s dynamic query, creates a draft campaign, and optionally enqueues messaging.

| Method | Path | Purpose | Request | Response | Unlocks |
|--------|------|---------|---------|----------|---------|
| POST | `/api/insights/:key/actions` | Convert insight CTA → campaign (+ optional job) | Body: `{ action: 'send' \| 'nudge' \| 'create', channel?: 'email' \| 'sms' }` | `{ insight_action_id, campaign_id, job_id? }` | Insight CTAs, G-09 |

**:key** values (initial set; extend in shared rules module):

| `insight_key` | Audience (illustrative) | Typical CTA |
|---------------|-------------------------|-------------|
| `at_risk_churn` | `last_activity_at` **> 30 days** ago (insight at-risk window) | Send / Nudge |
| `one_visit_from_reward` | Members one visit/stamp from reward per program rules | Nudge |
| `tier_upgrade` | Members within threshold distance of next `loyalty_program_tiers` row | Create |

**Behavior by `action`:**

| `action` | Behavior |
|----------|----------|
| `create` | Insert draft `campaigns` row prefilled with insight audience + copy template; insert `insight_actions`; return `campaign_id`. No send. |
| `nudge` | Same as `create`, then enqueue `campaign_jobs` (lighter/reminder template if product defines one); return `job_id`. Worker sends outside Next ([ADR-013](../architecture/decisions/ADR-013-campaign-messaging-runtime.md)). **DG-08:** `channel: "sms"` → **503** `SMS_CAMPAIGNS_NOT_AVAILABLE_PHASE1`; draft may exist, **no** job. |
| `send` | Same as `create`, then enqueue full send via `campaign_jobs` / `POST /api/campaigns/:id/send` semantics; return `job_id`. **DG-08:** `channel: "sms"` → same 503; **no** enqueue. |

**Pipeline:**

```text
CTA click → POST /api/insights/:key/actions
         → resolve audience SQL (program-scoped)
         → INSERT campaigns (draft, audience snapshot)
         → INSERT insight_actions (audit)
         → if send|nudge: INSERT campaign_jobs + enqueue worker
         → 200 { insight_action_id, campaign_id, job_id? }
```

Persist `audience_filter` jsonb on `insight_actions` (see [data-contract](data-contract.md#insight_actions)). Frontend navigates to `/app/campaigns/{campaign_id}` on `create`, or shows “Queued” toast when `job_id` is present. Insight CTAs are **campaign send/nudge/create**, not Scheduled Automations (PM-18).

Example audience for `at_risk_churn` (must live in shared rules module, not only the UI):

```sql
SELECT id FROM customers
WHERE loyalty_program_id = :program_id
  AND last_activity_at IS NOT NULL
  AND last_activity_at < now() - interval '30 days';
```

### Programs (independent; DECIDED, not shipped)

Canonical product: [program-model.md](../product/program-model.md). Paths illustrative.

| Method | Path | Purpose | Request | Response |
|--------|------|---------|---------|----------|
| GET | `/api/programs` | List Shop programs | — | `{ items: Program[] }` including `status` |
| POST | `/api/programs` | Create `draft` | Body: type + rules | `{ program }` or `409` `PROGRAM_ACTIVE_LIMIT` if attempting a second ACTIVE without archive |
| PATCH | `/api/programs/:id` | Prospective rule/catalog edits | Body | `{ program }`. Does **not** rewrite ledger / PENDING / `reward_snapshot` |
| POST | `/api/programs/:id/activate` | Atomically archive previous ACTIVE; set this `active` | — | `{ program, archived_id? }`. **PM-07:** **400** `REFERRAL_POINTS_REQUIRES_POINTS_ENABLED` if activating non-points while referral kinds include `points` |
| POST | `/api/programs/:id/archive` | Allowed **with** members / PENDING | — | `{ program }` |
| DELETE / PATCH disable or draft | `/api/programs/:id` | **Mutation guards** | — | **409** with counts + Wait vs Archive: `PROGRAM_MUTATION_BLOCKED_*` |
| POST | `/api/programs/:id/force-soft-delete` | **Out of Product MVP (Ship 1)** — documented stub | — | `501` / omit until later phase |
| PATCH | `/api/referral-settings` | **PM-07** kinds `points` \| `voucher` | Body | `{ settings }` or **400** `REFERRAL_POINTS_REQUIRES_POINTS_ENABLED` |

Reward CRUD on a program: **409** `REWARD_MUTATION_BLOCKED_PENDING_CLAIMS` while PENDING exist. Material catalog cuts insert a `reward_version`.

### Staff POS (Product MVP Ship 1 cashier)

Square/Clover still deferred (UX-19). Authz: `admin` / `staff`, Shop-scoped.

| Method | Path | Purpose | Request | Response |
|--------|------|---------|---------|----------|
| POST | `/api/pos/scan` | Customer QR → membership + eligibility + optional **deferred migrate** | `{ qr_payload }` | `{ customer, enrolled_program, migrated?: boolean }` |
| POST | `/api/pos/transactions` | Bill Amount + Invoice Number; earn on **locked** program after migrate decision | `{ customer_id, amount_cents, invoice_number, idempotency_key, branch_id?, currency_code? }` | `{ order, membership, ledger[] }` or **409** `INVOICE_DUPLICATE` |

Idempotency: `idempotency_key` and/or `(shop_id, invoice_number)`. Snapshot `currency_code` on the order (default from `profiles.currency` when omitted). Display currency on `profiles` is metadata only — set once at onboarding, locked after `onboarding_completed` ([data-contract](data-contract.md#profiles--merchant-display-currency-ux-23--dg-09)).

### Join — OTP + enroll

Public, unauthenticated. Rate-limit OTP request **and** enroll (ADR-012). New members are **not** written until OTP succeeds.

| Method | Path | Change | Unlocks |
|--------|------|--------|---------|
| GET | `/api/join/shop/:shopSlug` | **Primary Shop join resolve.** Always this Shop’s **ACTIVE** program — no picker. 404 / unavailable if no `active` program | G-35 |
| GET | `/api/join/program` | Transitional: today’s printed `/join/{programId}`. Log `visit_events` (`source=qr_view`); accept `branch` query; if `ref` present, persist invite telemetry. Resolve UUID → Shop **ACTIVE** (do not enroll into archived). 404 if no `active` program | G-01, G-14 |
| POST | `/auth/otp/send` | **Canonical PM-06 send/resend.** Insert `otp_verifications` only — **no** `customers` / `referrals` / ledger / vouchers. Alias: `POST /api/join/otp/request` **must** share limiter + store | G-14, G-33, G-18 |
| POST | `/auth/otp/verify` | **Canonical PM-06 verify.** 3 failed guesses → **400** `OTP_MAX_ATTEMPTS_EXCEEDED` and invalidate challenge | G-14 |
| POST | `/api/join/enroll` | Verify OTP then atomically create membership on **ACTIVE**. **UX-75:** require `full_name`, `email`, `birth_date`. Existing account, first time in this Shop → one new identity. Returning phone in Shop = check-in only (no new OTP, no second identity, no second referral) | G-01, G-02, G-03, G-14, G-18, G-35 |
| POST | `/api/vouchers/:id/redeem` | Mark voucher `used`; attach `order_id`. Shop-customer or staff/admin POS. Never auto-apply at issue | G-14, G-20 |

#### `GET /api/join/shop/:shopSlug`

**Primary Shop join entry (DECIDED).** Always resolves to this Shop’s **ACTIVE** program. No program picker. Exact slug vs UUID is backend-owned; today’s `/join/{programId}` may keep working as a Shop alias that still lands on ACTIVE.

Illustrative shape:

```json
{
  "shop_slug": "string",
  "shop_id": "uuid",
  "name": "string",
  "active_program": {
    "id": "uuid",
    "program_type": "points",
    "status": "active"
  }
}
```

Join is unavailable when there is no `active` program (`404`).

#### `POST /auth/otp/send` (alias `POST /api/join/otp/request`)

```json
{
  "shop_id": "uuid",
  "phone": "+201000000000",
  "channel": "sms",
  "ref": "ABC123",
  "branch_id": "uuid"
}
```

Transitional clients may still send `program_id`; the backend resolves it to the Shop. `channel`: `"sms"` \| `"whatsapp"`. `ref` optional (omit when not a referral join).

```json
{
  "challenge_id": "uuid",
  "otp_id": "uuid",
  "expires_at": "2026-08-14T19:15:00Z",
  "channel": "sms",
  "retry_after_seconds": 60
}
```

`expires_at` is **now + 180 seconds** (PM-06). UI timers use `retry_after_seconds` — do **not** hardcode 60s / 180s.

Errors: **429** `OTP_RESEND_COOLDOWN` or `DAILY_OTP_LIMIT_REACHED` + `retry_after_seconds`; `400` invalid phone/channel; `404` Shop has no `active` program. Transport failure (stub SMS/WhatsApp) → `503` with a generic message — do not leak provider errors. ADR-012 IP limits may coexist.

Send the code through [messaging contracts](../frontend/17-messaging-templates.md). Store `code_hash` only.

#### `POST /auth/otp/verify`

```json
{
  "challenge_id": "uuid",
  "phone": "+201000000000",
  "otp_code": "123456"
}
```

Wrong code on a live challenge increments `attempts`. 3rd failure: invalidate challenge; **400** `OTP_MAX_ATTEMPTS_EXCEEDED`. Expired challenge → `400`/`410` (do not count as a guess). Default: omit remaining-guesses from the response.

#### `POST /api/join/enroll`

```json
{
  "shop_id": "uuid",
  "otp_id": "uuid",
  "otp_code": "123456",
  "phone": "+201000000000",
  "ref": "ABC123",
  "branch_id": "uuid",
  "full_name": "string",
  "email": "string",
  "birth_date": "date",
  "gender": "string",
  "city": "string",
  "custom_field_value": "string"
}
```

`otp_id` + `otp_code` + matching `phone` are **required** for a **new** member. **UX-75:** `full_name`, `email` (valid format), `birth_date` (ISO date) are **required** on new-phone enroll — **400** `ENROLL_VALIDATION_FAILED` with per-field `details`. `gender` / `city` / `custom_field_value` stay optional. Returning member (same phone/email in this Shop): treat as check-in; OTP fields may be omitted.

Success (new member):

```json
{
  "customer_id": "uuid",
  "referral": {
    "id": "uuid",
    "status": "pending",
    "referred_granted": true,
    "referrer_granted": false
  },
  "reward": {
    "kind": "voucher",
    "voucher_id": "uuid",
    "expires_at": "2026-09-13T19:10:00Z"
  }
}
```

`referral` is `null` when `ref` is absent or invalid. `status` may be `"pending_review"`. `reward.kind` is `"points"` \| `"voucher"` from `referral_settings` (**PM-07**). Invalid/expired OTP → **`401` / `410` and no member row**. Self-invite or duplicate `referred_id` → **`409`** (DB constraint). Missing UX-75 fields → **400** `ENROLL_VALIDATION_FAILED`.

Also: log check-in `visit_events`; `assign_customer_tier` (period metric); stamp lot `expires_at`; device/IP compare for `pending_review`; Sign-up Bonus on **this program enrollment**.

### Invoice.Paid (referrer release)

Internal service event. POS or billing adapter is the only writer of `orders.paid_at`. Next.js must not own this persistence ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

| Method | Path | Purpose | Unlocks |
|--------|------|---------|---------|
| POST | `/api/webhooks/invoice-paid` | Verify provider signature; set `orders.paid_at`; if this is the customer’s **first paid** invoice in the program and `referrals.status = pending`, grant the **referrer** in the **same transaction** | G-14, G-06 |

Request (shape — provider envelope may wrap this):

```json
{
  "event": "Invoice.Paid",
  "order_id": "uuid",
  "customer_id": "uuid",
  "loyalty_program_id": "uuid",
  "amount_cents": 15000,
  "paid_at": "2026-08-14T20:01:00Z",
  "external_invoice_id": "string"
}
```

Idempotent on `order_id`: a second `Invoice.Paid` must not double-grant. Unpaid order create **must not** call this path. Same earn-idempotency class as write rule 16 ([data-contract](data-contract.md#binding-write-rules)).

Response:

```json
{
  "order_id": "uuid",
  "paid_at": "2026-08-14T20:01:00Z",
  "referral": {
    "id": "uuid",
    "status": "completed",
    "referrer_granted": true
  }
}
```

`referral` is `null` when the payer is not a pending referred member. `status` stays `pending_review` if still flagged — `referrer_granted` is `false`.

### Customer wallet (session)

**Authz:** shop-**`customer`** session only. Not `/app`. Path is illustrative (portal routes not locked).

| Method | Path | Purpose | Request | Response (shape) | Unlocks |
|--------|------|---------|---------|------------------|---------|
| GET | `/api/me/wallet` | Shop memberships for this login | — | `{ shops: WalletShop[] }` | G-33, G-14, G-10 expiry |

`WalletShop`:

```json
{
  "shop_id": "uuid",
  "name": "string",
  "enrolled_program_id": "uuid",
  "program_type": "points",
  "points": {
    "total": 100,
    "reserved": 0,
    "spendable": 100,
    "period_points_earned": 80,
    "lots": [{ "amount": 100, "expires_at": "timestamptz|null" }]
  },
  "visits": { "current": 3, "required": 8 },
  "tier": { "current": "Silver", "next": "Gold", "remaining": 200 },
  "archived_history": [{ "program_id": "uuid", "program_type": "points", "spendable_points": 40, "archived_at": "timestamptz" }],
  "vouchers": [{ "voucher_id": "uuid", "discount_pct": 15, "status": "active", "expires_at": "timestamptz" }],
  "referral_code": "string",
  "share_url": "{shopJoinUrl}?ref={referral_code}",
  "progress": [
    {
      "kind": "visit",
      "current": 3,
      "target": 8,
      "remaining": 5,
      "reward_name": "string|null",
      "state": "in_progress"
    }
  ],
  "pending_redemptions": [{
    "id": "uuid",
    "reward_id": "uuid",
    "points_cost": 100,
    "status": "pending",
    "qr_code": "string",
    "qr_expires_at": "timestamptz"
  }]
}
```

Rules: one object per **Shop** identity. Show the **enrolled** program card plus `archived_history` (non-spendable). `points` / `visits` / `tier` reflect that enrolled program’s type (`null` when N/A). **Do not** include a top-level summed points field across Shops. `points.spendable` is **available** (`total − reserved`) for the enrolled program; `period_points_earned` is ladder-only (PM-08). `share_url` is this Shop’s **ACTIVE** join URL `?ref=`. Pending catalog redemptions must be reconcilable from the server. [program-model.md](../product/program-model.md#4-customer-membership-and-wallet) · [reward-redemption-flow.md](../product/reward-redemption-flow.md).

### Billing / integrations (backend-owned)

| Method | Path | Purpose | Unlocks |
|--------|------|---------|---------|
| POST | `/api/billing/checkout` | Start / **upgrade** paid plan (target `PLAN_ORDER` **>** current) | G-07, DG-04 |
| POST | `/api/billing/cancel` | Cancel at period end — does **not** write a lower `profiles.plan` now | G-07, DG-04 |
| POST | `/api/billing/webhook` | Sole writer of `profiles.plan`; reject downgrade | G-07, G-32, DG-04 |
| POST | `/api/integrations/:provider/connect` | OAuth/API keys; POS → `orders` + `Invoice.Paid` | G-19, G-06, G-14 |

Exact provider paths are product choices; this row is the contract intent.

**DG-04 (DECIDED):** no subscription **downgrade**. Rank `starter` < `growth` < `premium`. Checkout / webhook that would set a lower plan → **400** `PLAN_DOWNGRADE_FORBIDDEN`. Off a paid plan: **cancel** (current plan until `current_period_end`, then typically `starter`) or **upgrade**. Product MVP (Ship 1) may ship placeholder Billing **without** implementing these paid paths. [data-contract](data-contract.md#profiles--merchant-plan-dg-04).

---

## Client → Supabase vs backend

| Stay client → Supabase (RLS) for now | Move to backend APIs |
|--------------------------------------|----------------------|
| Simple owner CRUD that already works under RLS (e.g. draft campaign fields, branch list reads until POST cap exists) | Paginated customers, analytics aggregates (incl. visit metrics + ROI), search, **catalog redemption lifecycle**, branch create with plan cap, campaign send enqueue, insight actions, billing, POS/orders ingest, **customer wallet** (`GET /api/me/wallet`), Shop QR resolve (`GET /api/join/shop/:shopSlug`) |
| Profile fields the owner edits directly | Anything needing service-role, multi-table transactions (visit + tier + ledger), or secrets |

When Phase 2 cutover lands (ADR-011), **all** application traffic moves to backend APIs; this table is the transitional map.

---

## Existing Next BFF (not replaced by this contract)

Documented in [system-architecture.md](../frontend/system-architecture.md#api-route-inventory):

- `/api/join/*`, `/api/campaigns/send`, `/api/notifications/owner`, `/api/account/*`, `/api/email/*`

Target end-state: `/api/campaigns/send` becomes a thin enqueue to backend (`202` + `campaign_jobs`); join gains event/tier/`ref`/`branch` behavior per data-contract write rules; notifications gate on `notification_preferences` (G-15); Analytics insight CTAs call `/api/insights/:key/actions` instead of no-ops.
