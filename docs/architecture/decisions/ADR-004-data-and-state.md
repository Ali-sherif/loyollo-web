# ADR-004: Data Fetching and State

## Status

PROPOSED

## Decision

Classify state before choosing tools. Use Server Components for initial server-readable data, direct Supabase browser calls temporarily where the existing token/RLS model requires them, Server Actions for narrow first-party mutations, Route Handlers for explicit/public/external APIs, React Query for client server-state requiring polling/refetch/optimism, URL state for filters, and local state for UI.

## Consequences

Do not introduce Redux/Zustand. Existing imperative effects should be migrated route-by-route, not globally rewritten.

## Verification

Parity checks cover loading, error, empty, retry, pagination, and mutation invalidation behavior.
