# Data Fetching

## Current

Most protected routes fetch directly from Supabase in `useEffect`. React Query is globally provided but materially used only by the public join route. Six server functions cover privileged/public workflows.

## Target decision rules

- Server-readable initial data: Server Component → `lib/server` Supabase adapter.
- Browser RLS data during auth transition: Client Component → browser Supabase client.
- First-party authenticated form mutation: Server Action when request/session and progressive UI fit.
- Public/external/scheduled/long-running contract: Route Handler.
- Polling, optimism, refetch, infinite lists: React Query in a Client Component.
- Filters/search/page: URL search params.

## Cache/invalidation

Protected data is no-store by default. Mutations explicitly invalidate affected route/query state. Public program metadata may receive a short TTL only after freshness and cross-tenant isolation tests. No implicit `fetch` caching assumptions are permitted for Supabase SDK calls.

See [server-function mapping](15-server-function-mapping.md).
