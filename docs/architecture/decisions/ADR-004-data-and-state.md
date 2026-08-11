# ADR-004: Data Fetching and State

## Status

DECIDED

## Decision

### Data fetching

Use a hybrid data-fetching strategy:

- Prefer server-side data fetching in Server Components for initial page data where appropriate.
- Use TanStack Query for client-side server state that requires caching, refetching, mutations, polling, optimistic updates, or interactive synchronization.
- Do not automatically put every API request into TanStack Query.
- Server Components may communicate with the backend directly when appropriate ([ADR-006](ADR-006-server-boundaries.md)).
- Client Components may communicate with the backend through the established API layer.

### State management

- Treat backend/API data as server state and manage it primarily with TanStack Query.
- Use React local state for component-specific UI state.
- Use URL state for filters and shareable UI parameters where appropriate.
- Use global state management only for genuinely global client-side state.
- Keep Redux, if retained, focused on client-side application state rather than duplicating backend data.
- Do not duplicate the same server state between Redux (or another global store) and TanStack Query.
- Avoid introducing global state when local state is sufficient.
- Do not introduce a new global store by default; prefer local state and TanStack Query.

Existing imperative effects should be migrated route-by-route, not globally rewritten.

## Consequences

Server state and client UI state remain separated. Next.js is not a second source of truth for backend entities. Any retained global client store must not mirror API caches already owned by TanStack Query.

## Verification

Parity checks cover loading, error, empty, retry, pagination, and mutation invalidation behavior. Confirm no duplicated server-state ownership between TanStack Query and a global client store.
