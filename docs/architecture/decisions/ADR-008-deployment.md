# ADR-008: Deployment Target

## Status

DECIDED

## Context

Lovable withdrawal is decided ([ADR-009](ADR-009-lovable-withdrawal.md)). The Next.js app must therefore run on a non-Lovable host. Visual style and messaging templates must remain unchanged regardless of host ([ADR-010](ADR-010-style-and-template-parity.md)). Runtime versions are pinned in [ADR-001](ADR-001-nextjs-version.md).

## Options

### Vercel

Native Next.js integration, preview deployments, ISR/image/cache platform support, and selectable Node 20/22/24 (24 LTS is the project target). Clean fit after leaving Lovable/Nitro.

### Cloudflare Workers with OpenNext

Closer to the previous Cloudflare direction, but not Lovable. Requires `@opennextjs/cloudflare`, `nodejs_compat`, workerd validation, adapter preview testing, image strategy, and awareness of Worker bundle/memory/CPU limits. Node.js Middleware is unsupported. The app would target Cloudflare `workerd` through OpenNext; Node.js compatibility is validated separately from the Node 24 LTS pin used for Node-based deployments.

## Decision

**Initial hosting target: Vercel**, running on **Node.js 24 LTS**.

Cloudflare Workers via OpenNext remains a secondary/future option. If pursued, target `workerd` through OpenNext and validate Node.js compatibility separately; do not treat the Node 24 LTS pin as sufficient proof for Workers.

Do not keep Lovable as a hosting fallback. Before production cutover, run a production-like spike on Vercel covering auth, first-party email queue handler, React Email rendering of preserved templates, `jspdf`, streaming, asset hosting, and environment handling. Exercise an OpenNext/`workerd` spike only if Cloudflare is actively evaluated for a later phase.

## Sources

- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://opennext.js.org/cloudflare
