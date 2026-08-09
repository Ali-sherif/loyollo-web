# ADR-006: Server and API Boundaries

## Status

PROPOSED

## Decision

Do not mechanically convert TanStack Server Functions to Server Actions. Use:

- server-only library functions for privileged reusable logic,
- Server Components for render-time reads,
- Server Actions for first-party authenticated UI mutations,
- Route Handlers for public, external, scheduled, long-running, or explicit HTTP contracts,
- direct client Supabase calls only when intentionally relying on RLS and browser session.
  The authoritative mapping is [server-function-mapping](../../frontend/15-server-function-mapping.md).

## Security

Service-role access must remain server-only. Public enrollment needs rate limiting, idempotency/concurrency review, and abuse monitoring before parity sign-off.
