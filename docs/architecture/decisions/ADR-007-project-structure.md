# ADR-007: Target Project Structure

## Status

PROPOSED

## Decision

- Keep `app/` focused on routing, layouts, loading/error states, metadata, and page composition.
- Keep business/domain logic inside domain-oriented feature modules.
- Avoid turning route files into large components containing business logic.
- Keep framework-specific concerns at the application boundary and reusable business logic inside feature/domain modules.
- Use shared UI primitives and explicit server infrastructure modules.
- Messaging templates and server-side messaging infrastructure live under `src/lib/server/messaging/`. Business features may invoke messaging through provider-agnostic contracts and must not depend directly on delivery providers.
- Prevent feature-to-feature deep imports.

## Target

`src/app`, `src/features`, `src/components/ui`, `src/components/shared`, `src/lib/server`, `src/lib/server/messaging`, `src/lib/client`, `src/integrations/supabase`, `src/config`, and `src/types`.

## Consequences

This is a migration boundary, not authorization for a broad refactor. Move code only as its route/domain is migrated. Thin route files compose feature modules; features own UI and domain behavior; `lib/server` holds privileged orchestration that must not leak to the client. Messaging delivery providers are isolated behind `lib/server/messaging` contracts.

## Verification

Migrated routes contain composition only. Domain logic lives under `features/`. Server-only modules are not imported from Client Components. Features call messaging only through provider-agnostic contracts under `src/lib/server/messaging/`.
