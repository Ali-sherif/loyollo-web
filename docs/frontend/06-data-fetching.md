# Data Fetching

Aligned with [ADR-004](../architecture/decisions/ADR-004-data-and-state.md) and [ADR-006](../architecture/decisions/ADR-006-server-boundaries.md).

## Current

Most protected routes fetch directly from Supabase in `useEffect`. React Query is globally provided but materially used only by the public join route. Six server functions cover privileged/public workflows.

## Target decision rules

Use a hybrid strategy. Do not put every API request into TanStack Query.

- Prefer server-side fetching in Server Components for initial page data where appropriate (Server Component → backend or `lib/server` orchestration).
- Client Components communicate with the backend through the established API / browser client layer.
- Use TanStack Query for client-side server state that needs caching, refetching, mutations, polling, optimistic updates, or interactive synchronization.
- Server Actions only when they provide a clear architectural benefit; they must not replace the backend API.
- Route Handlers only for BFF/proxy or frontend-specific server requirements (public webhooks, schedulers, etc.).
- Filters/search/page: URL search params.

## Cache/invalidation

Protected data is no-store by default. Mutations explicitly invalidate affected route/query state. Public program metadata may receive a short TTL or ISR only after freshness and cross-tenant isolation tests. No implicit `fetch` caching assumptions are permitted for Supabase SDK calls.

See [server-function mapping](15-server-function-mapping.md).
