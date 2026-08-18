# Customer lifecycle state (DECIDED — not shipped)

**Status:** DECIDED 2026-08-18 · **Not implemented in code yet** (docs-only spec).

Canonical spec for **mutually exclusive** customer segmentation. One primary `lifecycle_state` per customer at any time. **New + Active + At-Risk must always equal 100%** of the customer base (no duplicate counts, no overlap).

**Related:** [data-contract § Unified glossary](data-contract.md#unified-glossary) · [analytics-page.md](../frontend/analytics-page.md) · [dashboard-page.md](../frontend/dashboard-page.md) · [customers-page.md](../frontend/customers-page.md) · [campaigns-page.md](../frontend/campaigns-page.md) · [G-08](../frontend/gaps-and-solutions.md#g-08--customer-lifecycle-single-state-decided-not-shipped)

---

## Problem today

Segmentation is **split three ways** with conflicting rules:

| Surface | Rule used today |
|---------|-----------------|
| Dashboard + Analytics | Client-side recency on `last_activity_at` (> 30 days) |
| Customers tabs + campaign send | Stored `customers.status === 'at_risk'` (never written) |
| Analytics Overview | Overlapping visit buckets (Champions, Loyal, New 30d, At risk) |
| Analytics Engagement | Different overlapping buckets (Champions, Loyal, Occasional, Dormant) |

Campaign audiences can miss at-risk members; Analytics percentages can exceed 100% when summed.

---

## Decision

Replace overlapping engagement buckets with **three exclusive lifecycle states**:

| `lifecycle_state` | Priority | Rule |
|-------------------|----------|------|
| **`at_risk`** | 1 (highest) | `last_activity_at` is not null **and** more than **30 days** ago |
| **`new`** | 2 | `created_at` within the last **14 days** (≤ 14 days) **and** customer is **not** `at_risk` |
| **`active`** | 3 | `last_activity_at` within the last **30 days** (≤ 30 days) **and** customer does **not** fit `new` or `at_risk` |

**Coverage fallback:** If a customer does not match any rule above (e.g. `last_activity_at` is null and `created_at` is older than 14 days), assign **`at_risk`**. This guarantees every member belongs to exactly one bucket.

**Distinct from:**

- **`customers.status`** — operational record (`active`, `churned`, `deleted`). Not used for lifecycle segmentation counts.
- **`customers.tier`** — loyalty ladder milestone (VIP/Gold/Silver). Orthogonal to lifecycle.
- **Engagement visit buckets** — Champions / Loyal / Occasional / Dormant are **withdrawn** for segmentation; do not reintroduce.

---

## Evaluation algorithm (pseudocode)

```
function computeCustomerLifecycleState(created_at, last_activity_at, now = now()):
  // 1. at_risk
  if last_activity_at != null AND last_activity_at < now - 30 days:
    return 'at_risk'

  // 2. new
  if created_at >= now - 14 days:
    return 'new'

  // 3. active
  if last_activity_at != null AND last_activity_at >= now - 30 days:
    return 'active'

  // fallback — full coverage
  return 'at_risk'
```

**Constants (locked for v1):**

| Constant | Value |
|----------|-------|
| `LIFECYCLE_AT_RISK_DAYS` | 30 |
| `LIFECYCLE_NEW_DAYS` | 14 |

---

## Worked examples

| created_at | last_activity_at | Result | Why |
|------------|------------------|--------|-----|
| 5 days ago | 2 days ago | **new** | Within 14-day window; not at_risk |
| 5 days ago | 45 days ago | **at_risk** | Priority 1 beats new |
| 60 days ago | 10 days ago | **active** | Recent activity; not new |
| 60 days ago | 45 days ago | **at_risk** | Stale activity |
| 60 days ago | null | **at_risk** | Fallback (no activity on record) |
| 3 days ago | null | **new** | Within 14-day window |

---

## Database (target)

### Enum

```sql
CREATE TYPE customer_lifecycle_state AS ENUM ('new', 'active', 'at_risk');
```

### Function (single source of truth)

```sql
CREATE OR REPLACE FUNCTION compute_customer_lifecycle_state(
  p_created_at timestamptz,
  p_last_activity_at timestamptz
) RETURNS customer_lifecycle_state
LANGUAGE plpgsql STABLE AS $$
BEGIN
  IF p_last_activity_at IS NOT NULL
     AND p_last_activity_at < now() - interval '30 days' THEN
    RETURN 'at_risk'::customer_lifecycle_state;
  END IF;

  IF p_created_at >= now() - interval '14 days' THEN
    RETURN 'new'::customer_lifecycle_state;
  END IF;

  IF p_last_activity_at IS NOT NULL
     AND p_last_activity_at >= now() - interval '30 days' THEN
    RETURN 'active'::customer_lifecycle_state;
  END IF;

  RETURN 'at_risk'::customer_lifecycle_state;
END;
$$;
```

### View (query-time, not stored column)

```sql
CREATE OR REPLACE VIEW customers_with_lifecycle AS
SELECT
  c.*,
  compute_customer_lifecycle_state(c.created_at, c.last_activity_at) AS lifecycle_state
FROM customers c;
```

`lifecycle_state` is **computed at query time** — not a persisted column (avoids stale data; `now()` is always current).

### Optional RPC for campaign targeting

```sql
CREATE OR REPLACE FUNCTION filter_customers_by_lifecycle(
  p_loyalty_program_id uuid,
  p_lifecycle_state customer_lifecycle_state
) RETURNS SETOF customers ...
```

---

## Shared application module (target)

**Path:** `src/lib/customer-lifecycle.ts` (web) · mirror in Nest when customer APIs ship.

| Export | Purpose |
|--------|---------|
| `computeCustomerLifecycleState(input, now?)` | Single-customer evaluation |
| `countByLifecycleState(customers, now?)` | `{ new, active, at_risk }` counts |
| `filterByLifecycleState(customers, state, now?)` | Filter list by state |
| `LIFECYCLE_LABELS`, `LIFECYCLE_SUBTITLES` | UI copy |

Logic must **match** the SQL function byte-for-byte on the same inputs.

---

## API contract (target)

Every customer-facing API that returns segmentation data must include explicit `lifecycle_state`:

| Endpoint | Field |
|----------|-------|
| `GET /api/customers` | `lifecycle_state` on each `CustomerSummary` |
| `GET /api/customers/:id` | `lifecycle_state` on detail |
| Analytics aggregates (future) | `{ new, active, at_risk, total }` — server-computed |

**Do not** require the frontend to recompute lifecycle for display counts; return the string from the backend/shared module to avoid drift.

---

## Campaign audience targeting (target)

Audiences are **mutually exclusive sets** — a customer must never match more than one lifecycle audience.

| UI audience label | Filter |
|-------------------|--------|
| All customers | No lifecycle filter |
| **New Customers** | `lifecycle_state === 'new'` |
| **Active Customers** | `lifecycle_state === 'active'` |
| **At Risk** | `lifecycle_state === 'at_risk'` |
| VIP / Gold / Silver | `tier` ILIKE (unchanged; orthogonal) |
| Birthday | `birth_date` month filter (unchanged) |

**Today:** send path queries `customers.status = 'at_risk'` and `created_at >= now - 30d` for New — **wrong window and wrong field**.

**Target:** `campaigns-service` loads `created_at` + `last_activity_at`, filters via `computeCustomerLifecycleState()` (or RPC).

---

## Frontend surfaces (target)

### Analytics — Overview tab

- Replace **Customer segments** card with **Customer lifecycle** (New, Active, At-Risk).
- Remove Champions / Loyal regulars / overlapping New (30d) buckets.
- Stat card **Active members** → count where `lifecycle_state === 'active'` (not `status === 'active'`).
- Percentages: each state ÷ total customers; three percentages sum to **100%**.

### Analytics — Engagement tab

- Replace **Engagement levels** (Champions/Loyal/Occasional/Dormant) with **Lifecycle states** (same three bars as Overview).
- **At risk of churning** insight count → `lifecycle_state === 'at_risk'`.
- Keep **Most engaged members** table (visits ranking) — not a lifecycle segment.

### Dashboard (`SetupCompleteDashboard`)

| Stat card | Target formula |
|-----------|----------------|
| Active Customers | `count(lifecycle_state === 'active')` |
| At-Risk Customers | `count(lifecycle_state === 'at_risk')` |
| Customers at Risk list | Top 3 by oldest `last_activity_at` among `at_risk` |

### Customers page

| Tab | Target filter |
|-----|---------------|
| All | none |
| New | `lifecycle_state === 'new'` |
| Active | `lifecycle_state === 'active'` |
| At-Risk | `lifecycle_state === 'at_risk'` |

Remove **Churned** tab from lifecycle tabs (or keep as separate `customers.status` filter if product requires — not part of lifecycle sum).

Table column: show **Lifecycle** pill (computed), not raw `status`.

---

## What to remove (do not ship overlapping logic)

| Withdrawn | Reason |
|-----------|--------|
| Overview: Champions, Loyal regulars, New (30d) segments | Overlap with each other and with at-risk |
| Engagement: Champions, Loyal, Occasional, At risk, Dormant levels | Overlap; different cutoffs than Overview |
| Client-side-only at-risk on Dashboard while Customers uses `status` | Three-system collision (G-08) |
| Campaign New audience: 30-day `created_at` window | Spec is **14 days** for `new` |

---

## Implementation order (when coding starts)

1. Supabase migration: enum + function + view + optional RPC
2. `src/lib/customer-lifecycle.ts` + unit tests with worked examples above
3. `campaigns-service.ts` — lifecycle audience filters
4. Analytics + Dashboard + Customers — consume shared module
5. Nest `GET /api/customers` — return `lifecycle_state` from DB function
6. Remove withdrawn bucket UI/code paths

**Phase:** Backend Remediation **P3** (G-08) · Frontend slice after shared module exists.

---

## Acceptance criteria

- [ ] Any two lifecycle states have **zero** customers in common
- [ ] `count(new) + count(active) + count(at_risk) === total customers` on Dashboard, Analytics Overview, Analytics Engagement
- [ ] Campaign send to “At Risk” and “New Customers” uses lifecycle rules (14d / 30d), not stored `status` alone
- [ ] SQL function and TS module return identical results for the worked examples table
- [ ] Docs glossary terms match this spec ([data-contract](data-contract.md), [GLOSSARY.md](../../GLOSSARY.md))
