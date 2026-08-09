# ADR-003: Rendering and Caching

## Status

PROPOSED

## Decision

Use Server Components by default, with small Client Component islands. Choose rendering per route:

- Marketing/legal: static where content is build-known.
- Public join metadata: server-rendered; short bounded cache only after freshness is agreed.
- Auth and protected dashboard: dynamic/no-store unless user isolation is proven.
- Browser libraries and interactive forms: Client Components.
  Do not enable Cache Components/PPR globally during parity migration.

## Risks

The localStorage token model limits authenticated Server Component reads. Accidental caching of user data is a Critical risk.

## Verification

Inspect build output and test two concurrent users for cache/session leakage.
