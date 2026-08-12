# Analytics Page (`/app/analytics`)

Reference for all components, conditions, and edge cases on the Analytics route.

**Source files:**

- Route entry: `src/app/app/(shell)/analytics/page.tsx`
- Feature implementation: `src/features/analytics/analytics-page.tsx`
- Shell layout guard: `src/app/app/(shell)/layout.tsx`
- Dashboard chrome: `src/components/dashboard/DashboardShell.tsx`

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

**Tier grouping rules:**

- `tier` null or empty → `"Untiered"`
- Sorted by count descending
- Colors from a fixed palette

| Condition | Result |
|-----------|--------|
| `tierBreakdown.total === 0` | `EmptyChart("No members yet.")` |
| Otherwise | SVG donut + legend (count and % per tier) |

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

Four fixed segments. Percentage is of total customers; shows `"—"` if no customers.

| Segment | Rule |
|---------|------|
| **Champions** | `visits >= 10` |
| **Loyal regulars** | `3 <= visits < 10` |
| **New members** | `created_at` within last 30 days |
| **At risk** | `last_activity_at` exists AND more than 60 days ago |

> **Note:** A customer can fall into multiple segments (e.g. new + champion).

### Revenue impact (within Overview) — `Card`

Placeholder only — no order data:

- Green info banner
- Loyalty members / Non-members AOV: both `"—"`

---

## Tab 2: `EngagementTab`

### Global condition: no program

Same pattern as Overview:

> “Create a loyalty program to start seeing engagement analytics.”

### Stat cards (4)

| Card | Value | Condition |
|------|-------|-----------|
| **Avg. visits per member** | `avgVisits` or `"—"` | `"—"` if no members |
| **QR scans this period** | Always `"—"` | Not wired |
| **Avg. days between visits** | Always `"—"` | Needs visit event log |
| **30-day retention rate** | `%` or `"—"` | Only if members ≥ 30 days old exist |

**Retention logic:**

- **Eligible:** joined ≥ 30 days ago
- **Retained:** `last_activity_at` within last 30 days
- **Rate:** `retained / eligible * 100`

### Visit frequency chart — `Card` + `EmptyChart`

Always empty:

> “Visit-level tracking coming soon — data will appear once scans are logged.”

Legend (Returning / First-time) is shown but has no data.

### Engagement insights — `Card` (4 insight rows)

| Insight | Dynamic part | CTA | Wired? |
|---------|--------------|-----|--------|
| At risk of churning | `atRisk.length` (20–60 days since last activity) | Send | No |
| 1 visit from reward | `visits > 0 && visits % 5 === 4` | Nudge | No |
| Peak hour | Static “coming soon” | Explore | No |
| Tier upgrade nudges | Static “coming soon” | Create | No |

Pluralization: `"1 member"` vs `"N members"`.

### Most engaged members — `Card` + table

- Top 5 by `visits`, then `points`
- **Empty:** `EmptyChart("No members yet.")`
- Columns: Customer (initials, name, optional email), `TierPill`, visits, points
- Name fallback: `"Unnamed"`
- Initials fallback: `"?"` if no name

**`TierPill` cases:**

| `tier` | Display |
|--------|---------|
| null / empty | `"—"` |
| `vip`, `gold`, `silver`, `bronze` | Colored pill + crown icon |
| anything else | Default gray pill |

### Engagement levels — `Card` + horizontal bars

Five buckets (by visits + recency):

| Level | Rule |
|-------|------|
| **Champions** | `visits >= 10` AND active ≤ 30 days |
| **Loyal** | `5 <= visits < 10` AND active ≤ 30 days |
| **Occasional** | `2 <= visits < 5` AND active ≤ 60 days |
| **At risk** | last activity 20–60 days ago |
| **Dormant** | last activity > 60 days ago (or never) |

| Condition | Result |
|-----------|--------|
| `totalMembers === 0` | `EmptyChart("No members yet.")` |
| Otherwise | Bar chart + summary footer |

**Summary footer:**

| Metric | Empty case |
|--------|------------|
| Champion avg visits | `"—"` if no champions |
| Occasional avg visits | `"—"` if none |
| Dormant last seen | `"—"` / `"Never active"` / `"N+ days ago"` (most recent dormant member) |

---

## Tab 3: `RevenueTab`

Entirely placeholder — no `hasProgram` check, no Supabase queries.

| Section | Content |
|---------|---------|
| 6 stat cards | All values `"—"` |
| Revenue over time chart | `EmptyChart` |
| Revenue by channel chart | `EmptyChart` |
| Revenue by tier table | Header + “No revenue data yet.” |

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

## Data model

### Customer (from `customers` table)

`id`, `full_name`, `email`, `tier`, `points`, `visits`, `status`, `last_activity_at`, `created_at`

### Reward (from `rewards` table)

`id`, `name`, `icon`, `point_cost`, `redeemed_count`

Both are scoped to the owner's single loyalty program (`loyalty_programs` where `owner_id = user.id`).

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
| Revenue tab | Always placeholder |

---

## Known limitations

Documented in source via `TODO(feature)` comments:

1. **Points chart** — issued is proxied from `created_at`; redeemed weekly series is not tracked
2. **Visit frequency chart** — needs timestamped scan/visit events
3. **QR scans / days between visits** — not wired
4. **Peak hour / tier nudges** — coming soon
5. **Revenue metrics** — need orders/transactions linked to members
6. **Month-over-month deltas** on stat cards — need historical snapshots

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
