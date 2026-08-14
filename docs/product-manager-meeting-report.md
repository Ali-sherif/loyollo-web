# Product manager notes — Campaigns (`/app/campaigns`)

**Date:** 2026-08-14  
**Topic:** What “Completed” and “Performance” mean, and the campaign status lifecycle  
**Status:** DECIDED for product language. Not implemented in send writers yet.  
**Source of truth:** [campaigns-page.md](frontend/campaigns-page.md#product-meanings-decided) · glossary in [data-contract.md](backend/data-contract.md#unified-glossary) · gap [G-09](frontend/gaps-and-solutions.md#g-09--campaign-send--opens--automations)

---

## What we discussed

On `/app/campaigns`, **Completed** and **Performance** look related but they are not the same thing.

| Term | Kind | Meaning |
|------|------|---------|
| **Completed** | Status (tab + pill) | This campaign’s send is **finished**. Every email or SMS for that launch has been processed. |
| **Performance** | Results column (and sort) | How well a **sent** campaign did: email **% Open**, SMS **% Redeemed**. Drafts show `—`. |

Completed is not a score. A completed campaign can still show `0% Open` until open tracking exists.

---

## Agreed lifecycle

A campaign **must not start as Active**.

1. **Create** → **Draft** (saved, not started)
2. **Launch** → **Active** (it is working; messages are going out)
3. **All emails/SMS processed** → **Completed** (if at least one was sent) or **Failed** (if none were sent)

| Status | Meaning |
|--------|---------|
| Draft | Starting status. Not launched. |
| Active | Currently running. |
| Completed | Send finished. |
| Failed | Launch ran, nothing sent. |
| Disabled | Owner turned it off. |
| Scheduled | Starts later (tab exists; not wired yet). |

**Enable** must not mark a campaign Active without sending. A disabled draft should go back to **Draft**.

**Performance** then belongs on sent campaigns (Active while sending, Completed when done). It is `opened_count / sent_count`.

---

## What the product does today (gap)

- Successful launch stays **Active** forever. Nothing writes **Completed**, so that tab stays empty.
- **Enable** also sets Active without sending, so “Active” mixes “running” with “already sent” and “never sent.”
- After send, Performance shows **`0% Open`** / **`0% Redeemed`** because opens and redemptions are not tracked. SMS “Redeemed” is a label only.

This is G-09. The decided fix is: write `completed` when fan-out finishes with `sent_count > 0`; keep Active = working only; do not drop the Completed tab.

---

## Not in this discussion

Open tracking, SMS delivery, automations, and campaign revenue still follow existing G-09 / G-06 / G-20 items. This note only locks **status language** and **when Completed is written**.
