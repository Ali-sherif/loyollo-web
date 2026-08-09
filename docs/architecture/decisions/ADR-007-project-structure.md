# ADR-007: Target Project Structure

## Status

PROPOSED

## Decision

Use thin App Router files, feature-owned UI/business logic, shared primitives, and explicit server infrastructure. Prevent feature-to-feature deep imports.

## Target

`src/app`, `src/features`, `src/components/ui`, `src/components/shared`, `src/lib/server`, `src/lib/client`, `src/integrations/supabase`, `src/config`, and `src/types`.

## Consequences

This is a migration boundary, not authorization for a broad refactor. Move code only as its route/domain is migrated.
