# Missing pages — PO + UI briefing

**Audience:** Product Owner, UI/UX  
**Date:** 2026-08-16  
**Purpose:** Separate **pages that do not exist** from **existing pages with incomplete widgets**. Use this in design / priority reviews.  
**Product decisions source:** [product-manager-meeting-report.md](product-manager-meeting-report.md) · [gaps-and-solutions.md](frontend/gaps-and-solutions.md) · [11-authentication-migration.md](frontend/11-authentication-migration.md)

**Not in scope here:** Next.js migration cutover, TanStack retirement, or backend schema work. Those stay in `docs/architecture/` and `docs/frontend/12-migration-plan.md`.

---

## Snapshot

| Kind | Count | Action for this meeting |
|------|-------|-------------------------|
| **A — Missing pages** (no route today) | **7 surfaces** | Lock URLs + wireframes; decide ship order |
| **B — Existing but hollow** (route exists; major panels fake/empty) | 6+ routes | Honesty / Phase 0 UI — not new pages |
| **C — Optional / not decided** | 2 | Confirm need before design |

All approved production routes that **do** exist: [02-route-migration.md](frontend/02-route-migration.md).

---

## A — Missing pages (no UI route)

These are **product DECIDED** (or strongly implied) but **not shipped**. Exact paths are **not locked** unless noted. Illustrative paths below are proposals for UI to challenge — do not treat them as the route contract until PO approves an update to `02-route-migration.md`.

### A1. Customer register

| | |
|--|--|
| **Gap** | [G-33](frontend/gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows) |
| **Who** | Shop member (`customer` role) — **not** merchant `/app` sign-up |
| **Must include** | Profile fields (not fully locked); **OTP** via SMS or WhatsApp before the member row is finalized |
| **Must not** | Grant `/app` access; skip OTP on public new register |
| **Related today** | Owner still adds customers in `/app/customers`; public `/join/[programId]` enrolls without customer login |
| **Illustrative URL** | `/customer/sign-up` (or under a brand portal prefix) |
| **UI open** | Exact URL; field list beyond identity/contact; OTP challenge UX (TTL/attempts not locked) |

### A2. Customer login

