# UI/UX team requests

**Date:** 2026-08-14  
**Audience:** UI/UX team  
**Purpose:** One list of everything `docs/` says is missing, undesigned, or undecided on the design side. Engineering must not invent screens that this list leaves open.

**Not in scope of this file:** backend schema, APIs, or Next.js implementation. Those stay in [gaps-and-solutions.md](../frontend/gaps-and-solutions.md), [data-contract.md](../backend/data-contract.md), and [api-contract.md](../backend/api-contract.md).

**There is no standalone PRD** in `docs/`. Product locks live in [product-manager-meeting-report.md](../product-manager-meeting-report.md) and the page specs. This file does not add new product decisions; it extracts what design still owes.

**Jump to:** [How to use](#how-to-use-this-document) · [Locked constraints](#locked-constraints-do-not-redesign) · [1. New screens](#1-new-screens--flows-to-design) · [2. UX decisions](#2-ux-decisions-hide-vs-honest-placeholder-vs-wire) · [3. Copy](#3-copy--content) · [4. Assets](#4-assets--brand) · [5. Not UI/UX](#5-not-uiux--do-not-design-as-if-these-exist) · [Index](#request-index) · [Traceability](#traceability-docs--this-file)

---

## How to use this document

Each request is tagged:

| Tag | Meaning |
|-----|---------|
| **UX-nn** | This file’s request ID. Use it in Figma / tickets. |
| **Need** | `Design` (new screen/flow) · `Decision` (hide / keep / relabel) · `Copy` · `Asset` |
| **Priority** | `P0` blocks a DECIDED product flow · `P1` honesty / Phase-1 ship look · `P2` later or optional |
| **Source** | `G-xx` gap, `DG-xx` docs gap, `A-01` audit, page spec, meeting report |

**Locked facts** in each row must appear in the design. **Open** items are what UI/UX (with product) must close. Do not invent a parallel product rule.

---

## Locked constraints (do not redesign)

These are already decided. Design new surfaces **inside** them.

| Constraint | Source |
|------------|--------|
| **No visual redesign** of existing merchant / marketing screens during migration. Keep Tailwind tokens, Radix/shadcn, Figtree, navy `#0a152f` / yellow `#feb602`, current icons and empty-state illustrations. | [ADR-010](../architecture/decisions/ADR-010-style-and-template-parity.md) |
| **Do not change existing email/SMS template copy** (`signup`, `invite`, `magiclink`, `recovery`, `email_change`, `reauthentication`, transactional builders). New templates are allowed; overwriting `invite.tsx` is not. | ADR-010 · [17-messaging-templates.md](../frontend/17-messaging-templates.md) |
| Roles are **`admin`** (buyer), **`staff`** (same `/app` permissions as admin **for now**), **`customer`** (never `/app`). Never `purchaser`. | [locked role matrix](../frontend/11-authentication-migration.md#locked-role-matrix) |
| `customer` register / login / recovery are **passwordless OTP** (SMS or WhatsApp). No customer password, no `/auth/forgot-password` for customers. | [credential recovery](../frontend/11-authentication-migration.md#credential-recovery-decided) |
| Campaigns: **Draft → Active (sending) → Completed / Failed**. Completed is a status, not a score. Performance is `% Open` / `% Redeemed`. | [campaigns-page.md](../frontend/campaigns-page.md#product-meanings-decided) |
| Wallet: **one card per program**. Never show a mixed points total (100 + 200 ≠ 300). | [customer wallet](../frontend/loyalty-page.md#customer-wallet-per-program-decided) |
| Honesty: do not invent percentages, even-split donuts, or proxy metrics under misleading labels. Prefer `"—"` or hide. | [ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md) · audit §3.6 |
| Approved merchant URLs are frozen in [02-route-migration.md](../frontend/02-route-migration.md). Customer-portal and team-management **routes are not in that map** — proposing them is part of the work below. | 02-route-migration · 03-frontend-domains |

---

## 1. New screens & flows to design

These surfaces are **DECIDED as product** (or clearly required) and **have no UI today**. Pixel layout is not locked unless noted. Propose routes; do not assume they are approved until product + [02-route-migration.md](../frontend/02-route-migration.md) update.

### 1.1 Merchant team

#### UX-01 — Add teammate form (`admin` creates `admin` or `staff`)

| | |
|--|--|
| **Need / priority** | Design · **P0** |
| **Source** | [G-34](../frontend/gaps-and-solutions.md#g-34--admin-cannot-create-adminstaff-with-emailed-temp-password) · [11-auth add teammate](../frontend/11-authentication-migration.md#admin-adds-admin-or-staff-decided) · meeting report §4 |

**Locked**

- Actor: **`admin`**. Fields at least **name**, **email**, **role** (`admin` \| `staff`).
- On Create: backend generates a **random temp password** (admin does not pick it) and emails it. See [UX-61](#ux-61--teammate-created-email).
- This is **not** shop-customer signup.

**Open (design + product)**

- Route (docs say “likely Settings / team”; not locked). Natural home is the **Team** tab on [UX-03](#ux-03--account-list--activeinactive); not locked to that page.
- Extra fields (phone, etc.).
- Whether **`staff` can open this form** (not locked).
- Empty / error / duplicate-email states.
- Success: toast vs confirmation screen vs “email sent” copy.

#### UX-02 — First-login force password change

| | |
|--|--|
| **Need / priority** | Design · **P0** |
| **Source** | 11-auth first login · G-34 |

**Locked**

- After first sign-in with the temp password, the new `admin` / `staff` **must change the password before `/app`**. Cannot skip.
- Later self-serve reset (`/auth/forgot-password`) does **not** re-trigger this gate.

**Open**

- Dedicated full-page vs modal vs reuse `/app/settings/password` chrome.
- Copy that this is a one-time gate, not a lockout.
- Strength / match-confirm pattern (existing Settings password UI exists — prefer parity, not a new visual language).

#### UX-03 — Account list + Active / Inactive

| | |
|--|--|
| **Need / priority** | Design · **P0** |
| **Source** | [G-36](../frontend/gaps-and-solutions.md#g-36--no-admin-account-list-or-activeinactive-for-staffcustomer) · [account status](../frontend/11-authentication-migration.md#account-active--inactive-decided) · meeting report §6 · **DG-06** |

**Locked**

- **One page, two tabs** (not two routes). The `admin` switches tabs:
  - **Team** — `admin` and `staff` rows (`admin` rows **are listed**)
  - **Customers** — `customer` rows
- `admin` sets **`staff`** and **`customer`** to **`active` (نشط)** or **`inactive` (غير نشط)**. No deactivate control on another `admin`.
- Inactive `staff` cannot use `/app`. Inactive `customer` cannot get a session from a new OTP.
- **Not** the same as member `customers.status` (`at_risk` / `churned`) or program status (`draft` / `active` / `disabled`).
- **Both tabs:** active/inactive + filters **email**, **name**, **phone**.
- **Team tab also:** filter **role** (`admin` \| `staff`). Customers tab does not show a role filter (every row is `customer`).

**Open**

- Route; whether this page also hosts [UX-01](#ux-01--add-teammate-form-admin-creates-admin-or-staff) (Team tab is the natural home).
- Whether an `admin` can deactivate **another `admin`** (explicitly **out** of the current decision — do not design that control unless product reopens it).
- Layout, table vs cards, tab labels, Arabic labels vs English UI (product used Arabic in the lock; current app is English-only — [deferred i18n](../architecture/deferred-decisions.md)).
- Confirm / undo for deactivate; what the inactive person sees on next login.

#### UX-04 — Admin re-issue temporary password

| | |
|--|--|
| **Need / priority** | Design · **P1** |
| **Source** | [credential recovery](../frontend/11-authentication-migration.md#credential-recovery-decided) |

**Locked**

- Extra path when a teammate is locked out: `admin` re-issues a temp password (same email facts as UX-01). **Not** the existing `invite` accept-link. **Not** a second forgot-password screen.

**Open**

- Where the action lives (row menu on UX-03 vs teammate detail).
- Confirm copy: this invalidates the old password.

### 1.2 Shop-customer portal (not `/app`)

Customer-portal **URLs are not locked** and are **not** on the approved route map. Design must propose a URL family for product to approve.

#### UX-05 — Customer register (passwordless OTP)

| | |
|--|--|
| **Need / priority** | Design · **P0** |
| **Source** | [G-33](../frontend/gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows) · [OTP](../frontend/loyalty-page.md#otp-verification-decided) · 11-auth shop-customer · ADR-012 |

**Locked**

- Role **`customer`**. Never lands on `/app`.
- Channel picker: **SMS** or **WhatsApp**. Code only. Never a password.
- OTP **must succeed before** any member row / referral / reward is finalized. Failed or skipped OTP → no account.
- Public new register is rate-limited: HTTP **429** must be a **visible toast**, no silent retry.
- Owner **Add Customer** in `/app/customers` stays a merchant tool (no OTP). Do not merge those forms.

**Open**

- URL; relationship to public `/join/[programId]` (same funnel vs separate “create account”).
- Phone input, country code, resend timer, attempt-cap messaging (TTL/cap **not locked** — design states, not numbers).
- How `?ref=` referral context is shown during register (see [UX-09](#ux-09--join-page-otp--referral-context)).

#### UX-06 — Customer login + lost access (new OTP)

| | |
|--|--|
| **Need / priority** | Design · **P0** |
| **Source** | credential recovery · G-33 |

**Locked**

- Login = new OTP on the same channel. **No** forgot-password screen. **No** merchant `RecoveryEmail`.
- After OTP → **customer portal**, never `/app`, never `/auth/reset-password`.
- Inactive `customer` must not get a session — design the blocked/inactive state.

**Open**

- Same screen as register vs distinct “log in” vs “lost access” (product treats them as the same OTP).
- Returning-user empty states (unknown phone, wrong channel).

#### UX-07 — Customer wallet (per program)

| | |
|--|--|
| **Need / priority** | Design · **P0** |
| **Source** | [customer wallet](../frontend/loyalty-page.md#customer-wallet-per-program-decided) · meeting report §8 · G-33 |

**Locked facts on each program card**

| Fact | Rule |
|------|------|
| Program name | From that program |
| Spendable points | That program only. **Forbidden:** a single mixed total across programs |
| Expiry | One date if lots share it; otherwise **amount + date groups**. Never one date that hides a sooner-expiring lot |
| Vouchers | `active` vouchers + their dates. Used / expired are not spendable points |
| Share | Personal **link** + **QR** for `/join/{programId}?ref={referral_code}` — this is **not** the shop’s program join QR |

**Open**

- Pixel layout: cards vs list vs tabs. Portal URL.
- Empty wallet (member of zero programs), expired-lot treatment, copy/share/download QR.
- Example that must stay true in mockups: 100 pts (month window) + 200 pts (week window) = **two cards, not 300**.

#### UX-08 — Customer portal shell

| | |
|--|--|
| **Need / priority** | Design · **P0** |
| **Source** | 11-auth · 03-frontend-domains (portal not in approved map) |

**Locked**

- Separate visual world from merchant `/app` (customer must never look like they can open merchant nav). ADR-010 still applies: same brand tokens, not a new brand.

**Open**

- Nav: wallet only vs history / profile / vouchers.
- Sign-out, language, support.
- KPI list the customer sees is **not locked** — do not invent a full analytics dashboard; start from wallet facts unless product expands.

#### UX-09 — Join page: OTP + referral context

| | |
|--|--|
| **Need / priority** | Design · **P0** |
| **Source** | [join / OTP](../frontend/loyalty-page.md#public-join--check-in) · [referral rewards](../frontend/loyalty-page.md#referral-rewards-decided) · G-18 |

**Locked**

- Today `/join/[programId]` enrolls without login. Intended: OTP before new enroll; returning scan = check-in (no new OTP).
- `?ref=` is a personal invite. Returning check-in with `ref` does **not** create another referral.

**Open**

- Step sequence on the existing join page (branding from QR Experience tab **is** wired — keep it).
- How referred reward is previewed before OTP.
- 429 / invalid OTP / expired OTP / inactive program (`draft`/`disabled` must not accept join) empty states.
- Marketing consent: today disclaimer is **copy-only**, no stored opt-in ([DG-08](#ux-24--communication-policy--sms-in-phase-1)). Design a real consent control if product includes it in Phase 1.

### 1.3 Loyalty operations (merchant)

#### UX-10 — Multi-program list / switcher

| | |
|--|--|
| **Need / priority** | Design · **P0** |
| **Source** | [G-35](../frontend/gaps-and-solutions.md#g-35--shop-is-limited-to-one-loyalty-program-no-program-status) · [multiple programs](../frontend/loyalty-page.md#multiple-programs-and-status-decided) |

**Locked**

- Many programs per shop. Status **`draft` \| `active` \| `disabled`** (no other spellings).
- Join stays `/join/{programId}`. Only **`active`** programs accept join/check-in.
- Today `/app/loyalty` is create+edit of **one** row (no overview). That page cannot stay the only surface.

**Open**

- List vs switcher in the shell vs tabs on Loyalty.
- Default status on create.
- Whether **two programs can be `active` at once** (not locked — design must not assume exclusivity).
- Empty state: zero programs vs all disabled.
- How Dashboard / Customers / Campaigns / Analytics pick “which program” (today `maybeSingle`).

#### UX-11 — Staff POS: identify · award · redeem

| | |
|--|--|
| **Need / priority** | Design · **P1** (product Phase 1 **may exclude POS** — see [UX-19](#ux-19--phase-1-exclusions-social-auth-2fa-pos-wallet)) |
| **Source** | [G-20](../frontend/gaps-and-solutions.md#g-20--rewardsredeemed_count-vs-earn) · audit §4.1 · **DG-01** |

**Locked (when built)**

- Identify member (QR / phone), award visit or spend, **redeem** with insufficient-balance / zero-balance rejection. Earn ≠ redeem.

**Open**

- In or out of product Phase 1 (checklist says POS deferred; Settings still shows Connect). **Do not ship a POS UI that looks live if Phase 1 excludes it.**
- Device: `/app` page vs dedicated staff view.
- Success / fail / already-redeemed / inactive-member states.

#### UX-12 — Referral Pending Review (merchant)

| | |
|--|--|
| **Need / priority** | Design · **P1** |
| **Source** | [referral fraud](../frontend/loyalty-page.md#referral-fraud-controls-decided) · meeting report “Not decided” · **DG-11** remaining |

**Locked**

- Same device **or** same IP in the **same minute** → row `pending_review`. Referrer is **not** granted until a reviewer clears to `pending` or `rejected`.
- Status and backend path are locked. **The screen is not.**

**Open**

- Does the merchant see this list at all in Phase 1, or is review internal-only?
- Table columns, approve/reject copy, empty state.

#### UX-13 — Loyalty program overview (create vs edit split)

| | |
|--|--|
| **Need / priority** | Design · **P1** |
| **Source** | loyalty-page.md “same page is create and edit”; TODO in source; G-35 |

**Locked**

- Save today always returns to dashboard. Type change copy says “anytime” but does not migrate counters ([UX-47](#ux-47)).

**Open**

- After multi-program: list → create → edit. Status chips. Confirm before disabling an `active` program that has members.

### 1.4 Campaigns & messaging

#### UX-14 — Campaign schedule UI — or hide the tab

| | |
|--|--|
| **Need / priority** | Decision + Design · **P1** |
| **Source** | [G-09](../frontend/gaps-and-solutions.md#g-09--campaign-send--opens--automations) · campaigns-page Scheduled tab · `scheduled_at` unused |

**Locked**

- Tab **Scheduled** exists and stays at 0. Column exists. Product lifecycle includes Scheduled.

**Open**

- Design a date/time picker (owner timezone — not locked) **or** hide the tab until a worker exists. Do not leave a tab that can never fill.

#### UX-15 — Automations: config-only vs hide Enable

| | |
|--|--|
| **Need / priority** | Decision + Design · **P1** |
| **Source** | **DG-10** · campaigns-page automations · meeting report: automations **not decided** |

**Locked**

- Seven types, CRUD, unique per type. **Enabled does not send.** `config` jsonb is never used.

**Open**

- Phase 1: hide the whole section, keep CRUD but hide Enable, or show “coming later” non-actionable cards.
- If kept: per-type settings (when it fires, who, what message, timezone) — **behavior is not specified**. Do not invent trigger UX as if it were live.

#### UX-16 — Campaign create: personalization hints + freeze-after-send

| | |
|--|--|
| **Need / priority** | Design · **P2** |
| **Source** | campaigns-page personalization UX gap |

**Locked tokens:** `{{name}}`, `{{first_name}}`, `{{business_name}}`. They work on send; the dialog does not mention them. Detail preview is raw, not personalized.

**Open**

- Token chips / sample preview.
- After send: freeze message vs allow silent overwrite (today allowed).

### 1.5 Settings, billing, support

#### UX-17 — Billing: real checkout vs non-operational

| | |
|--|--|
| **Need / priority** | Decision + Design · **P1** |
| **Source** | [G-07](../frontend/gaps-and-solutions.md#g-07--plan-limits-are-ui-only-billing-is-a-placeholder) · **DG-04** · settings-page Billing · onboarding plan |

**Locked**

- Checkout + webhook must be the **sole** writer of `profiles.plan`. Today Settings and onboarding write the field with “no payment will be charged.”

**Open**

- Hide plan switch, mark “not available”, or design checkout (provider **not chosen**).
- **No downgrade** is a checklist item **not in docs** — if product confirms it, the switcher must not offer a lower plan (or must block with copy).
- Upgrade CTA on Branches goes to `/pricing` — align that path with whatever Billing becomes.
- Onboarding `/onboarding/plan` is the same placeholder.

#### UX-18 — Internal admin / support back office

| | |
|--|--|
| **Need / priority** | Decision first · **P2** |
| **Source** | audit **A-01** |

**There is no `/admin`.** Support cannot suspend a tenant, impersonate, resend stuck mail, or refund points.

**Do not design this** until product says Loyollo-the-company needs an operator console. Distinct from merchant `admin`.

---

## 2. UX decisions: hide vs honest placeholder vs wire

These controls **already exist** and either lie, do nothing, or contradict Phase-1 scope. UI/UX + product must pick **hide**, **keep `"—"`**, **relabel**, or **wire**. Default engineering honesty (ADR-014) is `"—"` or hide — not fake numbers.

### 2.1 Product Phase 1 exclusions (docs vs checklist)

#### UX-19 — Phase 1 exclusions: social auth, 2FA, POS, Wallet

| | |
|--|--|
| **Need / priority** | Decision · **P0** |
| **Source** | **DG-01**, **DG-02** · settings Integrations · ADR-005 · G-26 |

| Item | Docs today | Checklist | What design must lock |
|------|------------|-----------|------------------------|
| Facebook / Google / Apple **Sign-In** | **Never mentioned** | Deferred from Phase 1 | Never / later / hidden buttons on `/auth/*` |
| **2FA** | Settings documents **real TOTP enroll**; login challenge missing (G-26) | Deferred from Phase 1 | If Phase 1 **excludes** 2FA: hide Security 2FA card. If it **includes** enroll: design the **sign-in MFA challenge** ([UX-56](#ux-56)) |
| **POS** (Square, Clover, Toast, Lightspeed, Shopify) | Catalog + “recorded your interest” | Deferred | Hide Integrations POS rows vs interest-only |
| **QR & Wallet** (Apple/Google Wallet) | Same catalog | Deferred | Hide vs interest-only. **Shop join QR on `/app/loyalty` stays in Phase 1** — different feature |

Integrations tab as a whole: out of Phase 1, or visible catalog that never looks “Connectable.”

#### UX-20 — Analytics Revenue Impact: hide vs `"—"`

| | |
|--|--|
| **Need / priority** | Decision · **P0** |
| **Source** | **DG-03** · G-06 · analytics-page Revenue tab + Overview AOV card |

Checklist: **hide** Overview Revenue Impact and (by implication) the Revenue tab in Phase 1 (no POS). Specs: **keep** the tab and Overview card as `"—"`. Subtitle still says “revenue impact.”

**Pick one:** remove tab + Overview money card, or keep honest dashes and change the subtitle so it does not promise revenue.

Same ruling should cover Dashboard **Total Revenue** (today sums `campaigns.revenue_cents` → `$0.00` looks like GMV) and Campaigns **Campaign Revenue** `$0.00`.

#### UX-21 — Business Type fixed dropdown

| | |
|--|--|
| **Need / priority** | Decision + Design · **P1** |
| **Source** | **DG-05** · [G-24](../frontend/gaps-and-solutions.md#g-24--settings-field-labels-vs-columns) · onboarding business-category / business-type |

**Today:** UI label “Business Type” writes `business_category`; “Industry” writes `business_type`; `industry` has **no input**. No option list. Control type (select vs free text) and mutability after onboarding are unset.

**Need from UI/UX + product:** canonical option enum, which Settings vs onboarding field is the dropdown, labels that match columns, immutable-after-onboarding or not.

#### UX-22 — Marketing-tool strategy (Mailchimp / Klaviyo)

| | |
|--|--|
| **Need / priority** | Decision · **P2** |
| **Source** | **DG-07** · G-19 |

Catalog ≠ strategy. Until objects/direction/Phase are locked, treat like POS: hide or interest-only. Do not design OAuth connect screens.

#### UX-23 — Currency meaning

| | |
|--|--|
| **Need / priority** | Decision · **P1** |
| **Source** | **DG-09** · settings General · dashboard hardcodes USD |

`profiles.currency` is saved and **ignored** on Dashboard. Need: display vs billing vs points valuation; ISO 4217 select vs free text; one currency per shop; what happens to historical `*_cents` if changed. Then design the Settings control and every `$` widget to use it — or hide Currency until defined.

#### UX-24 — Communication policy + SMS in Phase 1

| | |
|--|--|
| **Need / priority** | Decision · **P1** |
| **Source** | **DG-08** · campaigns channel `email` \| `sms` · 17-messaging SMS stub |

**Open:** marketing vs transactional; stored opt-in on join; frequency caps; quiet hours; preferred channel; unsubscribe vs `suppressed_emails`; whether **SMS campaigns** are a real path, a visible-fail stub, or **hidden** in Phase 1.

If SMS is out of Phase 1, hide the channel picker. If it stays, design the explicit failure (today every SMS recipient fails with “SMS provider not configured”).

#### UX-25 — Single “At risk” definition + engagement exclusivity

| | |
|--|--|
| **Need / priority** | Decision · **P1** |
| **Source** | **DG-14**, **DG-15**, [G-08](../frontend/gaps-and-solutions.md#g-08--three-at-risk-definitions) |

Four published rules:

| Place | Rule |
|-------|------|
| Analytics Overview | `last_activity_at` **> 60 days** |
| Analytics Engagement | **20–60 days** |
| Dashboard | **> 30 days** |
| Customers / campaigns | stored `status` `at_risk` (send wrongly queries `at-risk`) |

Engagement buckets: specs allow **overlap**; glossary wants **exclusive**.

**Need:** one glossary for Phase 1, and whether Overview vs Engagement may keep different cutoffs. Then restyle labels so “At risk” / “Champion” are not four products.

#### UX-26 — Loyalty ↔ “bill types”

| | |
|--|--|
| **Need / priority** | Decision · **P2** |
| **Source** | **DG-12** |

If this means program types `points` / `visit` / `tier`, relationship is documented. If it means POS ticket class, **it is not in any doc** — do not design a bill-type picker.

### 2.2 Misleading labels (honesty bugs)

Existing widgets that train the merchant to distrust numbers. Prefer relabel or `"—"` / hide until data exists.

| ID | Widget | Shows | Claims | Source | Ask |
|----|--------|-------|--------|--------|-----|
| **UX-27** | Customers “New this month” | Gold+VIP count | New members this month | G-12 · customers-page | Relabel to tier count **or** compute from `created_at` |
| **UX-28** | Customers “Returning Rate” | Silver count | A rate | G-12 | Relabel or hide until visit events |
| **UX-29** | Branches performance donut | Even % split | Performance share | G-04 · ADR-014 | Hide or `"—"` until `branch_id` |
| **UX-30** | Branch cards customers / redemptions | Program total ÷ N | Per-branch stats | G-04 | Same |
| **UX-31** | Campaign Performance after send | `0% Open` / `0% Redeemed` | Measured results | G-09 · meeting report | `"—"` until opens/redemptions exist (Phase 1 does **not** track opens — already locked) |
| **UX-32a** | Auth promo cards | Hardcoded `+20%` / `863.5K` / `5.6M` | Product metrics | audit §3.6 · sign-in | Mark as marketing fiction or remove numbers |
| **UX-32b** | Dashboard / Campaigns revenue | `$0.00` | GMV | G-06 | `"—"` or hide (same ruling as UX-20) |

### 2.3 Dead or decorative controls

| ID | Control | Where | Ask | Source |
|----|---------|-------|-----|--------|
| **UX-33** | Header **Search** | Every `/app/*` shell | Hide until `GET /api/search`, or design results | G-05 |
| **UX-34** | **This month** | Dashboard, Analytics, Branches | Hide/disable until period query | dashboard / analytics / branches specs |
| **UX-35** | Analytics **Export** | `/app/analytics` | Hide or design export (CSV/PDF, period) | analytics-page |
| **UX-36** | Insight CTAs Send / Nudge / Explore / Create | Analytics Engagement | Disable + tooltip, or design prefilled campaign | G-09 · data-contract insight rule |
| **UX-37** | Live Activity **View All** | Dashboard | Hide until event log | G-01 |
| **UX-38** | Contact form submit | `/contact` | Wire or remove submit (map is real, Vancouver coords) | 02-route-migration · audit §3.3 |
| **UX-39** | Customers **Send Campaign** | List row + detail | Prefill audience / customer, or drop the item | customers-page |
| **UX-40a** | Analytics “1 visit from a reward” uses `visits % 5` | Insights | Align copy with program `visits_required` or say “example rule” | analytics-page |
| **UX-41** | Dashboard checklist “Launch campaign” | Existence of any campaign **draft** counts | Copy: “Create” vs “Launch” | dashboard-page |
| **UX-41a** | Loyalty **Send Upgrade Nudge** | `MembersCloseToUpgradingPanel` would toast success on an empty list | Disable / hide until tier assignment exists | loyalty-page · G-03 |
| **UX-41b** | Referrals **Top referrers** | Hardcoded empty array; settings save only | Hide leaderboard until `referrals` exist, or honest empty | G-14 |

### 2.4 Small existing-screen fixes (layout / IA)

| ID | Issue | Ask | Source |
|----|-------|-----|--------|
| **UX-42** | Header avatar → `/dashboard`, not Settings | Link to `/app/settings` (or a menu) | G-22 |
| **UX-43** | Settings tabs are React state, not URL | `?tab=` so Notifications is deep-linkable | G-23 |
| **UX-44** | Settings reachable mid-onboarding | Same onboarding gate as other `/app` pages | G-23 |
| **UX-45** | Two password UIs (Settings Security vs `/app/settings/password`) | One flow | G-25 |
| **UX-46** | Branches search placeholder “name, email, or phone” | Match copy to name/city/address | G-29 |
| **UX-47** | Loyalty “change type anytime” | Honest copy: lock after first member, or warn | G-31 |
| **UX-48** | Join fields `gender` / `city` / `custom_field_value` hidden from owner | Show on customer detail / add dialog | G-17 |
| **UX-49** | Customer detail: LTV / referrals / transactions / rewards “Coming soon” | Honest empty vs hide until APIs | G-13 |
| **UX-50** | Detail hero defaults null tier to **Bronze**; list shows empty | One empty treatment | customers-page |
| **UX-51** | Branch detail: fake grey bars | Remove fake chart; use `"—"` / empty copy | G-13 · G-04 |
| **UX-52** | Customers At-Risk / Churned tabs always 0 | Hide tabs until a writer exists, or compute from recency (after UX-25) | G-08 |
| **UX-53** | Campaigns Enable sets Active without sending | Align Enable/Disable/Launch with locked lifecycle (Enable → Draft) | G-09 · meeting report |
| **UX-54** | No loyalty program: Customers/Campaigns empty list; Analytics has a dedicated empty canvas | One empty-program pattern | page specs |
| **UX-55** | Session timeout lands on generic sign-in (`redirectedFrom` unused) | Design post-login return (allow-listed paths only) | audit S-16 |
| **UX-56** | MFA enroll exists; sign-in may skip challenge | Design AAL2 challenge on `/auth/sign-in` **if 2FA is in Phase 1** (UX-19) | G-26 |
| **UX-57** | Optional suppression-list read-only UI | Settings vs hide | G-30 |
| **UX-58** | Email change disabled on Settings | Keep disabled with explanation, or design Auth email-change flow | settings-page |
| **UX-59** | Reward “on completion” is a free-text label, not a catalog `rewards.id` | Picker from Rewards tab vs keep string | loyalty-page |
| **UX-60** | Settings subtitle mentions “team members” with no team UI | Point at UX-01/03 or drop the phrase until those ship | settings-page known limitations |
| **UX-60a** | Loyalty advanced rules saved but unused (min spend, expiry, birthday double, signup bonus, card expiry, notify 1-away, tier multipliers) | **Hide** those fields until check-in/POS honours them, or mark “not applied yet” | G-10 |
| **UX-60b** | Loyalty QR / visit / tier-member stats hardcoded `"0"` | Use `"—"` or hide until `visit_events` + tier write | G-01, G-02, G-03 |
| **UX-60c** | Notification toggles save but in-app bell ignores them | Disable toggles, or annotate “email only / not applied yet” | G-15 |
| **UX-60d** | Delete last / **main** branch allowed; no reassign | Confirm + block, or force pick a new main | G-28 |
| **UX-60e** | Reward performance dialog: revenue and per-tier counts are 0 | `"—"` / hide until redeem + orders | G-06, G-20 |
| **UX-60f** | Campaign “At Risk” audience matches nobody (`at-risk` vs `at_risk`) | Empty-state copy must not look like a data problem the owner caused; fix is also engineering (G-08) | campaigns-page |
| **UX-60g** | Visit `VisitsProgressSection` / stamp stats always empty | Hide telescope-on-purpose until events, or derive buckets from `visits` vs `visits_required` | G-02 |

---

## 3. Copy & content

Existing **auth/transactional/campaign templates must not be rewritten** (ADR-010). These are **new** or **gap** copy.

#### UX-61 — Teammate-created email

| | |
|--|--|
| **Need / priority** | Copy · **P0** |
| **Source** | 11-auth email facts · [17-messaging-templates.md](../frontend/17-messaging-templates.md) |

**Locked facts in the mail:** they were added to the shop’s `/app`; their **email**; the **temporary password**.

**Must not** reuse or overwrite `invite.tsx` (“You've been invited” / accept-link).

**Open:** subject, body, layout, CTA (sign-in URL). English is the current product language.

#### UX-62 — OTP SMS / WhatsApp text

| | |
|--|--|
| **Need / priority** | Copy · **P0** |
| **Source** | 17-messaging OTP row · loyalty OTP |

Code only; never log plaintext. Channel chosen at request time. Same copy family for join, register, login, and lost-access unless product wants distinct strings.

**Open:** sender name, expiry wording (TTL not locked — avoid hard-coding minutes until product sets them).

#### UX-63 — Campaign token helper copy

Document `{{name}}` / `{{first_name}}` / `{{business_name}}` in the create dialog (see UX-16).

#### UX-64 — Auth / landing invented stats

Ruling for UX-32a: either clearly “illustrative” or remove. Same for landing hero hardcoded targets ([Hero.tsx](../../src/components/landing/Hero.tsx) per audit).

#### UX-65 — Arabic vs English for account status

Meeting report uses **نشط / غير نشط**. App is English-only; i18n is deferred. Decide whether the account list shows English only, bilingual chips, or waits on localization.

---

## 4. Assets & brand

ADR-010: **no new visual language**. New screens reuse Figtree, navy/yellow, existing empty-state illustrations (telescope, etc.) unless a **new empty state** is required.

| ID | Asset | Notes | Priority |
|----|-------|-------|----------|
| **UX-66** | Customer **wallet card** | Facts locked; pixel layout free. Share QR is **personal**, not the shop program QR | P0 |
| **UX-67** | Customer portal chrome | Distinct from merchant sidebar; same tokens | P0 |
| **UX-68** | OTP / channel picker (SMS vs WhatsApp) | Icons, selected states, 429 toast | P0 |
| **UX-69** | Program **status pills** | `draft` / `active` / `disabled` — do not collide with campaign pills (Active = sending) or member status | P0 |
| **UX-70** | Account **active / inactive** chips | Distinct from member `at_risk` / `churned` | P0 |
| **UX-71** | Empty states for: zero programs, inactive login, pending-review list, wallet with no programs, POS insufficient points | Reuse telescope where it still means “no data”; do not reuse it for **errors** (429, inactive) | P1 |
| **UX-72** | Referral share sheet (copy link / save QR / native share) | On the wallet card | P1 |
| **UX-73** | Teammate-created **email HTML** | New template; visual parity with existing React Email auth set | P0 |
| **UX-74** | MFA challenge (if in Phase 1) | TOTP input; parity with Settings 2FA enroll QR | P1 |

Do **not** vendor new marketing assets via external CDN ([deferred-decisions](../architecture/deferred-decisions.md) asset vendoring is done).

---

## 5. Not UI/UX — do not design as if these exist

Designing pixel-perfect charts against missing data produces unbuildable screens. Until backend ships the keystone, use hide / `"—"`.

### Backend-owned (ADR-014)

| Missing | Blocks | Gap |
|---------|--------|-----|
| `visit_events` | QR scan counts, visit frequency, peak hour, live activity, real returning rate, per-week first-time vs returning | G-01, G-02 |
| `points_ledger` + redeem API | Wallet spendable truth, POS redeem, redemption donut, `redeemed_count` | G-20 |
| `orders` + attribution | All revenue, LTV, ROI, branch-by-revenue, campaign revenue | G-06 |
| `customers.tier` writer | Tier donut, VIP/Gold audiences, customer tier filter | G-03 |
| `branch_id` on events | Per-branch cards and donut | G-04 |
| `referrals` + `vouchers` + OTP tables | Referral leaderboard, both-party grants | G-14 |
| Role + `account_status` columns | UX-01…04, customer never `/app` | G-33, G-34, G-36 |
| Campaign job worker + ESP opens | Completed tab, `% Open`, automations execution | G-09 |
| Real email/SMS transport | Every mail-dependent flow, including UX-61 | ADR-009/010, audit S-02 |
| Checkout webhook | UX-17 | G-07 |
| Paginated customer/search APIs | Header search, large lists | G-05, G-11 |

### Product-manager open questions (do not guess in mockups)

From [meeting report “Not decided”](../product-manager-meeting-report.md) and deferred-decisions:

1. Customer-portal **URL**
2. Whether **more than one** loyalty program can be `active` at once
3. Whether `staff` can add teammates (`admin` rows **are** on the Team tab — locked)
4. **Staff subtypes** (manager / cashier / …) and a later permission split — `staff` = `admin` permissions until then
5. Default referral expiry **day counts**
6. OTP challenge **TTL** and attempt cap
7. Merchant UI for **Pending Review** vs internal-only (UX-12)
8. Device-fingerprint algorithm (hashes locked; UI does not show raw IP)
9. SMS vs WhatsApp **provider** (channel enum locked; adapters stay stubs)
10. Open tracking, SMS delivery, automations execution, campaign revenue
11. i18n (English-only today)
12. Payment provider

---

## Request index

| ID | Need | P | Title |
|----|------|---|-------|
| UX-01 | Design | P0 | Add teammate form |
| UX-02 | Design | P0 | First-login force password change |
| UX-03 | Design | P0 | One page, two tabs (Team / Customers) + active/inactive + filters |
| UX-04 | Design | P1 | Re-issue temp password |
| UX-05 | Design | P0 | Customer register (OTP) |
| UX-06 | Design | P0 | Customer login / lost access (OTP) |
| UX-07 | Design | P0 | Customer wallet per program |
| UX-08 | Design | P0 | Customer portal shell + routes proposal |
| UX-09 | Design | P0 | Join page OTP + referral context + consent |
| UX-10 | Design | P0 | Multi-program list / switcher + status |
| UX-11 | Design | P1 | Staff POS award / redeem (if in Phase 1) |
| UX-12 | Design | P1 | Referral Pending Review screen |
| UX-13 | Design | P1 | Loyalty list vs create/edit |
| UX-14 | Decision | P1 | Campaign Scheduled tab: design or hide |
| UX-15 | Decision | P1 | Automations: hide / config-only / later |
| UX-16 | Design | P2 | Campaign token hints + freeze-after-send |
| UX-17 | Decision | P1 | Billing / onboarding plan: hide vs checkout |
| UX-18 | Decision | P2 | Internal `/admin` back office — product first |
| UX-19 | Decision | P0 | Phase 1: social auth, 2FA, POS, Wallet, Integrations tab |
| UX-20 | Decision | P0 | Revenue Impact tab / money widgets: hide vs `"—"` |
| UX-21 | Decision | P1 | Business Type dropdown + enum + labels |
| UX-22 | Decision | P2 | Mailchimp / Klaviyo: hide vs interest |
| UX-23 | Decision | P1 | What Currency does |
| UX-24 | Decision | P1 | Consent policy + SMS in/out of Phase 1 |
| UX-25 | Decision | P1 | One At-risk definition; exclusive vs overlapping buckets |
| UX-26 | Decision | P2 | “Bill type” = program type or POS ticket? |
| UX-27…32 | Decision | P1 | Misleading labels / fake stats / `$0.00` |
| UX-33…41b | Decision | P1 | Dead buttons (search, This month, Export, CTAs, contact, nudge, referrers) |
| UX-42…60g | Design | P1–P2 | Existing IA / empty-state / copy / unused-field honesty (incl. G-10, G-15, G-28) |
| UX-61…65 | Copy | P0–P1 | New emails, OTP text, tokens, promo stats, AR/EN |
| UX-66…74 | Asset | P0–P1 | Wallet, portal, pills, empty states, email HTML |

### Suggested design order

1. Close **UX-19, UX-20, UX-24, UX-25** (Phase 1 scope) so the rest of the file does not produce out-of-scope screens.
2. Design **P0 new flows:** UX-01…03, UX-05…10, UX-61, UX-62, UX-66…70, UX-73.
3. Honesty pass on existing merchant UI: UX-27…41, UX-53.
4. Remaining P1/P2 after backend keystones (ledger, orders, events) have dates.

---

## Traceability (docs → this file)

Every indexed gap / docs-gap / audit item that has a **design** consequence is listed. Backend-only items point at [§5](#5-not-uiux--do-not-design-as-if-these-exist).

### G-01 … G-36

| Gap | UI/UX request |
|-----|----------------|
| G-01 QR scans always 0 | UX-37, UX-60b · else §5 |
| G-02 Visit/stamp empty | UX-60g · else §5 |
| G-03 Tier never assigned | UX-41a, UX-50, UX-60b · else §5 |
| G-04 Branch even-split | UX-29, UX-30, UX-51 |
| G-05 Header search | UX-33 |
| G-06 Revenue dead | UX-20, UX-32b, UX-60e |
| G-07 Billing placeholder | UX-17 |
| G-08 Four “at risk” rules | UX-25, UX-52, UX-60f |
| G-09 Campaigns / automations | UX-14, UX-15, UX-31, UX-36, UX-53 |
| G-10 Unused loyalty rules | UX-60a |
| G-11 List scale | §5 (API); no new visual until cursor pagination |
| G-12 Customers stat labels | UX-27, UX-28 |
| G-13 Detail shells | UX-49, UX-51 |
| G-14 Referrals without attribution | UX-07, UX-09, UX-12, UX-41b, UX-72 |
| G-15 Notification prefs cosmetic | UX-60c |
| G-16 Avatar URL expiry | §5 (ops); not a new screen |
| G-17 Join-only fields hidden | UX-48 |
| G-18 Rate limit | UX-05, UX-09 (429 toast) |
| G-19 Integrations never connect | UX-19, UX-22 |
| G-20 Redeem vs earn | UX-11, UX-60e |
| G-21 Birthday unused | UX-15 |
| G-22 Avatar → dashboard | UX-42 |
| G-23 Tabs / onboarding gate | UX-43, UX-44 |
| G-24 Business Type labels | UX-21 |
| G-25 Two password UIs | UX-45 |
| G-26 MFA login challenge | UX-19, UX-56, UX-74 |
| G-27 Delete-account cleanup | §5 |
| G-28 Main branch delete | UX-60d |
| G-29 Branches search copy | UX-46 |
| G-30 Suppression list | UX-57 |
| G-31 Program type change | UX-47 |
| G-32 Plan contact/admin caps | UX-01, UX-17 |
| G-33 Customer register/login | UX-05, UX-06, UX-07, UX-08, UX-09 |
| G-34 Add admin/staff | UX-01, UX-02, UX-04, UX-61, UX-73 |
| G-35 Multiple programs | UX-10, UX-13, UX-69 |
| G-36 Account active/inactive | UX-03, UX-65, UX-70 |

### DG-01 … DG-15 · A-01

| ID | UI/UX request |
|----|----------------|
| DG-01 Phase 1 exclusions (social / 2FA / POS / Wallet) | UX-19 |
| DG-02 Integrations tab in/out of Phase 1 | UX-19 |
| DG-03 Hide vs `"—"` Revenue Impact | UX-20 |
| DG-04 No subscription downgrade | UX-17 |
| DG-05 Business Type dropdown + enum | UX-21 |
| DG-06 RBAC / admin-on-admin / staff add-teammate | UX-01, UX-03 |
| DG-07 Marketing-tool strategy | UX-22 |
| DG-08 Communication / SMS policy | UX-24, UX-09 consent |
| DG-09 Currency meaning | UX-23 |
| DG-10 Automation execution | UX-15 |
| DG-11 Referral remaining (expiry days, portal URL) | UX-07, UX-08 · §5 |
| DG-12 Bill / ticket type | UX-26 |
| DG-13 Analytics fetch wording | Engineering only · §5 |
| DG-14 At-risk definition | UX-25 |
| DG-15 Engagement exclusive vs overlap | UX-25 |
| A-01 Internal admin | UX-18 |

### Meeting-report “not decided” → this file

Portal URL → UX-08. Multiple `active` programs → UX-10. Account page two tabs (Team / Customers); `admin` rows on Team → UX-03. Staff can add teammates → UX-01 (not locked). Staff subtypes → §5 (do not design a permission matrix). Referral default days → §5. OTP TTL/cap → UX-05 states only. Pending Review screen → UX-12. SMS vs WhatsApp provider → UX-24 / §5. Automations / opens / revenue → UX-14, UX-15, UX-20.

---

*This file is documentation. It does not authorize frontend migrations of backend-owned tables ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)) or a visual redesign ([ADR-010](../architecture/decisions/ADR-010-style-and-template-parity.md)).*
