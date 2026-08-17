# Program model (Shop vs Program)

**Date:** 2026-08-16  
**Status:** DECIDED for Shop vs Program, v1 program types, and same-type / rule-vs-program guidance (not shipped). **Open:** tier downgrade if activity drops. **Pending Business Owner:** whether more than one program may be `active` at once (Shop QR) — [§15](./counter-qr-and-program-membership.md#15-shop-qr--multiple-active-programs-pending).  
**Audience:** Product, UI/UX, QA, backend  
**Does not authorize** schema, APIs, or Next.js implementation ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

**Sources of truth to keep in sync:** [loyalty-page.md](../frontend/loyalty-page.md#multiple-programs-and-status-decided) · [counter-qr-and-program-membership.md](./counter-qr-and-program-membership.md) · [customer-reward-progress.md](./customer-reward-progress.md) · [UX-10](./ui-ux-team-requests.md#ux-10--multi-program-list--switcher) · [G-35](../frontend/gaps-and-solutions.md#g-35--shop-is-limited-to-one-loyalty-program-no-program-status)

Do **not** restate Signup/Referral grant timing or the catalog redeem state machine here. Cross-ref:

- Signup Bonus vs Referral Bonus: [loyalty-page.md](../frontend/loyalty-page.md#signup-bonus-vs-referral-bonus-decided)
- Catalog redeem (reserve + QR + atomic scan + expiry job): [reward-redemption-flow.md](./reward-redemption-flow.md)

---

## 1. Shop vs Program

A **Shop** is a container. It has no shop-wide points balance, membership, wallet, or reward catalog.

A **Program** is the independent unit of loyalty logic. It owns its own:

- Members
- Wallet
- Points / stamps / tier state
- Rewards
- Signup Bonus config
- Referral rules

A customer’s balance in one Program **never** combines with their balance in another Program, even when both Programs belong to the same Shop.

```text
Shop  (container only — no wallet)
├── Program A  → members, wallet, points/stamps/tier, rewards, signup, referrals
└── Program B  → members, wallet, points/stamps/tier, rewards, signup, referrals
                 (never mixed with A)
```

Joining Program A does **not** automatically join Program B. QR join / check-in always targets **one** Program: [counter QR](./counter-qr-and-program-membership.md).

---

## 2. Program types (v1)

**v1 scope:** in-store transactions only. Do not design delivery / online / other-channel earning logic in this phase.

Stored `program_type`: `points` · `visit` · `tier`.

| Type | What it is | What the member spends / uses | Wallet display |
| ---- | ---------- | ----------------------------- | -------------- |
| **Points system** | Numeric balance earned via a **$-to-point** conversion rate | Spent on that Program’s catalog rewards | Numeric **available** balance + progress toward the next reward |
| **Visit-based** | Counter incremented per qualifying in-store visit / transaction | At the target count (e.g. 10 visits), the Program grants a reward and the counter **resets** | Visit counter (filled / empty stamp icons) |
| **Tier-based** | A **status** (e.g. Bronze / Silver / Gold) derived from a cumulative metric (e.g. annual spend or visit count) | **Not** redeemed or spent. Unlocks standing perks (discounts, priority) | Current tier + progress toward the next tier threshold |

Tier is **status**, not a spendable currency. Catalog redeem stays a points-program (or visit-completion) path: [reward-redemption-flow.md](./reward-redemption-flow.md) · [customer-reward-progress.md](./customer-reward-progress.md).

### Qualifying visit — Minimum invoice amount (`min_spend_per_visit`)

**Product meaning (DECIDED intent):** on a **Visit** Program, **Minimum invoice amount** (UI today: “Minimum spend per visit”; column `min_spend_per_visit`) is the floor on the **paid invoice / ticket** for that in-store transaction. A visit **counts** (stamp +1) only when invoice amount **≥** this value. Below the floor → **no stamp**, no progress change.

**Owner example:** “The visit does not count unless the invoice is ≥ 200” → set Minimum invoice amount to `200` (shop currency). Invoice `150` → no stamp. Invoice `200` or `350` → stamp counts.

| Setting | Effect |
| ------- | ------ |
| `0` or empty | Every recorded visit / check-in qualifies (no invoice floor) |
| `> 0` | Only invoices at or above the amount qualify |

This is a **Visit** earning gate, not a Points conversion rule. The Points parallel is **Minimum spend to earn** (`minimum_spend`): no points below that ticket floor — [loyalty-page Points](../frontend/loyalty-page.md#points-system).

**Honesty:** the field is saved on the program today; check-in does **not** enforce it until ticket amount is available (G-10). Product meaning above is what design and backend must honour when orders/POS land — do not invent a different rule.

### Open — tier downgrade

Whether a member **downgrades** if activity drops (and how `tier_downgrade_protection` behaves) is **not decided**. Do not invent a default. Today’s merchant form stores a `tierDowngradeProtection` flag; that is **not** a product lock. Track in [deferred-decisions.md](../architecture/deferred-decisions.md).

---

## 3. Multiple programs per Shop, including same type

A shop owner can **create any number of Programs**, including **multiple Programs of the same type** (for example two separate Points-system Programs). There is **no** 1-per-type restriction. Do not add a unique constraint on `(shop, program_type)`.

This is independent of **how many may be `active` at once** (Shop QR — still [pending Business Owner](./counter-qr-and-program-membership.md#15-shop-qr--multiple-active-programs-pending)). Independently pausing / stopping a Program is already modeled as that Program’s `disabled` (or leaving it `draft`).

### Rule vs new Program (decision rule)

Use this for product, backend modeling, and **admin UI copy** when the owner creates a Program (tooltip / helper on [UX-10](./ui-ux-team-requests.md#ux-10--multi-program-list--switcher) / `/app/loyalty`):

| Model as… | When |
| --------- | ---- |
| **Multiple earning rules inside ONE Program** (one shared balance) | The initiatives share the **same underlying goal** and only differ by a **conditional earning modifier** (time-of-day multiplier, product-category variant, birthday double, weekend stamp, and similar). |
| **Separate Programs** (even if the same type) | The initiatives have **genuinely different purposes**, **different lifespans** (limited-time campaign vs a permanent Program), need **independent analytics**, or need to be **independently paused / stopped**. |

**Example — keep as a rule, not a Program:** “Happy Hour 3x points” is an earning rule **inside** “Regular Points.” Members share one Points balance. Do not create a second Points-system Program named Happy Hour.

**Example — separate Programs:** “Punch card — drinks” and “Punch card — pastries” are two Visit-based Programs when they need independent stamp counts, catalogs, and pause/stop.

Suggested create-flow helper copy (pixel layout not locked):

> Same goal, different rate? Add it as a rule instead of a new program.

How earning rules are **stored** is backend-owned. This lock is the product decision only — do not add tables from this frontend repo.

---

## 4. Customer wallet (summary)

A customer can be a member of **multiple Programs at once** (any mix of types). The wallet shows each membership **independently** — no aggregation across Programs.

| Membership type | Card shows |
| --------------- | ---------- |
| Points | Numeric **available** balance (`Total − Reserved`) + progress toward the next reward |
| Visit | Visit counter (filled / empty stamp icons) |
| Tier | Current tier + progress toward the next tier threshold |

Full card facts (expiry groups, vouchers, share QR, redeem): [customer wallet](../frontend/loyalty-page.md#customer-wallet-per-program-decided) · [customer-reward-progress.md](./customer-reward-progress.md).

---

## 5. Related locks (do not duplicate)

| Topic | Canonical doc |
| ----- | ------------- |
| Signup Bonus (once per customer per Program on first join) vs Referral Bonus (`?ref=` + OTP; can stack) | [Signup vs Referral](../frontend/loyalty-page.md#signup-bonus-vs-referral-bonus-decided) |
| Welcome / link-program screens are **UX only** — they do not grant a bonus unless Signup Bonus is configured | [UX-76](./ui-ux-team-requests.md#ux-76--first-shop-welcome--link-program) · [customer-portal-journey.md](./customer-portal-journey.md) |
| Catalog redeem: Available check → reserve → PENDING QR → staff scan COMPLETED (atomic) or job EXPIRED | [reward-redemption-flow.md](./reward-redemption-flow.md) |
| Program QR / Shop QR / membership join | [counter-qr-and-program-membership.md](./counter-qr-and-program-membership.md) |
