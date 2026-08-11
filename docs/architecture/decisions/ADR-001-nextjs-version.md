# ADR-001: Next.js and Runtime Version

## Status

DECIDED

## Context

The repository resolves React/React DOM 19.2.x and TypeScript 5.x today, with no pinned Node version. As of 2026-08-11, Next.js 16 is Active LTS and 16.3.x is the current documented stable line. Initial hosting is Vercel ([ADR-008](ADR-008-deployment.md)), which supports selectable Node 20/22/24.

## Options

1. Next.js 16.3.x: Active LTS, React 19.2 baseline, current App Router.
2. Next.js 15.x: Maintenance LTS; shorter strategic runway.
3. Canary: unsuitable for this production migration.

## Decision

Pin the following lines for the Next.js migration:

| Package / runtime | Target line |
| ----------------- | ----------- |
| Next.js           | 16.3.x      |
| React             | 19.2.x      |
| React DOM         | 19.2.x      |
| TypeScript        | 6.0.x       |
| Node.js           | 24 LTS      |

Use the latest stable patch within each line when implementation begins. Next.js 16 requires Node >=20.9; Node 24 LTS is the target for Node-based deployments (including Vercel).

For Cloudflare Workers deployments (if pursued later), the application targets the Cloudflare `workerd` runtime through OpenNext. Node.js compatibility on that path is validated separately and is not assumed from the Node 24 LTS pin.

## Consequences and risks

- React framework integration is managed by Next.js and should not be independently forced outside the 19.2.x line Next expects.
- TypeScript 6.0.x is ahead of the current repo pin and must be validated with Next.js 16.3.x tooling during the spike.
- Cloudflare/`workerd` remains a secondary path; OpenNext + `nodejs_compat` validation is required before any Workers cutover.

## Verification

Run clean install, typecheck, production build, route tests, and target-runtime preview (Vercel Node 24; separately OpenNext/`workerd` if Cloudflare is exercised).

## Sources

- https://nextjs.org/support-policy
- https://nextjs.org/blog/next-16-3
- https://nextjs.org/docs/app/getting-started/installation
- https://nextjs.org/docs/app/guides/upgrading/version-16
