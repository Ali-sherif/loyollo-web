# Counter QR and program-level membership

**Date:** 2026-08-16  
**Status:** DECIDED (not shipped)  
**Audience:** Product, UI/UX, QA, backend  
**Does not authorize** schema, APIs, or Next.js implementation ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

**Sources of truth to keep in sync:** [loyalty-page.md](../frontend/loyalty-page.md#counter-qr--program-membership-decided) · [G-35](../frontend/gaps-and-solutions.md#g-35--shop-is-limited-to-one-loyalty-program-no-program-status) · [customer-portal-journey.md](./customer-portal-journey.md) (journey B) · [reward-redemption-flow.md](./reward-redemption-flow.md)

The loyalty model is **program-scoped**, not shop-scoped.

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

### Counter / shop QR

The printed counter QR is a **shop-level stable entry point**.

```text
/join/shop/{shopSlug}
```

Exact slug source is **not locked** (backend-owned). The URL family is locked: shop QR ≠ program UUID.

The QR is printed once. It does **not** contain a `programId`. It remains stable when the shop changes, disables, or creates programs.

When scanned:

```text
Counter QR
    ↓
Shop
    ↓
Resolve current default / live program
    ↓
Customer joins / checks in to ONE program
```

The QR itself does **not** create a shop-wide membership.

### Program QR

Program-specific QR remains available for campaigns or other program-specific use:

```text
/join/{programId}
```

It always targets exactly one program. Valid only while that program is `active`.

### Personal referral QR

Referral remains program-specific:

```text
/join/{programId}?ref={code}
```

The referral code must **never** change the program scope.

| QR | URL | Role |
| --- | --- | --- |
| **Counter / door** | `/join/shop/{shopSlug}` | Stable shop entry; resolves to one program, then enrolls / checks in |
| **Program QR** | `/join/{programId}` | Direct join / check-in for that program (campaign / table tent). Only if `active` |
| **Personal referral** | `/join/{programId}?ref={referral_code}` | Same program + referral attribution. Not the counter sticker |

Today the app only prints `{origin}/join/{programId}`. Intended: merchant print for the **door** is the shop QR.

---

## 3. Counter QR resolution

### Case A — One active / default program

```text
Shop QR → one active / default program → join or check-in
```

No additional program-selection screen.

### Case B — No active program

```text
Shop QR → no active program → Program unavailable
```

No membership is created and no check-in occurs.

### Case C — Multiple active programs with no default

```text
Shop QR → multiple active programs → program picker → customer selects ONE program → join / check-in that program only
```

The system must **never** automatically join the customer to every active program.

### Default program

The owner can change the shop’s default program from `/app`. Changing the default does **not** require reprinting the counter QR.

Old program-specific QR codes remain valid **only** while their target program is `active`.

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

**The QR belongs to the shop as an entry point; the customer’s loyalty relationship belongs to a program.**

```text
Shop Counter QR
      ↓
Shop
      ↓
Current Default / Live Program
      ↓
Customer Membership
      ↓
Points / Stamps / Wallet
      ↓
Rewards configured within that Program
```

**Multiple `active` programs:** allowed. The shop QR still lands on **one** program (default, the only live one, or customer choice). Wallet remains **one card per program**.

---

## Canonical flow

```text
                    SHOP
                     │
              Stable Counter QR
                     │
                     ▼
             /join/shop/{slug}
                     │
                     ▼
              Resolve Program
                     │
          ┌──────────┼──────────┐
          │          │          │
       One live   Multiple    None live
          │        live / no     │
          │        default       │
          │          │           │
          │       Program        │
          │        Picker        │
          │          │           │
          └──────────┼───────────┘
                     ▼
              ONE Program
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
                  PENDING
                     │
              Reserve Points
                     │
             ┌───────┴───────┐
             ▼               ▼
          APPROVE           REJECT
             │               │
             ▼               ▼
         Deduct Points    Release Reserve
             │               │
             ▼               ▼
         COMPLETED        REJECTED
```

Redemption lifecycle, reservation, idempotency, and staff approval: [reward-redemption-flow.md](./reward-redemption-flow.md).

---

## Core product constraints (QR + membership)

1. Membership, points, stamps, and wallet cards are always **program-scoped**.
2. Rewards belong to a specific program.
3. A customer never joins a reward; they join a **program**.
4. Counter QR is **shop-scoped** and stable.
5. Counter QR resolves to the current / default **live** program.
6. Program QR and referral QR remain **program-specific**.
7. A customer can join only **one** selected program per join flow.

---

## Not locked (backend / design)

| Item | Note |
| ---- | ---- |
| How `shopSlug` is stored / generated | Backend-owned |
| How “default program” is stored | Backend-owned; required for shops with more than one `active` program if they want no picker |
| Pixel layout of the program picker | UX-09 |
| Whether `/join/shop/{shopSlug}` is on the **approved** production route map yet | Product URL is locked; [02-route-migration.md](../frontend/02-route-migration.md) still lists `/join/[programId]` only |
| QR Experience branding on the shop landing | Today 1:1 with a program; which branding the shop QR uses is not locked |
