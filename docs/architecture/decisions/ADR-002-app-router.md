# ADR-002: App Router

## Status

PROPOSED

## Context

The current file router has nested layouts, dynamic routes, metadata, errors, and server handlers. Next.js App Router is production-stable and the maintained model for Server Components.

## Decision

Use App Router. Preserve public URL paths. Keep `app` modules thin and compose domain features.

## Trade-offs

This is not a filename-only conversion: TanStack route APIs, navigation, generated route types, server functions, and head definitions must be remapped. Pages Router would reduce none of the core migration risk and would forgo the desired server/client model.

## Verification

Every inventory row must have one target route, metadata policy, auth policy, and 404/error behavior.
