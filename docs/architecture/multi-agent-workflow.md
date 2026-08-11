# Multi-model / multi-agent migration workflow

**Status:** DECIDED for how humans and AI agents execute the docs-led migration.  
**Does not** replace `docs/frontend/12-migration-plan.md` or ADRs — those remain the product source of truth.

## Principle

Multiple AI models/agents are allowed and useful. They must **not** invent parallel migration plans. Every agent reads the same docs, respects locked constraints, and owns **one slice (or one non-overlapping file set)** at a time.

## Role split (by strength)

| Role | Typical work | Prefer |
| --- | --- | --- |
| Lead / architect | Gate status, ADR wording, go/no-go, slice sequencing, conflict resolution | Strongest reasoning / Plan Mode |
| Implementer | One authorized slice: code + acceptance checks | Strong coding model |
| Reviewer | Diff review vs ADRs, visual/messaging parity, risk callouts | Strong review model |
| Spike / explorer | Read-only inventory or blocked spike evidence (e.g. D-28) | Any capable model; no product redesign |

Switch models freely **between** roles or slices. Do not switch mid-slice without a handoff note (slice id, files touched, remaining acceptance).

## Hard rules

1. **One source of truth:** `docs/architecture/` + `docs/frontend/` (especially `12-migration-plan.md`). Skill: `.cursor/skills/nextjs-migration/SKILL.md`.
2. **One owner per overlapping path:** two agents must not edit the same files in the same turn.
3. **No parallel rewrite of locked decisions** (ADR-006/009/010 messaging/Lovable/visual; target versions) without explicit user approval.
4. **Do not skip dependency-aware order** for foundation → assets → server-infra/auth proof → messaging → routes. Limited parallelization only where paths do not collide (see below).
5. **Do not delete TanStack/Lovable** until production smoke + rollback window + explicit user approval.
6. **D-28 cookie/SSR** stays documented **BLOCKED** until spike **PASSED**; agents may work the spike during server-infra/auth but must not claim auth complete early.
7. Prefer **separate branches / commits per agent** with a clear slice id in the message.

## Parallelization map (current)

| Slice | Title | Parallel? |
| --- | --- | --- |
| 1 | Foundation | **Done** — do not re-scaffold |
| 2 | Vendor/re-host Lovable/CDN assets | **Done** |
| 3 | Server infrastructure + auth proof (D-28) | **Done (scaffolding)** — cookie/SSR proof still **BLOCKED** (D-28) |
| 4 | Messaging skeleton (`src/lib/server/messaging/`) | **Done** (stubs; no real provider) |
| 5+ | Routes / domains | **Done (ported)** — Next is default `npm run dev` / `npm run build`; TanStack kept as `dev:tanstack` until retirement approval |

**Forbidden parallel pairs:** two agents on the same route tree; redesign + migration; Lovable deletion + active feature ports.

## Where parallel agents start now

1. **Lead:** production smoke on Vercel + confirm env UI values ([docs/deployment/env.md](../deployment/env.md)).
2. **Optional:** D-28 cookie/SSR proof (needs credentials; do not fake PASS).
3. **Do not** delete TanStack/Lovable packages or `src/routes` until smoke + rollback window + **explicit user approval**.
4. **Reviewer:** visual/messaging parity vs TanStack source; ADR compliance.

Route port slices 5–13 are in the Next App Router tree. Default scripts point at Next; TanStack remains in-repo via `dev:tanstack` / `build:tanstack`.

## Handoff checklist (every agent turn)

```markdown
## Migration status
- Coding allowed: yes/no
- Current slice: N — title
- Files owned this turn: …
- Blocked on: … (or none)
- Next agent should: …
```
