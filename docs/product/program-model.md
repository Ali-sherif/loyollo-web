# Program model (Shop loyalty capabilities)

**Date:** 2026-08-17  
**Status:** DECIDED for Shop as the loyalty unit, one-per-type capabilities (Points / Visit / Tier), and one customer membership per Shop (not shipped). **Open:** tier downgrade if activity drops; whether the Tier metric is a cumulative lifetime figure separate from spendable points / resettable visits.  
**Audience:** Product, UI/UX, QA, backend  
**Does not authorize** schema, APIs, or Next.js implementation ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

**Supersedes (2026-08-16):** Shop as a container of many independent Programs (including same type); one wallet card per Program; pending Business Owner item 15 (multiple ACTIVE programs / Shop QR picker). Shop QR now always resolves to the Shop — [counter-qr-and-program-membership.md](./counter-qr-and-program-membership.md).

**Sources of truth to keep in sync:** [loyalty-page.md](../frontend/loyalty-page.md#shop-loyalty-capabilities-decided) · [counter-qr-and-program-membership.md](./counter-qr-and-program-membership.md) · [customer-reward-progress.md](./customer-reward-progress.md) · [UX-10](./ui-ux-team-requests.md#ux-10--loyalty-capabilities-settings) · [G-35](../frontend/gaps-and-solutions.md#g-35--shop-loyalty-is-one-row-not-one-config-per-capability)

Do **not** restate Signup/Referral grant timing or the catalog redeem state machine here. Cross-ref:

- Signup Bonus vs Referral Bonus: [loyalty-page.md](../frontend/loyalty-page.md#signup-bonus-vs-referral-bonus-decided)
- Catalog redeem (reserve + QR + atomic scan + expiry job): [reward-redemption-flow.md](./reward-redemption-flow.md)

---

## 1. Shop vs capability

A **Shop** is the loyalty unit. It owns:

- One customer membership / relationship per shopper
- One wallet (points balance, visit counter, current tier — each present only when that capability is enabled)
- One rewards catalog
- One referral configuration
- One join / check-in QR

A **capability** is an optional configuration of that Shop’s loyalty system. Stored `program_type`: `points` · `visit` · `tier`.

| Cap | Rule |
| --- | ---- |
| Points | At most **one** Points config per Shop |
| Visit | At most **one** Visit config per Shop |
| Tier | At most **one** Tier config per Shop |

These are **not** independent loyalty programs. A customer does not join “the Points Program” separately from “the Visit Program.” They join **the Shop**, and the Shop’s enabled capabilities determine what that membership earns and displays.

```text
Shop  (loyalty unit — one membership, one wallet, one catalog)
├── Points capability  (optional)  → conversion rate, min spend to earn, expiry
├── Visit capability   (optional)  → stamp target, min invoice, max/day, weekend multiplier
└── Tier capability    (optional)  → ladder + measured-by + reset period
```

**Schema assumption (do not invent a `shops` table from this file):** today there is no `shops` table. The Shop identity is `owner_id` / `profiles` (the merchant who bought Loyollo). `branches` are locations under that owner and are not a second loyalty unit. Backend may later introduce a formal `shops` row; product meaning stays “one loyalty system per merchant Shop.”

**Storage (backend-owned):** keep using `loyalty_programs` rows as capability configs. Target unique constraint: **`UNIQUE (owner_id, program_type)`** — at most three rows per Shop, never two of the same type. Do **not** unique-constrain `owner_id` alone (that is today’s 1-row-total limit and blocks Points+Visit). Do **not** drop uniqueness entirely (that would allow two Points configs).

Joining a Shop creates **one** membership. QR join / check-in always targets **the Shop**: [counter QR](./counter-qr-and-program-membership.md).

---

## 2. Valid and invalid configurations

Each capability is independently optional. Any non-empty subset is valid.

**Valid**

1. Points only
2. Visits only
3. Tiers only
4. Points + Visits
5. Points + Tiers
6. Visits + Tiers
7. Points + Visits + Tiers

**Invalid**

- Two Points configs for the same Shop
- Two Visit configs for the same Shop
- Two Tier configs for the same Shop

A Shop with **no** capability enabled is a setup gap (no earn path). Join/check-in should treat that as unavailable — same empty state as “no live loyalty” today.

Visit does **not** require Points. Tier does **not** require Points or Visit. See [§3](#3-capability-types-v1).

---

## 3. Capability types (v1)

**v1 scope:** in-store transactions only. Do not design delivery / online / other-channel earning logic in this phase.

| Type | What it is | What the member spends / uses | Wallet display |
| ---- | ---------- | ----------------------------- | -------------- |
| **Points** | Numeric balance earned via a **currency-to-point** conversion rate | Spent on the Shop’s catalog rewards | Numeric **available** balance + progress toward the next reward |
| **Visit** | Counter incremented per qualifying in-store visit / check-in (and purchase when a minimum is set) | At the target count (e.g. 10 visits), the Shop grants a reward and the counter **resets** | Visit counter (filled / empty stamp icons) |
| **Tier** | A **status** (e.g. Bronze / Silver / Gold) derived from a cumulative metric | **Not** redeemed or spent. Unlocks standing perks (discounts, priority) | Current tier + progress toward the next tier threshold |

Tier is **status**, not a spendable currency. Catalog redeem stays a points path (or visit-completion earn): [reward-redemption-flow.md](./reward-redemption-flow.md) · [customer-reward-progress.md](./customer-reward-progress.md).

Rewards catalog is **Shop-wide**. A reward’s `point_cost` is only redeemable when the Points capability is enabled. Visit-completion rewards remain the Visit capability’s completion grant (earn ≠ catalog redeem).

---

### Points

Optional. If enabled, points are earned from a **purchase amount** on a paid invoice / POS transaction or a cashier-entered purchase, using the configured conversion rate.

**Example:** every 100 EGP = 10 points (`spend_amount = 100`, `points_earned = 10`). Invoice 250 EGP → 20 points (integer division; remainder not specified here — backend-owned).

Points **require** a purchase amount. A QR/check-in with no ticket does **not** award points.

**Minimum spend to earn (`minimum_spend`):** ticket floor. No points when the paid invoice is **below** this amount. Parallel Visit gate: [Minimum invoice amount](#qualifying-visit--minimum-invoice-amount-min_spend_per_visit) below.

**Honesty vs today:** check-in currently awards a flat `points_earned` and ignores ticket size / `minimum_spend` (G-10). Product meaning above is what design and backend must honour when orders/POS land.

---

### Visit

Optional. **Can exist without a Points capability.** Visit does **not** technically depend on Points. It can optionally depend on a qualifying **purchase amount**.

#### Qualifying visit — Minimum invoice amount (`min_spend_per_visit`)

**Product meaning (DECIDED):** on the Visit capability, **Minimum invoice amount** (UI today: “Minimum spend per visit”; column `min_spend_per_visit`) is the floor on the **paid invoice / ticket** for that in-store event.

| Setting | Effect |
| ------- | ------ |
| `0` or empty (none) | A qualifying QR check-in awards **+1 Visit**. No invoice floor. |
| `> 0` | Visit is awarded only when the customer’s **purchase amount meets that minimum**. QR/check-in **plus** purchase ≥ minimum → +1 Visit. Purchase below the floor → **no Visit**. |

**Examples**

- Visit enabled + minimum amount = none → QR/check-in → +1 Visit.
- Visit enabled + minimum amount = 200 EGP → QR/check-in + purchase ≥ 200 EGP → +1 Visit.
- Purchase &lt; 200 EGP → no Visit.

This is a **Visit** earning gate, not a Points conversion rule.

**Existing rules that remain configurable** (already stored; keep as product locks when the writer exists):

- Maximum visits per day (`max_visits_per_day`)
- Weekend multipliers (`double_stamp_weekends`)

**Honesty:** the field is saved on the capability row today; check-in does **not** enforce a purchase floor until ticket amount is available (G-10). Product meaning above is what design and backend must honour when orders/POS land — do not invent a different rule.

**Intended v1:** at the target count the counter **resets**. Today’s `after_reward_action === "continue"` is stored UI, **not** the v1 product lock.

A Shop has **one** Visit config. Do not model “drinks punch card” and “pastries punch card” as two Visit programs. If a future product needs independent stamp cards, that is a new decision — not this lock.

---

### Tier

Optional. **Only one Tier configuration per Shop.** Independent of whether Points or Visit is enabled.

It works according to the configured tier rules (ladder rows on `loyalty_program_tiers`, `tier_measured_by`, `tier_reset_period`). It does **not** require multiple Tier programs.

Wallet: current tier + progress to the next threshold. Standing perks, not catalog spend.

#### Open — tier metric source

Whether Tier is measured from **spendable** `customers.points` / `customers.visits` (today’s intended writer) or from a **cumulative lifetime** metric (e.g. lifetime spend or lifetime visit count that does not fall on redeem / stamp reset) is **not decided**. Redeeming points or resetting a visit card would currently move the same counters the ladder reads. Do not invent a default. Track in [deferred-decisions.md](../architecture/deferred-decisions.md).

#### Open — tier downgrade

Whether a member **downgrades** if activity drops (and how `tier_downgrade_protection` behaves) is **not decided**. Do not invent a default. Today’s merchant form stores a `tierDowngradeProtection` flag; that is **not** a product lock. Track in [deferred-decisions.md](../architecture/deferred-decisions.md).

---

## 4. Customer membership and wallet

A customer has **one loyalty relationship / account per Shop**. That membership holds separate balances / state for:

- **Points** (if Points is enabled)
- **Visits** (if Visit is enabled)
- **Current Tier** (if Tier is enabled)

Not separate wallets for multiple programs inside the same Shop. Not one card per capability as if they were different Shops.

A customer **may** be a member of **several Shops** at once. Those wallets never mix (Shop A points + Shop B points ≠ a combined total).

| Enabled on this Shop | Card shows |
| -------------------- | ---------- |
| Points | Numeric **available** balance (`Total − Reserved`) + progress toward the next catalog reward |
| Visit | Visit counter (filled / empty stamp icons) |
| Tier | Current tier + progress toward the next tier threshold |
| Several | **One** Shop card with independent sections for each enabled capability |

Full card facts (expiry groups, vouchers, share QR, redeem): [customer wallet](../frontend/loyalty-page.md#customer-wallet-per-shop-decided) · [customer-reward-progress.md](./customer-reward-progress.md).

---

## 5. Signup Bonus when several capabilities are enabled

Signup Bonus remains **once per customer per Shop** on first membership join of that Shop ([Signup vs Referral](../frontend/loyalty-page.md#signup-bonus-vs-referral-bonus-decided)). Welcome / link-Shop screens are UX only.

If **both** Points Signup Bonus and Visit signup stamp are configured, they **can both fire** on that first Shop join. That is the intended consequence of independent capabilities, not a bug. Returning check-in never fires either.

---

## 6. Related locks (do not duplicate)

| Topic | Canonical doc |
| ----- | ------------- |
| Signup Bonus (once per customer per Shop on first join) vs Referral Bonus (`?ref=` + OTP; can stack) | [Signup vs Referral](../frontend/loyalty-page.md#signup-bonus-vs-referral-bonus-decided) |
| Welcome / link-Shop screens are **UX only** — they do not grant a bonus unless Signup Bonus is configured | [UX-76](./ui-ux-team-requests.md#ux-76--first-shop-welcome--link-shop) · [customer-portal-journey.md](./customer-portal-journey.md) |
| Catalog redeem: Available check → reserve → PENDING QR → staff scan COMPLETED (atomic) or job EXPIRED | [reward-redemption-flow.md](./reward-redemption-flow.md) |
| Shop QR / membership join | [counter-qr-and-program-membership.md](./counter-qr-and-program-membership.md) |
| Referral points kind when Points is **disabled** | **Open** — [deferred-decisions.md](../architecture/deferred-decisions.md) |
