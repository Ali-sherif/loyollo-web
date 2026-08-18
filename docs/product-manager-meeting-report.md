# Product manager notes

**Date:** 2026-08-14  
**Status:** DECIDED for product language. Send-status writers and role schema are not implemented yet.

---

## 1. Campaigns — Completed vs Performance

**Source of truth:** [campaigns-page.md](frontend/campaigns-page.md#product-meanings-decided) · glossary in [data-contract.md](backend/data-contract.md#unified-glossary) · gap [G-09](frontend/gaps-and-solutions.md#g-09--campaign-send--opens--automations)

On `/app/campaigns`, **Completed** and **Performance** look related but they are not the same thing.

| Term | Kind | Meaning |
|------|------|---------|
| **Completed** | Status (tab + pill) | This campaign’s send is **finished**. Every email or SMS for that launch has been processed. |
| **Performance** | Results column (and sort) | How well a **sent** campaign did: email **% Open**, SMS **% Redeemed**. Drafts show `—`. |

Completed is not a score. A completed campaign can still show `0% Open` until open tracking exists.

### Agreed lifecycle

A campaign **must not start as Active**.

1. **Create** → **Draft** (saved, not started)
2. **Launch** → **Active** (it is working; messages are going out)
3. **All emails/SMS processed** → **Completed** (if at least one was sent) or **Failed** (if none were sent)

**Enable** must not mark a campaign Active without sending. A disabled draft should go back to **Draft**.

### What the product does today (gap)

- Successful launch stays **Active** forever. Nothing writes **Completed**, so that tab stays empty.
- **Enable** also sets Active without sending, so “Active” mixes “running” with “already sent” and “never sent.”
- After send, Performance shows **`0% Open`** / **`0% Redeemed`** because opens and redemptions are not tracked.

---

## 2. Locked role matrix (who uses what)

**Status:** DECIDED  
**Source of truth:** [11-authentication-migration.md](frontend/11-authentication-migration.md#locked-role-matrix) · [ADR-005](architecture/decisions/ADR-005-authentication.md) · glossary in [data-contract.md](backend/data-contract.md#unified-glossary)

There are **three** account roles in the product. No other logged-in roles.

| Role (stored name) | Who | What they use | Permissions |
|--------------------|-----|---------------|-------------|
| **`admin`** | Person who **buys Loyollo** (the shop). Same as today’s **owner**. | Merchant app **`/app`** | Full merchant access. The software-purchase account is this role. |
| **`staff`** | Person who **works for** that shop (team). | Merchant app **`/app`** | **For now: same permissions as `admin`.** A later limited-staff split is not locked. |
| **`customer`** | Person who **shops at** that business (loyalty member). | Customer register / login (not `/app`) | Their data + calculated KPIs. Never merchant `/app`. |

**Today:** `staff` is a **different name** from `admin`, but **the same permissions** as `admin`. Do not treat `staff` as a weaker role until a split is approved. The buyer role is **`admin`**, not `purchaser`.

**Not a role:** visitor on the marketing site; QR join **before** they register. Member **status** and **tier** are labels on a `customer`, not extra roles.

`admin` / `staff` must never be given to a shop customer. `customer` must never open `/app` as merchant.

This “Phase 1” is the **product** first ship — not Next.js migration Phase 1 (ADR-011) and not remediation Phase 1 (tiers).

---

## 3. Shop-customer register / login (feature that will exist)

**Source of truth:** [11-authentication-migration.md](frontend/11-authentication-migration.md#shop-customer-register-and-login-decided) · [customers-page.md](frontend/customers-page.md) · [G-33](frontend/gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows) · case map [customer-portal-journey.md](product/customer-portal-journey.md)

Shop customers get role **`customer`**. They register/login so we **store their data** and **calculate KPIs**. This is not merchant `/app` sign-up.

| Today | Intended |
|-------|----------|
| Shop owner **manually adds** customers in `/app/customers` | Still allowed (`admin` / `staff` tool). Row role remains **`customer`**. |
| Public QR `/join/[programId]` enrolls **without** login | Capture/check-in after **OTP** (SMS/WhatsApp); then **link** to the `customer` account when they register |
| KPIs on owner-typed rows / counters | KPIs **calculated** from stored `customer` activity |

Customer-portal URLs and the exact KPI list are **not** locked. Implementation is backend-owned ([ADR-014](architecture/decisions/ADR-014-product-data-ownership.md)).

**DECIDED:** `customer` register, login, and recovery are **passwordless** (OTP via SMS or WhatsApp). There is no customer forgot-password. Lost access = a new OTP. Staff use the owner `/auth/forgot-password` flow after their account exists. [Credential recovery](frontend/11-authentication-migration.md#credential-recovery-decided).

Working design journey (2026-08-16, not a new ADR): one OTP funnel for portal register/login; first-shop link and profile setup as extra screens; in-store returning check-in still without OTP. [customer-portal-journey.md](product/customer-portal-journey.md).

---

## 4. Admin form: add admin or staff + email credentials

**Status:** DECIDED (not shipped)  
**Source of truth:** [11-authentication-migration.md](frontend/11-authentication-migration.md#admin-adds-admin-or-staff-decided) · [G-34](frontend/gaps-and-solutions.md#g-34--admin-cannot-create-adminstaff-with-emailed-temp-password)

An **`admin`** fills a form with the new person’s information and chooses **`admin`** or **`staff`**. On **Create account**:

1. The account is created.
2. A **random temporary password** is generated.
3. An **email** goes to that person: you were added; your email is …; your temporary password is … (the random one).
4. On **first login** they **must change** that temporary password before using `/app`.

Not the shop-`customer` signup. Exact form fields beyond name / email / role and UI route are **not** locked. Send through messaging contracts; do not reuse the current invite-link email as if it already includes a password.

After the teammate account exists, forgotten password is the **same** owner reset (`/auth/forgot-password`). An `admin` may re-issue a temp password if they are locked out. [Credential recovery](frontend/11-authentication-migration.md#credential-recovery-decided).

---

## 5. Independent programs + one ACTIVE

**Status:** DECIDED 2026-08-18 (not shipped). **Supersedes** the 2026-08-17 Shop-capability lock.  
**Source of truth:** [program-model.md](product/program-model.md) · [ADR-016](architecture/decisions/ADR-016-independent-programs.md) · [loyalty-page.md](frontend/loyalty-page.md#independent-programs-decided) · [G-35](frontend/gaps-and-solutions.md#g-35--shop-loyalty-is-one-row-not-independent-programs)

A Shop may own **many independent programs**. **At most one is `ACTIVE`**. Counter QR + `?ref=` resolve only to ACTIVE. Customer is **locked** to `enrolled_program` until deferred POS migration (cashier scan of **customer QR**). Catalog / wallet / ledger are program-scoped. Campaigns stay Shop-scoped.

Today the DB allows only one `loyalty_programs` row per owner (`UNIQUE owner_id`). Target: **partial unique one ACTIVE per Shop** — do **not** use `UNIQUE (owner_id, program_type)`. Admin UI: [UX-10](product/ui-ux-team-requests.md#ux-10--loyalty-program-list--active-default).

---

## 6. Admin: account active/inactive + filters

**Status:** DECIDED (not shipped)  
**Source of truth:** [11-authentication-migration.md](frontend/11-authentication-migration.md#account-active--inactive-decided) · [G-36](frontend/gaps-and-solutions.md#g-36--no-admin-account-list-or-activeinactive-for-staffcustomer)

An **`admin`** can set **`staff`** and **`customer`** accounts to **نشط (`active`)** or **غير نشط (`inactive`)**. Inactive `staff` cannot use `/app`; inactive `customer` cannot use customer login.

This is **not** loyalty member status (`at_risk` / `churned`) and **not** program status.

**One page, two tabs** (not two routes): **Team** (`admin` + `staff`) and **Customers** (`customer`). The `admin` switches tabs to move between those groups.

On both tabs: **active / inactive** plus filters **email**, **name**, **phone**. Team tab also filters **role** (`admin` \| `staff`). `admin` rows **are shown** on Team. Toggling another **`admin`** is not in this decision. Route is not locked.

---

## 7. Referral rewards (both parties)

**Status:** DECIDED (not shipped)  
**Source of truth:** [loyalty-page.md](frontend/loyalty-page.md#referral-rewards-decided) · [OTP](frontend/loyalty-page.md#otp-verification-decided) · [fraud controls](frontend/loyalty-page.md#referral-fraud-controls-decided) · [data-contract.md](backend/data-contract.md#referrals) · [G-14](frontend/gaps-and-solutions.md#g-14--referrals-settings-without-attribution)

Both the new member and the person who invited them get a reward.

| Party | When | Points | Discount |
|-------|------|--------|----------|
| **Referred** (new) | After **OTP** (SMS/WhatsApp) and successful **register** with a valid share | Wallet credit immediately (`points_ledger`, `expires_at`) | **`vouchers`** row (`active`) they redeem later — not an automatic % on join or the current cart |
| **Referrer** (existing) | When the new member’s **first paid invoice** (`Invoice.Paid` / `orders.paid_at`) is written | Wallet credit then | `vouchers` row then |

New public registration **must not** insert `customers` / `referrals` / rewards until OTP succeeds.

The referrer is **not** granted at enroll. Points (or voucher) land only after a **real paid order**. That gate is the primary anti-fraud control: a fake invite is worthless until someone actually pays.

**Share:** personal **link** or **QR** of this Shop’s join URL `?ref={referral_code}`.

**Expiry:** referral point lots and referral vouchers each have `expires_at`. Shop sets `points_expiry_days` and `voucher_expiry_days` (default day counts not locked). Voucher states: `active` → `used` / `expired`.

**Database (hard reject — no row):**

- `referrer_id` **cannot** equal `referred_id` (`CHECK`). The inviter cannot be the invitee.
- `referred_id` is **UNIQUE**: a customer can be invited **once in their lifetime**.

**Device / IP matching:** if the invite and the registration happen from the **same device** or the **same Wi-Fi / public IP** in the **same minute**, the backend marks the row **Pending Review** (`pending_review`). The referrer is not granted until a reviewer clears it.

Returning check-in with `ref` does not create another referral. Signup Bonus is separate and **can stack** with the referred-party grant when both are configured ([Signup vs Referral](frontend/loyalty-page.md#signup-bonus-vs-referral-bonus-decided)). Welcome / link-program screens do not imply a bonus.

The share **link / QR** appears on **that Shop’s card** in the customer wallet ([§8](#8-customer-wallet-per-shop)).

---

## 8. Customer wallet (per Shop)

**Status:** DECIDED (not shipped)  
**Source of truth:** [loyalty-page.md](frontend/loyalty-page.md#customer-wallet-per-shop-decided) · [11-authentication-migration.md](frontend/11-authentication-migration.md#customer-wallet-decided) · [data-contract write rule 13](backend/data-contract.md#binding-write-rules)

Points belong to the **Shop** they were earned in. They do **not** mix across Shops. Points, Visit, and Tier **inside one Shop** are sections of **one** card.

| Shop A | Shop B | Customer must see |
|-----------|-----------|-------------------|
| 100 points (+ stamps if Visit enabled) | 200 points | **Two** wallets: Shop A and Shop B — **not** 300 |

Each Shop card: enrolled program + **Archived History**. Points: spendable / **available** (`total − pending reserved`) — distinct from **`period_points_earned`** (PM-08). Visit: stamps. Tier: highest **milestone this period**. Plus expiry groups, vouchers, personal share link + QR of **ACTIVE** join URL. Never aggregate across Shops.

---

## 9. Catalog redemption (pending + reserve + QR)

**Status:** DECIDED (not shipped)  
**Source of truth:** [reward-redemption-flow.md](product/reward-redemption-flow.md) · [G-20](frontend/gaps-and-solutions.md#g-20--rewardsredeemed_count-vs-earn)

The customer redeems only rewards on their **enrolled program**. Redeem → persist **`reward_snapshot`**; if Available < snapshot cost, refuse (no row); else `pending` + single-use QR (10-minute expiry) → staff **scan** using the snapshot (`completed`, **PM-04**) or scheduled job (`expired`, release + purge expired reserved lots).

**Closed:** §14.1 snapshot; prospective program/reward edits; PM-04 reserved-lot expiry; Phase 1 mutation guards. **Not Phase 1:** emergency cancel+refund. **PM-08** is decided (period vs spendable). **PM-07** voucher-only when ACTIVE is not points.

---

## Not decided in this discussion

Open tracking, SMS delivery, campaign **send/opens** (G-09 send — automations **hidden** PM-18). Exact **staff** subtype names. Whether `staff` permissions stay equal to `admin` forever. Whether `staff` can also use the add-teammate form. Customer-portal **URLs**. Default referral expiry **day counts**. Merchant UI for **Pending Review**. Device-fingerprint algorithm. SMS vs WhatsApp **provider**. Gender/city on UX-75 (G-17). General `COMPLETED → REVERSED`. Refund / reversal is deferred (not Phase 1). **Resolved 2026-08-18:** independent programs; PM-06 OTP limits; UX-75 required fields; PM-07/08/04; currency display-only; customer soft-delete; staff cashier POS.

