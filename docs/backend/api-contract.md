# Backend API contract

**Status:** SPEC-READY (docs-only). Paths below are the **backend program** surface (or BFF that only forwards). Next.js must not become the system of record ([ADR-006](../architecture/decisions/ADR-006-server-boundaries.md), [ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

**Related:** [data-contract.md](data-contract.md) · [remediation-roadmap.md](remediation-roadmap.md) · [gaps-and-solutions.md](../frontend/gaps-and-solutions.md)

Authz unless noted: **owner session** = **`admin`** (buyer of Loyollo; [data-contract glossary](data-contract.md#unified-glossary)). **`staff`** uses the same `/app` APIs with **the same permissions as `admin` for now**. Scope to the caller’s `loyalty_program_id` / `owner_id`. Service-role only in workers and public enroll.

**Shop-customer session (DECIDED, not shipped):** register/login for role **customer** is a separate authz plane from `admin` / `staff`. It must not authorize `/app` merchant APIs. Endpoints and identity are backend-owned ([G-33](../frontend/gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows)).

---

## Endpoints

### Customers

| Method | Path | Purpose | Request | Response (shape) | Unlocks |
|--------|------|---------|---------|------------------|---------|
| GET | `/api/customers` | Paginated list + server filters | Query: `cursor`, `q`, `status`, `tier`, `limit` | `{ items: CustomerSummary[], next_cursor? }` | G-11, G-12 scale |
| GET | `/api/customers/:id` | Detail with rewards + activity | Path id (ownership check) | `{ customer, rewards[], visits_summary, ltv_cents?, referrals_count, referral_code }` | G-13, G-14 |
| POST | `/api/customers/:id/redeem` | Explicit redeem | Body: `{ reward_id, branch_id?, order_id?, amount_cents? }` | `{ customer_reward, redeemed_count, order? }` | G-20, ROI |
| GET | `/api/customers/export` | CSV export (optional BFF) | Same filters as list | `text/csv` stream | G-11 |

**Redeem write rules** (see [data-contract](data-contract.md#binding-write-rules)):

1. Set `customer_rewards.redeemed_at`, `status = redeemed`, optional `branch_id`.
2. When a ticket exists: create or attach `orders` (`amount_cents`, channel/branch as known) and set `customer_rewards.order_id` in the **same transaction**.
3. Decrement points / insert `points_ledger`; increment `rewards.redeemed_count`.
4. Redemptions without `order_id` are valid operationally but **excluded from ROI** until linked.
5. Refuse redeem when `customer_rewards.expires_at` is set and `now() >= expires_at` (expired catalog reward if that column is used).
6. Refuse spend of a `points_ledger` lot when `expires_at` is set and `now() >= expires_at` (expired referral points). FIFO remaining unexpired lots.
7. Referral **discount** redeem is `POST /api/vouchers/:id/redeem` on `vouchers` (`active` only; refuse `used` / `expired` / `now() >= expires_at`). Do not auto-apply to a cart.

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
| POST | `/api/campaigns/:id/send` | Enqueue send (**202**) | Body optional | `{ job_id }` — worker outside Next ([ADR-013](../architecture/decisions/ADR-013-campaign-messaging-runtime.md)) | G-09 |

### Insights / nudge automation

Analytics Engagement insight cards expose CTAs (**Send**, **Nudge**, **Create**). Those buttons must **not** be dead UI. They call this endpoint, which materializes an audience from the insight’s dynamic query, creates a draft campaign, and optionally enqueues messaging.

| Method | Path | Purpose | Request | Response | Unlocks |
|--------|------|---------|---------|----------|---------|
| POST | `/api/insights/:key/actions` | Convert insight CTA → campaign (+ optional job) | Body: `{ action: 'send' \| 'nudge' \| 'create', channel?: 'email' \| 'sms' }` | `{ insight_action_id, campaign_id, job_id? }` | Insight CTAs, G-09 |

**:key** values (initial set; extend in shared rules module):

| `insight_key` | Audience (illustrative) | Typical CTA |
|---------------|-------------------------|-------------|
| `at_risk_churn` | `last_activity_at` in insight at-risk window (e.g. 20–60 days) | Send / Nudge |
| `one_visit_from_reward` | Members one visit/stamp from reward per program rules | Nudge |
| `tier_upgrade` | Members within threshold distance of next `loyalty_program_tiers` row | Create |

**Behavior by `action`:**

| `action` | Behavior |
|----------|----------|
| `create` | Insert draft `campaigns` row prefilled with insight audience + copy template; insert `insight_actions`; return `campaign_id`. No send. |
| `nudge` | Same as `create`, then enqueue `campaign_jobs` (lighter/reminder template if product defines one); return `job_id`. Worker sends outside Next ([ADR-013](../architecture/decisions/ADR-013-campaign-messaging-runtime.md)). |
| `send` | Same as `create`, then enqueue full send via `campaign_jobs` / `POST /api/campaigns/:id/send` semantics; return `job_id`. |

**Pipeline:**

```text
CTA click → POST /api/insights/:key/actions
         → resolve audience SQL (program-scoped)
         → INSERT campaigns (draft, audience snapshot)
         → INSERT insight_actions (audit)
         → if send|nudge: INSERT campaign_jobs + enqueue worker
         → 200 { insight_action_id, campaign_id, job_id? }
```

Persist `audience_filter` jsonb on `insight_actions` (see [data-contract](data-contract.md#insight_actions)). Frontend navigates to `/app/campaigns/{campaign_id}` on `create`, or shows “Queued” toast when `job_id` is present.

Example audience for `at_risk_churn` (must live in shared rules module, not only the UI):

```sql
SELECT id FROM customers
WHERE loyalty_program_id = :program_id
  AND last_activity_at < now() - interval '20 days'
  AND last_activity_at >= now() - interval '60 days';
```

### Join — OTP + enroll

Public, unauthenticated. Rate-limit OTP request **and** enroll (ADR-012). New members are **not** written until OTP succeeds.

| Method | Path | Change | Unlocks |
|--------|------|--------|---------|
| GET | `/api/join/program` | Log `visit_events` (`source=qr_view`); accept `branch` query; if `ref` present, persist invite telemetry (hashed IP + device, `invite_at`) for enroll matching | G-01, G-14 |
| POST | `/api/join/otp/request` | Start SMS or WhatsApp OTP. Insert `otp_verifications` only — **no** `customers` / `referrals` / ledger / vouchers | G-14, G-33, G-18 |
| POST | `/api/join/enroll` | Verify OTP then atomically create the member (and referral grant). Returning phone in program = check-in only (no new OTP, no second referral) | G-01, G-02, G-03, G-14, G-18 |
| POST | `/api/vouchers/:id/redeem` | Mark voucher `used`; attach `order_id`. Shop-customer or staff/admin POS. Never auto-apply at issue | G-14, G-20 |

#### `POST /api/join/otp/request`

```json
{
  "program_id": "uuid",
  "phone": "+201000000000",
  "channel": "sms",
  "ref": "ABC123",
  "branch_id": "uuid"
}
```

`channel`: `"sms"` \| `"whatsapp"`. `ref` optional (omit when not a referral join).

```json
{
  "otp_id": "uuid",
  "expires_at": "2026-08-14T19:15:00Z",
  "channel": "sms"
}
```

Errors: `429` rate limit; `400` invalid phone/channel; `404` program not `active`. Transport failure (stub SMS/WhatsApp) → `503` with a generic message — do not leak provider errors.

Send the code through [messaging contracts](../frontend/17-messaging-templates.md). Store `code_hash` only.

#### `POST /api/join/enroll`

```json
{
  "program_id": "uuid",
  "otp_id": "uuid",
  "otp_code": "123456",
  "phone": "+201000000000",
  "ref": "ABC123",
  "branch_id": "uuid",
  "name": "string",
  "email": "string",
  "birth_date": "date",
  "gender": "string",
  "city": "string",
  "custom_field_value": "string"
}
```

`otp_id` + `otp_code` + matching `phone` are **required** for a **new** member. Returning member (same phone/email in program): treat as check-in; OTP fields may be omitted.

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
    "kind": "discount",
    "voucher_id": "uuid",
    "expires_at": "2026-09-13T19:10:00Z"
  }
}
```

`referral` is `null` when `ref` is absent or invalid. `status` may be `"pending_review"`. `reward.kind` is `"points"` \| `"discount"` from `referral_settings.referred_reward_kind`. Invalid/expired OTP → **`401` / `410` and no member row**. Self-invite or duplicate `referred_id` → **`409`** (DB constraint).

Also: log check-in `visit_events`; `assign_customer_tier`; stamp lot `expires_at`; device/IP compare for `pending_review`.

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

Idempotent on `order_id`: a second `Invoice.Paid` must not double-grant. Unpaid order create **must not** call this path.

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
| GET | `/api/me/wallet` | Memberships for this login | — | `{ programs: WalletProgram[] }` | G-33, G-14, G-10 expiry |

`WalletProgram`:

```json
{
  "program_id": "uuid",
  "name": "string",
  "points_spendable": 100,
  "lots": [{ "amount": 100, "expires_at": "timestamptz|null" }],
  "vouchers": [{ "voucher_id": "uuid", "discount_pct": 15, "status": "active", "expires_at": "timestamptz" }],
  "referral_code": "string",
  "share_url": "/join/{programId}?ref={referral_code}"
}
```

Rules: one object per program membership. **Do not** include a top-level summed points field. `lots` grouped by `expires_at` so mixed windows (month vs week) are visible. [loyalty-page.md](../frontend/loyalty-page.md#customer-wallet-per-program-decided).

### Billing / integrations (backend-owned)

| Method | Path | Purpose | Unlocks |
|--------|------|---------|---------|
| POST | `/api/billing/checkout` | Start paid plan | G-07 |
| POST | `/api/billing/webhook` | Sole writer of `profiles.plan` | G-07, G-32 |
| POST | `/api/integrations/:provider/connect` | OAuth/API keys; POS → `orders` + `Invoice.Paid` | G-19, G-06, G-14 |

Exact provider paths are product choices; this row is the contract intent.

---

## Client → Supabase vs backend

| Stay client → Supabase (RLS) for now | Move to backend APIs |
|--------------------------------------|----------------------|
| Simple owner CRUD that already works under RLS (e.g. draft campaign fields, branch list reads until POST cap exists) | Paginated customers, analytics aggregates (incl. visit metrics + ROI), search, redeem, branch create with plan cap, campaign send enqueue, insight actions, billing, POS/orders ingest, **customer wallet** (`GET /api/me/wallet`) |
| Profile fields the owner edits directly | Anything needing service-role, multi-table transactions (visit + tier + ledger), or secrets |

When Phase 2 cutover lands (ADR-011), **all** application traffic moves to backend APIs; this table is the transitional map.

---

## Existing Next BFF (not replaced by this contract)

Documented in [system-architecture.md](../frontend/system-architecture.md#api-route-inventory):

- `/api/join/*`, `/api/campaigns/send`, `/api/notifications/owner`, `/api/account/*`, `/api/email/*`

Target end-state: `/api/campaigns/send` becomes a thin enqueue to backend (`202` + `campaign_jobs`); join gains event/tier/`ref`/`branch` behavior per data-contract write rules; notifications gate on `notification_preferences` (G-15); Analytics insight CTAs call `/api/insights/:key/actions` instead of no-ops.
