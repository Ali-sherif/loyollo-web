# UI/UX team requests

**Date:** 2026-08-14  
**Audience:** UI/UX team  
**Purpose:** One list of everything `docs/` says is missing, undesigned, or undecided on the design side. Engineering must not invent screens that this list leaves open.

**Not in scope of this file:** backend schema, APIs, or Next.js implementation. Those stay in [gaps-and-solutions.md](../frontend/gaps-and-solutions.md), [data-contract.md](../backend/data-contract.md), and [api-contract.md](../backend/api-contract.md).

**There is no standalone PRD** in `docs/`. Product locks live in [product-manager-meeting-report.md](../product-manager-meeting-report.md) and the page specs. This file does not add new product decisions; it extracts what design still owes.

**Product scope labels:** never use bare “Phase 1” — see [phase-1-scope.md](./phase-1-scope.md).

Customer portal **case map** (every outcome on the 2026-08-16 diagram, plus cases the diagram omitted): [customer-portal-journey.md](./customer-portal-journey.md). Program model (Shop capabilities, one-per-type, one membership per Shop): [program-model.md](./program-model.md). Counter QR vs Shop membership: [counter-qr-and-program-membership.md](./counter-qr-and-program-membership.md). Customer reward progress: [customer-reward-progress.md](./customer-reward-progress.md). Catalog redeem (pending / reserve / QR verification): [reward-redemption-flow.md](./reward-redemption-flow.md).

