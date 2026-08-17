# Counter QR and Shop membership

**Date:** 2026-08-17  
**Status:** DECIDED for Shop-scoped membership and Shop QR (not shipped). The 2026-08-16 pending Business Owner item 15 (multiple ACTIVE programs / Shop QR picker) is **resolved** by the capability model.  
**Audience:** Product, UI/UX, QA, backend  
**Does not authorize** schema, APIs, or Next.js implementation ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

**Sources of truth to keep in sync:** [program-model.md](./program-model.md) · [loyalty-page.md](../frontend/loyalty-page.md#counter-qr--shop-membership-decided) · [G-35](../frontend/gaps-and-solutions.md#g-35--shop-loyalty-is-one-row-not-one-config-per-capability) · [customer-portal-journey.md](./customer-portal-journey.md) (journey B) · [reward-redemption-flow.md](./reward-redemption-flow.md)

The loyalty model is **Shop-scoped**. A Shop has at most one Points, one Visit, and one Tier **capability** — not independent programs. Canonical lock: [program-model.md](./program-model.md).

---

## 1. Core architecture

A Shop is the loyalty unit (one membership, one wallet, one catalog). Capabilities (Points / Visit / Tier) are optional configs of that Shop. All loyalty state stays scoped by Shop identity (`owner_id` / `profiles` today — no `shops` table; do not invent one from this file).

```text
Shop  (one membership, one wallet, one catalog)
├── Points capability  (optional, at most one)
├── Visit capability   (optional, at most one)
└── Tier capability    (optional, at most one)
```

Joining the Shop enables every **active** capability on that membership. There is no “join Points without joining Visit.” Invalid: two configs of the same type.

---

## 2. QR architecture

### Shop / counter QR (agreed)

Identifies the **Shop**. Always resolves to exactly one destination — this Shop’s join / check-in. No program picker.

Exact URL is **backend-owned** (`/join/shop/{shopSlug}` is illustrative). Today the app prints `{origin}/join/{programId}` because there is one `loyalty_programs` row; that UUID may keep working as a Shop entry while it uniquely identifies the merchant’s loyalty row set.

### Personal referral QR (agreed)

```text
{shopJoinUrl}?ref={code}
```

Today: `/join/{programId}?ref={code}`. The referral code must **never** change Shop scope.

| QR | URL | Role |
| --- | --- | --- |
| **Counter / door** | Shop join URL (backend-owned) | Shop entry; enroll or check-in |
| **Personal referral** | Same URL + `?ref={referral_code}` | Same Shop + referral attribution |

There is no separate “Points QR” vs “Visit QR.” One door QR.

---

## 3. Counter QR resolution

```text
Shop QR → this Shop’s join / check-in
```

- Join / check-in targets **the Shop**.
- No **active** capability → unavailable; no membership, no check-in.
- Direct `/join/{programId}` (today’s printed QR / referral) remains valid while it maps to a Shop that has at least one `active` capability.

---

## 4. Customer join / check-in

### First time joining this Shop

If the customer has an account but is not yet a member of this Shop:

```text
Existing Customer Account
        ↓
Join Shop
        ↓
Create Shop Membership
        ↓
Link Shop to Customer Account
```

The membership holds Points / Visits / Tier state according to enabled capabilities.

### Returning customer

```text
Scan Shop QR → existing membership → check-in
```

No duplicate membership. A repeated scan of the same Shop is **not** a second enrollment.

OTP, referral, and portal vs in-store rules: [public join](../frontend/loyalty-page.md#public-join--check-in) · [OTP](../frontend/loyalty-page.md#otp-verification-decided) · [customer-portal-journey.md](./customer-portal-journey.md).

---

## Core rule

**The customer’s loyalty relationship belongs to the Shop.** Shop QR is the entry point to that membership — not a picker among programs.

```text
Shop QR
      ↓
THE Shop
      ↓
Customer Membership
      ↓
Points / Visits / Tier (enabled capabilities)
      ↓
Shop Rewards catalog
```

Wallet is **one card per Shop**, with independent sections for each enabled capability.

---

## Canonical flow

```text
                    SHOP
                     │
                  Shop QR
                     │
                     ▼
             Customer Membership
                     │
                     ▼
          Shop Points / Visits / Tier
                     │
                     ▼
               Shop Rewards
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

Redemption lifecycle: [reward-redemption-flow.md](./reward-redemption-flow.md).

---

## Core product constraints (QR + membership)

1. Membership, points, stamps, and wallet cards are always **Shop-scoped**.
2. Rewards belong to the Shop (one catalog). Point-cost redeem requires Points enabled.
3. A customer never joins a reward; they join a **Shop**.
4. Referral QR remains **Shop-specific**.
5. A customer has **one** membership per Shop per join flow.
6. Shop QR always resolves to that Shop. The old multiple-ACTIVE / picker pending item is **closed**.

---

## Not locked (backend / design)

| Item | Note |
| ---- | ---- |
| Exact Shop QR path (`/join/shop/{shopSlug}` vs today’s `/join/{programId}`) | Backend-owned |
| How `shopSlug` is stored / generated | Backend-owned; only if a slug URL is chosen |
| Pixel layout of join branding | QR Experience tab is 1:1 with a capability row today; target is Shop-level branding |
| Whether a shop-level join URL is on the **approved** production route map | [02-route-migration.md](../frontend/02-route-migration.md) lists `/join/[programId]` only until the map is updated |
