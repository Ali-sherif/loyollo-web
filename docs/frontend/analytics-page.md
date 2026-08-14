# Analytics Page (`/app/analytics`)

Reference for all components, conditions, and edge cases on the Analytics route. Includes domain notes for frontend + backend work (one program per owner **today**; **DECIDED** many programs with `draft`/`active`/`disabled` — [loyalty-page.md](loyalty-page.md#multiple-programs-and-status-decided); how tiers are stored vs assigned, segment cutoffs, revenue placeholders), plus a [UI / API / DB gap analysis](#gaps-ui--api--db-and-recommended-solutions).

**Jump to:** [one program](#one-owner--one-loyalty-program) · [how tiers work](#how-customer-tiers-actually-work) · [point ranges](#loyalty-page-point-ranges-saved-vs-ui) · [segments](#customer-segments--card) · [members by tier](#members-by-tier--card--donut) · [engagement stats](#stat-cards-4) · [visit frequency](#visit-frequency-over-time--card--emptychart-disabled) · [insights](#engagement-insights--card-suggestion-cards-not-a-report) · [most engaged / tier column](#most-engaged-members--card--table) · [engagement levels](#engagement-levels--card--horizontal-bars) · [colliding labels](#three-different-systems-do-not-mix-them) · [revenue tab](#tab-3-revenuetab) · [ROI](#roi-from-rewards) · [channel](#revenue-by-channel--what-channel-means) · [gaps](#gaps-ui--api--db-and-recommended-solutions)

**Source files:**

- Route entry: `src/app/app/(shell)/analytics/page.tsx`
- Feature implementation: `src/features/analytics/analytics-page.tsx`
- Shell layout guard: `src/app/app/(shell)/layout.tsx`
- Dashboard chrome: `src/components/dashboard/DashboardShell.tsx`
- Loyalty program (tier config): `src/features/loyalty/loyalty-page.tsx`
- Tier UI: `src/components/loyalty/TierBasedFlow.tsx`, `src/components/loyalty/TierSection.tsx`
- Unique owner constraint: `supabase/migrations/20260713174353_034cd3b0-2acb-430d-b1d9-14efe9174840.sql`
- Dashboard “at risk” (30-day recency): `src/components/dashboard/SetupCompleteDashboard.tsx`
- Customers status filter: `src/features/customers/customers-page.tsx`

---

## Route structure

The URL `/app/analytics` is served by a thin Next.js page that delegates to the feature module:

```tsx
// src/app/app/(shell)/analytics/page.tsx
"use client";

import AnalyticsPage from "@/features/analytics/analytics-page";

export default function Page() {
  return <AnalyticsPage />;
}
```

The page sits under `src/app/app/(shell)/`, which applies a **server-side auth guard** before anything renders:

```tsx
// src/app/app/(shell)/layout.tsx
export default async function AppShellLayout({ children }) {
  await requireUser();
  return <>{children}</>;
}
```

Auth is enforced twice:

1. **Server** — `requireUser()` redirects unauthenticated users to `/auth/sign-in`
2. **Client** — `AnalyticsPage` runs additional checks (verification, onboarding)

---

## High-level page flow

```mermaid
flowchart TD
  A[Server: requireUser] --> B[Client: AnalyticsPage mounts]
  B --> C{loading?}
  C -->|yes| D[Full-screen spinner]
  C -->|no| E{user exists?}
  E -->|no| F[Redirect /signin]
  E -->|yes| G{isVerified?}
  G -->|no| H[Redirect /verify]
  G -->|yes| I[Fetch profile + program + data]
  I --> J{onboarding_completed?}
  J -->|no| K[Redirect /onboarding]
  J -->|yes| L{loyalty program exists?}
  L -->|no| M[ready=true, hasProgram=false]
  L -->|yes| N[Load customers + rewards, ready=true]
  M --> O[DashboardShell + tabs]
  N --> O
```

---

## `AnalyticsPage` — root component

### State

| State | Purpose |
|-------|---------|
| `fullName` | Shown in dashboard header |
| `programId` | Whether a loyalty program exists |
| `customers` | All customers for the program |
| `rewards` | All rewards for the program |
| `ready` | Data fetch finished |
| `tab` | `"overview"` \| `"engagement"` \| `"revenue"` |

### Client-side redirects (`useEffect`)

| Condition | Action |
|-----------|--------|
| `loading === true` | Wait (no redirect) |
| `!user` | → `/signin` |
| `!isVerified` | → `/verify?email=...` |
| `!profile.onboarding_completed` | → `/onboarding` |
| No loyalty program | Stay on page, `hasProgram = false` |
| Program exists | Load `customers` + `rewards` from Supabase |

### Data loading sequence

1. Fetch `profiles` (`full_name`, `onboarding_completed`) for current user
2. Fetch `loyalty_programs` where `owner_id = user.id`
3. If program exists, parallel fetch:
   - `customers` — `id, full_name, email, tier, points, visits, status, last_activity_at, created_at`
   - `rewards` — `id, name, icon, point_cost, redeemed_count`

### Loading UI

While `loading || !ready`, a centered yellow spinner is shown (not `DashboardShell`).

### Main UI (once ready)

Wrapped in `DashboardShell` with sidebar, header, notifications, and mobile nav. Analytics is highlighted under **Growth → Analytics**.

---

## Page chrome (always visible when loaded)

### Header

- **Title:** Analytics
- **Subtitle:** “A deeper look at engagement, retention, and revenue impact”
- **“This month” button** — UI only; no date filtering wired
- **“Export” button** — UI only; no export logic

### Tab bar

Three tabs switch `tab` state:

| Tab | Component | Data dependency |
|-----|-----------|-----------------|
| Overview | `OverviewTab` | `customers`, `rewards`, `hasProgram` |
| Engagement | `EngagementTab` | `customers`, `hasProgram` |
| Revenue Impact | `RevenueTab` | None (all placeholders) |

Active tab gets yellow background (`#feb602`).

---

## Tab 1: `OverviewTab`

### Global condition: no loyalty program

If `hasProgram === false` (`programId` is null), only an empty state is shown — no stat cards or charts:

> “Create a loyalty program to start seeing analytics.”

### Stat cards (4) — `StatCard`

All use real customer/reward data except deltas (always `"—"`).

| Card | Calculation |
|------|-------------|
| **Active members** | `customers.filter(c => c.status === "active").length` |
| **Redemption rate** | `pointsRedeemed / (totalPointsIssued + pointsRedeemed) * 100` — `0%` if denominator is 0 |
| **Avg. points liability** | `totalPointsIssued / activeMembers` — `0` if no active members |
| **Repeat purchase rate** | % of customers with `visits >= 2` — `0%` if no customers |

Where:

- `totalPointsIssued` = sum of all customer `points`
- `pointsRedeemed` = sum of `redeemed_count * point_cost` per reward

### Points issued vs. redeemed chart — `Card` + bar chart

| Condition | Result |
|-----------|--------|
| `customers.length === 0 && pointsRedeemed === 0` | `EmptyChart("No point activity yet.")` |
| Otherwise | 8 weekly buckets (W1–W8) |

Chart behavior:

- **Issued:** customer `points` bucketed by `created_at` (proxy — not a true transaction ledger)
- **Redeemed:** always `0` in weekly buckets (no per-week redemption events tracked)
- Bar height scales to `maxBar` (minimum 1)

### Members by tier — `Card` + `Donut`

Groups **all customers** by the stored `customers.tier` **string**. It does **not** compute tier from points, visits, or `loyalty_program_tiers` thresholds.

**Grouping rules:**

| `customers.tier` | Shown as |
|------------------|----------|
| `null` or blank | **Untiered** |
| Any other text | That exact name (Gold, VIP, …) |

Then:

- Count how many customers share each name
- `%` = count ÷ **all customers** (rounded)
- Slices sorted by count, largest first
- Colors from a **fixed palette** in the page (`#a3a3a3`, `#feb602`, `#0a152f`, `#344f89`, `#c48a5b`) — **not** `loyalty_program_tiers.color`

| Condition | Result |
|-----------|--------|
| `tierBreakdown.total === 0` | `EmptyChart("No members yet.")` |
| Otherwise | SVG donut + legend (count and % per tier) |

**Owner does not assign a customer to a tier in the UI.** They only define the program’s tier ladder (see [How customer tiers actually work](#how-customer-tiers-actually-work)). Enrollment and check-in do not write `customers.tier`, so most members currently land in **Untiered**.

### Top redeemed rewards — `Card` + `RewardIcon`

- Filters rewards with `redeemed_count > 0`, top 5 by redemptions
- **Empty:** “No redemptions yet.”
- **Per row:** icon, name, optional `point_cost`, redemption count

**`RewardIcon` cases:**

| `icon` value | Display |
|--------------|---------|
| Length ≤ 2 (emoji) | Renders emoji |
| Otherwise | Lucide fallback icon by index (`Coffee`, `Percent`, `Cookie`, `Gift`, `Crown`) |

### Customer segments — `Card`

Grouped by **recency** (`created_at` / `last_activity_at`) and **visit frequency** (`visits`). Counts are **real** (from Supabase customer rows). The cutoffs are **hardcoded in the frontend** — not configurable, not stored in program settings, same for every business.

Percentage is of total customers; shows `"—"` if no customers.

| Segment | Rule | Fields used |
|---------|------|-------------|
| **Champions** | `visits >= 10` | `visits` |
| **Loyal regulars** | `3 <= visits < 10` | `visits` |
| **New members** | Joined in the last **30 days** | `created_at` |
| **At risk** | `last_activity_at` exists AND more than **60 days** ago | `last_activity_at` |

> **Note:** Segments can **overlap** (e.g. new + champion). **At risk** excludes never-active customers (`last_activity_at` null).

These numbers are not demo placeholders: a customer with 12 visits really counts as a Champion. The `10` / `3` / `30` / `60` values are product defaults in code.

### Revenue impact (within Overview) — `Card`

**No equations run.** Every value is `"—"`. This is a layout for money metrics that need **order/transaction data**, which does not exist yet. Points and visits are **not** used as a stand-in for revenue.

**Intended meaning:** average order value (AOV) for loyalty members vs non-members.

| Box | Shown now | Intended formula (not coded) |
|-----|-----------|------------------------------|
| Loyalty members | `—` | member order totals ÷ member order count |
| Non-members | `—` | non-member order totals ÷ non-member order count |

**Required inputs (missing):** `order.amount`, `order.date`, and whether the buyer is a loyalty customer.

Green banner copy: tracking will appear once orders are linked to loyalty members. Dashes are used instead of `0` so it does not look like “zero revenue.”

Full intended metrics for the Revenue tab: [Revenue impact — intended equations](#revenue-impact--intended-equations-not-coded).

---

## Tab 2: `EngagementTab`

### Global condition: no program

Same pattern as Overview:

> “Create a loyalty program to start seeing engagement analytics.”

### Stat cards (4)

Only **two** cards calculate. The other two are always `"—"`. The “This month” header does not filter any of them.

| Card | Calculated? | Factors | Formula |
|------|-------------|---------|---------|
| **Avg. visits per member** | Yes | `customers.visits`, member count | `sum(visits) / customers.length` as `1.5x`. `"—"` if no customers. All-time; not only `status === "active"` |
| **QR scans this period** | No | none | Always `"—"`. Needs a scan/event log |
| **Avg. days between visits** | No | none | Always `"—"`. Needs visit events with timestamps |
| **30-day retention rate** | Yes, if eligible | `created_at`, `last_activity_at` | See below |

**Retention logic:**

- **Eligible:** `now - created_at >= 30 days`
- **Retained:** among those, `last_activity_at` exists and is within the last 30 days
- **Rate:** `retained / eligible * 100` (rounded)
- No eligible members → `"—"` (“Needs members ≥ 30 days old”)
- Does **not** use points, tier, or QR scans

### Visit frequency over time — `Card` + `EmptyChart` (disabled)

**Today:** no inputs, no numbers. Always empty:

> “Visit-level tracking coming soon — data will appear once scans are logged.”

The Returning / First-time legend is **decoration only**.

**Intended (not coded):** weekly bars on the X-axis, two series:

| Series | Intended meaning |
|--------|------------------|
| **First-time** | That customer’s first check-in/scan **that week** |
| **Returning** | Extra visits by the same customer later in the week |

**Why it is disabled:** needs a scan/visit **event log** (`who` + exact timestamp). The app only stores a running total on `customers.visits`, not each visit’s date. `visits`, `created_at`, and `last_activity_at` cannot tell first-time vs returning **per week**.

### Engagement insights — `Card` (suggestion cards, not a report)

Four always-visible tips. Buttons do **not** open campaigns or member lists.

| Insight | What the number is | CTA | Wired? |
|---------|--------------------|-----|--------|
| At risk of churning | Same **Engagement levels** At risk: `last_activity_at` **20–60 days** ago (not Overview > 60 days, not `customers.status`) | Send | No |
| 1 visit from a reward | `visits > 0 && visits % 5 === 4` (4, 9, 14…). The `5` is hardcoded, **not** program `visits_required` | Nudge | No |
| Peak hour | Static “coming soon” — needs visit timestamps | Explore | No |
| Tier upgrade nudges | Static “coming soon” — would use `loyalty_program_tiers` once wired | Create | No |

Pluralization: `"1 member"` vs `"N members"`.

### Most engaged members — `Card` + table

- Ranked top 5 by `visits`, then `points` (not by tier)
- **Empty:** `EmptyChart("No members yet.")`
- Columns: Customer (initials, name, optional email), **Tier**, visits, points
- Name fallback: `"Unnamed"`
- Initials fallback: `"?"` if no name

**Tier column** = `customers.tier` via `TierPill` (same as Overview donut). Not computed from visits/points or `loyalty_program_tiers`. Usually `"—"` because enroll/check-in never write `tier`.

**`TierPill` cases:**

| `tier` | Display |
|--------|---------|
| null / empty | `"—"` |
| `vip`, `gold`, `silver`, `bronze` | Colored pill + crown icon |
| anything else | Default gray pill |

### Engagement levels — `Card` + horizontal bars

**Only on this Analytics card.** Not stored in the DB. Not the same as **tiers**. Computed here from `visits` + `last_activity_at`. If `last_activity_at` is null → treated as never → **Dormant**.

| Level | Visits | Last activity |
|-------|--------|----------------|
| **Champions** | ≥ 10 | within **30** days |
| **Loyal** | 5–9 | within **30** days |
| **Occasional** | 2–4 | within **60** days |
| **At risk** | any | **20–60** days ago |
| **Dormant** | any | **> 60** days or never |

Cutoffs are hardcoded. Buckets can **overlap** (e.g. 12 visits and last seen 25 days ago = Champions **and** At risk).

| Condition | Result |
|-----------|--------|
| `totalMembers === 0` | `EmptyChart("No members yet.")` |
| Otherwise | Bar chart + summary footer |

**Summary footer:**

| Metric | Empty case |
|--------|------------|
| Champion avg visits | `"—"` if no champions |
| Occasional avg visits | `"—"` if none |
| Dormant last seen | `"—"` / `"Never active"` / `"N+ days ago"` (most recent dormant `last_activity_at`) |

**Not the same as other pages** (similar words, different rules):

| Place | Meaning |
|-------|---------|
| Overview **Customer segments** | Champions = `visits >= 10` only; At risk = last activity **> 60 days** |
| Dashboard “at risk” | last activity **> 30 days** |
| Customers page / campaign audience | `customers.status` `at_risk` / `at-risk` |
| **Tiers** | Loyalty rank (points ladder / `customers.tier`) |

---

## Tab 3: `RevenueTab`

Entirely placeholder — no `hasProgram` check, no Supabase queries, **no conditions**, **no calculations**. Points, visits, and `customers.tier` are **not** used as money.

Each stat card shows **value `"—"`**, **delta `"—"`** (would be month-over-month later), and a hint that order data is missing. Dashes are used instead of `0` so it does not look like “zero revenue.”

### Six cards

| Card | Intended meaning | Intended factors | Why empty |
|------|------------------|------------------|-----------|
| **Total Revenue Generated** | All sales in the period | `sum(order.amount)` | No orders table |
| **Loyalty-Driven Revenue** | Sales tied to loyalty (member checkout, or after a reward/campaign) | order amount + “from member / campaign” flag | Cannot tag an order as loyalty-driven |
| **ROI from Rewards** | Did rewards pay back? See [ROI from Rewards](#roi-from-rewards) | linked sales − reward **money** cost, then ÷ cost | No money cost on rewards; no linked orders |
| **Avg. revenue per member** | Spend per member | member revenue ÷ member count | No spend per customer |
| **Rewards redeemed revenue** | Sales around a redemption | order totals linked to a `customer_rewards` row | `redeemed_count` is a count, not money |
| **Top-spending member** | Who spent the most | `max(sum of orders per customer)` | No orders |

### Two charts

| Chart | Subtitle | Today | Intended |
|-------|----------|-------|----------|
| **Revenue over time** | Monthly revenue trend | EmptyChart | `sum(order.amount)` by month |
| **Revenue by channel** | Where loyalty-driven revenue comes from | EmptyChart | See [channel](#revenue-by-channel--what-channel-means) |

### Table: Revenue by reward tier

**Subtitle:** “Which tiers drive the most spend.”

| Column | Intended | Today |
|--------|----------|-------|
| **Tier** | Silver / Gold / VIP (or `loyalty_program_tiers.name`) | No rows |
| **Members** | Count in that tier | No rows |
| **Revenue** | Sum of those members’ orders | No rows |

Body copy: **“No revenue data yet.”** Needs (1) assigned tier and (2) orders. Without (2), even a filled `customers.tier` cannot show revenue.

Overview’s **Revenue impact** card is a smaller version: Loyalty members AOV vs Non-members AOV, both `"—"`.

### ROI from Rewards

**Meaning:** did giving gifts/rewards produce **net profit**, or a loss?

The card always shows `"—"`. The system stores reward cost in **points** (`point_cost`, e.g. 200 points). ROI needs a **cash cost** in currency.

**Formula:**

```text
ROI % = (revenue from the redemption ticket − cash cost of the reward)
        ÷ cash cost of the reward
        × 100
```

**Example:** 10 members redeem “free coffee”. Coffee costs the shop 20 each → investment 200. Those tickets also include 800 of extra products.

```text
ROI = (800 − 200) / 200 = 3 → 300%
```

| Factor | Meaning | In the app today |
|--------|---------|------------------|
| **Return** | `orders.amount_cents` on the ticket linked to the redemption | No orders table. `campaigns.revenue_cents` is campaign money, not redemptions |
| **Investment** | What honouring the gift **costs the owner in money** | **Not stored.** `rewards.point_cost` is points the **customer** burns, not cash |

`point_cost` is **not** currency. `redeemed_count` is a count. `customer_rewards` has `earned_at` / `redeemed_at` but no cents and no `order_id`.

Hint on the card: “Requires reward cost + revenue link.”

**How to track (backend):**

1. Cash cost on the reward:

```sql
ALTER TABLE rewards
ADD COLUMN cost_cents INT NOT NULL DEFAULT 0;
```

Owner enters this on `/app/loyalty` (cost of one free coffee, not points).

2. Link each redemption to the ticket. Prefer **extending** existing `customer_rewards` rather than a second table:

```sql
ALTER TABLE customer_rewards
ADD COLUMN order_id UUID REFERENCES orders(id);
```

If a dedicated table is preferred:

```sql
CREATE TABLE redemptions (
  id UUID PRIMARY KEY,
  reward_id UUID REFERENCES rewards(id),
  customer_id UUID REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

At redeem-in-store: create/attach the `orders` row, set `order_id` on the redemption.

3. Backend aggregation:

```sql
WITH reward_metrics AS (
  SELECT
    SUM(r.cost_cents) AS total_investment,
    SUM(o.amount_cents) AS total_return
  FROM customer_rewards red
  JOIN rewards r ON red.reward_id = r.id
  JOIN orders o ON red.order_id = o.id
  WHERE r.loyalty_program_id = :program_id
    AND red.order_id IS NOT NULL
)
SELECT
  CASE
    WHEN COALESCE(total_investment, 0) = 0 THEN NULL
    ELSE ((total_return - total_investment) / total_investment::float) * 100
  END AS roi_percentage
FROM reward_metrics;
```

Return `NULL` → UI `"—"` when investment is 0 (avoid fake 0% ROI). Use `amount_cents` consistently (not mixed pounds/cents).

### Revenue by channel — what “channel” means

**Channel is not** customer tiers and **not** visit count. It is the **source of the sale** — the path that led to the purchase.

**Today:** `campaigns.channel` is `"email"` \| `"sms"` (how you **message**). The Analytics chart is **not** bound to that column. There are no orders, so nothing to group.

**Intended:** split **loyalty-driven sales** by what motivated the buy:

| `attributed_channel` | Meaning |
|----------------------|---------|
| `email` | Sale attributed to an email campaign |
| `sms` | Sale attributed to an SMS campaign |
| `in_store` (or `qr`) | Sale at the counter / QR scan, no campaign |

**How to track (attribution):**

1. Orders must carry the source (and optional campaign):

```sql
ALTER TABLE orders
ADD COLUMN attributed_channel VARCHAR(50), -- 'email', 'sms', 'in_store'
ADD COLUMN campaign_id UUID REFERENCES campaigns(id);
```

Also store `loyalty_program_id`, `amount_cents`, `customer_id` (nullable for non-members), `occurred_at`.

2. **Tracking links / promo codes:** campaign email/SMS includes a URL or discount code with `campaign_id`. Checkout or POS redeem of that code writes `attributed_channel` from `campaigns.channel` and sets `campaign_id`. In-store QR with no code → `in_store`.

3. Backend chart query:

```sql
SELECT attributed_channel, SUM(amount_cents) AS total_revenue
FROM orders
WHERE loyalty_program_id = :program_id
GROUP BY attributed_channel;
```

Do not `GROUP BY campaigns.channel` alone — that is send-channel, not sale-channel, and unsent/unattributed campaigns would skew the chart.

---

## Domain context (loyalty + tiers + revenue)

Use this when wiring frontend and backend. Analytics assumes the current product model below.

### One owner → one loyalty program (today)

**Today** a business **cannot** have more than one loyalty program.

- DB: `CONSTRAINT loyalty_programs_owner_unique UNIQUE (owner_id)`  
  (`supabase/migrations/20260713174353_034cd3b0-2acb-430d-b1d9-14efe9174840.sql`)
- App fetches with `.eq("owner_id", user.id).maybeSingle()` (expects 0 or 1 row)
- App saves with `.upsert(..., { onConflict: "owner_id" })` — create or **overwrite** that one program

**Intended (DECIDED):** a shop has **many** programs; each is `draft` \| `active` \| `disabled`. See [loyalty-page.md](loyalty-page.md#multiple-programs-and-status-decided) and [G-35](gaps-and-solutions.md#g-35--shop-is-limited-to-one-loyalty-program-no-program-status).

There is **no** (today):

| Capability | Loyalty programs (today) | Intended | Campaigns |
|------------|--------------------------|----------|-----------|
| Draft | No | Yes (`draft`) | Yes (`status: "draft"`) |
| Multiple per shop | No | **Yes** | Yes |
| Status active / disabled | No | `active` \| `disabled` | Campaign has its own machine |
| Switch / select | No | List/select (UI not locked) | Filter by status tabs |

`draft` exists only for **campaigns** today. Opening Loyalty Program is create-or-edit of the same row until G-35 ships.

### How customer tiers actually work

Two different things:

| Layer | Table | What it is |
|-------|-------|------------|
| **Tier ladder (config)** | `loyalty_program_tiers` | Owner-defined names, colors, **minimum** `points_threshold`, benefits |
| **Customer’s current tier** | `customers.tier` (text, nullable) | What Analytics groups on |

**Owner configures the ladder, not each customer.** On `/app/loyalty`, if program type is `tier`, they add/edit/delete `loyalty_program_tiers` rows. There is no “assign this customer to Gold” control.

**The ladder is not applied yet.** Join/enroll does not set `tier`. Check-in does not compare points to thresholds. No trigger writes `customers.tier`. Analytics therefore usually shows **Untiered**.

Loyalty page “Tier stats” even hardcodes member counts as `"0"`.

### Loyalty page point ranges: saved vs UI

Ranges like **“0 – 999 pts”** / **“1,000 – 2,499 pts”** are **not** stored as from–to columns.

**Template cards** (`TierBasedFlow`) hardcode those labels. Selecting a template **saves only the start**:

| Template card (UI text) | Saved `points_threshold` |
|-------------------------|--------------------------|
| `0 – 999 pts` | `0` |
| `1,000 – 2,499 pts` | `1000` |
| `2,500+ pts` | `2500` |

After save, the list **recomputes** a range from neighboring thresholds (sorted):

- Silver `0`, Gold `1000` → shown as `0 – 999 points` / `1,000+` (or next − 1)
- Last tier: `{threshold}+ points`

The owner **can** add, edit, and delete tiers (name, color, threshold, benefits). Changing Gold from `1000` to `800` updates the stored threshold; the range label is recalculated in the UI only.

**Intended rule (copy on the edit dialog, not implemented):** “Customers will enter this tier once they reach the specified point balance.”

### Customer segments vs engagement levels

Both use hardcoded frontend cutoffs on real customer fields. They are **not** the same buckets.

| | Overview **Customer segments** | Engagement **Engagement levels** |
|--|-------------------------------|----------------------------------|
| Champions | `visits >= 10` (no recency) | `visits >= 10` AND active ≤ 30 days |
| Loyal | `3 <= visits < 10` | `5 <= visits < 10` AND active ≤ 30 days |
| Occasional | — | `2 <= visits < 5` AND active ≤ 60 days |
| New | joined last 30 days | — |
| At risk | last activity **> 60 days** (must have timestamp) | last activity **20–60 days** |
| Dormant | — | last activity **> 60 days** or never |

### Three different systems (do not mix them)

Same English words appear in several screens. They are **not** one shared model.

| System | Stored? | Based on | Where |
|--------|---------|----------|-------|
| **Tiers** (loyalty rank) | Config: `loyalty_program_tiers`. Member label: `customers.tier` (usually null) | Intended: points vs threshold. Today: unused string | `/app/loyalty`, Overview donut, Most engaged **Tier** column |
| **Activity groups** (Engagement levels) | **No** — computed only on Analytics Engagement | `visits` + `last_activity_at` | That card only |
| **Customer status** | `customers.status` (`active`, `at_risk`, …) | Whatever wrote that column (not this page’s visit math) | Customers list, campaign “at risk” audience |

A VIP who has not visited in 70 days can still be **Dormant** on Engagement levels. A Champion there can still show **—** for tier.

**“At risk” is four different rules:**

| Place | Rule |
|-------|------|
| Analytics Overview **Customer segments** | `last_activity_at` **> 60 days** (timestamp required) |
| Analytics Engagement **levels + insights** | `last_activity_at` **20–60 days** |
| Dashboard | `last_activity_at` **> 30 days** |
| Customers page / campaigns | `customers.status` is `at_risk` / `at-risk` |

### Missing scan / visit event log

Several Engagement widgets need a table of individual scans (`customer_id` + timestamp), which **does not exist**. Today only `customers.visits` (running total) and `last_activity_at` (last time) exist.

Blocked until that log exists:

- QR scans this period
- Avg. days between visits
- Visit frequency over time (first-time vs returning **per week**)
- Peak hour insight

`visits`, `created_at`, and `last_activity_at` are **not** enough for those four.

---

## Revenue impact — intended equations (not coded)

Detail for each Revenue tab widget: [Tab 3](#tab-3-revenuetab). ROI: [ROI from Rewards](#roi-from-rewards). Channel: [what channel means](#revenue-by-channel--what-channel-means).

**Today:** no factors, no formulas. UI shows `"—"`.

**Needed data source:** orders/transactions with amount, timestamp, and link to a loyalty customer (or “not a member”). Optionally `reward_id` / campaign for ROI and “loyalty-driven” revenue.

Points, visits, and `customers.tier` are **not** inputs to these metrics today.

### Overview card

| Metric | Intended equation |
|--------|-------------------|
| Loyalty members AOV | `sum(member order totals) / count(member orders)` |
| Non-members AOV | `sum(non-member order totals) / count(non-member orders)` |

### Revenue tab cards

| Metric | Intended idea | Factors |
|--------|----------------|---------|
| **Total Revenue Generated** | All sales in the period | `sum(order.amount)` |
| **Loyalty-Driven Revenue** | Sales tied to loyalty (member orders, or after reward/campaign) | order total + “from member / campaign” flag |
| **ROI from Rewards** | Did rewards pay for themselves? | revenue from redeemers ÷ cost of those rewards |
| **Avg. revenue per member** | Spend per member | member revenue ÷ member count |
| **Rewards redeemed revenue** | Sales around redemptions | order totals linked to a redemption |
| **Top-spending member** | Highest spend | `max(sum of orders per customer)` |

### Revenue tab charts

| Chart | Intended |
|-------|----------|
| Revenue over time | Monthly `sum(order.amount)` |
| Revenue by channel | Group by sale channel |
| Revenue by reward tier | Group spend by Silver/Gold/VIP (would need assigned `customers.tier` **or** live threshold matching) |

---

## Data model

### Customer (from `customers` table)

`id`, `full_name`, `email`, `tier`, `points`, `visits`, `status`, `last_activity_at`, `created_at`

- `tier` is a free-text column, not an FK to `loyalty_program_tiers`
- Analytics reads it as-is; empty → Untiered

### Reward (from `rewards` table)

`id`, `name`, `icon`, `point_cost`, `redeemed_count`

### Loyalty program (from `loyalty_programs`)

One row per `owner_id` (unique). Analytics loads that single program’s customers and rewards.

### Program tiers (from `loyalty_program_tiers`) — **not queried by Analytics**

`name`, `color`, `points_threshold` (minimum only), `benefits`, `bonus_percentage`, `points_multiplier`, `sort_order`

Used on `/app/loyalty` for config UI. Not used to classify members on Analytics until backend writes `customers.tier` (or Analytics joins thresholds to `points`).

### Orders / transactions

**Do not exist** in the current schema used by this page. Blocker for all Revenue impact metrics.

### Scan / visit events

**Do not exist.** Blocker for QR scans, days between visits, visit-frequency chart, and peak-hour insight. Only `customers.visits` (counter) and `last_activity_at` (last ping) are available.

---

## Shared building blocks

| Component | Role |
|-----------|------|
| `DashboardShell` | Sidebar, header, mobile drawer, sign out |
| `Card` | White rounded container |
| `CardHeader` | Title + optional subtitle |
| `StatCard` | Metric card with icon, value, delta, hint |
| `EmptyChart` | Dashed bordered placeholder |
| `Donut` | SVG ring chart |
| `RewardIcon` | Emoji or Lucide icon for rewards |
| `TierPill` | Tier badge with colors |
| `initials()` | Avatar initials helper |

---

## Summary of all major cases

| Scenario | What the user sees |
|----------|-------------------|
| Not logged in (server) | Redirect to `/auth/sign-in` |
| Not logged in (client) | Redirect to `/signin` |
| Unverified email | Redirect to `/verify` |
| Onboarding incomplete | Redirect to `/onboarding` |
| Loading auth or data | Full-screen spinner |
| No loyalty program | Tab empty states (Overview/Engagement); Revenue still shows placeholders |
| Program but no customers | Stats at 0/`—`; multiple empty charts |
| Program with customers | Live metrics from Supabase |
| Date range / Export buttons | No effect (not implemented) |
| Insight CTAs (Send, Nudge, etc.) | No handlers |
| Visit frequency chart | Always empty (needs scan event log) |
| QR scans / days between visits | Always `"—"` |
| Most engaged **Tier** column | Usually `"—"` (`customers.tier` unset) |
| Revenue tab | Always placeholder |

---

## Gaps (UI / API / DB) and recommended solutions

Analytics is a **client-side dashboard** over two tables (`customers`, `rewards`) for one program. Most widgets are either **proxies**, **hardcoded rules**, or **empty shells**. Existing backend remains the primary API ([ADR-006](../architecture/decisions/ADR-006-server-boundaries.md)); do not turn Next.js into an orders/POS backend ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

Indexed backlog: [gaps-and-solutions.md](gaps-and-solutions.md) · contracts: [data-contract.md](../backend/data-contract.md) · [api-contract.md](../backend/api-contract.md) · [remediation-roadmap.md](../backend/remediation-roadmap.md).

### Gap map (widget → layer)

| G-ID | Widget | UI gap | API gap | DB gap | Recommended fix |
|------|--------|--------|---------|--------|-----------------|
| — | **This month / Export** | Buttons do nothing | No period query / export | All-time counters | Period query + export BFF; hide until then (Phase 0) |
| — | **Stat deltas (↑/↓)** | Always `"—"` | No previous-period totals | No snapshots | Period aggregates (Phase 7) |
| [G-11](gaps-and-solutions.md#g-11--customer-list-will-not-scale) | **Active members / repeat rate** | Works | Client loads **all** customers | OK | Move aggregation to backend |
| [G-20](gaps-and-solutions.md#g-20--rewardsredeemed_count-vs-earn) | **Redemption rate / points chart** | Redeemed series always 0 | No points ledger API | No per-transaction log | `points_ledger` |
| [G-03](gaps-and-solutions.md#g-03--customer-tier-is-never-assigned) | **Members by tier / Most engaged Tier** | Usually Untiered | Check-in never sets `tier` | Free text, ladder unused | Write `tier` / `tier_id` |
| [G-08](gaps-and-solutions.md#g-08--three-at-risk-definitions) | **Customer segments vs Engagement levels** | Two cutoffs; overlap | Logic only in React | Nothing stored | Shared rules module + glossary |
| [G-08](gaps-and-solutions.md#g-08--three-at-risk-definitions) | **“At risk” / Champion labels** | Four meanings across pages | Campaigns use `status` | `status` vs recency | One source of truth |
| [G-02](gaps-and-solutions.md#g-02--visit--stamp-progress-is-always-empty) | **Avg. visits per member** | All-time; ignores period | No | `visits` counter | All-time or derive from events |
| [G-01](gaps-and-solutions.md#g-01--qr-scan-tracking-is-always-0) | **QR scans / days between / frequency / peak** | Empty | Check-in does not append events | No event table | `visit_events` |
| — | **Insights CTAs** | Send / Nudge / Explore / Create do nothing | No create-from-insight | N/A | Prefill campaign or hide |
| [G-02](gaps-and-solutions.md#g-02--visit--stamp-progress-is-always-empty) | **1 visit from a reward** | Uses `visits % 5 === 4` | Ignores program rules | Rules exist | Compare to `visits_required` / `point_cost` |
| [G-06](gaps-and-solutions.md#g-06--revenue-is-a-dead-column-everywhere) | **Revenue tab (all)** | Layout only | Never queries money | **No orders table** | [data-contract](../backend/data-contract.md) |
| [G-06](gaps-and-solutions.md#g-06--revenue-is-a-dead-column-everywhere) | **Revenue by channel** | Chart empty | Not joined to orders | No `attributed_channel` | See [channel](#revenue-by-channel--what-channel-means) |
| [G-06](gaps-and-solutions.md#g-06--revenue-is-a-dead-column-everywhere) / [G-20](gaps-and-solutions.md#g-20--rewardsredeemed_count-vs-earn) | **ROI from Rewards** | `"—"` | No cost + ticket join | No `cost_cents` / `order_id` | See [ROI](#roi-from-rewards) |
| [G-03](gaps-and-solutions.md#g-03--customer-tier-is-never-assigned) | **Loyalty page Tier stats = 0** | Hardcoded | Same missing assignment | Same as tier write | Same check-in assignment |

### What already exists (do not rebuild)

| Exists | Use for |
|--------|---------|
| `customers` (points, visits, last_activity_at, created_at, status, tier) | Current Overview/Engagement proxies |
| `rewards` + `redeemed_count` + `point_cost` | Top rewards (count only) |
| `loyalty_program_tiers.points_threshold` | Assign member tier |
| `customer_rewards` (earned_at, redeemed_at) | Redemption events **without money** |
| `campaigns.channel` (`email` \| `sms`), `campaigns.revenue_cents` | Messaging channel; **not** a substitute for orders |
| Check-in in join/enroll service | **Write path** for visit events + tier updates |

### Recommended revenue + visit data model

**Canonical copy:** [data-contract.md](../backend/data-contract.md). This page keeps domain notes on [ROI](#roi-from-rewards) and [channel](#revenue-by-channel--what-channel-means); do not invent a parallel schema here.

Minimum new facts (backend-owned, not Next-only): `visit_events`, `points_ledger`, `orders` (+ `attributed_channel`, `campaign_id`), `rewards.cost_cents`, `customer_rewards.order_id`, write `customers.tier` / `tier_id`.

### Recommended API shape / delivery order

See [api-contract.md](../backend/api-contract.md) (`GET /api/analytics/overview`) and [remediation-roadmap.md](../backend/remediation-roadmap.md). Do **not** keep loading every customer into the browser for analytics.

---

## Known limitations

Documented in source via `TODO(feature)` comments. Full UI / API / DB analysis and phased fixes: [Gaps](#gaps-ui--api--db-and-recommended-solutions).

Short list:

1. **Points chart** — issued is proxied from `created_at`; redeemed weekly series is not tracked
2. **Visit frequency chart** — needs timestamped scan/visit events
3. **QR scans / days between visits** — not wired
4. **Peak hour / tier nudges** — coming soon
5. **Revenue metrics** — need orders/transactions linked to members (no equations today)
6. **Month-over-month deltas** on stat cards — need historical snapshots
7. **`customers.tier` never written** — enroll/check-in do not apply `loyalty_program_tiers.points_threshold`; Analytics donut will stay Untiered until backend assigns tiers (or Analytics computes from points)
8. **One program per owner (today)** — **DECIDED:** many programs + `draft`/`active`/`disabled` ([loyalty-page.md](loyalty-page.md#multiple-programs-and-status-decided))
9. **Segment/level cutoffs** — hardcoded in the frontend; not owner-configurable
10. **Loyalty “Tier stats”** — member counts hardcoded `"0"` on `/app/loyalty`
11. **Insight CTAs** — Send / Nudge / Explore / Create have no handlers; “1 visit from a reward” uses hardcoded `visits % 5 === 4`, not program `visits_required`
12. **Engagement level overlap** — At risk (20–60 days) can also match Champions/Loyal/Occasional; not a single exclusive assignment
13. **Colliding “at risk” / “Champion” labels** — Overview, Engagement, Dashboard, and Customers/campaigns each use different rules (see [three systems](#three-different-systems-do-not-mix-them))

---

## Component tree

```
Page (analytics/page.tsx)
└── AnalyticsPage
    ├── [loading] Spinner
    └── DashboardShell
        ├── DashboardSidebar
        ├── DashboardHeader
        ├── MobileNavDrawer
        └── Main content
            ├── Header (title, date picker*, export*)
            ├── Tab bar (Overview | Engagement | Revenue)
            └── Active tab:
                ├── OverviewTab
                │   ├── StatCard × 4
                │   ├── Card (points chart) + EmptyChart?
                │   ├── Card (tier donut) + Donut + EmptyChart?
                │   ├── Card (top rewards) + RewardIcon
                │   ├── Card (segments)
                │   └── Card (revenue placeholder)
                ├── EngagementTab
                │   ├── StatCard × 4
                │   ├── Card (visit chart) + EmptyChart
                │   ├── Card (insights)
                │   ├── Card (most engaged) + TierPill
                │   └── Card (engagement levels)
                └── RevenueTab
                    ├── StatCard × 6
                    ├── Card (revenue over time) + EmptyChart
                    ├── Card (revenue by channel) + EmptyChart
                    └── Card (revenue by tier table)

* UI only — not functional
```