**Jump to:** [How to use](#how-to-use-this-document) · [Locked constraints](#locked-constraints-do-not-redesign) · [1. New screens](#1-new-screens--flows-to-design) · [2. UX decisions](#2-ux-decisions-hide-vs-honest-placeholder-vs-wire) · [3. Copy](#3-copy--content) · [4. Assets](#4-assets--brand) · [5. Not UI/UX](#5-not-uiux--do-not-design-as-if-these-exist) · [Index](#request-index) · [Traceability](#traceability-docs--this-file)

---

## How to use this document

Each request is tagged:

| Tag | Meaning |
|-----|---------|
| **UX-nn** | This file’s request ID. Use it in Figma / tickets. |
| **Need** | `Design` (new screen/flow) · `Decision` (hide / keep / relabel) · `Copy` · `Asset` |
| **Priority** | `P0` blocks a DECIDED product flow · `P1` honesty / Product MVP (Ship 1) ship look · `P2` later or optional |
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
| Wallet: **one card per Shop** (sections for enabled Points / Visit / Tier). Never show a mixed points total across Shops (Shop A 100 + Shop B 200 ≠ 300). Reward progress is on that Shop’s card (points: numeric available + next-reward bar; visit: stamp icons; tier: current + next threshold). **Available = total − pending reserved.** | [program-model.md](./program-model.md) · [customer wallet](../frontend/loyalty-page.md#customer-wallet-per-shop-decided) · [counter QR](./counter-qr-and-program-membership.md) · [reward progress](./customer-reward-progress.md) · [redemption](./reward-redemption-flow.md) |
| Shop QR is the entry to **this Shop**. Always one destination. No program picker. | [counter QR](./counter-qr-and-program-membership.md) |
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
- Public new register is rate-limited: HTTP **429** must be a **visible toast**, no silent retry. **PM-06:** 3 failed guesses → 400 `OTP_MAX_ATTEMPTS_EXCEEDED`; 60s resend cooldown; 5 sends / 24h per **phone**; TTL **180s**. UI timers from `retry_after_seconds` — **do not hardcode** 60s / 180s.
- After successful **new-phone** OTP: [UX-75](#ux-75--customer-profile-setup-name-email-dob) **requires** name, email, DOB.
- Owner **Add Customer** in `/app/customers` stays a merchant tool (no OTP). Do not merge those forms.

**Open**

- URL. Channel empty states.
- Gender / city / custom (G-17) remain optional — not on the required UX-75 set.

**Working journey (not a new ADR):** register and login are **one OTP funnel**. Direct vs QR/`?ref=` share the phone step; referral uses a banner ([customer-portal-journey.md](./customer-portal-journey.md)). In-store returning check-in stays [UX-09](#ux-09--join-page-otp--referral-context) (no new OTP).

#### UX-06 — Customer login + lost access (new OTP)

| | |
|--|--|
| **Need / priority** | Design · **P0** |
| **Source** | credential recovery · G-33 |

**Locked**

- Login = new OTP on the same channel. **No** forgot-password screen. **No** merchant `RecoveryEmail`.
- After OTP → **customer portal**, never `/app`, never `/auth/reset-password`.
- Inactive `customer` must not get a session. Copy must stay **generic** (no “account suspended — contact support” that proves the phone exists).

**Open**

- Exact blocked-state copy (must stay **generic** — not “account suspended / contact support”, which enumerates).
- Wrong-channel empty state.

**Working journey:** same screens as [UX-05](#ux-05--customer-register-passwordless-otp). Unknown phone is **not** shown before OTP; after OTP a new phone goes to [UX-75](#ux-75--customer-profile-setup-name-email-dob).

#### UX-07 — Customer wallet (per Shop)

| | |
|--|--|
| **Need / priority** | Design · **P0** |
| **Source** | [customer wallet](../frontend/loyalty-page.md#customer-wallet-per-shop-decided) · [program-model.md](./program-model.md) · [customer-reward-progress.md](./customer-reward-progress.md) · meeting report §8 · G-33 |

**Locked facts on each Shop card**

| Fact | Rule |
|------|------|
| Shop / business name | From this Shop |
| Spendable points | This Shop only (if Points enabled). **Available = total − pending reserved.** **Forbidden:** a single mixed total across Shops |
| Expiry | One date if lots share it; otherwise **amount + date groups**. Never one date that hides a sooner-expiring lot |
| Vouchers | `active` vouchers + their dates. Used / expired are not spendable points |
| Share | Personal **link** + **QR** for this Shop’s join URL `?ref={referral_code}` — this is **not** the shop **counter** QR |
| **Reward progress** | **This Shop only.** Visit, Points, and Tier are **sections on the same card** when enabled. Visit: filled / empty stamp icons — `current / visits_required`. Points: numeric **available** vs next unearned live catalog reward (cheapest). Tier: current + remaining to next (status, not spendable). Ready-at-counter when earned/available; earn ≠ redeem. Catalog redeem is pending + single-use QR (staff scan verifies; 10-minute expiry). [customer-reward-progress.md](./customer-reward-progress.md) · [reward-redemption-flow.md](./reward-redemption-flow.md) · [program-model.md](./program-model.md#4-customer-membership-and-wallet) |

**Open**

- Pixel layout: sections vs tabs on the card; bar vs stamp row. Portal URL.
- Empty wallet (member of zero Shops), expired-lot treatment, copy/share/download QR.
- “See all rewards” for this Shop (optional under the primary target).
- Redeem control on the card / list: disable after submit; show the **single-use QR** + remaining TTL; reconcile `pending` / `completed` / `expired` from the server (multi-device). Pixel layout of pending QR vs available is free. Insufficient Available → clear error, no QR.
- Example that must stay true in mockups: Shop A 100 pts + Shop B 200 pts = **two cards, not 300**. Points + Visit **on the same Shop** = **one card with two sections**.

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
| **Source** | [join / OTP](../frontend/loyalty-page.md#public-join--check-in) · [counter QR](./counter-qr-and-program-membership.md) · [referral rewards](../frontend/loyalty-page.md#referral-rewards-decided) · G-18 |

**Locked**

- Today `/join/[programId]` enrolls without login. Direct `/join/{programId}` remains as today’s printed QR + `?ref=` (valid while the Shop has at least one `active` capability). OTP before new enroll; returning scan **at that Shop** = check-in (no new OTP). Existing account, first time at this Shop → create **this** membership only.
- `?ref=` is a personal invite. Returning check-in with `ref` does **not** create another referral. Referral never changes Shop scope.
- Shop QR always this Shop. No live capability → unavailable.
- Check-in / enroll **success** shows **this Shop’s** reward progress (same numbers as the wallet card), plus this-visit delta when there was one. [customer-reward-progress.md](./customer-reward-progress.md)

**Open**

- Exact Shop QR URL (backend-owned).
- Step sequence on the existing join page (branding from QR Experience tab **is** wired).
- How referred reward is previewed before OTP (working: **referral banner** on the entry screen).
- 429 / invalid OTP / expired OTP / already-used OTP / no live capability (`draft`/`disabled` must not accept join) empty states.
- Marketing consent: today disclaimer is **copy-only**, no stored opt-in ([DG-08](#ux-24--communication-policy--sms-in-product-mvp-ship-1)). Design a real consent control if product includes it in Product MVP (Ship 1).

Do **not** fold returning in-store check-in into the portal OTP diagram. Portal login is always OTP ([customer-portal-journey.md](./customer-portal-journey.md)).

#### UX-75 — Customer profile setup (name, email, DOB)

| | |
|--|--|
| **Need / priority** | Design · **P0** |
| **Source** | Portal case map 2026-08-16 · enroll body in [api-contract join](../backend/api-contract.md#join--otp--enroll) · [G-33](../frontend/gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows) |

**Locked**

- Shown only after a **successful OTP** for a **new** phone (no `customers` row yet). Failed OTP → no profile write.
- **All three required:** `full_name`, `email` (valid format), `birth_date` (ISO date). Invalid → highlight required fields, stay on this screen. Enroll **400** `ENROLL_VALIDATION_FAILED` with per-field `details`. **No** merchant optional override.
- After valid save: wallet ([UX-07](#ux-07--customer-wallet-per-shop)). If `?ref=` was valid, **referred-party** grant only — referrer still waits for first paid invoice.
- Owner **Add Customer** should collect the same three required fields; phone may still be omitted on owner-typed rows.

**Open**

- Gender / city / custom (G-17) on this screen or later (stay **optional**).

#### UX-76 — First-shop welcome + link Shop

| | |
|--|--|
| **Need / priority** | Design · **P0** |
| **Source** | Portal case map 2026-08-16 · 11-auth “enroll should link to the customer account” · [G-33](../frontend/gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows) |

**Locked**

- Existing **active** customer (phone already has an account) who is **not** yet a member of **this Shop**.
- After OTP: welcome + **link** this Shop, then wallet with a **new** card for that Shop (never merge points with other Shops).
- Welcome is **UX only**. It does **not** grant a bonus unless **this Shop’s Signup Bonus** is configured ([Signup vs Referral](../frontend/loyalty-page.md#signup-bonus-vs-referral-bonus-decided)). Do not copy “you got a welcome bonus” unless that flag is on.
- Distinct from in-store returning check-in (already a member of **this** Shop — no OTP, UX-09).

**Open**

- Copy and whether this is a full screen vs a banner on the wallet.
- Behavior when the Shop has no `active` **program**.

### 1.3 Loyalty operations (merchant)

#### UX-10 — Loyalty program list + ACTIVE default

| | |
|--|--|
| **Need / priority** | Design · **P0** |
| **Source** | [G-35](../frontend/gaps-and-solutions.md#g-35--shop-loyalty-is-one-row-not-independent-programs) · [program-model.md](./program-model.md) · [independent programs](../frontend/loyalty-page.md#independent-programs-decided) · [counter QR](./counter-qr-and-program-membership.md) |

**Locked**

- Many independent programs per Shop. **At most one `ACTIVE`**. Statuses: `draft` \| `active` \| `archived` \| `disabled` \| `expired` (later `soft_deleted`).
- Shop QR + `?ref=` always the **ACTIVE** program. Join unavailable with no ACTIVE.
- One customer **identity** per Shop; locked `enrolled_program`; catalog/wallet **program-scoped**.
- Today `/app/loyalty` is create+edit of **one** row. Target: a **program list** (create another Points program over time is valid). Activating B archives previous ACTIVE (allowed with members). Mutation 409: Wait vs Archive ([program-model.md](./program-model.md)).
- Happy Hour–style rates stay rules **inside** a Points program.

**Open**

- Merchant UI to **print the Shop QR** (pixel layout is free; exact URL backend-owned).
- Empty state: zero programs vs all archived/disabled.
- How Dashboard / Customers / Campaigns / Analytics scope to the Shop (today `maybeSingle` on one program row).

#### UX-11 — Staff POS: identify · award · redeem

| | |
|--|--|
| **Need / priority** | Design · **P1** (**staff cashier POS is in Product MVP (Ship 1)**; Square/Clover still deferred — [UX-19](#ux-19--product-mvp-ship-1-exclusions-social-auth-2fa-pos-wallet)) |
| **Source** | [G-20](../frontend/gaps-and-solutions.md#g-20--rewardsredeemed_count-vs-earn) · [reward-redemption-flow.md](./reward-redemption-flow.md) · audit §4.1 · **DG-01** |

**Locked (when built)**

- **Product MVP (Ship 1) cashier:** scan **customer QR** (`POST /api/pos/scan`) → optional **deferred migrate** → **Bill Amount + Invoice Number** (`POST /api/pos/transactions`). Square/Clover still deferred.
- Identify member (QR / phone), award visit or spend (**idempotent** on `idempotency_key` / `(shop_id, invoice_number)`). Earn ≠ redeem. Catalog **Redeem** from the customer wallet is not a staff “create redemption” click — the customer taps Redeem; staff **scans the redemption QR** at checkout.
- Catalog redeem: persist **`reward_snapshot`**; if Available < snapshot cost, refuse (no row); else `pending` + reserve + **single-use QR** (10-minute `qr_expires_at`). Staff **scan verifies** using the snapshot (atomic `PENDING → COMPLETED` + consume reserved; **PM-04**). Second scan / retry → **“already redeemed”**. Expired QR → **“expired”**. Create is idempotent.
- Staff scanning is **verification**, not discretionary approval. Staff **cannot** reject a valid, unexpired, un-redeemed QR. Do **not** design an Approve / Reject pending list for physical catalog rewards.
- Staff authz is **Shop-level**. Product MVP (Ship 1): any existing Staff or Admin role may perform Redemption scan/verify **and** cashier POS.
- Live catalog PATCHes are **prospective only**. Material cuts → new reward version.
- Refund / reversal is **out of Product MVP (Ship 1)**.

**Open**

- Device: `/app` page vs dedicated staff scanner view.
- Success / fail / already-redeemed / expired / wrong-shop / inactive-member / **INVOICE_DUPLICATE** states. Do not add Approve / Reject copy for a valid QR.

#### UX-12 — Referral Pending Review (merchant)

| | |
|--|--|
| **Need / priority** | Design · **P1** |
| **Source** | [referral fraud](../frontend/loyalty-page.md#referral-fraud-controls-decided) · meeting report “Not decided” · **DG-11** remaining |

**Locked**

- Same device **or** same IP in the **same minute** → row `pending_review`. Referrer is **not** granted until a reviewer clears to `pending` or `rejected`.
- Status and backend path are locked. **The screen is not.**

**Open**

- Does the merchant see this list at all in Product MVP (Ship 1), or is review internal-only?
- Table columns, approve/reject copy, empty state.

#### UX-13 — Loyalty program overview (create vs edit split)

| | |
|--|--|
| **Need / priority** | Design · **P1** |
| **Source** | loyalty-page.md “same page is create and edit”; TODO in source; G-35 |

**Locked**

- Save today always returns to dashboard. Type change copy says “anytime” but does not migrate counters ([UX-47](#ux-47)) — **target:** do not change type on a live row; create a new program and activate (archives previous ACTIVE).
- After independent programs: **`/app/loyalty` is a program list** (not three capability toggles). Status chips include `archived`. Confirm Wait vs Archive on mutation 409.

**Open**

- Pixel layout of the list vs create wizard.

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
- **PM-18:** Product MVP (Ship 1) **hide** Scheduled Automations. Writes → **503** `AUTOMATIONS_NOT_AVAILABLE_PHASE1`. Do **not** hide campaign list / Launch.

**Open**

- Later-phase trigger UX. Do not invent as if live.

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

These controls **already exist** and either lie, do nothing, or contradict Product MVP (Ship 1) scope. UI/UX + product must pick **hide**, **keep `"—"`**, **relabel**, or **wire**. Default engineering honesty (ADR-014) is `"—"` or hide — not fake numbers.

**Ship 1 exclusions (UX-19, UX-20):** use **comment out** in source — not feature flags. Canonical rule: [phase-1-scope.md § Implementation](./phase-1-scope.md#implementation--comment-out-do-not-refactor-decided).

### 2.1 Product MVP (Ship 1) exclusions (docs vs checklist)

#### UX-19 — Product MVP (Ship 1) exclusions: social auth, 2FA, POS, Wallet

| | |
|--|--|
| **Need / priority** | **DECIDED** · was P0 |
| **Source** | **DG-01** ✓, **DG-02** ✓ · settings Integrations · ADR-005 · G-26 · [phase-1-scope.md](./phase-1-scope.md#ship-1-ui-exclusion-lock-decided) |

**Decision (2026-08-18):** All items below are **out of Product MVP (Ship 1)**. Merchant UI is hidden by **commenting out** the JSX blocks — **not** feature flags, env vars, or `{flag && …}`. Marker: `/* OUT OF SCOPE Ship 1: … */`. Inventory: [phase-1-scope.md § Code inventory](./phase-1-scope.md#code-inventory--blocks-to-comment-out-for-ship-1).

| Item | Product MVP (Ship 1) | Ship 1 implementation |
|------|----------------------|------------------------|
| Facebook / Google / Apple **Sign-In** | **Out** | Do not add buttons on `/auth/*` |
| **2FA** | **Out** | **Comment out** Settings → Security `TwoFactorCard` |
| **POS** (Square, Clover, Toast, Lightspeed, Shopify) | **Out** | **Comment out** Settings → Integrations tab + all toggles. **Staff cashier** (Bill Amount + Invoice Number) **is in** — [UX-11](#ux-11--staff-pos-identify--award--redeem) |
| **QR & Wallet** (Apple/Google Wallet passes) | **Out** | **Comment out** Integrations `"QR & Wallet"` rows. **Shop join QR on `/app/loyalty` stays in** — different feature |

Integrations tab as a whole: **commented out** for Ship 1 (not interest-only catalog).

#### UX-20 — Analytics Revenue Impact (DECIDED — comment out)

| | |
|--|--|
| **Need / priority** | **DECIDED** · was P0 |
| **Source** | **DG-03** ✓ · G-06 · analytics-page Revenue tab + Overview AOV card · [phase-1-scope.md](./phase-1-scope.md#ship-1-ui-exclusion-lock-decided) |

**Decision (2026-08-18):** **Comment out** — do not keep tab/card as `"—"` placeholders in Ship 1.

| Surface | Ship 1 implementation |
|---------|------------------------|
| Analytics **Revenue Impact** tab + `RevenueTab` | **Comment out** tab entry and panel |
| Overview **Revenue impact** card | **Comment out** entire `<Card>` |
| Page subtitle | Trim “revenue impact” while card is commented |
| Dashboard **Total Revenue** | **Comment out** stat card |
| Campaigns **Campaign Revenue** / detail **Revenue Influenced** | **Comment out** |
| Customers **Revenue** column + sort | **Comment out** |
| Branches **Performance / By revenue** + detail **Revenue Influenced** | **Comment out** |
| Rewards detail **Total Revenue** tile | **Comment out** |

Post–Ship 1: uncomment blocks when `orders` + attribution ship — do not add flags.

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

`profiles.currency` is **display metadata only** (symbol/label). Changing it must **not** convert historical `*_cents`, points, or vouchers. Each `orders` / `points_ledger` row snapshots `currency_code` at write time. No FX. Design Settings + `$` widgets to use the display code — never imply conversion.

#### UX-24 — Communication policy + SMS in Product MVP (Ship 1)

| | |
|--|--|
| **Need / priority** | Decision · **P1** |
| **Source** | **DG-08** · campaigns channel `email` \| `sms` · 17-messaging SMS stub |

**Open:** marketing vs transactional; stored opt-in on join; frequency caps; quiet hours; preferred channel; unsubscribe vs `suppressed_emails`; whether **SMS campaigns** are a real path, a visible-fail stub, or **hidden** in Product MVP (Ship 1).

If SMS is out of Product MVP (Ship 1), hide the channel picker. If it stays, design the explicit failure (today every SMS recipient fails with “SMS provider not configured”).

#### UX-25 — Single “At risk” definition + engagement exclusivity

| | |
|--|--|
| **Need / priority** | Decision · **P1** (cutoff **resolved**; exclusivity open) |
| **Source** | **DG-14** (resolved), **DG-15**, [G-08](../frontend/gaps-and-solutions.md#g-08--three-at-risk-definitions) |

**Canonical rule (DG-14, 2026-08-18):** **At risk** = no activity for **> 30 consecutive days** (`last_activity_at` required; null excluded). Snake_case `at_risk` everywhere in DB/API (campaign send fixed).

| Place | Rule |
|-------|------|
| Analytics Overview | `last_activity_at` **> 30 days** |
| Analytics Engagement | `last_activity_at` **> 30 days** |
| Dashboard | `last_activity_at` **> 30 days** |
| Customers / campaigns | stored `status` `at_risk` (send queries same value) |

Engagement buckets: specs allow **overlap** with Champions/Loyal/Occasional; glossary wants **exclusive** (**DG-15** still open).

**Remaining:** optional nightly job to write `status` from recency; restyle labels so “At risk” / “Champion” are not confused with tier names.

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
| **UX-31** | Campaign Performance after send | `0% Open` / `0% Redeemed` | Measured results | G-09 · meeting report | `"—"` until opens/redemptions exist (Product MVP (Ship 1) does **not** track opens — already locked) |
| **UX-32a** | Auth promo cards | Hardcoded `+20%` / `863.5K` / `5.6M` | Product metrics | audit §3.6 · sign-in | Mark as marketing fiction or remove numbers |
| **UX-32b** | Dashboard / Campaigns revenue | `$0.00` | GMV | G-06 | **Comment out** for Ship 1 (same ruling as UX-20) |

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
| **UX-56** | MFA enroll exists; sign-in may skip challenge | **Out of Ship 1** — comment out `TwoFactorCard`; do **not** design sign-in MFA challenge until product re-opens 2FA | G-26 |
| **UX-57** | Optional suppression-list read-only UI | Settings vs hide | G-30 |
| **UX-58** | Email change disabled on Settings | Keep disabled with explanation, or design Auth email-change flow | settings-page |
| **UX-59** | Reward “on completion” is a free-text label, not a catalog `rewards.id` | Picker from Rewards tab vs keep string | loyalty-page |
| **UX-60** | Settings subtitle mentions “team members” with no team UI | Point at UX-01/03 or drop the phrase until those ship | settings-page known limitations |
| **UX-60a** | Loyalty advanced rules saved but unused (min spend / **Minimum invoice amount** `min_spend_per_visit`, expiry, birthday double, signup bonus, card expiry, notify 1-away, tier multipliers) | **Hide** those fields until check-in/POS honours them, or mark “not applied yet”. Product meaning of Minimum invoice amount: [program-model.md](./program-model.md#qualifying-visit--minimum-invoice-amount-min_spend_per_visit) | G-10 |
| **UX-60b** | Loyalty QR / visit / tier-member stats hardcoded `"0"` | Use `"—"` or hide until `visit_events` + tier write | G-01, G-02, G-03 |
| **UX-60c** | Notification toggles save but in-app bell ignores them | Disable toggles, or annotate “email only / not applied yet” | G-15 |
| **UX-60d** | Delete last / **main** branch allowed; no reassign | Confirm + block, or force pick a new main | G-28 |
| **UX-60e** | Reward performance dialog: revenue and per-tier counts are 0 | `"—"` / hide until redeem + orders | G-06, G-20 |
| **UX-60f** | Campaign “At Risk” audience matches nobody when `status` not written | Empty-state copy must not look like a data problem the owner caused; snake_case query fixed (G-08 partial); nightly status job still deferred | campaigns-page |
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

**Open:** sender name. TTL is **180 seconds** (PM-06) — copy may say “expires in 3 minutes”; UI countdown still uses `retry_after_seconds` / `expires_at`, not a hardcoded timer.

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
| **UX-66** | Customer **wallet card** | Facts locked (incl. per-Shop reward progress, capability sections); pixel layout free. Share QR is **personal**, not the shop counter QR | P0 |
| **UX-67** | Customer portal chrome | Distinct from merchant sidebar; same tokens | P0 |
| **UX-68** | OTP / channel picker (SMS vs WhatsApp) | Icons, selected states, 429 toast | P0 |
| **UX-69** | Program **status pills** | `draft` / `active` / `disabled` — do not collide with campaign pills (Active = sending) or member status | P0 |
| **UX-70** | Account **active / inactive** chips | Distinct from member `at_risk` / `churned` | P0 |
| **UX-71** | Empty states for: zero programs, inactive login, pending-review list, wallet with no programs, POS insufficient points | Reuse telescope where it still means “no data”; do not reuse it for **errors** (429, inactive) | P1 |
| **UX-72** | Referral share sheet (copy link / save QR / native share) | On the wallet card | P1 |
| **UX-73** | Teammate-created **email HTML** | New template; visual parity with existing React Email auth set | P0 |
| **UX-74** | MFA challenge (if in Product MVP (Ship 1)) | TOTP input; parity with Settings 2FA enroll QR | P1 |

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

1. Customer-portal **URL** (case map: [customer-portal-journey.md](./customer-portal-journey.md); register+login = one OTP funnel is the working answer)
2. ~~Whether **more than one** loyalty program can be `active` at once~~ **Resolved 2026-08-17:** one Shop, up to three capabilities, Shop QR always this Shop. Remaining open: tier metric source / downgrade; referral points kind when Points is off.
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
| UX-07 | Design | P0 | Customer wallet per Shop (capability sections + available vs reserved) |
| UX-08 | Design | P0 | Customer portal shell + routes proposal |
| UX-09 | Design | P0 | Join page: OTP + referral context; Shop QR → this Shop |
| UX-75 | Design | P0 | Customer profile setup (name, email, DOB) |
| UX-76 | Design | P0 | First-shop welcome + link Shop |
| UX-10 | Design | P0 | Loyalty **program list** + one ACTIVE default |
| UX-11 | Design | P1 | Staff cashier POS (customer QR + bill + invoice) + redemption QR scan |
| UX-12 | Design | P1 | Referral Pending Review screen |
| UX-13 | Design | P1 | Loyalty create vs edit (**program list**, not capability toggles) |
| UX-14 | Decision | P1 | Campaign Scheduled tab: design or hide |
| UX-15 | Decision | P1 | Automations: hide / config-only / later |
| UX-16 | Design | P2 | Campaign token hints + freeze-after-send |
| UX-17 | Decision | P1 | Billing / onboarding plan: hide vs checkout |
| UX-18 | Decision | P2 | Internal `/admin` back office — product first |
| UX-19 | **DECIDED** | — | Ship 1: comment out social/2FA/Integrations/Wallet UI ([phase-1-scope.md](./phase-1-scope.md)) |
| UX-20 | **DECIDED** | — | Ship 1: comment out Revenue tab + all revenue widgets ([phase-1-scope.md](./phase-1-scope.md)) |
| UX-21 | Decision | P1 | Business Type dropdown + enum + labels |
| UX-22 | Decision | P2 | Mailchimp / Klaviyo: hide vs interest |
| UX-23 | Decision | P1 | What Currency does |
| UX-24 | Decision | P1 | Consent policy + SMS in/out of Product MVP (Ship 1) |
| UX-25 | Decision | P1 | One At-risk definition; exclusive vs overlapping buckets |
| UX-26 | Decision | P2 | “Bill type” = program type or POS ticket? |
| UX-27…32 | Decision | P1 | Misleading labels / fake stats / `$0.00` |
| UX-33…41b | Decision | P1 | Dead buttons (search, This month, Export, CTAs, contact, nudge, referrers) |
| UX-42…60g | Design | P1–P2 | Existing IA / empty-state / copy / unused-field honesty (incl. G-10, G-15, G-28) |
| UX-61…65 | Copy | P0–P1 | New emails, OTP text, tokens, promo stats, AR/EN |
| UX-66…74 | Asset | P0–P1 | Wallet, portal, pills, empty states, email HTML |

### Suggested design order

1. ~~Close **UX-19, UX-20**~~ **Done (2026-08-18)** — Ship 1 exclusions = **comment out** per [phase-1-scope.md](./phase-1-scope.md). Still open: **UX-24, UX-25**.
2. Design **P0 new flows:** UX-01…03, UX-05…10, UX-75, UX-76, UX-61, UX-62, UX-66…70, UX-73. Case list: [customer-portal-journey.md](./customer-portal-journey.md).
3. Honesty pass on existing merchant UI: UX-27…41, UX-53.
4. Remaining P1/P2 after backend keystones (ledger, orders, events) have dates.

---

## Traceability (docs → this file)

Every indexed gap / docs-gap / audit item that has a **design** consequence is listed. Backend-only items point at [§5](#5-not-uiux--do-not-design-as-if-these-exist).

### G-01 … G-36

| Gap | UI/UX request |
|-----|----------------|
| G-01 QR scans always 0 | UX-37, UX-60b · else §5 |
| G-02 Visit/stamp empty | UX-07 (customer card) · UX-60g · else §5 |
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
| G-20 Redeem vs earn | UX-07 (available / pending), UX-11, UX-60e |
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
| G-33 Customer register/login | UX-05, UX-06, UX-07, UX-08, UX-09, UX-75, UX-76 |
| G-34 Add admin/staff | UX-01, UX-02, UX-04, UX-61, UX-73 |
| G-35 Independent programs (one ACTIVE) | UX-10, UX-13, UX-69 |
| G-36 Account active/inactive | UX-03, UX-06 (customer blocked state), UX-65, UX-70 |

### DG-01 … DG-15 · A-01

| ID | UI/UX request |
|----|----------------|
| DG-01 Product MVP (Ship 1) exclusions (social / 2FA / POS / Wallet) | UX-19 ✓ **comment out** |
| DG-02 Integrations tab in/out of Product MVP (Ship 1) | UX-19 ✓ **comment out tab** |
| DG-03 Hide vs `"—"` Revenue Impact | UX-20 ✓ **comment out** |
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

Portal URL → UX-08. Shop QR always **ACTIVE** program → UX-09 / UX-10 ([counter QR](./counter-qr-and-program-membership.md)). Catalog redeem pending/reserve/QR + snapshot → UX-07 / UX-11 ([redemption](./reward-redemption-flow.md)). OTP TTL/cap → **PM-06** (UX-05). Automations hidden in Product MVP (Ship 1) → PM-18. Currency display-only → UX-23.

---

*This file is documentation. It does not authorize frontend migrations of backend-owned tables ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)) or a visual redesign ([ADR-010](../architecture/decisions/ADR-010-style-and-template-parity.md)).*
