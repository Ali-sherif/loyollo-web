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

**Source of truth:** [11-authentication-migration.md](frontend/11-authentication-migration.md#shop-customer-register-and-login-decided) · [customers-page.md](frontend/customers-page.md) · [G-33](frontend/gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows)

Shop customers get role **`customer`**. They register/login so we **store their data** and **calculate KPIs**. This is not merchant `/app` sign-up.

| Today | Intended |
|-------|----------|
| Shop owner **manually adds** customers in `/app/customers` | Still allowed (`admin` / `staff` tool). Row role remains **`customer`**. |
| Public QR `/join/[programId]` enrolls **without** login | Capture/check-in after **OTP** (SMS/WhatsApp); then **link** to the `customer` account when they register |
| KPIs on owner-typed rows / counters | KPIs **calculated** from stored `customer` activity |

Customer-portal URLs and the exact KPI list are **not** locked. Implementation is backend-owned ([ADR-014](architecture/decisions/ADR-014-product-data-ownership.md)).

**DECIDED:** `customer` register, login, and recovery are **passwordless** (OTP via SMS or WhatsApp). There is no customer forgot-password. Lost access = a new OTP. Staff use the owner `/auth/forgot-password` flow after their account exists. [Credential recovery](frontend/11-authentication-migration.md#credential-recovery-decided).

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

## 5. Multiple loyalty programs + status

**Status:** DECIDED (not shipped)  
**Source of truth:** [loyalty-page.md](frontend/loyalty-page.md#multiple-programs-and-status-decided) · [G-35](frontend/gaps-and-solutions.md#g-35--shop-is-limited-to-one-loyalty-program-no-program-status)

A shop will have **more than one** loyalty program. Each program status is **`draft`**, **`active`**, or **`disabled`**.

Today the DB allows only one program per owner. Join stays `/join/{programId}`. Whether two programs can be `active` at once is **not** locked.

---

## 6. Admin: account active/inactive + filters

**Status:** DECIDED (not shipped)  
**Source of truth:** [11-authentication-migration.md](frontend/11-authentication-migration.md#account-active--inactive-decided) · [G-36](frontend/gaps-and-solutions.md#g-36--no-admin-account-list-or-activeinactive-for-staffcustomer)

An **`admin`** can set **`staff`** and **`customer`** accounts to **نشط (`active`)** or **غير نشط (`inactive`)**. Inactive `staff` cannot use `/app`; inactive `customer` cannot use customer login.

This is **not** loyalty member status (`at_risk` / `churned`) and **not** program status.

The page **filters** by **role**, **email**, **name**, and **phone**.

Toggling another **`admin`** is not in this decision. Route is not locked.

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

**Share:** personal **link** or **QR** of `/join/{programId}?ref={referral_code}`.

**Expiry:** referral point lots and referral vouchers each have `expires_at`. Shop sets `points_expiry_days` and `voucher_expiry_days` (default day counts not locked). Voucher states: `active` → `used` / `expired`.

**Database (hard reject — no row):**

- `referrer_id` **cannot** equal `referred_id` (`CHECK`). The inviter cannot be the invitee.
- `referred_id` is **UNIQUE**: a customer can be invited **once in their lifetime**.

**Device / IP matching:** if the invite and the registration happen from the **same device** or the **same Wi-Fi / public IP** in the **same minute**, the backend marks the row **Pending Review** (`pending_review`). The referrer is not granted until a reviewer clears it.

Returning check-in with `ref` does not create another referral.

The share **link / QR** appears on **that program’s card** in the customer wallet ([§8](#8-customer-wallet-per-program)).

---

## 8. Customer wallet (per program)

**Status:** DECIDED (not shipped)  
**Source of truth:** [loyalty-page.md](frontend/loyalty-page.md#customer-wallet-per-program-decided) · [11-authentication-migration.md](frontend/11-authentication-migration.md#customer-wallet-decided) · [data-contract write rule 13](backend/data-contract.md#binding-write-rules)

Points belong to the **program** they were earned in. They do **not** mix.

| Program 1 | Program 2 | Customer must see |
|-----------|-----------|-------------------|
| 100 points, that program’s expiry (e.g. 1 month per lot) | 200 points, that program’s expiry (e.g. 1 week per lot) | **Two** wallets: 100 and 200 — **not** 300 |

Each program card: name, spendable points, expiry date(s) (split by lot if mixed), vouchers + their dates, personal share link + QR. Portal **URL** still not locked. Pixel layout not locked.

---

## Not decided in this discussion

Open tracking, SMS delivery, automations, campaign revenue (G-09 / G-06 / G-20). Exact **staff** subtype names. Whether `staff` permissions stay equal to `admin` forever. Whether `staff` can also use the add-teammate form. Customer-portal **URLs** (wallet **contents** are locked in §8). Whether more than one loyalty program can be `active` at the same time. Whether the account list also shows `admin` rows. Default referral expiry **day counts**. OTP challenge TTL and attempt cap. Merchant UI for **Pending Review** (status and backend review path are locked; the screen is not). Device-fingerprint algorithm (hashes and same-minute rule are locked). SMS vs WhatsApp **provider** (channel enum is locked; adapters stay stubs).

