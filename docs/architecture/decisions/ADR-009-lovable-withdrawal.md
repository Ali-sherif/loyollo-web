# ADR-009: Withdraw Lovable from the Project

## Status

DECIDED

## Context

The current app is coupled to Lovable for Vite/TanStack build config, email send/webhook packages, `/lovable/email/*` routes, host error reporting (`window.__lovableEvents`), CDN asset manifests, and editor sync guidance in `AGENTS.md`. The migration target is a portable Next.js application that does not depend on Lovable packages, secrets, routes, or runtime hooks.

## Decision

Remove Lovable from the project during the Next.js migration. Specifically:

1. Drop `@lovable.dev/vite-tanstack-config`, `@lovable.dev/email-js`, `@lovable.dev/webhooks-js`, and transitive Lovable Vite plugins.
2. Replace Lovable build/runtime with the Next.js hosting stack on Vercel (initial target; see [ADR-008](ADR-008-deployment.md)).
3. Replace Lovable email transport with a provider-agnostic messaging adapter.
4. Move auth/email/preview/queue endpoints off `/lovable/*` paths to first-party API routes.
5. Remove Lovable-specific error reporting and replace with a portable observability approach later.
6. Vendor or re-host assets currently referenced through Lovable/CDN asset manifests so the UI does not depend on Lovable hosting.
7. Stop treating Lovable editor sync as a deployment requirement.

## Non-goals

- Do not redesign product email/SMS content as part of withdrawal.
- Do not select the email or SMS provider in this ADR.
- Do not change Supabase schema or queue RPCs solely to remove Lovable.

## Consequences

- Auth hooks, campaign sends, and queue workers must be re-wired to a new transport and auth model.
- Cutover must update any external webhook/scheduler URLs that currently point at `/lovable/email/*`.
- Visual assets and OG images must be inventoried and made independently hostable.
- Documentation and env inventories must stop requiring `LOVABLE_API_KEY` and `LOVABLE_SEND_URL`.

## Risks

- Email delivery outage if transport is removed before a replacement adapter is ready.
- Broken images if CDN/R2 assets are not vendored before Lovable URLs become unavailable.
- Scheduler/webhook callers still posting to old `/lovable/*` paths after cutover.

## Verification

- No `@lovable.dev/*` packages remain in `package.json` / lockfile after migration implementation.
- No `/lovable/` routes remain in the Next.js app.
- No runtime references to `LOVABLE_*` env vars or `window.__lovableEvents`.
- Auth, transactional, and campaign email templates still render identical content through the new adapter.
- Marketing and app screens retain current visual assets without Lovable CDN dependency.
