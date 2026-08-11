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
| 2 | Vendor/re-host Lovable/CDN assets | **Primary next** — one implementer |
| 3 | Server infrastructure + auth proof (D-28) | May start **after or lightly alongside** slice 2 only if file ownership is split (`src/lib/server/*`, auth factories vs `src/assets/*`) |
| 4 | Messaging skeleton (`src/lib/server/messaging/`) | Parallel with slice 2 **only** if no shared files with the asset owner; do not invent a provider |
| 5+ | Routes / domains | **Serial after** slices 2–4 land enough shared infra; one domain slice per agent max |

**Forbidden parallel pairs:** two agents on the same route tree; redesign + migration; Lovable deletion + active feature ports.

## Where parallel agents start now

1. **Lead:** confirm GO from [pre-implementation-checklist.md](pre-implementation-checklist.md) and cite [12-migration-plan.md](../frontend/12-migration-plan.md).
2. **Implementer A (required):** **slice 2** — inventory `src/assets/*.asset.json` + CDN URLs; vendor/re-host; broken-image scan ([10-styling-and-assets.md](../frontend/10-styling-and-assets.md)).
3. **Implementer B (optional, non-blocking):** **slice 4 prep** — messaging contracts/stubs under `src/lib/server/messaging/` only, **or** D-28 spike evidence under [spikes/auth-ssr-spike.md](spikes/auth-ssr-spike.md) (needs credentials; do not fake PASS).
4. **Reviewer:** after each PR, check parity + ADR compliance; no new architecture.

Do **not** start marketing/auth/dashboard route ports (slices 5+) until slice 2 is accepted and server/messaging baselines exist for the routes you touch.

## Handoff checklist (every agent turn)

```markdown
## Migration status
- Coding allowed: yes/no
- Current slice: N — title
- Files owned this turn: …
- Blocked on: … (or none)
- Next agent should: …
```
