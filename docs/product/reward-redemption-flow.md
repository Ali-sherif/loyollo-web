# Reward redemption flow (per program)

**Date:** 2026-08-16  
**Status:** DECIDED (not shipped)  
**Audience:** Product, UI/UX, QA, backend  
**Does not authorize** schema, APIs, or Next.js implementation ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

**Sources of truth to keep in sync:** [counter-qr-and-program-membership.md](./counter-qr-and-program-membership.md) · [loyalty-page.md](../frontend/loyalty-page.md#reward-redemption-lifecycle-decided) · [customer-reward-progress.md](./customer-reward-progress.md) · [G-20](../frontend/gaps-and-solutions.md#g-20--rewardsredeemed_count-vs-earn)

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

Stored status names: `pending` · `completed` · `rejected`. Optional later: `cancelled` · `expired` · `reversed`. Do not use other spellings. UI may show APPROVED as the staff action; the resulting row is `completed`.

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

---

## 4. State machine (server-enforced)

Minimum lifecycle:

```text
PENDING
   │
   ├── APPROVED → COMPLETED
   │
   └── REJECTED
```

Optional states (`cancelled`, `expired`, `reversed`) may be added when business requires them. **Reversal of a completed redemption** is required if refunds are in scope (see §12).

Rules:

- Transitions are enforced **server-side**.
- A `completed` redemption cannot be approved again.
- Frontend may disable Redeem after submit; that is **not** the protection.

---

## 5. Duplicate protection (backend)

### Idempotency

Repeated submission of the same request returns the **same** redemption rather than creating another:

```text
Request A → Create Redemption #123
Request A retried → Return Redemption #123
```

### Pending duplicate

When the business rule does not allow it, a customer must not have multiple `pending` redemptions for the same reward.

Validate:

```text
customer + program + reward + pending redemption
```

Database-level uniqueness (or an equivalent transactional lock) must handle races. UI disable is insufficient.

---

## 6. Atomic staff approval

```text
BEGIN TRANSACTION

1. Verify redemption is still PENDING
2. Verify customer / program relationship
3. Verify redemption is valid
4. Verify sufficient points / reservation
5. Consume / deduct reserved points
6. Mark redemption COMPLETED

COMMIT
```

Two staff members approving at once must never double-deduct or double-fulfil:

```text
Staff A → PENDING → COMPLETED
Staff B → already COMPLETED → reject / no-op
```

Network timeout after a successful approve, then a second Approve press, must no-op the same way (idempotent; server state is source of truth).

---

## 7. Concurrent earn and redeem

Earn and redeem may run at the same time. Example: balance 50, earn +100, redeem 100.

Both operations must be **atomic** and produce a consistent final balance. No operation may trust a stale client-side balance.

---

## 8. Immutable snapshot on create

A redemption stores the reward terms that existed **when it was created**.

Example: cost 100 → customer PENDING → admin changes catalog cost to 150. The existing row stays `points_cost = 100`. Catalog edits must not retroactively change a pending (or completed) redemption.

Store whatever immutable snapshot is required for fulfilment (at least point cost; other fields as the backend needs).

---

## 9. Earn must also be idempotent

The same purchase or event processed twice (retry) must not credit twice:

```text
Purchase #123 → +100 points
Retry of Purchase #123 → still +100, not +200
```

Each earning event needs its own idempotency / reference key. `Invoice.Paid` is already idempotent on `order_id` ([api-contract](../backend/api-contract.md)). Check-in / POS earn needs the same class of protection.

---

## 10. Program isolation

All redemption operations stay on the original program. The row always references `loyalty_program_id`.

```text
Customer
├── Program A → 100 points
└── Program B → 50 points
```

A Program A redemption cannot consume Program B points. No cross-program balance aggregation.

---

## 11. Staff authorization

Staff access is scoped to the shop / program they are authorized to operate.

Knowing a `redemption_id` must not let Shop A staff approve a Shop B redemption.

Validate through the ownership chain:

```text
Staff → Shop → Program → Redemption
```

Do not authorize on the redemption ID alone.

Who may view / approve / reject / cancel / reverse is a **role-permission** question. Today `staff` has the same `/app` permissions as `admin` ([locked roles](../frontend/11-authentication-migration.md#locked-role-matrix)); a later split is not locked. The **ownership-chain check is locked now**.

---

## 12. Refund / reversal

Do not manually edit the customer’s balance.

```text
COMPLETED → REVERSED → restore reserved/deducted points
```

The reversal must be **auditable** and **idempotent**. Required if refunds are in product scope.

---

## 13. Multiple devices

The customer may have the same account open on several devices. Local UI state must not be what prevents a duplicate redeem. Server-side state (`pending` / `completed` / `rejected`) is authoritative. The UI refreshes / reconciles against the server.

---

## 14. Policies that are not locked yet

These must be explicit **before** the corresponding implementation. Recommended defaults are not product locks.

### Reward disabled or deleted while a redemption is pending

| Option | Behavior |
| ------ | -------- |
| **Recommended** | Existing `pending` remains valid and fulfillable |
| Alternative | Cancel the redemption and release reserved points |

Do **not** silently invalidate an already-created redemption because the live catalog changed.

### Program disabled while redemptions are pending

| Option | Behavior |
| ------ | -------- |
| **Recommended** | Existing `pending` remain fulfillable; **new** redemptions are blocked |
| Alternative | Cancel pending and release reserved points |

An admin status change must not unexpectedly void an in-flight customer transaction unless product chooses that alternative.

### Reward vs pending-redemption vs point expiration

Distinguish:

- Reward catalog expiration
- Pending redemption expiration
- Point-lot expiration

Example: reward expires at 11:00; customer redeems at 10:59; staff approves at 11:05. Policy is **not locked**. Recommended:

- Validate eligibility **when the redemption is created**
- Store the redemption’s terms (snapshot)
- Give pending redemptions their **own** expiry if required
- Do not silently invalidate a valid redemption because the catalog changed later

### Point-lot expiry vs reservation

Points expiry is already a product lock on issued lots ([points ledger](../backend/data-contract.md#points_ledger)). How a **pending reservation** interacts with lot expiry is **not locked**:

- Reservation protects the points until the redemption resolves, **or**
- Reservation expires with the underlying lots, **or**
- Pending redemption is cancelled and points are released

Decide this before implementing reservation against expiring lots.

---

## 15. Core constraints

1. Membership, points, stamps, wallet, and rewards are always **program-scoped**.
2. A customer joins a **program**, never a reward.
3. Pending redemptions **reserve** points; reserved points reduce **available** balance.
4. Approval is **atomic**; duplicate approval is impossible.
5. Earn and redeem are **idempotent**.
6. Cross-program points / rewards are never allowed.
7. Staff authorization is enforced **server-side** via the ownership chain.
8. Completed redemptions support an auditable **reversal** if refunds are required.
9. Program / reward config changes must not **silently mutate** existing redemption transactions.

Canonical shop → program → redeem diagram: [counter QR](./counter-qr-and-program-membership.md#canonical-flow).
