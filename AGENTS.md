<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Migration (TanStack Start → Next.js)

Lead from documentation — do not invent a parallel plan:

- Architecture / gates: `docs/architecture/` (start with `README.md` and `pre-implementation-checklist.md`)
- Frontend blueprint: `docs/frontend/` (especially `12-migration-plan.md`)
- Multi-model / multi-agent: `docs/architecture/multi-agent-workflow.md` (multiple models OK; one plan; slice owners)
- Always-apply rule: `.cursor/rules/migration-docs.mdc`
- Workflow skill: `.cursor/skills/nextjs-migration/SKILL.md`

Do not remove TanStack/Lovable until production smoke + rollback window + explicit user approval. Critical checklist items are cleared (DECIDED or ACCEPTED RISK); D-28 cookie/SSR remains documented BLOCKED until proven after migration start.

**Parallel agents start here:** slice 2 (vendor/re-host Lovable/CDN assets). Optional second lane: messaging stubs (slice 4) or D-28 auth spike — not slices 5+ routes until 2–4 baselines exist.
