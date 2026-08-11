# ADR-003: Rendering and Caching

## Status

PROPOSED

## Decision

### Server vs Client Components

- Use Server Components by default.
- Use Client Components only when client-side capabilities are required.
- Introduce client boundaries for interactivity, browser APIs, local state, effects, or client-only libraries.
- Avoid marking entire routes or large component trees as `"use client"` unnecessarily.
- Keep Client Components as small and isolated as practical.

### Rendering strategy

Choose the rendering strategy at the route/component level rather than adopting one strategy for the entire application:

- Prefer server rendering for public, data-driven pages where it provides SEO or performance benefits.
- Use static rendering where content is sufficiently stable (for example marketing/legal).
- Use ISR where cached content needs periodic regeneration.
- Use Client Components for highly interactive parts of the application.
- Avoid defaulting to full client-side rendering for entire pages.

Route guidance during migration:

- Marketing/legal: static where content is build-known.
- Public join/program metadata: server-rendered; short bounded cache or ISR only after freshness is agreed.
- Auth and protected dashboard: dynamic/no-store unless user isolation is proven.
- Browser libraries and interactive forms: Client Component islands.

Do not enable Cache Components/PPR globally during parity migration.

## Risks

The current localStorage token model limits authenticated Server Component reads until a trustworthy request session exists ([ADR-005](ADR-005-authentication.md)). Accidental caching of user data is a Critical risk.

## Verification

Inspect build output and test two concurrent users for cache/session leakage. Confirm public routes benefit from SSR/static/ISR where intended, and interactive surfaces remain isolated Client islands.
