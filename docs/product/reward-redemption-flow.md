# Reward redemption flow (per program)

**Date:** 2026-08-16  
**Status:** DECIDED for Phase 1 lifecycle and agreed edge cases (not shipped). Five items remain **pending owner decision** — see [§14](#14-pending-owner-decisions-do-not-implement-yet).  
**Audience:** Product, UI/UX, QA, backend  
**Does not authorize** schema, APIs, or Next.js implementation ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

**Sources of truth to keep in sync:** [counter-qr-and-program-membership.md](./counter-qr-and-program-membership.md) · [loyalty-page.md](../frontend/loyalty-page.md#reward-redemption-lifecycle-decided) · [customer-reward-progress.md](./customer-reward-progress.md) · [G-20](../frontend/gaps-and-solutions.md#g-20--rewardsredeemed_count-vs-earn) · [data-contract](../backend/data-contract.md) · [api-contract](../backend/api-contract.md)

The customer redeems **only** rewards that belong to the program in which they have membership. Points, stamps, wallet, and catalog never mix across programs.

---

## 1. Catalog redeem vs earn vs voucher

Do not collapse these three paths:

| Path | What it is | This file |
| ---- | ---------- | --------- |
| **Catalog redemption** | Customer selects a program reward, creates a redemption, staff reviews | **Yes** — pending, reserve, approve/reject |
| **Earn** | Check-in / visit completion / POS spend may *earn* a reward (`earned` ≠ redeemed) | Earn must be **idempotent** (see §9). Fulfilment still needs an explicit redeem |
| **Referral voucher** | Discount-kind grant on `vouchers` | [referral rewards](../frontend/loyalty-page.md#referral-rewards-decided) — not this state machine |

Earn ≠ redeem remains locked. A visit-completion “ready at the counter” is not an automatic catalog redemption.

---

## 2. Customer request → staff review

```text
Customer
   ↓
Program A Membership
   ↓
Program A Points
   ↓
Program A Rewards
   ↓
Select Reward
   ↓
Create Redemption
   ↓
PENDING
   ↓
Staff reviews
   ├── Approve
   │    ↓
   │  Deduct reserved points
   │    ↓
   │  COMPLETED
   │
   └── Reject
        ↓
      Release reserved points
        ↓
      REJECTED
```

The customer **cannot** redeem a reward that belongs to another program.

Stored status names: `pending` · `completed` · `rejected`. Do not use other spellings. UI may show APPROVED as the staff action; the resulting row is `completed`.

Optional later states (`cancelled` · `expired` · `reversed`) are **not** Phase 1. Refund / reversal is deferred ([§12](#12-refund--reversal-deferred--not-phase-1)). Do not add them to the Phase 1 flow.

---

## 3. Pending redemption reserves points

Points are **not** permanently deducted when the customer requests a redemption if staff approval is required.

Pending redemptions **reserve** the required points:

```text
Total Points
     -
Pending Reserved Points
     =
Available Points
```

Example:

```text
Total Points = 100
Reward A = 70 points → PENDING
Reserved = 70
Available = 30
```

A second reward costing 50 points must be **rejected** (50 > 30). Combined pending cost must never exceed available balance.

**Spendable / available** on the wallet and on redeem eligibility is this **available** figure — not a stale client total, and not a raw `customers.points` counter that ignores reservations.

How reserved points interact with lot expiry is **pending** ([§14 item 14](#14-pending-owner-decisions-do-not-implement-yet)).

---

## 4. State machine (server-enforced)

Minimum Phase 1 lifecycle:

```text
PENDING
   │
   ├── APPROVED → COMPLETED
   │
   └── REJECTED
```

Rules:

- Transitions are enforced **server-side** (database transaction).
- The transition `PENDING → COMPLETED` must be **atomic** and **idempotent**.
- A `completed` redemption cannot be approved again (no-op; return the existing result).
- Frontend may disable Redeem / Approve after submit; that is **UX only** and **must not** be relied upon for correctness.

---

## 5. Duplicate protection (backend)

### Create must be idempotent

Viewing the same existing redemption from multiple devices is allowed and is **not** a duplicate:

```text
Mobile A → Redemption #123 → PENDING
Mobile B → Redemption #123 → PENDING
```

The Backend must still prevent the **create** operation from inserting multiple redemptions because of double-click, multiple tabs, multiple devices, or network retry. Use an idempotency / business rule and/or a unique database constraint.

```text
First request
→ Create Redemption #123
→ Reserve points

Duplicate request
→ Detect existing operation
→ Return / use Redemption #123
→ Do not create another Redemption
→ Do not reserve points again
```

### Pending duplicate

When the business rule does not allow it, a customer must not have multiple `pending` redemptions for the same reward.

Validate:

```text
customer + program + reward + pending redemption
```

Database-level uniqueness (or an equivalent transactional lock) must handle races. UI disable is insufficient.

---

## 6. Atomic staff approval (Backend + Frontend)

The Redemption state transition must be atomic and idempotent: `PENDING → COMPLETED`.

The first approval:

```text
PENDING
→ COMPLETED
→ consume / deduct the reserved points
```

Any subsequent approval attempt must not deduct the points again:

```text
COMPLETED
→ no-op / return existing result
```

The Backend transaction must ensure that the state transition and points consumption cannot partially succeed.

Two staff members approving at once must never double-deduct or double-fulfil:

```text
Staff A → PENDING → COMPLETED
Staff B → already COMPLETED → no-op / return existing result
```

### Network retry during approval

The Approve Redemption endpoint must be idempotent. Enforced by the Backend / database, not the Frontend.

```text
Request #1
→ PENDING → COMPLETED
→ consume reserved points
→ success

Network timeout

Request #2 / retry
→ Redemption already COMPLETED
→ no additional points consumption
→ return the same logical result
```

A network retry must never create another points transaction or perform another deduction.

---

## 7. Concurrent earn and redeem (Backend)

Earn and Redemption operations must use the **same** concurrency / transaction consistency model for points.

The Backend must prevent race conditions that could cause:

- Negative balances
- Lost updates
- Double deductions
- Lost / created points due to concurrent requests
- Incorrect points reservations

Balance validation and points reservation / consumption must be performed **atomically**. No operation may trust a stale client-side balance.

Example: initial available balance = 50. Concurrent `Earn +100` and `Redeem 100` must still result in a transactionally consistent final state.

---

## 8. Reward eligibility at create (agreed)

Reward eligibility / expiry is evaluated **when the Redemption is created**.

```text
10:59 → Reward is valid
       → Customer creates Redemption
       → PENDING

11:00 → Reward expires

11:05 → Staff approves
```

The Reward expiring after the Redemption was created **must not** automatically invalidate the existing Redemption.

If the system later introduces a separate expiration for `PENDING` Redemptions, that expiration must be **independent** from the Reward’s `expires_at`. Do not invent a pending-redemption TTL until product asks for one.

Whether a later **catalog price change** updates a `PENDING` row’s reserved `points_cost` is **not** decided ([§14 item 1](#14-pending-owner-decisions-do-not-implement-yet)). Do not treat cost snapshot-on-create as locked.

---

## 9. Earn must also be idempotent (Backend)

Every Earn operation must have an **idempotency key** or unique business reference representing the underlying business event. The same business event must only award points once. Enforce a suitable unique constraint / business reference at the Backend / database level.

```text
Purchase #123
First request → +100 points
Retry         → no-op
```

Different legitimate business events must both be processed:

```text
Purchase #123 → +100
Purchase #124 → +100
```

Idempotency prevents duplicate processing of the **same** event; it must not prevent legitimate separate earning events. `Invoice.Paid` is already idempotent on `order_id` ([api-contract](../backend/api-contract.md)). Check-in / POS earn needs the same class of protection.

---

## 10. Program isolation (agreed)

A Redemption remains **permanently** associated with the Program under which it was created:

```text
redemption.program_id = Program A
```

If the customer later joins or uses Program B, the existing Redemption must remain associated with Program A.

- The Redemption must not be transferred to Program B.
- The Redemption must not be covered using Program B’s points.
- The points reservation must remain associated with the customer’s balance / wallet for Program A.

```text
Customer
├── Program A → 100 points  (Redemption #123 stays here)
└── Program B → 50 points   (must not pay for #123)
```

No cross-program balance aggregation.

---

## 11. Staff authorization (Shop-level)

A Shop can have multiple Branches. Staff members are associated with a Branch.

Any authorized Staff member from **any Branch belonging to the same Shop** can process Redemptions for that Shop’s Programs.

```text
Shop A
├── Branch 1
│   ├── Staff A
│   └── Staff B
│
└── Branch 2
    ├── Staff C
    └── Staff D

All of these Staff members can process Redemptions belonging to Shop A.
Staff from Shop B must not access or process Shop A’s Redemptions.
```

The authorization boundary is **Shop**, not Branch:

```text
staff.branch.shop_id
    ===
redemption.program.shop_id
```

Knowing a `redemption_id` must not let Shop A staff approve a Shop B redemption. Do not authorize on the redemption ID alone.

The Frontend should only expose Redemptions the Staff is authorized to access. The Backend must enforce the same authorization independently.

### Phase 1 role permissions (agreed)

Any existing **Staff** or **Admin** role can perform Redemption operations.

Do **not** introduce additional role-based restrictions for Redemption in Phase 1 unless explicitly decided later.

Existing authentication and authorization / security rules still apply (including the Shop boundary above).

---

## 12. Refund / reversal (deferred — not Phase 1)

Refund / Reversal is **not** part of the Phase 1 Redemption flow.

Do **not** implement it. Do **not** make it part of Phase 1 APIs, UI, or state machine.

A future phase may introduce a proper reversal mechanism rather than manually modifying the points balance. Until then, do not document a Phase 1 `COMPLETED → REVERSED` path as required.

---

## 13. Multiple devices (agreed)

The customer may have the same account open on several devices. Local UI state must not be what prevents a duplicate redeem. Server-side state (`pending` / `completed` / `rejected`) is authoritative. The UI refreshes / reconciles against the server.

Viewing the same record on two devices is allowed ([§5](#5-duplicate-protection-backend)). Creating two records for the same operation is not.

---

## 14. Pending owner decisions (do not implement yet)

Do **not** finalize implementation for these items. Do **not** invent a product default.

### 1. Reward price changes while Redemption is PENDING

**Status:** Pending Product Owner decision.

Whether a pending Redemption should keep the original `points_cost` from the time it was created if the Reward price later changes is **not** decided.

### 2. Reward is disabled or deleted while Redemption is PENDING

**Status:** Pending Product Owner decision.

Whether an existing valid pending Redemption can still be completed after the Reward is disabled / deleted, or whether it should be cancelled with the reserved points returned, is **not** decided.

### 3. Program is disabled while it has PENDING Redemptions

**Status:** Pending Product Owner decision.

Whether existing pending Redemptions can still be completed after the Program is disabled, or whether they should be cancelled and the reserved points released, is **not** decided.

### 14. Point expiry while points are reserved

**Status:** Pending Product Owner decision.

What happens when points are reserved for a PENDING Redemption and those points reach their expiration date is **not** decided. Decide this before implementing reservation against expiring lots.

### 15. Shop QR with multiple active Programs

**Status:** Pending Business Owner decision.

Whether a Shop can have multiple **ACTIVE** Programs simultaneously is **not** decided. Shop QR behavior must **not** be finalized until that decision.

| If | Then |
| -- | ---- |
| Only one active Program is allowed | Shop QR → `/join/{programId}` |
| Multiple active Programs are allowed | Shop QR → Shop / Program selection → customer chooses one Program → `/join/{programId}` |

Selecting one Program must **not** automatically create a membership in the other Programs.

Canonical tracking for QR / membership: [counter-qr-and-program-membership.md](./counter-qr-and-program-membership.md#15-shop-qr--multiple-active-programs-pending).

---

## 15. Core constraints (Phase 1)

1. Membership, points, stamps, wallet, and rewards are always **program-scoped**.
2. A customer joins a **program**, never a reward.
3. Pending redemptions **reserve** points; reserved points reduce **available** balance.
4. Approval is **atomic** and **idempotent**; duplicate approval never deducts twice.
5. Create-redemption and Approve are **idempotent** at the Backend / database (UI disable is UX only).
6. Earn is **idempotent** per business event; concurrent earn and redeem share one consistency model.
7. Cross-program points / rewards are never allowed. A redemption never moves to another program.
8. Staff authorization is **Shop-level**, enforced **server-side**. Phase 1: any existing Staff or Admin role may process redemptions for that Shop.
9. Reward eligibility / expiry is evaluated **at create**. Later reward `expires_at` does not auto-invalidate an existing pending redemption.
10. Refund / reversal is **not** Phase 1.
11. Do not implement the five pending owner items in [§14](#14-pending-owner-decisions-do-not-implement-yet).

Canonical shop → program → redeem diagram (QR resolution still pending item 15): [counter QR](./counter-qr-and-program-membership.md#canonical-flow).
