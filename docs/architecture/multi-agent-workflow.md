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
| 5+ | Routes / domains | **Primary next** — one domain slice per agent max; start with static marketing/legal (slice 5) |

**Forbidden parallel pairs:** two agents on the same route tree; redesign + migration; Lovable deletion + active feature ports.

## Where parallel agents start now

1. **Lead:** confirm GO from [pre-implementation-checklist.md](pre-implementation-checklist.md) and cite [12-migration-plan.md](../frontend/12-migration-plan.md).
2. **Implementer A (required):** **slice 5** — static marketing/legal routes with visual + SEO metadata parity.
3. **Implementer B (optional):** D-28 cookie/SSR proof (needs `SUPABASE_SERVICE_ROLE_KEY` or confirmed `SPIKE_TEST_*`; do not fake PASS) **or** first-party email BFF stubs under `/api/email/*` when touching auth (slice 6).
4. **Reviewer:** after each PR, check parity + ADR compliance; no new architecture.

Slices 1–4 baselines exist. Domain route ports (5+) may proceed one slice / one owner at a time.

## Handoff checklist (every agent turn)

```markdown
## Migration status
- Coding allowed: yes/no
- Current slice: N — title
- Files owned this turn: …
- Blocked on: … (or none)
- Next agent should: …
```
