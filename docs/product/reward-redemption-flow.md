# Reward redemption flow (per program)

**Date:** 2026-08-16  
**Status:** DECIDED for Phase 1 lifecycle and agreed edge cases (not shipped). Five items remain **pending owner decision** — see [§14](#14-pending-owner-decisions-do-not-implement-yet).  
**Audience:** Product, UI/UX, QA, backend  
**Does not authorize** schema, APIs, or Next.js implementation ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

**Sources of truth to keep in sync:** [counter-qr-and-program-membership.md](./counter-qr-and-program-membership.md) · [loyalty-page.md](../frontend/loyalty-page.md#reward-redemption-lifecycle-decided) · [customer-reward-progress.md](./customer-reward-progress.md) · [G-20](../frontend/gaps-and-solutions.md#g-20--rewardsredeemed_count-vs-earn) · [data-contract](../backend/data-contract.md) · [api-contract](../backend/api-contract.md)

The customer redeems **only** rewards that belong to the program in which they have membership. Points, stamps, wallet, and catalog never mix across programs. Program-level wallet (`Total` / `Reserved` / `Available = Total − Reserved`), Signup Bonus, and Referral Bonus stay as documented on the [customer wallet](../frontend/loyalty-page.md#customer-wallet-per-program-decided) and [referral rewards](../frontend/loyalty-page.md#referral-rewards-decided) — this file does not restate those grants.

---

## 1. Catalog redeem vs earn vs voucher

Do not collapse these three paths:

| Path | What it is | This file |
| ---- | ---------- | --------- |
| **Catalog redemption** | Customer selects a program reward, creates a redemption, staff **verifies** a single-use QR at checkout | **Yes** — pending, reserve, QR, scan → `completed` or job → `expired` |
| **Earn** | Check-in / visit completion / POS spend may *earn* a reward (`earned` ≠ redeemed) | Earn must be **idempotent** (see §9). Fulfilment still needs an explicit redeem |
| **Referral voucher** | Discount-kind grant on `vouchers` | [referral rewards](../frontend/loyalty-page.md#referral-rewards-decided) — not this state machine |

Earn ≠ redeem remains locked. A visit-completion “ready at the counter” is not an automatic catalog redemption.

**Exception (not a contradiction):** purely **digital** catalog rewards (for example an instantly-applied discount voucher) may skip the QR / staff-scan step and complete in the same create transaction. Physical / in-person handoff rewards use the QR flow below. See [§16](#16-digital-rewards-exception).

---

## 2. Customer request → staff QR verification

Staff scanning is **verification**, not discretionary approval. Staff cannot reject a valid, unexpired, un-redeemed QR.

```text
Customer taps Redeem on a reward
   (e.g. Free Coffee = 100 points)
   ↓
Available = Total − Reserved
   ↓
Available < cost?
   ├── Yes → reject immediately (clear error; no row; no reservation)
   └── No  → reserve points (increment Reserved)
             create Redemption PENDING
             generate single-use QR tied to that row
             qr_expires_at = now + 10 minutes
   ↓
Customer shows QR at checkout
   ↓
Staff scans QR
   ↓
Validate: maps to PENDING, correct program, scanner’s Shop,
          QR not expired, single-use
   ├── Valid     → atomic PENDING → COMPLETED
   │               permanently deduct reserved from Total
   │               staff hands over the reward
   ├── COMPLETED → reject scan (“already redeemed”)
   └── EXPIRED   → reject scan (“expired”)
```

The customer **cannot** redeem a reward that belongs to another program.

Stored status names: `pending` · `completed` · `expired` · `rejected`. Do not use other spellings.

- `pending` — points reserved; QR live until `qr_expires_at`.
- `completed` — staff scan (or instant digital complete) succeeded; reserved points consumed from Total.
- `expired` — scheduled job (or scan of a past-due QR) released the reservation. Not a staff action.
- `rejected` — **not** a staff action on a valid physical QR. Retained for other / non-QR flows if a created row must be invalidated without completing. Insufficient Available at create is an **error with no row**, not `rejected`.

Optional later states (`cancelled` · `reversed`) are **not** Phase 1. Refund / reversal is deferred ([§12](#12-refund--reversal-deferred--not-phase-1)).

---

## 3. Pending redemption reserves points

Reservation happens at **Redeem** time, not at staff-scan time.

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

A second reward costing 50 points must be **rejected immediately** (50 > 30): clear error, **no** reservation, **no** row. Combined pending cost must never exceed available balance. Concurrent redemption attempts must be checked against **Available**, not Total, so two in-flight Redeems cannot overspend.

**Spendable / available** on the wallet and on redeem eligibility is this **available** figure — not a stale client total, and not a raw `customers.points` counter that ignores reservations.

How reserved points interact with **lot** expiry (`points_ledger.expires_at`) is **pending** ([§14 item 14](#14-pending-owner-decisions-do-not-implement-yet)). That is independent of the 10-minute **QR** expiry ([§6b](#6b-expiry-handling-scheduled-job)).

---

## 4. State machine (server-enforced)

Minimum Phase 1 lifecycle (physical / in-person handoff):

```text
PENDING
   │
   ├── staff scan (verify) → COMPLETED
   │
   └── scheduled job / past qr_expires_at → EXPIRED
```

Digital exception: create may go `PENDING → COMPLETED` in the same transaction with no QR ([§16](#16-digital-rewards-exception)).

Rules:

- Transitions are enforced **server-side** (database transaction).
- `PENDING → COMPLETED` must be an **atomic, conditional** update: `UPDATE … WHERE status = 'pending'` (and QR still valid) and **affected row count = 1**. If count is 0, the scan failed (already `completed`, `expired`, or otherwise not pending).
- A second scan of a `completed` QR is **rejected** with a specific “already redeemed” error — not a silent success.
- A scan of an `expired` QR is **rejected** with a specific “expired” error.
- Frontend may disable Redeem after submit and show a countdown on the QR; that is **UX only** and **must not** be relied upon for correctness.

---

## 5. Duplicate protection (backend)

### Create must be idempotent

Viewing the same existing redemption from multiple devices is allowed and is **not** a duplicate:

```text
Mobile A → Redemption #123 → PENDING (same QR)
Mobile B → Redemption #123 → PENDING (same QR)
```

The Backend must still prevent the **create** operation from inserting multiple redemptions because of double-click, multiple tabs, multiple devices, or network retry. Use an idempotency / business rule and/or a unique database constraint.

```text
First request
→ Create Redemption #123
→ Reserve points
→ Issue QR (10-minute expiry)

Duplicate request
→ Detect existing operation
→ Return / use Redemption #123
→ Do not create another Redemption
→ Do not reserve points again
→ Do not issue a second QR
```

### Pending duplicate

When the business rule does not allow it, a customer must not have multiple `pending` redemptions for the same reward.

Validate:

```text
customer + program + reward + pending redemption
```

Database-level uniqueness (or an equivalent transactional lock) must handle races. UI disable is insufficient.

---

## 6. Atomic staff verification (QR scan)

Staff scanning **verifies** the QR. It is not an Approve / Reject decision.

On a valid scan:

```text
PENDING
→ COMPLETED
→ consume / deduct the reserved points from Total
→ staff hands over the reward
```

The `PENDING → COMPLETED` write must be:

```text
UPDATE … SET status = 'completed', … 
WHERE id = :id AND status = 'pending'
  AND qr_expires_at > now()
```

Commit only if **affected row count = 1**. That prevents two concurrent scans from both completing.

A second scan after complete:

```text
COMPLETED → reject (“already redeemed”) — do not deduct again
```

An expired QR (status already `expired`, or `qr_expires_at <= now()` while still `pending`):

```text
EXPIRED / past due → reject (“expired”) — do not complete, do not deduct
```

If the row is still `pending` but past `qr_expires_at`, the scan must **not** complete it. Prefer failing the scan with “expired”; the scheduled job is what marks `expired` and releases reserved points ([§6b](#6b-expiry-handling-scheduled-job)). Do not leave a past-due `pending` row completable.

The Backend transaction must ensure that the state transition and points consumption cannot partially succeed.

Two staff members scanning at once must never double-deduct or double-fulfil:

```text
Staff A → PENDING → COMPLETED (row count = 1)
Staff B → already COMPLETED → reject (“already redeemed”)
```

QR codes are **single-use**. Knowing a `qr_code` after complete must not fulfil again.

### Network retry during scan

The Scan / verify endpoint must be idempotent in the sense that a retry never consumes points twice. Enforced by the Backend / database, not the Frontend. A retry after a successful complete returns **“already redeemed”** (the first scan already succeeded — do not hand the reward over a second time).

```text
Request #1
→ PENDING → COMPLETED (row count = 1)
→ consume reserved points
→ success

Network timeout

Request #2 / retry
→ Redemption already COMPLETED
→ no additional points consumption
→ error “already redeemed”
```

A network retry must never create another points transaction or perform another deduction.

---

## 6b. Expiry handling (scheduled job)

PENDING redemptions expire **10 minutes** after create (`qr_expires_at`).

A **scheduled job** (cron / background worker) must periodically:

1. Find `pending` rows with `qr_expires_at <= now()`.
2. Mark them `expired` with an atomic conditional update (`WHERE status = 'pending' AND qr_expires_at <= now()`).
3. Release the reserved points back to Available.

Do **not** rely on client-side or lazy expiry only. Expired reservations must be released even if the customer never reopens the app.

Scan of a past-due QR must not complete the row ([§6](#6-atomic-staff-verification-qr-scan)). The job is the writer that turns those rows into `expired` and frees Reserved.

This 10-minute QR TTL is **independent** of the catalog reward’s `expires_at` ([§8](#8-reward-eligibility-at-create-agreed)).

---

## 7. Concurrent earn and redeem (Backend)

Earn and Redemption operations must use the **same** concurrency / transaction consistency model for points.

The Backend must prevent race conditions that could cause:

- Negative balances
- Lost updates
- Double deductions
- Lost / created points due to concurrent requests
- Incorrect points reservations
- Overspend when two Redeems race against **Total** instead of **Available**

Balance validation and points reservation / consumption must be performed **atomically**. No operation may trust a stale client-side balance.

Example: initial available balance = 50. Concurrent `Earn +100` and `Redeem 100` must still result in a transactionally consistent final state.

---

## 8. Reward eligibility at create (agreed)

Reward eligibility / expiry is evaluated **when the Redemption is created**.

```text
10:59 → Reward is valid
       → Customer creates Redemption
       → PENDING + QR (qr_expires_at = 11:09)

11:00 → Reward catalog expires_at passes

11:05 → Staff scans QR (still within 10-minute QR window)
```

The Reward expiring after the Redemption was created **must not** automatically invalidate the existing Redemption.

The **QR / pending-redemption TTL is 10 minutes** and is **independent** of the Reward’s `expires_at`. Do not use reward `expires_at` as the QR timer.

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
- The QR is valid only for that program. Staff/scanner must belong to the Shop that owns the program.

```text
Customer
├── Program A → 100 points  (Redemption #123 stays here)
└── Program B → 50 points   (must not pay for #123)
```

No cross-program balance aggregation.

---

## 11. Staff authorization (Shop-level)

A Shop can have multiple Branches. Staff members are associated with a Branch.

Any authorized Staff member from **any Branch belonging to the same Shop** can **scan / verify** Redemptions for that Shop’s Programs.

```text
Shop A
├── Branch 1
│   ├── Staff A
│   └── Staff B
│
└── Branch 2
    ├── Staff C
    └── Staff D

All of these Staff members can scan QRs belonging to Shop A.
Staff from Shop B must not access or complete Shop A’s Redemptions.
```

The authorization boundary is **Shop**, not Branch:

```text
staff.branch.shop_id
    ===
redemption.program.shop_id
```

Knowing a `redemption_id` or `qr_code` must not let Shop A staff complete a Shop B redemption. Do not authorize on the redemption ID or QR payload alone.

The scan must also confirm the redemption belongs to the **correct program** (the one the membership / catalog reward is on).

The Frontend should only expose a scanner for the Staff’s Shop. The Backend must enforce the same authorization independently.

Staff **cannot** discretionary-reject a valid, unexpired, un-redeemed QR. Invalid scans return specific errors (`already redeemed`, `expired`, wrong shop / program). They are not a `rejected` status chosen by staff.

### Phase 1 role permissions (agreed)

Any existing **Staff** or **Admin** role can perform Redemption **scan / verify** operations.

Do **not** introduce additional role-based restrictions for Redemption in Phase 1 unless explicitly decided later.

Existing authentication and authorization / security rules still apply (including the Shop boundary above).

---

## 12. Refund / reversal (deferred — not Phase 1)

Refund / Reversal is **not** part of the Phase 1 Redemption flow.

Do **not** implement it. Do **not** make it part of Phase 1 APIs, UI, or state machine.

A future phase may introduce a proper reversal mechanism rather than manually modifying the points balance. Until then, do not document a Phase 1 `COMPLETED → REVERSED` path as required.

---

## 13. Multiple devices (agreed)

The customer may have the same account open on several devices. Local UI state must not be what prevents a duplicate redeem. Server-side state (`pending` / `completed` / `expired` / `rejected`) is authoritative. The UI refreshes / reconciles against the server (same QR + remaining TTL on every device).

Viewing the same record on two devices is allowed ([§5](#5-duplicate-protection-backend)). Creating two records for the same operation is not. Completing from a scan on one device must show `completed` on the others; expiry on the server must show `expired` even if a device still displays a stale QR.

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

What happens when points are reserved for a PENDING Redemption and those **lots** reach their `points_ledger.expires_at` is **not** decided. Decide this before implementing reservation against expiring lots. This is **not** the 10-minute QR TTL (that TTL is locked in [§6b](#6b-expiry-handling-scheduled-job)).

### 15. Shop QR with multiple active Programs

**Status:** Pending Business Owner decision.

Whether a Shop can have multiple **ACTIVE** Programs simultaneously is **not** decided. Shop QR behavior must **not** be finalized until that decision. Shop / door QR is unrelated to the **redemption** QR in this file.

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
3. Pending redemptions **reserve** points at Redeem time; reserved points reduce **available** balance (`Available = Total − Reserved`). Concurrent Redeems check Available, not Total.
4. Staff scan is **verification**, not approval. `PENDING → COMPLETED` is an **atomic conditional update** (`WHERE status = 'pending'`, affected rows = 1). A second scan is “already redeemed”; an expired QR is “expired”.
5. Create-redemption is **idempotent** at the Backend / database (UI disable is UX only). Do not issue a second QR or reserve twice for the same operation.
6. A scheduled job expires `pending` rows past the 10-minute `qr_expires_at` and **releases** reserved points. Do not rely on client-side / lazy expiry.
7. Earn is **idempotent** per business event; concurrent earn and redeem share one consistency model.
8. Cross-program points / rewards are never allowed. A redemption never moves to another program.
9. Staff authorization is **Shop-level**, enforced **server-side**. Phase 1: any existing Staff or Admin role may scan/verify redemptions for that Shop. Staff cannot reject a valid, unexpired, un-redeemed QR.
10. Reward eligibility / expiry is evaluated **at create**. Later reward `expires_at` does not auto-invalidate an existing pending redemption. QR TTL is independent (10 minutes).
11. Refund / reversal is **not** Phase 1.
12. Digital catalog rewards may complete instantly without QR ([§16](#16-digital-rewards-exception)).
13. Do not implement the five pending owner items in [§14](#14-pending-owner-decisions-do-not-implement-yet).

Canonical shop → program → redeem diagram (Shop QR resolution still pending item 15): [counter QR](./counter-qr-and-program-membership.md#canonical-flow).

---

## 16. Digital rewards exception

This file’s QR + staff-scan path applies to rewards that need **physical / in-person handoff**.

Purely **digital** catalog rewards (for example an instantly-applied discount voucher) **may** bypass QR generation and staff scan:

```text
Available ≥ cost → reserve + COMPLETED in one transaction
(permanently deduct; no QR, no 10-minute hold)
Available < cost → error, no row
```

That is a documented **exception**, not a second contradictory state machine. Referral discount grants remain on `vouchers` ([§1](#1-catalog-redeem-vs-earn-vs-voucher)) and are not this path.

Which catalog rewards are digital vs physical is a catalog/product flag (backend-owned). Until that flag exists, treat catalog redeem as the physical QR flow.

---

## Gaps (design vs implementation)

This section is a **design change**, not a clarification of shipped code.

| Gap | Reality today | Locked design |
| --- | ------------- | ------------- |
| No catalog redeem lifecycle | Check-in may insert `customer_rewards` with `status = earned`; `redeemed_count` is not a pending → completed machine ([G-20](../frontend/gaps-and-solutions.md#g-20--rewardsredeemed_count-vs-earn)) | Customer Redeem → `pending` + reserve + QR; staff **scan** → atomic `completed`; job → `expired` |
| Previous spec was staff **Approve / Reject** | Docs and UX briefs (UX-11, older api-contract approve/reject) described a discretionary pending list | **Superseded.** Do not implement staff Approve/Reject for physical catalog rewards. Scan verifies; staff cannot reject a valid QR |
| No redemption QR / 10-minute TTL / expiry job | Not in schema or workers | `qr_code` + `qr_expires_at`; cron/worker must release Reserved even if the app never reopens |
| Instant digital complete | Not distinguished from physical | [§16](#16-digital-rewards-exception) — exception only |

Do not ship a staff “pending redemptions → Approve / Reject” UI as if it matched this lock.
