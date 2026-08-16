# Counter QR and program-level membership

**Date:** 2026-08-16  
**Status:** DECIDED for program-scoped membership (not shipped). Shop QR / multiple **ACTIVE** programs is **pending Business Owner** ([§15](#15-shop-qr--multiple-active-programs-pending)).  
**Audience:** Product, UI/UX, QA, backend  
**Does not authorize** schema, APIs, or Next.js implementation ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

**Sources of truth to keep in sync:** [loyalty-page.md](../frontend/loyalty-page.md#counter-qr--program-membership-decided) · [G-35](../frontend/gaps-and-solutions.md#g-35--shop-is-limited-to-one-loyalty-program-no-program-status) · [customer-portal-journey.md](./customer-portal-journey.md) (journey B) · [reward-redemption-flow.md](./reward-redemption-flow.md)

The loyalty model is **program-scoped**, not shop-scoped.

**Pending Business Owner (item 15):** whether a Shop can have multiple **ACTIVE** Programs at once, and therefore Shop QR behavior. Do **not** finalize the Shop QR URL or resolution until that decision. See [§15](#15-shop-qr--multiple-active-programs-pending). Selecting one Program must **not** auto-join the others.

---

## 1. Core architecture

A shop can have multiple loyalty programs. Each program owns its own:

- Membership
- Points
- Stamps
- Wallet card
- Reward catalog
- Reward eligibility
- Redemptions

All loyalty state stays scoped by `loyalty_program_id`.

```text
Shop
├── Program A
│   ├── Membership
│   ├── Points
│   ├── Stamps
│   ├── Wallet Card
│   └── Rewards
│
└── Program B
    ├── Membership
    ├── Points
    ├── Stamps
    ├── Wallet Card
    └── Rewards
```

There is **no** shop-wide points balance, membership, wallet balance, or reward catalog.

Joining Program A does **not** automatically join Program B, even when both belong to the same shop.

---

## 2. QR architecture

### Program QR (agreed)

```text
/join/{programId}
```

Always targets exactly one program. Valid only while that program is `active`. Today the app prints `{origin}/join/{programId}`.

### Personal referral QR (agreed)

```text
/join/{programId}?ref={code}
```

The referral code must **never** change the program scope.

### Counter / shop QR — not finalized

Shop QR behavior is **pending Business Owner** ([§15](#15-shop-qr--multiple-active-programs-pending)). Do not treat `/join/shop/{shopSlug}` as locked.

| If the Business Owner decides | Shop QR behavior |
| ----------------------------- | ---------------- |
| Only one active Program is allowed | Shop QR → `/join/{programId}` |
| Multiple active Programs are allowed | Shop QR → Shop / Program selection → customer chooses one Program → `/join/{programId}` |

The QR itself does **not** create a shop-wide membership. Selecting one Program must **not** automatically create a membership in the other Programs.

| QR | URL | Role |
| --- | --- | --- |
| **Counter / door** | **Pending item 15** | Shop entry; must still land on **one** program. URL not locked |
| **Program QR** | `/join/{programId}` | Direct join / check-in for that program (campaign / table tent). Only if `active` |
| **Personal referral** | `/join/{programId}?ref={referral_code}` | Same program + referral attribution |

---

## 3. Counter QR resolution — pending item 15

Do **not** implement Shop QR resolution until the Business Owner decides whether multiple ACTIVE Programs are allowed.

Agreed regardless of that decision:

- Join / check-in targets **one** Program.
- Selecting one Program must **not** auto-join sibling Programs.
- No `active` program → Program unavailable; no membership, no check-in.
- Direct `/join/{programId}` (program / referral QR) remains valid **only** while that program is `active`.

Possible behaviors after the Business Owner decides (not locked now):

```text
Only one active allowed:
Shop QR → /join/{programId}

Multiple active allowed:
Shop QR → Shop / Program selection → customer chooses one → /join/{programId}
```

---

## 4. Customer join / check-in

### First time joining a specific program

If the customer has an account but is not yet a member of the selected program:

```text
Existing Customer Account
        ↓
Join Program A
        ↓
Create Program A Membership
        ↓
Link Program A to Customer Account
```

The customer remains a member of Program A only.

### Returning customer

If the customer is already a member of the selected program:

```text
Scan Program A → existing membership → check-in
```

No duplicate membership. A repeated scan of the same program is **not** a second enrollment.

OTP, referral, and portal vs in-store rules after a program is chosen: [public join](../frontend/loyalty-page.md#public-join--check-in) · [OTP](../frontend/loyalty-page.md#otp-verification-decided) · [customer-portal-journey.md](./customer-portal-journey.md).

---

## Core rule

**The customer’s loyalty relationship belongs to a program.** A Shop QR (whatever URL the Business Owner later locks) is only an entry point — it must not create a shop-wide wallet.

```text
Shop QR (URL pending item 15)
      ↓
ONE Program
      ↓
Customer Membership
      ↓
Points / Stamps / Wallet
      ↓
Rewards configured within that Program
```

**Multiple `active` programs:** **pending Business Owner** ([§15](#15-shop-qr--multiple-active-programs-pending)). Wallet remains **one card per program**. Selecting one Program never auto-joins the others.

---

## Canonical flow

```text
                    SHOP
                     │
              Shop QR (URL / resolve PENDING item 15)
                     │
                     ▼
              ONE Program
              (direct /join/{programId},
               or picker then /join/{programId}
               — not locked until BO decides)
                     │
                     ▼
             Customer Membership
                     │
                     ▼
          Program Points / Stamps
                     │
                     ▼
             Program Rewards
                     │
                     ▼
              Customer Redeem
                     │
                     ▼
         Available ≥ cost?
             │               │
            No              Yes
             │               │
             ▼               ▼
      Error (no row)      PENDING
                             │
                      Reserve Points
                      Issue single-use QR
                      (10-minute expiry)
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
               Staff scan         Job: past due
               (verify)           qr_expires_at
                    │                 │
                    ▼                 ▼
              Deduct from Total   Release Reserve
                    │                 │
                    ▼                 ▼
                COMPLETED          EXPIRED
```

Redemption lifecycle, reservation, QR verification (not approval), atomic scan, and expiry job: [reward-redemption-flow.md](./reward-redemption-flow.md).

---

## Core product constraints (QR + membership)

1. Membership, points, stamps, and wallet cards are always **program-scoped**.
2. Rewards belong to a specific program.
3. A customer never joins a reward; they join a **program**.
4. Program QR and referral QR remain **program-specific** (`/join/{programId}`).
5. A customer can join only **one** selected program per join flow. Selecting one Program must **not** auto-join the others.
6. Shop QR URL and whether multiple Programs may be `active` at once are **pending Business Owner** ([§15](#15-shop-qr--multiple-active-programs-pending)).

---

## 15. Shop QR / multiple active Programs (pending)

**Status:** Pending Business Owner decision. Do **not** finalize Shop QR behavior or implement a picker vs direct-program QR until this is decided.

The Business Owner needs to decide whether a Shop can have multiple ACTIVE Programs simultaneously.

- If only one active Program is allowed: Shop QR → `/join/{programId}`.
- If multiple active Programs are allowed: Shop QR → Shop / Program selection → customer chooses one Program → `/join/{programId}`.

Selecting one Program must not automatically create a membership in the other Programs.

---

## Not locked (backend / design)

| Item | Note |
| ---- | ---- |
| Multiple ACTIVE Programs per Shop / Shop QR URL and resolution | **Pending Business Owner** ([§15](#15-shop-qr--multiple-active-programs-pending)) |
| How `shopSlug` is stored / generated | Backend-owned; only relevant if a shop-level URL is chosen |
| How “default program” is stored | Backend-owned; only relevant if multiple `active` programs are allowed |
| Pixel layout of a program picker | UX-09 — only if multiple `active` programs are allowed |
| Whether a shop-level join URL is on the **approved** production route map | Not a product lock until item 15; [02-route-migration.md](../frontend/02-route-migration.md) lists `/join/[programId]` only |
| QR Experience branding on a shop landing | Today 1:1 with a program; not locked until Shop QR is decided |
