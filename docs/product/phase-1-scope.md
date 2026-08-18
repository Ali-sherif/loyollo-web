# Product MVP (Ship 1) — scope and terminology

**Date:** 2026-08-18  
**Status:** DECIDED (docs lock; implementation not shipped)  
**Audience:** Product, engineering, QA, UI/UX  
**Does not authorize** schema or API implementation ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

This file is the **single product scope list** for the merchant first ship. It resolves `DG-01` and the “Phase 1” naming collision called out in the [2026-08-14 audit](../audit/2026-08-14-security-ui-product-audit.md#phase-name-collision-read-first).

---

## Terminology — four different “Phase 1” labels

Never use bare **“Phase 1”** in specs, tickets, or PRs. Always qualify:

| Label | Meaning | Canonical doc |
| --- | --- | --- |
| **Product MVP (Ship 1)** | Merchant launch features the product owner commits to for first customer-facing ship (Staff POS, join QR, redemption scan, etc.). | **This file** |
| **Frontend Migration** | TanStack → Next.js App Router while **retaining Supabase RLS** for leftover client data paths. ADR-011 Phase 1. | [ADR-011](../architecture/decisions/ADR-011-rls-storage-strategy.md) |
| **Backend Remediation P[N]** | Ordered backend fix ladder (P0 honesty → P7 pagination). **Not** the product ship list. | [remediation-roadmap.md](../backend/remediation-roadmap.md) |
| **Feature [In/Out of Scope]** | A specific capability inclusion or exclusion for **Product MVP (Ship 1)** only. | Tables below |

**Gaps index column `Phase`:** always means **Backend Remediation P[N]**, not Product MVP (Ship 1). See [gaps-and-solutions.md](../frontend/gaps-and-solutions.md).

**Error codes** ending in `_PHASE1` (e.g. `AUTOMATIONS_NOT_AVAILABLE_PHASE1`) are legacy identifiers; they mean **“not available in Product MVP (Ship 1)”** — do not rename without a coordinated API change.

---

## OTP vs Staff POS — resolved split

**Contradiction (fixed):** Staff cashier POS requires scanning a **customer wallet QR** ([counter-qr-and-program-membership.md](./counter-qr-and-program-membership.md)). That implies enrolled members with issued QRs. Public **first join** requires **PM-06 OTP** before a member row exists. [G-33](../frontend/gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows) had deferred all customer auth to “later,” and [Backend Remediation P6](../backend/remediation-roadmap.md#backend-remediation-p6--referrals--campaigns--insight-nudges--search) had placed OTP in P6 — after Staff POS in P5.

**Resolution:**

| Capability | Product MVP (Ship 1) | Backend Remediation | Notes |
| --- | --- | --- | --- |
| **Public enroll OTP (PM-06)** | **In scope** | **P5** (with Staff POS) | Counter/door QR first join: OTP → UX-75 profile → enroll → **wallet QR issued**. Required before cashier can scan. |
| **Returning check-in (door QR)** | **In scope** | **P5** | Known member at this Shop: check-in **without** new OTP ([counter-qr](./counter-qr-and-program-membership.md)). |
| **Staff POS scan + earn** | **In scope** | **P5** | Scan **customer wallet QR** → optional deferred migrate → Bill Amount + Invoice Number. |
| **Customer portal sessions** | **Out of scope** | **Later** (post–Ship 1) | Register/login/recovery **app**, `/api/me/wallet` behind customer JWT, account inactive gates ([G-33](../frontend/gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows) portal portion). |
| **Referral OTP + grants** | **Out of scope** | **P6** | Reuses PM-06 store from P5; referral attribution and both-party grants stay deferred. |

**Rule:** enrollment OTP and wallet QR are **Ship 1**; persistent **customer login** is **not**. A member can earn at POS and redeem via QR without ever opening a customer portal app.

---

## Product MVP (Ship 1) — in scope

| Area | In scope | Source |
| --- | --- | --- |
| **Merchant app** | `/app` for **`admin`** and **`staff`** (same permissions for now) | [11-authentication-migration.md](../frontend/11-authentication-migration.md#locked-role-matrix) |
| **Merchant auth** | NestJS JWT for admin/staff; temp password + first-login change; email password reset | [ADR-005](../architecture/decisions/ADR-005-authentication.md) Option C |
| **Programs** | Independent programs; **one ACTIVE** per Shop; counter QR → ACTIVE only | [ADR-016](../architecture/decisions/ADR-016-independent-programs.md) |
| **Join QR** | Shop join QR on `/app/loyalty` (print/display) | [ui-ux-team-requests.md](./ui-ux-team-requests.md#ux-10--loyalty-program-list--active-default) |
| **Public enroll** | Counter QR → PM-06 OTP (new phone) → UX-75 profile → membership + **wallet QR** | [counter-qr-and-program-membership.md](./counter-qr-and-program-membership.md) |
| **Staff cashier POS** | Scan customer QR → migrate if eligible → bill + invoice; earn on locked program | [api-contract.md](../backend/api-contract.md#staff-pos-product-mvp-ship-1-cashier) |
| **Catalog redeem** | Customer Redeem → snapshot + reserve + 10-min QR → staff scan verify | [reward-redemption-flow.md](./reward-redemption-flow.md) |
| **Redemption authz** | Shop-level; any Staff or Admin may scan/verify and use cashier POS | [reward-redemption-flow.md](./reward-redemption-flow.md#11-staff-authorization-shop-level) |
| **Campaigns** | List, create, Launch, Completed lifecycle; **hide** Scheduled Automations (PM-18) | [campaigns-page.md](../frontend/campaigns-page.md#pm-18--hide-scheduled-automations-product-mvp-ship-1) |
| **Campaign honesty** | No open tracking; sent campaigns show `0% Open` / `—` until deferred | [product-manager-meeting-report.md](../product-manager-meeting-report.md) |
| **Owner add customer** | Manual add in `/app/customers` (no OTP); collect UX-75 fields when possible | [customers-page.md](../frontend/customers-page.md) |
| **Tier display** | Tier ladder applied on enroll + earn (Backend Remediation **P1**) | [remediation-roadmap.md](../backend/remediation-roadmap.md#backend-remediation-p1--apply-the-tier-ladder--db-automation) |
| **UI honesty** | No fabricated metrics; `"—"` or hide per ADR-014 / Backend Remediation **P0** | [remediation-roadmap.md](../backend/remediation-roadmap.md#backend-remediation-p0--honesty-in-ui) |

---

## Product MVP (Ship 1) — out of scope

| Area | Out of scope | Ship behavior | Source |
| --- | --- | --- | --- |
| **Customer portal app** | Register/login/recovery **sessions** for role `customer`; `/api/me/wallet` behind customer JWT | Public join + wallet QR only; no standalone customer app routes | [G-33](../frontend/gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows) |
| **Social sign-in** | Facebook / Google / Apple on `/auth/*` | Hidden or absent | [UX-19](./ui-ux-team-requests.md#ux-19--product-mvp-ship-1-exclusions-social-auth-2fa-pos-wallet) |
| **2FA / MFA** | TOTP enroll + sign-in challenge | Hide Security 2FA card unless product re-opens | [UX-19](./ui-ux-team-requests.md#ux-19--product-mvp-ship-1-exclusions-social-auth-2fa-pos-wallet) · `DG-01` |
| **Third-party POS** | Square, Clover, Toast, Lightspeed, Shopify integrations | Deferred; hide or interest-only in Settings | [UX-19](./ui-ux-team-requests.md#ux-19--product-mvp-ship-1-exclusions-social-auth-2fa-pos-wallet) |
| **Apple / Google Wallet** | Settings → Integrations → QR & Wallet pass | Deferred; not the same as shop **join QR** | [UX-19](./ui-ux-team-requests.md#ux-19--product-mvp-ship-1-exclusions-social-auth-2fa-pos-wallet) |
| **Referrals (live)** | Both-party grants, `?ref=` attribution, pending review UI | Settings/config may exist; grants deferred (Backend **P6**) | [G-14](../frontend/gaps-and-solutions.md#g-14--referrals-settings-without-attribution) |
| **Scheduled automations** | Worker-fired automations | UI hidden; writes → 503 `AUTOMATIONS_NOT_AVAILABLE_PHASE1` | [PM-18](./ui-ux-team-requests.md#ux-15--automations-config-only-vs-hide-enable) |
| **Campaign opens** | `% Open`, ESP webhooks | `0% Open` / honest placeholder | [G-09](../frontend/gaps-and-solutions.md#g-09--campaign-send--opens--automations) |
| **Revenue / ROI widgets** | POS-attributed revenue, AOV, ROI cards | `"—"` or hide (`DG-03` — pick one in UX) | [G-06](../frontend/gaps-and-solutions.md#g-06--revenue-widgets-show-mock-or-empty) |
| **Refund / reversal** | POS or redemption reverse | Not implemented | [reward-redemption-flow.md](./reward-redemption-flow.md) |
| **Team invite UI** | Admin form add admin/staff + emailed temp password | Deferred (Backend **Later**) | [G-34](../frontend/gaps-and-solutions.md#g-34--admin-cannot-create-adminstaff-with-emailed-temp-password) |
| **Account active/inactive admin** | Team + Customers tabs with filters | Deferred | [G-36](../frontend/gaps-and-solutions.md#g-36--no-admin-account-list-or-activeinactive-for-staffcustomer) |
| **Insight nudge CTAs** | `POST /api/insights/:key/actions` | Disabled/hidden until Backend **P6** | [remediation-roadmap.md](../backend/remediation-roadmap.md#backend-remediation-p0--honesty-in-ui) |
| **Global search** | Header search with results | Hide or disable until Backend **P6** | [G-05](../frontend/gaps-and-solutions.md#g-05--global-search-is-a-dead-button) |
| **SMS campaigns (live)** | Bulk SMS send path | Visible-fail stub or hidden — product must pick (`DG-08`) | [UX-24](./ui-ux-team-requests.md#ux-24--communication-policy--sms-in-product-mvp-ship-1) |

---

## Cross-track map (read when planning)

```mermaid
flowchart LR
  subgraph ship [Product MVP Ship 1]
    POS[Staff cashier POS]
    OTP[Public enroll OTP PM-06]
    RED[Redemption scan]
    JOIN[Shop join QR]
  end
  subgraph fe [Frontend Migration]
    NEXT[Next.js App Router]
    RLS[Keep Supabase RLS]
  end
  subgraph be [Backend Remediation]
    P0[P0 honesty]
    P1[P1 tiers]
    P5[P5 POS + enroll OTP]
    P6[P6 referrals]
  end
  OTP --> POS
  P5 --> POS
  P5 --> OTP
  P1 --> ship
  P0 --> ship
  NEXT --> ship
```

---

## Related decisions still open (`DG-*`)

These do **not** block labeling but must close before UI ships conflicting screens:

| ID | Question |
| --- | --- |
| **DG-01** | Hide vs interest-only for Integrations rows (social, 2FA, third-party POS, Wallet passes) |
| **DG-03** | Hide vs `"—"` for Revenue Impact tab and Overview AOV card |
| **DG-08** | SMS campaigns: real path, visible fail, or hidden |
| **DG-11** | Referral `pending_review` merchant UI vs internal-only |
| **DG-14** | Single at-risk definition (30 vs 60 vs 20–60 day cutoffs) |

Track in [ui-ux-team-requests.md](./ui-ux-team-requests.md) and [deferred-decisions.md](../architecture/deferred-decisions.md).

---

## Verification

- [ ] No bare **“Phase 1”** in new docs or tickets without one of the four qualified labels above.
- [ ] Staff POS specs reference **public enroll OTP** as a Ship 1 prerequisite, not Backend Remediation P6-only.
- [ ] G-33 portal session work is explicitly **Out of Product MVP (Ship 1)**; enroll OTP is **In**.
