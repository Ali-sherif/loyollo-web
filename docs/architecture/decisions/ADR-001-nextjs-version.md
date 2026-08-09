# ADR-001: Next.js and Runtime Version

## Status

PROPOSED

## Context

The repository resolves React/React DOM 19.2.8, TypeScript 5.9.3, and has no pinned Node version. As of 2026-08-10, Next.js 16 is Active LTS and 16.3.0 is the current documented stable release.

## Options

1. Next.js 16.3.x: Active LTS, React 19.2 baseline, current App Router.
2. Next.js 15.x: Maintenance LTS; shorter strategic runway.
3. Canary: unsuitable for this production migration.

## Decision

Target the latest stable 16.3.x patch available when implementation begins. Pin Node 22 or 24 after hosting selection; Next.js 16 requires Node >=20.9.

## Consequences and risks

Cloudflare uses workerd via OpenNext rather than a selectable Node runtime. Dependencies must be validated there. React framework integration is managed by Next.js and should not be independently forced.

## Verification

Run clean install, typecheck, production build, route tests, and target-runtime preview.

## Sources

- https://nextjs.org/support-policy
- https://nextjs.org/blog/next-16-3
- https://nextjs.org/docs/app/getting-started/installation
- https://nextjs.org/docs/app/guides/upgrading/version-16
