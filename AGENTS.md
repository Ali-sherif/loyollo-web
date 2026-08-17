## Next.js app

The running app is **Next.js App Router** (`npm run dev` / `npm run build`). TanStack Start and Lovable have been retired from this repo (slice 14; ADR-009). Do not recreate `src/routes`, `/lovable/*` handlers, or `@lovable.dev/*` packages.

Lead from documentation — do not invent a parallel plan:

- Architecture / gates: `docs/architecture/` (start with `README.md` and `pre-implementation-checklist.md`)
- Frontend blueprint: `docs/frontend/` (especially `12-migration-plan.md`)
- Multi-model / multi-agent: `docs/architecture/multi-agent-workflow.md` (multiple models OK; one plan; slice owners)
- Always-apply rule: `.cursor/rules/migration-docs.mdc`
- Workflow skill: `.cursor/skills/nextjs-migration/SKILL.md`

Critical checklist items are cleared (DECIDED or ACCEPTED RISK). D-28 cookie/SSR remains documented BLOCKED until proven. Slice 15 remainder: production smoke + visual/email HTML parity.

**Parallel agents start here:** production smoke on Vercel + optional D-28 proof. Next remaining work is slice 15 parity, not a second frontend.
