# Go-live and cutover (D-23)

**Date:** 2026-08-11  
**Status:** **DECIDED** (D-23 reframed for pre-launch); D-21 email handlers **DECIDED**; rollback owner **ACCEPTED RISK** (not a GO gate)  
**Related:** [12-migration-plan.md](../frontend/12-migration-plan.md), [ADR-002](decisions/ADR-002-app-router.md), [ADR-008](decisions/ADR-008-deployment.md), [ADR-009](decisions/ADR-009-lovable-withdrawal.md), [15-server-function-mapping.md](../frontend/15-server-function-mapping.md)

## Context (locked)

- The product is **pre-launch** and has **never been live** with real production users or indexed legacy URLs ([ADR-002](decisions/ADR-002-app-router.md), [02-route-migration.md](../frontend/02-route-migration.md)).
- There is **no** production traffic to migrate gradually from TanStack Start to Next.js.

## What D-23 is (DECIDED)

D-23 is an **operational go-live / retirement** decision, not a dual-frontend production architecture:

- **First production host:** Next.js on Vercel ([ADR-008](decisions/ADR-008-deployment.md)).
- **Public URLs:** the **approved** map in [02-route-migration.md](../frontend/02-route-migration.md) only.
- **Repo during migration:** TanStack Start / Lovable may remain as the **development source** until slices finish; that is **not** production coexistence.
- **No dual writes** on shared backend paths once a path is owned by the Next app.
- **Legacy retirement:** remove TanStack / Lovable code only after production smoke, rollback window, and explicit user approval ([12-migration-plan.md](../frontend/12-migration-plan.md)).

## What D-23 is not (N/A — pre-launch)

- Running TanStack Start and Next.js as **simultaneous production** surfaces
- Gradual production traffic migration between frontends
- Percentage split / canary / edge routing between old and new frontends
- Migrating existing production users from a live legacy host

## Email handler cutover (D-21 DECIDED)

- Replace Lovable `/lovable/email/*` with first-party BFF paths (e.g. `/api/email/*`) during auth / messaging slices.
- Callers and schedulers switch as part of those slices; do not leave go-live callers on `/lovable/*` after withdrawal.

## Rollback (ACCEPTED RISK — not a pre-implementation gate)

- A named rollback owner and formal production acceptance criteria are **not** required to start migration.
- Operationally, prefer per-slice rollback to the prior Next deploy for routes that fail acceptance.
- Go-live still needs environment parity and validation of DNS / webhook / scheduler URLs when activating production.