| | |
|--|--|
| **Gap** | [G-33](frontend/gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows) |
| **Who** | `customer` only |
| **Must respect** | Account **active** / **inactive** ([G-36](frontend/gaps-and-solutions.md#g-36--no-admin-account-list-or-activeinactive-for-staffcustomer)) — inactive cannot log in |
| **Illustrative URL** | `/customer/sign-in` |
| **UI open** | Exact URL; recovery flow for customers (not decided) |

### A3. Customer wallet (post-login home)

| | |
|--|--|
| **Gap** | [G-33](frontend/gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows) · [wallet DECIDED](frontend/loyalty-page.md#customer-wallet-per-program-decided) |
| **Who** | Logged-in `customer` |
| **Must show (locked facts)** | **One card per program** — never a summed points total across programs. Each card: program name, spendable points, expiry (grouped by lot if mixed), vouchers + dates, personal share **link + QR** (`/join/{programId}?ref=…`) |
| **Example rule** | 100 pts in program 1 + 200 in program 2 → **two** cards, **not** 300 |
| **Illustrative URL** | `/customer/wallet` or `/me` |
| **UI open** | Exact URL; cards vs list vs tabs (pixel layout **not** locked) |

### A4. Admin — add teammate (admin or staff)

| | |
|--|--|
| **Gap** | [G-34](frontend/gaps-and-solutions.md#g-34--admin-cannot-create-adminstaff-with-emailed-temp-password) |
| **Who** | Acting `admin` creates another `admin` or `staff` |
| **Must include** | Form: at least **name**, **email**, **role** (`admin` \| `staff`) → Create account → random temp password → **email** (added + email + temp password) via messaging contracts |
| **Must not** | Reuse invite-link email as if it already includes a password; treat this as shop-`customer` signup |
| **Illustrative URL** | `/app/team` **or** Settings → Team tab (same page as A5 is allowed) |
| **UI open** | Exact URL; extra fields (phone, …); whether `staff` can open the form |

### A5. Admin — account list (active / inactive)

| | |
|--|--|
| **Gap** | [G-36](frontend/gaps-and-solutions.md#g-36--no-admin-account-list-or-activeinactive-for-staffcustomer) |
| **Who** | `admin` manages **`staff`** and **`customer`** accounts |
| **Must include** | Toggle **نشط (`active`)** / **غير نشط (`inactive`)**. Filters: **role**, **email**, **name**, **phone** |
| **Must not** | Confuse with loyalty member status (`at_risk` / `churned`) or program status (`draft` / `active` / `disabled`) |
| **Out of this decision** | Toggling **other `admin`** rows (not locked whether list shows `admin` at all) |
| **Illustrative URL** | `/app/accounts` (may share shell with A4) |
| **UI open** | Exact URL; table vs cards; whether `admin` rows appear |

### A6. First login — forced password change

| | |
|--|--|
| **Gap** | Tied to [G-34](frontend/gaps-and-solutions.md#g-34--admin-cannot-create-adminstaff-with-emailed-temp-password) |
| **Who** | New `admin` / `staff` after temp-password email |
| **Must** | Change password **before** any `/app` use; cannot skip |
| **Exists today** | `/app/settings/password` (voluntary change) — **not** the forced gate |
| **Illustrative URL** | `/auth/change-password` (forced) **or** gated reuse of settings password with hard redirect |
| **UI open** | Dedicated page vs modal/gate on existing password route |

### A7. Merchant — referral Pending Review

| | |
|--|--|
| **Gap** | [G-14](frontend/gaps-and-solutions.md#g-14--referrals-settings-without-attribution) · meeting report §7 |
| **Who** | Merchant reviewer (role for this screen **not** locked; typically `admin`) |
| **Backend locked** | `referrals.status = pending_review` when invite + enroll share same device or same IP in the same minute; referrer grant blocked until cleared → `pending` or `rejected` |
| **UI** | **Screen not locked** — no page today |
| **Illustrative URL** | `/app/referrals/review` **or** Loyalty → Referrals → Review queue |
| **UI open** | Whole surface: list, approve/reject, filters, who can act |

---

## B — Existing pages that look complete but are hollow

These are **not** missing routes. Do not invent parallel pages; fix honesty or wait for backend data.

| Route | What’s hollow / misleading | Gaps |
|-------|----------------------------|------|
| `/app/dashboard` | Live activity empty; revenue / open rate / search dead or fake | G-01, G-05, G-06, G-09, G-20 |
| `/app/customers/[customerId]` | Rewards, LTV, referrals, charts, health placeholders | G-13 |
| `/app/branches/[branchId]` | Performance stats / donut placeholders | G-04, G-13 |
| `/app/campaigns` (+ detail) | Completed tab empty; Performance `0%`; automations unused | G-09, G-06, G-20 |
| `/app/analytics` | Revenue tab all placeholders; many CTAs dead | G-06 + analytics notes |
| `/app/loyalty` | Referrals config without attribution; one program only today | G-14, G-35 |
| `/app/settings` | Billing placeholder; integrations never connect; tabs not in URL | G-07, G-19, G-23 |
| `/contact` | Form placeholder | marketing note in route map |

Full widget-level backlog: [gaps-and-solutions.md](frontend/gaps-and-solutions.md).

---

## C — Optional / not product-decided as a page yet

| Surface | Notes | Gap |
|---------|-------|-----|
| Email suppressions list | Optional read-only owner UI; no Settings screen today | [G-30](frontend/gaps-and-solutions.md#g-30--suppressions-have-no-owner-ui) |
| Customer password recovery | Not decided in PM notes | — |

---

## What already ships (so we don’t redesign)

Merchant shell routes under `/app/*`, marketing, legal, auth for **shop buyer**, onboarding, and public join are on the [approved route map](frontend/02-route-migration.md). Migration status: slices 1–13 baseline done; see [12-migration-plan.md](frontend/12-migration-plan.md).

**Locked roles** (do not invent new logged-in roles for wireframes):

| Role | Surface |
|------|---------|
| `admin` | `/app` |
| `staff` | `/app` (same permissions as `admin` for now) |
| `customer` | Customer register / login / wallet — **never** `/app` |

---

## Decisions needed from PO + UI (checklist)

Use this as the meeting agenda. Mark each **DECIDED** or leave open.

### URLs (update `02-route-migration.md` only after approval)

- [ ] Customer register URL  
- [ ] Customer login URL  
- [ ] Customer wallet URL  
- [ ] Add-teammate URL (dedicated vs Settings tab)  
- [ ] Account list URL (same page as add-teammate?)  
- [ ] Forced password-change URL  
- [ ] Pending Review URL  

### Scope / UX

- [ ] Ship order among A1–A7 (recommendation below)  
- [ ] Can `staff` open add-teammate?  
- [ ] Does account list show `admin` rows?  
- [ ] Pending Review: who can approve/reject?  
- [ ] Wallet layout: cards vs list vs tabs (facts already locked)  
- [ ] Customer recovery / MFA (if any) for this release  
- [ ] Suppressions UI (C) in or out  

### Explicitly out of this briefing

Open tracking, SMS delivery provider, campaign automations, campaign revenue (G-09 / G-06 / G-20) — product language partially decided; **not** missing-page work.

---

## Suggested discussion order (not a schedule)

1. **A4 + A5 + A6** — merchant team + account control (closes “Settings mentions team” with no UI).  
2. **A1 + A2 + A3** — customer portal (KPIs become real; wallet facts already locked).  
3. **A7** — Pending Review (needed when referrals + OTP ship).  
4. **B** — honesty pass on existing hollow widgets (Phase 0) so demos don’t lie.  
5. **C** — optional suppressions.

---

## One-slide summary (copy/paste)

```text
MISSING PAGES (no route today)
  Customer: register · login · wallet (per-program cards; never mixed points)
  Merchant: add admin/staff (+ temp password email) · account active/inactive list
            · forced first password change · referral Pending Review queue

EXISTING BUT HOLLOW (do not invent new pages)
  Dashboard / customer+branch detail / campaigns / analytics / loyalty / settings

LOCKED ALREADY
  Roles: admin | staff | customer
  Wallet contents · OTP before new public register · referral both-party rules

STILL OPEN FOR UI
  Exact URLs · pixel layouts · who can review referrals · staff may invite?
```

---

## Docs cited

- [product-manager-meeting-report.md](product-manager-meeting-report.md)  
- [gaps-and-solutions.md](frontend/gaps-and-solutions.md) (G-13, G-14, G-30, G-33–G-36)  
- [11-authentication-migration.md](frontend/11-authentication-migration.md)  
- [loyalty-page.md](frontend/loyalty-page.md) (wallet, OTP, referrals)  
- [02-route-migration.md](frontend/02-route-migration.md) (approved map — update when URLs lock)  
- [ADR-014](architecture/decisions/ADR-014-product-data-ownership.md) (backend owns schema/APIs for these surfaces)
