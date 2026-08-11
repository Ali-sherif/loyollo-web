# Characterization / visual / email HTML baselines

**Date:** 2026-08-11  
**Status:** **ACCEPTED RISK** (D-20)  
**Related:** [ADR-010](decisions/ADR-010-style-and-template-parity.md), [17-messaging-templates.md](../frontend/17-messaging-templates.md), [02-route-migration.md](../frontend/02-route-migration.md)

## Decision

Do **not** require a formal characterization / screenshot / email-HTML suite before migration coding. At implementation start, use a **minimal** baseline:

1. **Route smoke** — exercise routes from the approved map in [02-route-migration.md](../frontend/02-route-migration.md) as each slice lands.
2. **Visual parity** — side-by-side checks against the current TanStack UI for surfaces in that slice (no redesign).
3. **Email HTML** — inventory and preserve templates under `src/lib/server/messaging/`; capture rendered HTML diffs when messaging slices change templates or adapters.

## Acceptance (per slice)

- Smoke: migrated routes load without 5xx / blank shells.
- Visual: no intentional token, typography, spacing, or layout redesign.
- Email: template content/personalization preserved; provider-agnostic contracts only.

## Out of scope for this gate

A global pre-migration E2E suite, full visual regression CI, and exhaustive email HTML snapshots before coding.
