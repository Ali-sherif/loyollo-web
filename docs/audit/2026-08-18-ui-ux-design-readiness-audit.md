# UI/UX Design-Readiness Audit & Gap Analysis

**Date:** 2026-08-18  
**Audience:** Product lead + UI/UX Design Team (meeting brief)  
**Status:** Design-readiness only. Does not authorize schema, APIs, or a visual redesign ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md), [ADR-010](../architecture/decisions/ADR-010-style-and-template-parity.md)).  
**Scope reviewed:** all of `docs/` — product (`phase-1-scope`, `program-model`, `customer-portal-journey`, `counter-qr-and-program-membership`, `customer-reward-progress`, `reward-redemption-flow`, `auth-login-register-ui-brief`, `ui-ux-team-requests`), frontend blueprint (17 docs + 7 page specs), backend contracts, architecture/ADRs, both prior audit reports, and the product-manager meeting report.

**Jump to:** [Framing](#executive-framing) · [Locked constraints](#locked-constraints-do-not-redesign) · [1. Missing pages](#1-missing-pages--screen-gaps) · [2. Refinements](#2-uiux-refinements--modifications) · [3. Design system](#3-interactive-elements--design-system-needs) · [4. Responsive & a11y](#4-responsive--accessibility-a11y-gaps) · [5. Meeting agenda](#5-actionable-meeting-agenda--direct-questions)

**Canonical design backlog:** [ui-ux-team-requests.md](../product/ui-ux-team-requests.md) (`UX-01`…`UX-76`). This audit does not invent a parallel request list; it organizes that backlog for the meeting and adds coverage holes the requests file does not yet name.

---

## Executive framing

Say this first in the meeting.

1. **There is no standalone PRD.** Product locks live in [product-manager-meeting-report.md](../product-manager-meeting-report.md) and the page specs. The good news: `docs/product/ui-ux-team-requests.md` is already a **canonical design backlog**. This meeting should **close the OPEN items in that list**, not re-discover gaps.
2. **Docs are exceptionally strong on product logic** (state machines, OTP limits, wallet math, redemption lifecycle) and **exceptionally weak on interaction, responsive, and accessibility specs.** That asymmetry is the real risk.
3. **Split the work by ship.** Ship 1 dev-coupled design (join-page OTP, staff POS, program list, comment-out layouts) vs. next-ship design (customer portal sessions, team management). Both are P0 for design; only the first group blocks the current build.
4. **Headline:** product logic is over-specified, interaction states are under-specified, responsive is one hamburger menu, and accessibility is a blank page.

### Design-readiness verdict

| Dimension | Verdict |
|-----------|---------|
| Product rules (roles, wallet, OTP, redeem, programs) | **Ready** — locked in product + contracts |
| Existing merchant page component trees | **Ready** — richly specified (campaigns, loyalty, analytics especially) |
| New screens (portal, team, POS, program list) | **Product DECIDED, pixels not locked** |
| Loading / empty / error on `/app` pages | **Uneven** — spinners and some empties; fetch error often looks like empty |
| Offline, skeletons, 404 copy, session-return | **Missing** |
| Responsive (breakpoints, table pattern, mobile-first surfaces) | **Missing** (one mobile drawer) |
| Accessibility (WCAG, contrast, keyboard, focus) | **Missing** |
| Error-code → copy/component map | **Missing** (codes locked in [api-contract.md](../backend/api-contract.md)) |

---

## Locked constraints (do not redesign)

Design new surfaces **inside** these. Source: [ui-ux-team-requests.md § Locked constraints](../product/ui-ux-team-requests.md#locked-constraints-do-not-redesign).

| Constraint | Source |
|------------|--------|
| **No visual redesign** of existing merchant / marketing screens. Keep Tailwind tokens, Radix/shadcn, Figtree, navy `#0a152f` / yellow `#feb602`, current icons and empty-state illustrations. | [ADR-010](../architecture/decisions/ADR-010-style-and-template-parity.md) |
| **Do not change existing email/SMS template copy.** New templates are allowed; overwriting `invite.tsx` is not. | ADR-010 · [17-messaging-templates.md](../frontend/17-messaging-templates.md) |
| Roles are **`admin`** (buyer), **`staff`** (same `/app` permissions as admin **for now**), **`customer`** (never `/app`). Never `purchaser`. | [locked role matrix](../frontend/11-authentication-migration.md#locked-role-matrix) |
| `customer` register / login / recovery are **passwordless OTP** (SMS or WhatsApp). No customer password, no `/auth/forgot-password` for customers. | [credential recovery](../frontend/11-authentication-migration.md#credential-recovery-decided) |
| Campaigns: **Draft → Active (sending) → Completed / Failed**. Completed is a status, not a score. Performance is `% Open` / `% Redeemed`. | [campaigns-page.md](../frontend/campaigns-page.md#product-meanings-decided) |
| Wallet: **one card per Shop**. Never mix points across Shops (Shop A 100 + Shop B 200 ≠ 300). **Available = total − pending reserved.** | [program-model.md](../product/program-model.md) · [customer-reward-progress.md](../product/customer-reward-progress.md) |
| Shop QR is the entry to **this Shop’s ACTIVE program**. Always one destination. No program picker. | [counter-qr-and-program-membership.md](../product/counter-qr-and-program-membership.md) |
| Honesty: do not invent percentages, even-split donuts, or proxy metrics under misleading labels. Prefer `"—"` or hide. | [ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md) |
| Earn ≠ redeem. Staff scan is **verification**, never Approve/Reject. | [reward-redemption-flow.md](../product/reward-redemption-flow.md) |
| Approved merchant URLs are frozen in [02-route-migration.md](../frontend/02-route-migration.md). Customer-portal and team-management **routes are not on that map**. | 02-route-migration · [03-frontend-domains.md](../frontend/03-frontend-domains.md) |

### Product MVP (Ship 1) — already decided, do not reopen

Canonical: [phase-1-scope.md](../product/phase-1-scope.md).

| In Ship 1 | Out of Ship 1 (comment out — not flags) |
|-----------|-----------------------------------------|
| Merchant `/app` for `admin` and `staff` | Customer **portal sessions** (register/login/recovery app) |
| Public enroll OTP (PM-06) + wallet QR | Social sign-in, 2FA/MFA, Integrations tab, Apple/Google Wallet **passes** |
| Staff cashier POS (scan + bill + invoice) | Revenue / ROI widgets (comment out entirely, not `"—"`) |
| Catalog redeem (pending + 10-min QR + staff scan) | Live referrals (grants), scheduled automations (hide), team invite UI, account active/inactive admin |
| Campaigns list / Launch (SMS = visible-fail stub) | Global search, insight nudge CTAs, refund/reversal |

**OTP vs portal split:** enrollment OTP and wallet QR are **Ship 1**; persistent customer login is **not**. A member can earn at POS and redeem via QR without ever opening a customer portal app.

---

## 1. Missing Pages & Screen Gaps

### 1.1 Entire role has zero UI: the `customer` (P0)

The shop customer has **no screens today** beyond the bare `/join/[programId]` page. Required (all P0, all “No UI” per [auth-login-register-ui-brief.md](../product/auth-login-register-ui-brief.md)):

| ID | Screen | Notes |
|----|--------|-------|
| **UX-08** | Customer portal shell | Nav (wallet only vs. history/profile/vouchers), sign-out, support, language. Separate visual world from `/app`, same brand tokens. **Blocker: portal URL family is not locked** and not on the approved route map. |
| **UX-05 / UX-06** | Unified OTP funnel | Register = login = lost access. Phone (E.164 + country picker), channel picker (SMS/WhatsApp), OTP verify, edit-number loop, resend-cooldown blocked, generic inactive block, generic 503 “could not send code”, already-used. Case matrix: [customer-portal-journey.md](../product/customer-portal-journey.md) (31 cases). |
| **UX-75** | Profile setup | `full_name`, `email`, `birth_date` all required; per-field highlight on 400 `ENROLL_VALIDATION_FAILED`. |
| **UX-76** | First-shop welcome + link Shop | Welcome is **UX only** — must **not** imply a bonus unless Signup Bonus is configured. |
| **UX-07** | Wallet, one card per Shop | Locked facts: shop name; Available = total − reserved; expiry (single date **or** amount+date groups — never one date hiding a sooner lot); active vouchers; personal share link + QR (`?ref=`); reward progress (Visit stamps `current/visits_required`; Points numeric + bar to cheapest live reward; Tier milestone + remaining); pending-redemption QR + remaining TTL; Archived History (non-spendable). Open: sections vs tabs, empty wallet (zero Shops), “see all rewards,” redeem control states. |
| **UX-09** | Join page upgrade (**Ship 1 — most urgent customer surface**) | Page exists. Missing: OTP before enroll, **referral banner** for `?ref=`, unavailable empty/404 when no ACTIVE, success variants showing **this Shop’s** reward progress + this-visit delta. |

**Diagram defect:** the current Figma case-map image has **Journey B Yes/No reversed** ([customer-portal-journey.md](../product/customer-portal-journey.md) § Remaining image edits). Fix the diagram before engineering reads it.

**Join “unavailable” is a 404.** `GET /api/join/shop/:shopSlug` returns **404 when no ACTIVE program exists**. Design a branded, customer-safe 404 — not a raw error page, not only an empty canvas.

**Ship 1 vs next-ship:** public join OTP + wallet QR at enroll is **in** Ship 1. Portal sessions (UX-05/06/07/08 as a logged-in app) are **out** of Ship 1. Still design them now; do not treat them as blocking the current build.

### 1.2 Merchant team management — zero UI (P0)

Out of Product MVP (Ship 1) for **implementation**, still P0 for **design**.

| ID | Screen | Open |
|----|--------|------|
| **UX-01** | Add-teammate form (name, email, role `admin`\|`staff`; temp password is backend-generated) | Route (likely Settings/Team — not locked); extra fields; whether `staff` can open it; duplicate-email error; success pattern (toast vs. confirmation vs. “email sent”). |
| **UX-02** | First-login forced password change | Cannot skip (back button, direct URL). Full-page vs. modal vs. reuse `/app/settings/password` chrome (docs lean to parity). One-time-gate copy. |
| **UX-03** | Accounts page: **one page, two tabs** (Team = admin+staff, Customers) | Route; table vs. cards; confirm/undo on deactivate; **what the inactive person sees on next login**. |
| **UX-04** | Re-issue temp password (P1) | Row menu vs. detail; confirm copy that old password dies. |

**Third account state: `pending`.** Account status is `active` \| `inactive` \| **`pending`** (teammate created, has not completed forced first-login change). The Team tab needs a **pending chip** in addition to active/inactive. Sign-in for `pending` must route to UX-02, not a generic block. Not drawn anywhere.

Access matrix ([data-contract.md](../backend/data-contract.md)):

| `account_status` | `/app` | Customer login |
|------------------|--------|----------------|
| `active` | Allowed admin/staff | Allowed customer |
| `inactive` | Denied (even after password reset) | Denied (even after OTP) |
| `pending` | Denied until first-login password change | N/A for customer |

### 1.3 Loyalty operations redesign (P0 / P1)

| ID | Screen | Priority | Open |
|----|--------|----------|------|
| **UX-10 / UX-13** | `/app/loyalty` becomes a **program list**, not a single-row create/edit | P0 | Empty: zero programs vs. all archived. Print Shop QR (layout free, URL backend-owned). How Dashboard / Customers / Campaigns / Analytics scope when multiple programs exist (today all `maybeSingle` on one row). |
| **UX-11** | Staff cashier POS + redemption QR scan | P1 (Ship 1 product) | **Device:** `/app` page vs. dedicated scanner view. Camera-permission-denied **not specified**. |
| **UX-12** | Referral Pending Review list | P1 | Whether merchants see it at all in Ship 1 (**DG-11**). |
| **UX-14** | Campaign Scheduled tab | P1 | Design a date/time picker (owner timezone — not locked) **or hide the tab**. A tab pinned at 0 forever is not acceptable. |

Program statuses: `draft` \| `active` \| `archived` \| `disabled` \| `expired` (`soft_deleted` later-phase). One ACTIVE. Activating B archives previous ACTIVE (allowed with members). **409 mutation-guard dialog** with counts (`pending_claims`, `incomplete_members`, `expires_at`) and **Wait vs. Archive**.

POS result states that must be drawn: success / “already redeemed” / “expired” / wrong-shop / inactive member / `INVOICE_DUPLICATE`. No Approve/Reject copy for a valid QR.

### 1.4 System / edge-case screens — weakest coverage in the docs

| Surface | What exists | What’s missing |
|---------|-------------|----------------|
| **404 / not-found** | `02-route-migration.md` mandates `not-found.tsx` as a mechanism | No copy or visual spec for marketing vs. `/app` vs. portal vs. join-unavailable variants |
| **Error boundary** | `error.tsx` mandated | Retry CTA, support link, behavior when the session is gone |
| **Loading / skeletons** | `loading.tsx` named per route; most `/app` pages use a **full-screen spinner** | **No per-page skeleton spec.** Audit M9: dashboard/analytics/branches fetch failures currently render as “no data” — error is visually indistinguishable from empty |
| **Offline** | The word appears **nowhere** as a product requirement | For an in-store product (counter QR, cashier POS, flaky shop Wi-Fi) this is the single biggest edge-case hole. Minimum: join, POS scan, wallet |
| **Session expiry** | Proxy redirects to generic sign-in; `redirectedFrom` is set but never consumed (**UX-55**) | Post-login return (allow-listed paths only) |
| **429 rate-limit** | Behavior locked (toast + disable submit + no silent retry, ADR-012) | No visual spec (**UX-68**) |
| **CSRF / foreign-origin 403** | ADR-017: mutating requests with session cookie from wrong Origin → 403 | Must read as a **security rejection**, not a generic network error |
| **Success / confirmation** | Enroll success, check-in +delta copy examples exist | No shared confirmation pattern. Teammate-created: toast vs. screen is still open |
| **Messaging assets** | Existing auth templates must be preserved | Teammate-created email (**UX-61** copy + **UX-73** HTML); OTP SMS/WhatsApp text (**UX-62**, sender name open) |
| **Merchant `/auth/verify` timers** | Route map notes OTP timers | Same “timers from `retry_after_seconds`, never hardcoded” rule as PM-06 — currently only documented for customer OTP |

**Meeting caveat:** email transport is a stub that always fails (audit S-02). Do not demo email-dependent flows as if live.

**Empty-state inventory gaps (beyond UX-71):** notifications bell empty, Scheduled tab at 0, At-Risk/Churned tabs at 0 (**UX-52**), no-branches, no-archived-history on wallet, search-no-results (if search survives — **UX-33**).

### 1.5 Screens this journey needs (portal case map)

From [customer-portal-journey.md](../product/customer-portal-journey.md):

| Screen | UX | On diagram? |
|--------|----|-------------|
| Phone input + country / E.164 | UX-05 / UX-06 | Yes — add `(E.164)` on the decision label |
| Referral entry + banner | UX-09 | Yes |
| Channel picker | UX-68 | Yes |
| OTP verification (edit number, resend, paste) | UX-05 / UX-06 | Yes |
| Resend cooldown / cap block | UX-05 states | Yes (placeholder) |
| 429 toast + disable submit | UX-68 | Yes |
| Inactive account (generic) | UX-06 | Yes |
| Profile setup name / email / DOB | UX-75 | Yes |
| First-Shop welcome + link Shop | UX-76 | Yes — welcome ≠ Signup Bonus |
| Wallet per Shop | UX-07 | Yes |
| OTP already used | auth brief §6 | Yes |
| Self-referral / invalid ref | journey case 22 | **Add** |
| Reward progress on wallet / check-in success | UX-07 / UX-09 | **Add** |
| Portal shell | UX-08 | After wallet land (not required on this canvas) |
| Unavailable (no live capability) | UX-09 | Yes on Journey B — treat as branded 404 |
| Program picker | — | **Removed** |
| Journey B Yes/No wiring | UX-09 | **Fix** (currently reversed on the image) |

**Do not put on this canvas:** password, `/app`, “forgot PIN”, `pending_review` customer badge, catalog redeem, owner Add Customer.

---

## 2. UI/UX Refinements & Modifications

### 2.1 Honesty fixes — existing screens that currently mislead (P1)

These train merchants to distrust the numbers. Sources: audit §3.6, [gaps-and-solutions.md](../frontend/gaps-and-solutions.md), [ui-ux-team-requests.md §2.2](../product/ui-ux-team-requests.md).

| ID | Widget | Shows today | Ask |
|----|--------|-------------|-----|
| **UX-27** | Customers “New this month” | Gold+VIP count | Relabel to tier count **or** compute from `created_at` |
| **UX-28** | Customers “Returning Rate” | Silver count | Relabel or hide until `visit_events` |
| **UX-29 / UX-30** | Branches performance donut + per-branch cards | Even % split; program total ÷ N | Hide or `"—"` until `branch_id` |
| **UX-31** | Campaign Performance after send | `0% Open` / `0% Redeemed` | `"—"` until opens/redemptions exist (Ship 1 does **not** track opens) |
| **UX-32a** | Auth promo cards | Hardcoded `+20%` / `863.5K` / `5.6M` | Mark as marketing fiction or remove (**UX-64** same for landing hero) |
| **UX-32b / UX-20** | Dashboard / Campaigns / etc. revenue | `$0.00` as if GMV | **Comment out** for Ship 1 (same ruling as UX-20) |

### 2.2 Dead or decorative controls (P1)

Each needs a hide / disable+tooltip / wire decision. [ui-ux-team-requests.md §2.3](../product/ui-ux-team-requests.md).

| ID | Control | Where |
|----|---------|-------|
| **UX-33** | Header **Search** | Every `/app/*` shell |
| **UX-34** | **This month** | Dashboard, Analytics, Branches |
| **UX-35** | Analytics **Export** | `/app/analytics` |
| **UX-36** | Insight CTAs Send / Nudge / Explore / Create | Analytics Engagement |
| **UX-37** | Live Activity **View All** | Dashboard |
| **UX-38** | Contact form submit | `/contact` (`setTimeout` fake; map is real, Vancouver coords) |
| **UX-39** | Customers **Send Campaign** | List row + detail (no audience prefill) |
| **UX-40a** | “1 visit from a reward” uses `visits % 5` | Analytics Insights |
| **UX-41** | Dashboard checklist “Launch campaign” | Existence of any **draft** counts |
| **UX-41a** | Loyalty **Send Upgrade Nudge** | Would toast success on an empty list |
| **UX-41b** | Referrals **Top referrers** | Hardcoded empty array |

### 2.3 IA, layout, and flow fixes on existing screens

| ID | Issue | Ask |
|----|-------|-----|
| **UX-45** | Two password UIs (Settings Security vs. `/app/settings/password`) | One flow. **Password-page success currently redirects to `/` (marketing homepage)** after 1.5s — should land in `/app/settings` with a toast. |
| **UX-43 / UX-44** | Settings tabs are React state, not URL; Settings reachable mid-onboarding | `?tab=` so Notifications is deep-linkable; same onboarding gate as other `/app` pages |
| **UX-42** | Header avatar → `/dashboard` | Link to `/app/settings` (or a menu) |
| **UX-13 / UX-47** | `/app/loyalty` is create-and-edit of one row; copy says “change type anytime” | Type locks on a live row; create a new program and activate |
| **UX-53** | Campaign **Enable** sets Active without sending | Enable on a disabled draft restores **Draft**. Completed tab currently never fills |
| **UX-50** | Customer detail hero defaults null tier to **Bronze**; list shows empty | One empty treatment |
| **UX-51** | Branch detail: fake grey bars | Remove; `"—"` / empty copy |
| **UX-48** | Join fields `gender` / `city` / `custom_field_value` hidden from owner | Show on customer detail / add dialog |
| **UX-49** | Customer detail LTV / referrals / transactions / rewards “Coming soon” | Honest empty vs hide until APIs |
| **UX-52** | Customers At-Risk / Churned tabs always 0 | Hide until a writer exists, or compute from recency after UX-25 / lifecycle |
| **UX-54** | No loyalty program: Customers/Campaigns empty list; Analytics has a dedicated empty canvas | One empty-program pattern |
| **UX-55** | Session timeout lands on generic sign-in | Design post-login return (allow-listed paths only) |
| **UX-58** | Email change disabled on Settings | Keep disabled with explanation, or design Auth email-change flow |
| **UX-59** | Reward “on completion” is a free-text label | Picker from Rewards tab vs keep string |
| **UX-60** | Settings subtitle mentions “team members” with no team UI | Point at UX-01/03 or drop the phrase |
| **UX-60a** | Loyalty advanced rules saved but unused | Hide until POS honours them, or mark “not applied yet” |
| **UX-60b / UX-60g** | Loyalty QR / visit / tier-member stats hardcoded `"0"` | `"—"` or hide until events |
| **UX-60c** | Notification toggles save but in-app bell ignores them | Disable toggles, or annotate “email only / not applied yet” |
| **UX-60d** | Delete last / **main** branch allowed; no reassign | Confirm + block, or force pick a new main |
| **UX-60e** | Reward performance dialog: revenue and per-tier counts are 0 | `"—"` / hide until redeem + orders |
| **UX-60f** | Campaign “At Risk” audience matches nobody | Empty-state copy must not look like a data problem the owner caused |

### 2.4 Additional flow bugs found in page specs

- **Campaigns table rows do not navigate on click** — only RowMenu “View” does. Either make rows clickable or document the deliberate choice (inconsistent vs. Customers / Top-Customers links).
- **Inconsistent unauthenticated redirects:** branch detail bounces to `/auth` while everything else uses `/auth/sign-in`; campaign detail skips the onboarding check that other `/app` pages enforce. One redirect map, one gate set.
- **Notifications bell shows newest 10 with no pagination** and no “view all” — dedicated page, “recent only” label, or pagination.
- **Dashboard checklist buttons still navigate when the step is complete** — confirm intended, or switch completed rows to a non-navigating state.

### 2.5 Ship 1 comment-out creates a layout-rebalancing task

[phase-1-scope.md § Code inventory](../product/phase-1-scope.md#code-inventory--blocks-to-comment-out-for-ship-1) locks removal-by-commenting of:

- Settings **Integrations tab** and Security **2FA card**
- Analytics **Revenue Impact tab** + Overview revenue card
- Revenue tiles/columns on Dashboard, Campaigns, Customers, Branches, Rewards

Deleting tabs/cards/columns changes grids, tab bars, and table widths. **Design must review the post-exclusion layouts** so the product doesn’t look amputated (orphaned subtitles like “…and revenue impact” are explicitly called out for trimming).

### 2.6 Terminology collisions to resolve visually

Four different “status” families will appear in one product. Distinct pill families are **UX-69** (program) and **UX-70** (account). Design must not collide them.

| Family | Values | Where |
|--------|--------|-------|
| **Account** | `active` / `inactive` / **`pending`** | UX-03 Team tab |
| **Member engagement / lifecycle** | `new` / `active` / `at_risk` (computed) | Dashboard, Analytics, Customers tabs, campaign audiences |
| **Program** | `draft` / `active` / `archived` / `disabled` / `expired` | UX-10 list |
| **Campaign** | Draft / Active (= **sending**) / Completed / Failed | Campaigns |

**At-risk cutoff is resolved (DG-14):** no activity for **> 30 consecutive days**. Remaining: restyle labels so “At risk” / “Champion” are not confused with tier names.

**Lifecycle vs engagement buckets (confirm in the meeting):** [customer-lifecycle.md](../backend/customer-lifecycle.md) (DECIDED) **withdraws Champions / Loyal / Occasional / Dormant** and replaces them with a computed, mutually exclusive lifecycle (`new` ≤14d / `active` ≤30d / `at_risk` >30d). That likely **resolves DG-15**. Concrete UI: Customers tabs become **All / New / Active / At-Risk** (Churned moves to a separate status filter); a lifecycle **pill column** replaces raw status; Analytics labels change. `ui-ux-team-requests.md` still lists DG-15 as open — **confirm which doc wins** before anyone designs segment legends.

**Campaign send is now async:** **202 + `job_id`**. StatusPill family needs a **“Queued / Sending”** treatment. Insight CTAs need a “Queued” toast + navigate-to-prefilled-campaign pattern (when those CTAs are in scope).

---

## 3. Interactive Elements & Design System Needs

### 3.1 Micro-interactions / dynamic states the docs require but no one has drawn

- **OTP component:** 6-digit; paste allowed; `autocomplete="one-time-code"`; countdowns from `retry_after_seconds` / `expires_at` — **never hardcode 60s/180s** (PM-06); 3-failed-guesses (`OTP_MAX_ATTEMPTS_EXCEEDED`); already-used; edit-number invalidates the old challenge; resend-cooldown blocked; 429 daily-cap toast with disabled submit.
- **Redeem (customer):** disable Redeem after submit; single-use QR with a **live 10-minute countdown**; multi-device reconciliation (same pending QR on every device; completed/expired must propagate); insufficient-Available → clear error, no QR.
- **Staff scanner:** result feedback per state (success / already redeemed / expired / wrong shop / inactive member / duplicate invoice); camera-permission-denied; manual phone fallback.
- **409 mutation-guard dialog:** Wait vs. Archive with live counts.
- **Forms:** per-field error highlight (enroll); E.164 phone validation; password strength + match parity with existing Settings password UI; duplicate-email on add-teammate; disabled-with-explanation pattern (Settings email field, insight CTAs).
- **Not documented anywhere:** hover / active / focus / disabled specs for existing components. The design system needs a **states layer**, not just components.

### 3.2 Design-system components to add (extend, don’t rebrand — ADR-010)

Locked base: Tailwind tokens, Radix/shadcn, Figtree, navy/yellow, existing empty-state illustrations.

| # | Component | UX IDs |
|---|-----------|--------|
| 1 | Toast/notification system with a distinct **429 variant** + success/error/warning | UX-68, ADR-012 |
| 2 | **Four status-pill families** (program / campaign / member-lifecycle / account) with anti-collision rules | UX-69, UX-70 |
| 3 | OTP input + channel picker (SMS/WhatsApp icons, selected states) | UX-68 |
| 4 | **Wallet card** (per-Shop, capability sections) — the single most important new component | UX-66 |
| 5 | Stamp row + progress-to-next-reward bar (real membership numbers — never the merchant preview that always fills 3 stamps) | UX-07 |
| 6 | Share sheet (copy link / save QR / native share) | UX-72 |
| 7 | Empty-state illustration **rules:** telescope = “no data” only; **errors (429, inactive) get different treatment** | UX-71 |
| 8 | QR display + print layout (Shop QR print flow) | UX-10 |
| 9 | Confirmation-dialog pattern (deactivate teammate, delete main branch, archive program) with optional undo | UX-03, UX-60d |
| 10 | Date/time picker (campaign scheduling, owner timezone — if UX-14 goes “design”) | UX-14 |
| 11 | Token chips for `{{name}}` / `{{first_name}}` / `{{business_name}}` in campaign create | UX-16, UX-63 |
| 12 | Skeleton library per route (`loading.tsx`) + a **table→card responsive pattern** for Customers / Campaigns / Accounts | — |
| 13 | Email HTML: teammate-created at parity with existing React Email auth set; OTP SMS/WhatsApp text | UX-73, UX-61, UX-62 |

### 3.3 Error-code → UI map (assignable deliverable)

Every code is locked in [api-contract.md](../backend/api-contract.md). **None have designed copy or a designated component.** Envelope:

```json
{ "code": "...", "message": "human-readable", "details": {} }
```

OTP 429 bodies include **`retry_after_seconds`** — UI must **not hardcode** timers.

#### Full-screen / blocked states

| Code | HTTP | UI |
|------|------|-----|
| `ACCOUNT_NOT_ACTIVE` | 403 | Inactive/pending denial — **generic** copy (no enumeration) |
| `FORBIDDEN_ROLE` | 403 | Wrong role for surface (customer never `/app`) |
| Foreign-origin CSRF reject | 403 | Security rejection, not a network error (ADR-017) |

#### Dialogs with structured content (409 + counts)

| Code | UI |
|------|-----|
| `PROGRAM_MUTATION_BLOCKED_PENDING_CLAIMS` | Wait vs Archive + `pending_claims` |
| `PROGRAM_MUTATION_BLOCKED_ACTIVE_MEMBERS` | Wait vs Archive + `incomplete_members` |
| `PROGRAM_MUTATION_BLOCKED_NOT_EXPIRED` | Wait vs Archive + `expires_at` |
| `REWARD_MUTATION_BLOCKED_PENDING_CLAIMS` | Block reward delete/disable |
| `PROGRAM_ACTIVE_LIMIT` | Cannot second ACTIVE without archive |

#### Inline field errors

| Code | HTTP | UI |
|------|------|-----|
| `ENROLL_VALIDATION_FAILED` | 400 | Per-field `details` on UX-75 |
| `CURRENCY_LOCKED` | 400 | Settings currency is read-only after onboarding |
| `BUSINESS_TYPE_INVALID` / `BUSINESS_INDUSTRY_INVALID` | 400 | Closed lists (UX-21) |
| `PLAN_DOWNGRADE_FORBIDDEN` | 400 | No lower plan, even on placeholder Billing |
| `REFERRAL_POINTS_REQUIRES_POINTS_ENABLED` | 400 | Referral settings / activate non-points |

#### Toasts with timed disabled state

| Code | HTTP | UI |
|------|------|-----|
| `OTP_RESEND_COOLDOWN` | 429 | Countdown from `retry_after_seconds` |
| `DAILY_OTP_LIMIT_REACHED` | 429 | Countdown from `retry_after_seconds` |
| Generic public enroll limit | 429 | Toast + disable submit + **no silent retry** (ADR-012) |

#### Honest-failure family (visible-fail / stub)

| Code | HTTP | UI |
|------|------|-----|
| `SMS_CAMPAIGNS_NOT_AVAILABLE_PHASE1` | 503 | Shared trial message; campaign **stays draft**; do **not** hide SMS channel |
| `AUTOMATIONS_NOT_AVAILABLE_PHASE1` | 503 or 404 | Hide Scheduled Automations UI (PM-18) |
| OTP transport failure | 503 | Generic “could not send code” |
| `OTP_MAX_ATTEMPTS_EXCEEDED` | 400 | Force a new OTP challenge |

#### POS / scanner result states

| Code / condition | HTTP | UI |
|------------------|------|-----|
| `INVOICE_DUPLICATE` | 409 | Invoice already used |
| Already redeemed | — | Specific copy; do not hand the reward over a second time |
| Expired QR | — | Specific “expired” copy |
| Wrong shop / program / QR unknown | — | Specific copy |
| Insufficient Available | — | Clear error; **no row; no QR** |

---

## 4. Responsive & Accessibility (a11y) Gaps

### 4.1 Responsive — effectively unspecified

Across all docs, the **only** responsive statement is that `DashboardShell` has a mobile drawer / hamburger. Client boundaries mention “responsive state”; `matchMedia` is used for marketing animations. That’s it.

Missing:

- **No breakpoints, no page-level mobile specs** for any screen.
- **The three most mobile-critical surfaces are the least specified:** the join page (a customer arrives via phone camera scan — definitionally mobile-first), the customer portal / wallet, and the staff POS scanner (UX-11’s device question is still open). The docs never declare “mobile-first” for these.
- **Tables on small screens:** Customers, Campaigns, and the new Accounts page (UX-03) have no table→card or horizontal-scroll decision.
- **Print:** the Shop QR print flow (UX-10) has no print-layout spec.
- **Marketing pages:** no responsive spec (contact map pinned to fixed Vancouver coordinates — worth a mobile check, UX-38).

**Ask:** declare mobile-first surfaces (join, portal, POS) vs. desktop-first (analytics, campaigns), pick breakpoints, and define the table pattern — before portal wireframes start.

### 4.2 Accessibility — a blank page

There is **no WCAG target, no contrast spec, no keyboard-navigation requirement, no focus-management spec, no screen-reader expectation, no touch-target minimum, no font-scaling or reduced-motion policy** anywhere in the docs. The only a11y-adjacent items: paste allowed + `autocomplete` attributes on OTP / password fields (QA doc §4.2) and per-field error highlight on UX-75.

Concrete exposures:

- **Contrast:** locked palette (navy `#0a152f` / yellow `#feb602`) is unaudited — yellow-on-white CTAs and small yellow text are at risk; status pills / donuts must not be color-only.
- **Radix/shadcn gives an accessible foundation** — but only if focus rings, dialog focus traps, and keyboard flows are specified and not styled away.
- **Charts / donuts / stamp icons** need text equivalents (honest `"—"` states must also be screen-reader-honest).
- **Language / RTL:** product locks use Arabic (`نشط` / `غير نشط`) while the app is English-only and i18n is deferred ([deferred-decisions.md](../architecture/deferred-decisions.md)). **UX-65:** English-only chips, bilingual chips, or wait? If Arabic is on the roadmap, RTL (`dir`, bidi-safe emails) should be a documented decision **now**, not a retrofit.

### 4.3 Per-page UI-state coverage (pattern)

| Page family | Loading | Empty | Error | Success | Unauth | Forbidden | Offline | Skeleton |
|-------------|---------|-------|-------|---------|--------|-----------|---------|----------|
| Marketing / legal | `loading.tsx` policy | n/a | `error` / `not-found` policy | n/a | Public | — | **Missing** | **Missing** |
| Auth forms | Client forms | — | Field/API errors vague | Redirects | Public | — | **Missing** | **Missing** |
| Onboarding | Dynamic | — | Vague | `/onboarding/success` | Redirect | — | **Missing** | **Missing** |
| Dashboard | Spinner | Checklist + card empties | Redirects only | Weak | Yes | **No** | **No** | **No** |
| Customers | Spinner | Illustrated empty | Detail not found; toasts | Export toast | Yes | Soft-delete policy | **No** | **No** |
| Campaigns | Spinner | Telescope empties | Toasts, 503 SMS, not found | Send/draft toasts | Yes | Send Forbidden | **No** | **No** |
| Branches | Spinner | Placeholders / banners | Not found | Notify on add | Quirks | Plan UI-only | **No** | **No** |
| Loyalty | Spinner | Many zero empties | OTP/redeem errors (DECIDED) | Save toasts | Yes | Redeem authz DECIDED | **No** | **No** |
| Analytics | Spinner | Program empty + EmptyChart | Redirects | — | Yes | — | **No** | **No** |
| Settings | Vague | Pref defaults | Delete confirm | Password redirect/toasts | Yes (no onboard gate) | — | **No** | **No** |
| Join | Form | Unavailable if no ACTIVE (intended) | Rate limit / OTP | Enroll | Public | — | **No** | **No** |
| Portal / wallet / POS | **No UI** | — | Codes locked, pixels not | — | — | — | **No** | **No** |

---

## 5. Actionable Meeting Agenda & Direct Questions

### Suggested agenda (75 min)

1. **(5m) Framing** — `ui-ux-team-requests.md` is the canonical backlog; today closes its OPEN items; design inside locked constraints.
2. **(10m) Locked constraints sign-off** — ADR-010 parity; role matrix; wallet math (Shop A 100 + Shop B 200 = two cards, never 300); earn ≠ redeem; no staff Approve/Reject; one ACTIVE program; campaign lifecycle; honesty = `"—"` or hide.
3. **(15m) P0 assignment & sequencing** — Ship 1-coupled: **UX-09 join OTP, UX-11 POS, UX-10 program list, comment-out rebalancing**. Next-ship: **UX-05/06/07/08/75/76 portal, UX-01/02/03/04 team**. Owners + dates.
4. **(15m) Live decisions** — Q-list below. This is the meeting’s core.
5. **(10m) State-coverage standard** — every Figma frame ships with loading / empty / error / success / disabled / 429 / offline variants; adopt UX-71 illustration rules; split “error” from “empty” everywhere (audit M9). Assign the **error-code → copy/state map**.
6. **(10m) Responsive + a11y ratification** — mobile-first surfaces, breakpoints, table pattern; WCAG 2.2 AA target; palette contrast audit; RTL decision.
7. **(5m) Copy & assets** — UX-61/73 email, UX-62 OTP text, UX-64 promo stats, UX-66…72 assets. Remind: email transport is stubbed — no live-mail demos.

### Prioritized direct questions

Assign each an owner before leaving.

#### Blockers (answer today)

1. **What is the customer-portal URL family?** (UX-08) Everything customer-facing waits on this; design must table a proposal for product to approve, and [02-route-migration.md](../frontend/02-route-migration.md) needs the update.
2. **Where do Team screens live?** (UX-01 / UX-03) Settings → new “Team” tab is the docs’ lean — confirm or pick another route. Same question for the Accounts page route.
3. **Is the forced first-login password change a full page or modal?** (UX-02) Docs lean “reuse Settings password chrome.”
4. **Ship 1 sequencing confirm:** design bandwidth goes first to join-OTP (UX-09), POS (UX-11), program list (UX-10), and post-comment-out layouts — portal and team flows designed now but shipped next release. Agreed?
5. **Staff POS device:** `/app` page or dedicated scanner view? (UX-11) This decides whether POS is designed phone-first.

#### Product decisions design needs (with design input)

6. Can `staff` open the add-teammate form? (**DG-06** — not locked.) Confirm: no admin-on-admin deactivate control (explicitly out).
7. Referral Pending Review: merchant-visible screen in Ship 1, or internal-only? (UX-12 / **DG-11**)
8. Campaign Scheduled tab: design the date/time picker (owner timezone) or hide the tab? (UX-14)
9. Account-status chips: English-only, bilingual, or deferred to i18n? (**UX-65**) And is a real marketing-consent control in Ship 1, or does the disclaimer stay copy-only? (**UX-24** remainder)
10. **Confirm `customer-lifecycle.md` supersedes the old engagement buckets** — can design safely drop Champions / Loyal / Dormant from all Analytics and Customers specs? (likely **resolves DG-15**)
11. Add-teammate success: toast, confirmation screen, or “email sent” interstitial? Duplicate-email error copy? (UX-01 open items)
12. What does a deactivated staff member see on next login — and is it the same generic pattern as the customer blocked state? (UX-03 / UX-06 — currently unspecified on the merchant side)
13. **Pending chip on Team tab:** confirm `pending` (awaiting first-login change) is a third visible state, not folded into inactive.

#### Standards to ratify

14. Adopt the per-frame **state checklist** (loading / empty / error / success / disabled / 429 / **offline**) as a definition-of-done for every screen — starting with the offline spec for join + POS, which no document currently covers.
15. Approve **404 / error-boundary / session-expired-return** as three new micro-deliverables (route map mandates the files; nobody owns the content). Session return must use allow-listed `redirectedFrom` (UX-55). Join-unavailable = branded 404.
16. Ratify **WCAG 2.2 AA** as the target, a contrast audit of navy/yellow, and “states layer” (hover / focus / active / disabled) as design-system scope.
17. Sign off on the **dead-control dispositions** (UX-33…41b) — hide vs. disable+tooltip vs. wire, item by item; and the **honesty relabels** (UX-27…32) so the Ship 1 build isn’t blocked waiting for copy.
18. **Who owns the error-code → copy/state mapping**, and by when? Every code in [§3.3](#33-error-code--ui-map-assignable-deliverable) is locked behavior without a single pixel or string written.
19. Notifications bell: recent-10 only, paginated, or a full page? Password-change success: confirm redirect target is `/app/settings`, not `/`.

### Parking lot (explicitly do NOT design)

- Internal `/admin` back office (**UX-18** — product hasn’t asked)
- Social-login buttons, 2FA challenge, integrations / wallet-pass UI (**UX-19** — commented out for Ship 1)
- Mailchimp / Klaviyo OAuth screens (**UX-22**)
- Any chart that needs `visit_events` / `points_ledger` / `orders` — hide or `"—"` until backend keystones land ([ui-ux-team-requests.md §5](../product/ui-ux-team-requests.md#5-not-uiux--do-not-design-as-if-these-exist))
- Staff Approve/Reject pending list for physical catalog rewards — **superseded**
- Customer “pending review” wallet badge unless product asks (UX-12 is merchant)

### Suggested design order (from `ui-ux-team-requests.md`)

1. ~~Close UX-19, UX-20, UX-17, UX-21, UX-24 SMS campaigns~~ **Done (2026-08-18).** Still open: UX-24 consent/caps, **UX-25** exclusivity (likely superseded by lifecycle).
2. Design **P0 new flows:** UX-01…03, UX-05…10, UX-75, UX-76, UX-61, UX-62, UX-66…70, UX-73. Case list: [customer-portal-journey.md](../product/customer-portal-journey.md). **Ship 1 first:** UX-09, UX-11, UX-10.
3. Honesty pass on existing merchant UI: UX-27…41, UX-53.
4. Remaining P1/P2 after backend keystones (ledger, orders, events) have dates.

---

## Appendix A — Approved route map vs. missing families

From [02-route-migration.md](../frontend/02-route-migration.md) and [03-frontend-domains.md](../frontend/03-frontend-domains.md).

**On the approved map**

| Area | Paths |
|------|-------|
| Marketing | `/`, `/about`, `/features`, `/pricing`, `/guide`, `/contact` |
| Legal | `/legal/terms`, `/legal/privacy` |
| Merchant auth | `/auth/sign-in`, `/auth/sign-up`, `/auth/verify`, `/auth/verified`, `/auth/forgot-password`, `/auth/reset-password` |
| Onboarding | `/onboarding`, `/onboarding/business-category`, `/onboarding/business-type`, `/onboarding/plan`, `/onboarding/success` |
| Merchant app | `/app` → dashboard, `/app/dashboard`, `/app/customers`, `/app/customers/[customerId]`, `/app/loyalty`, `/app/branches`, `/app/branches/[branchId]`, `/app/campaigns`, `/app/campaigns/[campaignId]`, `/app/analytics`, `/app/settings`, `/app/settings/password` |
| Public join | `/join/[programId]` (target Shop slug `/join/shop/{shopSlug}` **not yet on map**) |

**DECIDED as product, not on the map (design must propose)**

| Surface | Notes |
|---------|-------|
| Customer portal URL family | UX-08 — passwordless OTP; never `/app` |
| Accounts page (Team / Customers tabs) | UX-03 — likely Settings / team; not locked |
| Add-teammate form | UX-01 — natural home is Team tab |
| First-login force-change | UX-02 — dedicated page vs modal |
| Staff POS / scanner | UX-11 — `/app` page vs dedicated view |
| Shop-scoped join | `/join/shop/{shopSlug}` or equivalent — backend-owned URL |

---

## Appendix B — What success looks like for today’s meeting

Three outcomes that make today a success:

1. A **portal URL family** approved (or a dated owner to propose one).
2. Every **OPEN** item in [ui-ux-team-requests.md](../product/ui-ux-team-requests.md) either closed or assigned with a date.
3. **Responsive + a11y + offline + error-code map** promoted from “absent” to “ratified standard” before the portal and POS screens are drawn.

---

*This file is a design-readiness audit for the UI/UX team meeting. It does not authorize frontend migrations of backend-owned tables ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)) or a visual redesign ([ADR-010](../architecture/decisions/ADR-010-style-and-template-parity.md)). Existing DECIDED locks in 11-auth, loyalty-page, ADR-012, counter-qr, program-model, and the API contract win when this brief disagrees.*
