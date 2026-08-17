# Multi-model / multi-agent migration workflow

**Status:** DECIDED for how humans and AI agents execute the docs-led migration.  
**Does not** replace `docs/frontend/12-migration-plan.md` or ADRs — those remain the product source of truth.

## Principle

Multiple AI models/agents are allowed and useful. They must **not** invent parallel migration plans. Every agent reads the same docs, respects locked constraints, and owns **one slice (or one non-overlapping file set)** at a time.

## Role split (by strength)

| Role             | Typical work                                                              | Prefer                                 |
| ---------------- | ------------------------------------------------------------------------- | -------------------------------------- |
| Lead / architect | Gate status, ADR wording, go/no-go, slice sequencing, conflict resolution | Strongest reasoning / Plan Mode        |
| Implementer      | One authorized slice: code + acceptance checks                            | Strong coding model                    |
| Reviewer         | Diff review vs ADRs, visual/messaging parity, risk callouts               | Strong review model                    |
| Spike / explorer | Read-only inventory or blocked spike evidence (e.g. D-28)                 | Any capable model; no product redesign |

Switch models freely **between** roles or slices. Do not switch mid-slice without a handoff note (slice id, files touched, remaining acceptance).

## Hard rules

1. **One source of truth:** `docs/architecture/` + `docs/frontend/` (especially `12-migration-plan.md`). Skill: `.cursor/skills/nextjs-migration/SKILL.md`.
2. **One owner per overlapping path:** two agents must not edit the same files in the same turn.
3. **No parallel rewrite of locked decisions** (ADR-006/009/010/011/014 messaging/Lovable/visual/data-ownership; target versions) without explicit user approval.
4. **Do not skip dependency-aware order** for foundation → assets → server-infra/auth proof → messaging → routes. Limited parallelization only where paths do not collide (see below).
5. **TanStack Start / Lovable are retired** — do not recreate `src/routes`, Vite/Nitro, or `@lovable.dev/*` packages (ADR-009).
6. **D-28 cookie/SSR** stays documented **BLOCKED** until Nest JWT HTTP-only cookies are **PASSED**; do not re-run or claim PASS on the superseded `@supabase/ssr` spike ([ADR-005](decisions/ADR-005-authentication.md) Option C).
7. Prefer **separate branches / commits per agent** with a clear slice id in the message.
8. **`docs/backend/` product-data contracts** have a **single owner** when edited. Agents **must not** add `supabase/migrations/` (or Next BFF persistence) for gaps **G-01…G-32** (orders, visit_events, tiers, referrals, etc.) — those belong to the backend program ([ADR-014](decisions/ADR-014-product-data-ownership.md)). Presentational Phase 0 honesty fixes in frontend UI are allowed.

## Parallelization map (current)

| Slice | Title                                            | Parallel?                                                                                                                      |
| ----- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 1     | Foundation                                       | **Done** — do not re-scaffold                                                                                                  |
| 2     | Vendor/re-host Lovable/CDN assets                | **Done**                                                                                                                       |
| 3     | Server infrastructure + auth proof (D-28)        | **Done (scaffolding)** — leftover `@supabase/ssr` is **not** the IdP; Nest JWT cookie/SSR proof still **BLOCKED** (D-28, ADR-005 Option C) |
| 4     | Messaging skeleton (`src/lib/server/messaging/`) | **Done** (stubs; no real provider)                                                                                             |
| 5+    | Routes / domains                                 | **Done (ported)** — Next is the only app (`npm run dev` / `npm run build`); TanStack Start and Lovable retired |

**Forbidden parallel pairs:** two agents on the same route tree; redesign + migration; Lovable deletion + active feature ports; two agents editing `docs/backend/` contracts without a single owner; frontend schema migrations for G-01…G-32.

## Where parallel agents start now

1. **Lead:** production smoke on Vercel + confirm env UI values ([docs/deployment/env.md](../deployment/env.md)).
2. **Optional:** D-28 Nest JWT cookie/SSR proof (needs Nest test user; do not fake PASS; do not use `@supabase/ssr`).
3. **Do not** restore TanStack Start / Lovable packages or `src/routes`.
4. **Reviewer:** visual/messaging parity vs approved Next routes; ADR compliance.

Route port slices 5–13 and Lovable/TanStack retirement (slice 14) are complete. Remaining work is slice 15 parity and production smoke.

## Handoff checklist (every agent turn)

```markdown
## Migration status

- Coding allowed: yes/no
- Current slice: N — title
- Files owned this turn: …
- Blocked on: … (or none)
- Next agent should: …
```
