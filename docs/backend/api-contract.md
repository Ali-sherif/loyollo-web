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
| GET | `/api/customers/:id` | Detail with rewards + activity | Path id (ownership check) | `{ customer, rewards[], visits_summary, ltv_cents?, referrals_count }` | G-13 |
| POST | `/api/customers/:id/redeem` | Explicit redeem | Body: `{ reward_id, branch_id?, order_id?, amount_cents? }` | `{ customer_reward, redeemed_count, order? }` | G-20, ROI |
| GET | `/api/customers/export` | CSV export (optional BFF) | Same filters as list | `text/csv` stream | G-11 |

**Redeem write rules** (see [data-contract](data-contract.md#binding-write-rules)):

1. Set `customer_rewards.redeemed_at`, `status = redeemed`, optional `branch_id`.
2. When a ticket exists: create or attach `orders` (`amount_cents`, channel/branch as known) and set `customer_rewards.order_id` in the **same transaction**.
3. Decrement points / insert `points_ledger`; increment `rewards.redeemed_count`.
4. Redemptions without `order_id` are valid operationally but **excluded from ROI** until linked.

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

### Join (extend existing)

| Method | Path | Change | Unlocks |
|--------|------|--------|---------|
| GET | `/api/join/program` | Log `visit_events` (`source=qr_view`); accept `branch` query | G-01 |
| POST | `/api/join/enroll` | Log check-in event; update points/visits (tier via `assign_customer_tier` / trigger); accept `branch`, `ref`; rate limit via Redis/Upstash (ADR-012) | G-01, G-02, G-03, G-14, G-18 |

### Billing / integrations (backend-owned)

| Method | Path | Purpose | Unlocks |
|--------|------|---------|---------|
| POST | `/api/billing/checkout` | Start paid plan | G-07 |
| POST | `/api/billing/webhook` | Sole writer of `profiles.plan` | G-07, G-32 |
| POST | `/api/integrations/:provider/connect` | OAuth/API keys; POS → `orders` | G-19, G-06 |

Exact provider paths are product choices; this row is the contract intent.

---

## Client → Supabase vs backend

| Stay client → Supabase (RLS) for now | Move to backend APIs |
|--------------------------------------|----------------------|
| Simple owner CRUD that already works under RLS (e.g. draft campaign fields, branch list reads until POST cap exists) | Paginated customers, analytics aggregates (incl. visit metrics + ROI), search, redeem, branch create with plan cap, campaign send enqueue, insight actions, billing, POS/orders ingest |
| Profile fields the owner edits directly | Anything needing service-role, multi-table transactions (visit + tier + ledger), or secrets |

When Phase 2 cutover lands (ADR-011), **all** application traffic moves to backend APIs; this table is the transitional map.

---

## Existing Next BFF (not replaced by this contract)

Documented in [system-architecture.md](../frontend/system-architecture.md#api-route-inventory):

- `/api/join/*`, `/api/campaigns/send`, `/api/notifications/owner`, `/api/account/*`, `/api/email/*`

Target end-state: `/api/campaigns/send` becomes a thin enqueue to backend (`202` + `campaign_jobs`); join gains event/tier/`ref`/`branch` behavior per data-contract write rules; notifications gate on `notification_preferences` (G-15); Analytics insight CTAs call `/api/insights/:key/actions` instead of no-ops.
