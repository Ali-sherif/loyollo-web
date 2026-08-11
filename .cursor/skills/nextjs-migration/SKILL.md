---
name: nextjs-migration
description: >-
  Leads the TanStack Start to Next.js migration using docs/architecture and
  docs/frontend as source of truth. Use when migrating to Next.js, clearing
  pre-implementation gates, approving ADRs, executing migration slices, Lovable
  withdrawal, messaging adapter work, or route cutover.
---

# Next.js migration (docs-led)

## Authority

- Architecture: `docs/architecture/` (ADRs, checklist, decision matrix)
- Frontend blueprint: `docs/frontend/` (especially `12-migration-plan.md`, `13-migration-risks.md`)
- Multi-model / multi-agent execution: `docs/architecture/multi-agent-workflow.md`
- Docs authorize planning and gate work; they do **not** authorize implementation until Critical gates clear

## Multi-model / multi-agent

- Multiple models are allowed (lead / implementer / reviewer / spike).
- They share one plan: never invent a parallel migration.
- One overlapping path → one owner. Prefer one slice per agent.
- Parallelize only as mapped in `docs/architecture/multi-agent-workflow.md`.
- **Current start for parallel agents:** slice 5 (marketing/legal); optional parallel = D-28 spike **or** auth email BFF (slice 6) — one owner per overlapping path. Slices 1–4 baselines exist.

## Workflow

### 1. Orient

Read in order:

1. `docs/architecture/README.md`
2. `docs/architecture/pre-implementation-checklist.md`
3. `docs/frontend/README.md`
4. `docs/frontend/12-migration-plan.md`

Report: what is DECIDED vs PROPOSED/NEEDS APPROVAL/DEFERRED, and whether coding is allowed.

### 2. Clear gates (no app scaffold yet)

Work open Critical items with the user. Typical blockers:

- ADR-002–007 approval (or ACCEPTED RISK)
- Production route map approval
- Canonical package manager
- Email/SMS provider or adapter stub ACCEPTED RISK
- Cookie/SSR session spike
- Characterization / visual / email HTML baselines

Output a go/no-go. If no-go, stop before creating a Next.js app.

### 3. Execute slices (only after go)

Follow `docs/frontend/12-migration-plan.md` slices in order. For each slice:

1. Cite the relevant docs/ADRs
2. List files/routes in scope
3. Implement within locked constraints
4. State acceptance checks (route smoke, visual parity, messaging parity as applicable)
5. Note rollback for the slice

### 4. Hard stops

- Do not redesign UI
- Do not couple features to a specific email/SMS vendor — use messaging contracts
- Do not move business authz/persistence into Next as a second backend
- Do not remove TanStack/Lovable until smoke tests pass, rollback window ends, and user explicitly approves deletion
- Prefer Plan Mode for architecture and multi-slice planning

## Response shape when leading

```markdown
## Migration status
- Coding allowed: yes/no
- Open Critical gates: …
- Current slice: N — title (or "gate clearing")

## Next action
- …

## Docs cited
- …
```
