# Customer reward progress (per program)

**Date:** 2026-08-16  
**Status:** DECIDED (not shipped)  
**Audience:** Product, UI/UX, QA  
**Does not authorize** schema, APIs, or Next.js implementation ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

**Source of truth:** [loyalty-page.md — customer wallet](../frontend/loyalty-page.md#customer-wallet-per-program-decided) · [UX-07](./ui-ux-team-requests.md#ux-07--customer-wallet-per-program) · [reward-redemption-flow.md](./reward-redemption-flow.md)

Progress toward a reward lives on the **same per-program wallet card** as points, expiry, vouchers, and the personal share QR. It is **not** a shop-wide tracker.

---

## Rule

`this program’s balance` vs `this program’s rewards` only.

- Joining / scanning into Program A never shows Program B’s catalog or stamps.
- Never mix points + stamps across programs.
- Do not use the merchant stamp-card **preview** (it always fills 3 stamps). Customer progress must be real membership numbers.

---

## What the customer sees (by program type)

| Program type | Progress on the card | Ready / claim |
| ------------ | -------------------- | ------------- |
| **Visit** | Stamp card: current stamps / `visits_required` toward that program’s completion reward (name from catalog when linked; until then the `reward_on_completion` label) | Card full → that reward is **earned** / ready to show at the counter |
| **Points** | Bar to the **next live catalog reward** they have not earned: **available** points / `point_cost`, plus remaining | Enough **available** (unexpired, after pending reserved) points → reward is **available** to request, not auto-spent |
| **Tier** | Current tier + amount remaining to the next tier | Tier change is status, not a catalog redeem |

If several catalog rewards exist on a **points** program, the card shows **one primary**: the cheapest `live` reward in that program the member has not earned yet. A “See all rewards” list for **that program only** may sit under it. Pixel layout of bar vs stamps vs list is **not** locked.

If no live reward is configured → honest empty: no fake bar.

**Spendable points** (already locked) are the progress numerator for points programs — **available** after pending reservations (`Total − Reserved`), not a raw counter that hides expiry or in-flight redeems.

---

## After an in-store scan (journey B)

Check-in success for **that program** shows the same numbers, plus the delta for this visit when there was one:

- Visit: `4 of 8 stamps · 4 more for Free coffee` (or `+1 this visit`)
- Points: `+10 this visit · 80 more to Free muffin`
- Ready: `Free coffee ready — show this at the counter`

Returning scan still needs **no** new OTP. Opening the portal later still uses OTP (journey A); the wallet card must match these numbers.

---

## First customer view vs later history

| Need | Data |
| ---- | ---- |
| Customer `3/8` or `120/200 to next reward` | Derive from membership: `customers.visits` vs `visits_required`; **available** lots (unexpired minus pending reserved) vs `rewards.point_cost` for that `loyalty_program_id`; `customer_rewards` for earned / ready / pending |
| Merchant “stamps this month”, visit charts, peak hour | `visit_events` (G-01 / G-02) — **not** required to ship the customer card |

Visit completion should eventually set `customer_rewards.reward_id` to a catalog row. Until then, progress copy may use the program’s completion label. Schema remains backend-owned.

---

## Forbidden

- Shop-wide loyalty progress or a mixed rewards catalog
- Hardcoded stamp fills or `"0"` that look measured
- Showing another program’s rewards on this card
- Treating earned-at-check-in as redeemed (earn ≠ redeem). Catalog redeem is a **pending** request that reserves points until staff approve or reject ([reward-redemption-flow.md](./reward-redemption-flow.md))
- Redeeming a reward that belongs to another program, or spending Program B points on a Program A redemption. A redemption created under Program A stays on Program A even if the customer later uses Program B.
