# ADR-006: Server and API Boundaries

## Status

DECIDED

## Decision

### API boundary

- Keep the existing backend as the primary business/API backend. Next.js must not become a second backend.
- **Auth (Phase 1):** NestJS is the only IdP. Do **not** use Supabase Auth even as a bridge ([ADR-005](ADR-005-authentication.md) Option C).
- Phase 1 product APIs may still use established contracts until the Nest cutover for those domains; **identity is not one of those exceptions**.
- Phase 2: the primary business API is **NestJS 11.x** over **PostgreSQL 18.x** via **Prisma 7.x** ([ADR-015](ADR-015-backend-stack.md)).
- Next.js should not become a replacement for the existing backend.
- Server Components may communicate with the backend directly when appropriate.
- Client Components may communicate with the backend through the established API layer.
- Use Next.js Route Handlers only when there is a specific BFF/proxy or frontend-specific server requirement.

### Server Functions / Server Actions

- Use Server Functions/Server Actions only where they provide a clear architectural benefit.
- Do not use Server Actions as a replacement for the existing backend API.
- Business logic and persistence should remain owned by the backend unless explicitly decided otherwise.
- Server-side functions should primarily handle frontend-specific server concerns or orchestrate backend calls.

### Mapping guidance

Do not mechanically convert TanStack Server Functions to Server Actions. Use this decision tree (authoritative detail and per-function rows: [server-function-mapping](../../frontend/15-server-function-mapping.md)):

```text
Old Server Function
       │
       ├── Backend business logic?     → Backend API
       ├── UI-specific server operation? → Next.js Server Action
       └── Needs server-side mediation?  → Next.js BFF
```

Prefer:

- backend APIs (NestJS for auth from Phase 1; other domains per [ADR-011](ADR-011-rls-storage-strategy.md) until Phase 2 cutover) for business logic and persistence,
- server-only library functions when the frontend must orchestrate privileged calls without exposing secrets,
- Server Components for render-time reads against the backend when a trustworthy session exists,
- Server Actions only for narrow frontend-specific mutations or backend orchestration with a clear benefit over calling the API layer,
- Route Handlers only for BFF/proxy, public/external webhooks, scheduled workers, or other frontend-specific HTTP contracts,
- direct client API/Supabase calls through the established client layer when intentionally relying on browser session and backend authorization (for example RLS).

The per-function mapping in [15-server-function-mapping.md](../../frontend/15-server-function-mapping.md) is **DECIDED / APPROVED** against this backend-primary model for the frontend migration.

## Security

Service-role and other privileged credentials must remain server-only. Public enrollment and similar privileged workflows need rate limiting, idempotency/concurrency review, and abuse monitoring before parity sign-off. **Rate limiting for public signup/enrollment is DECIDED:** edge/server enforcement with HTTP 429 and frontend graceful handling ([ADR-012](ADR-012-public-enrollment-rate-limiting.md)). Backend authorization remains authoritative ([ADR-005](ADR-005-authentication.md)).

## Verification

No business persistence logic is newly owned by Next.js without an explicit decision. Route Handlers and Server Actions exist only where BFF/frontend-specific justification is recorded. Service-role keys never reach the client.
