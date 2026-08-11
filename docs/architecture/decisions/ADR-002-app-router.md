# ADR-002: App Router

## Status

DECIDED

## Context

The current file router has nested layouts, dynamic routes, metadata, errors, and server handlers. Next.js App Router is production-stable and the maintained model for Server Components. The application has not launched, so URL redesign remains feasible before production.

## Decision

### Routing

- Use Next.js App Router.
- Review the existing route inventory instead of preserving every current URL by default.
- Preserve existing URL paths where they represent an intentional product contract.
- Allow URL restructuring before production if it improves consistency, SEO, or maintainability.
- Once the new route map is approved, treat it as the production URL contract.

### Generated route types

- Use Next.js/App Router native route typing capabilities where applicable.
- Do not introduce a custom route-type generation system unless a concrete requirement emerges.
- Keep route and parameter types close to the route definitions.

### Error / not-found / loading

- Use App Router native error boundaries and loading states.
- Use `not-found.tsx` for resources that do not exist.
- Use `error.tsx` for unexpected runtime or data-fetching failures.
- Use `loading.tsx` for route-level loading UI where appropriate.
- Define consistent behavior for authentication errors, authorization errors, API failures, and missing resources.

### Metadata / SEO

- Use the Next.js Metadata API as the standard metadata mechanism.
- Define static metadata for stable pages.
- Use `generateMetadata` for dynamic pages (for example event/details pages).
- Support SEO-relevant metadata such as title, description, Open Graph, canonical URLs, and robots directives where required.
- Treat public-facing pages as the primary SEO target; authenticated application pages require only appropriate basic metadata.

Keep `app` modules thin and compose domain features ([ADR-007](ADR-007-project-structure.md)).

## Trade-offs

This is not a filename-only conversion: TanStack route APIs, navigation, generated route types, server functions, and head definitions must be remapped. Pages Router would reduce none of the core migration risk and would forgo the desired server/client model. Pre-launch route redesigns must be captured in an approved route map before cutover; after approval, URL changes require an explicit contract update.

## Verification

Every inventory row maps to one approved target route in [02-route-migration.md](../../frontend/02-route-migration.md), with metadata policy, auth policy, and 404/error/loading behavior. That approved route map is the production URL contract.
