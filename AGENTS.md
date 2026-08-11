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
- Always-apply rule: `.cursor/rules/migration-docs.mdc`
- Workflow skill: `.cursor/skills/nextjs-migration/SKILL.md`

Do not create the Next.js application or implement migration slices until Critical checklist items are `DECIDED` or explicitly `ACCEPTED RISK`.
