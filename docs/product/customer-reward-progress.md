# Customer reward progress (per Shop)

**Date:** 2026-08-17  
**Status:** DECIDED (not shipped)  
**Audience:** Product, UI/UX, QA  
**Does not authorize** schema, APIs, or Next.js implementation ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

**Source of truth:** [program-model.md](./program-model.md) · [loyalty-page.md — customer wallet](../frontend/loyalty-page.md#customer-wallet-per-shop-decided) · [UX-07](./ui-ux-team-requests.md#ux-07--customer-wallet-per-shop) · [reward-redemption-flow.md](./reward-redemption-flow.md)

Progress toward a reward lives on the **same per-Shop wallet card** as points, expiry, vouchers, and the personal share QR. A customer may hold **several Shop identities**; each card is independent — never aggregate across Shops. Show the **enrolled program** plus Archived History ([program-model.md](./program-model.md#4-customer-membership-and-wallet)).

---

## Rule

`this Shop’s balance` vs `this Shop’s rewards` only.

- Joining / scanning into Shop A never shows Shop B’s catalog or stamps.
- Never mix points + stamps **across Shops**.
- Do **not** mix balances from archived programs into ACTIVE spendable.
- Do not use the merchant stamp-card **preview** (it always fills 3 stamps). Customer progress must be real membership numbers.

---

## What the customer sees (enrolled program)

| Program type | Progress on the card | Ready / claim |
| ------------ | -------------------- | ------------- |
| **Visit** | Stamp card: filled / empty stamp icons — current stamps / `visits_required` toward this **program’s** completion reward | Card full → that reward is **earned** / ready to show at the counter (counter **resets** at target — [program types](./program-model.md#3-program-types-v1)) |
| **Points** | Numeric **available** balance plus a bar to the **next live catalog reward**: **available** / snapshot `point_cost`, plus remaining | Enough **available** (unexpired, after pending reserved) points → reward is **available** to request, not auto-spent |
| **Tier** | Highest **milestone this period** + remaining to next threshold (`period_points_earned`, PM-08) | One-time payout when the threshold is crossed; **not** standing VIP. Redeem does not drop the period counter |

Show the **enrolled** program only, plus Archived History (non-spendable). If no live reward is configured → honest empty: no fake bar.

**Spendable points** are the progress numerator for Points — **available** after pending reservations (`Total − Reserved`). Do **not** use `period_points_earned` as the wallet spendable number.

---

## After an in-store scan (journey B)

Check-in success for **this Shop** shows the same numbers, plus the delta for this visit when there was one:

- Visit: `4 of 8 stamps · 4 more for Free coffee` (or `+1 this visit`)
- Points: `+10 this visit · 80 more to Free muffin` (only if a purchase awarded points)
- Ready: `Free coffee ready — show this at the counter`

Returning scan still needs **no** new OTP. Opening the portal later still uses OTP (journey A); the wallet card must match these numbers.

---

## First customer view vs later history

| Need | Data |
| ---- | ---- |
| Customer `3/8` or `120/200 to next reward` | Derive from membership: `customers.visits` vs `visits_required`; **available** lots (unexpired minus pending reserved) vs `rewards.point_cost` for that Shop; `customer_rewards` for earned / ready / pending |
| Merchant “stamps this month”, visit charts, peak hour | `visit_events` (G-01 / G-02) — **not** required to ship the customer card |

Visit completion should eventually set `customer_rewards.reward_id` to a catalog row. Until then, progress copy may use the capability’s completion label. Schema remains backend-owned.

---

## Forbidden

- Mixing two Shops’ loyalty progress or catalogs on one card
- Hardcoded stamp fills or `"0"` that look measured
- Showing another Shop’s rewards on this card
- Treating earned-at-check-in as redeemed (earn ≠ redeem). Catalog redeem is a **pending** request that reserves points and shows a single-use QR until staff **scan** (or the 10-minute job expires it) ([reward-redemption-flow.md](./reward-redemption-flow.md)). Do not design staff Approve/Reject for physical rewards.
- Redeeming a reward that belongs to another Shop, or spending Shop B points on a Shop A redemption. A redemption created under Shop A stays on Shop A even if the customer later uses Shop B.
- Separate wallet cards for Points vs Visit vs Tier **of the same Shop**.
