# ADR-011: RLS and Storage Policy Migration Strategy

## Status

DECIDED

## Context

The pre-implementation checklist required RLS and storage policies to be independently verified before Next.js migration coding. During the TanStack → Next.js frontend migration, client data and storage access continue to rely on the existing Supabase (Lovable-era) database contracts. A separate custom Backend and Database program will later own all data and storage access.

## Decision

### Phase 1 — Frontend migration (current scope)

- **Retain and enforce** the existing Lovable / Supabase RLS and Storage policies **as-is**.
- Do **not** redesign, weaken, or bypass those policies as part of the Next.js frontend migration.
- Client requests that talk to Supabase (browser session or established client layer) remain secured by those existing policies.
- Independent re-audit/rewrite of RLS and storage policies is **out of scope** for this migration gate; freezing the current contract is the approved approach for Phase 1.
- This satisfies the checklist item “RLS and storage policies independently verified” for **migration Go/No-Go purposes** as **DECIDED / APPROVED** under the transitional strategy above (retain existing policies; no schema/RLS change program in this migration).

### Phase 2 — Custom Backend / Database (future, out of frontend migration)

- Once the custom Backend and Database are deployed, **all** data and storage access transitions to **custom Backend APIs only**.
- Direct client database / storage access is retired for application traffic; the frontend calls Backend APIs instead.
- RLS/storage on the legacy Supabase surface may then be tightened, replaced, or decommissioned under a **separate** backend program — not as a Next.js migration slice.

## Consequences

- Migration risk stays bounded: no parallel authz model in Next.js; backend/Supabase policies remain authoritative in Phase 1 ([ADR-005](ADR-005-authentication.md), [ADR-006](ADR-006-server-boundaries.md)).
- Security defects discovered in existing policies still require a separate approval to change schema/RLS (see deferred decisions).
- Phase 2 cutover of data access is explicitly **not** part of clearing this frontend gate.

## Verification (Phase 1)

- No intentional client paths that use service-role or other privileged keys in the browser.
- Migrated surfaces keep using the established Supabase client contracts under existing RLS/storage rules.
- Any new BFF/Route Handler that needs elevated access must remain server-only and must not substitute for backend authorization.
