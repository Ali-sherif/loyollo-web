# ADR-008: Deployment Target

## Status

NEEDS APPROVAL

## Options

### Vercel

Native Next.js integration, preview deployments, ISR/image/cache platform support, and selectable Node 20/22/24 (24 default as of audit). Higher platform coupling and a change from current Lovable/Cloudflare execution.

### Cloudflare Workers with OpenNext

Closer to the current Cloudflare direction. Requires `@opennextjs/cloudflare`, `nodejs_compat`, workerd validation, adapter preview testing, image strategy, and awareness of Worker bundle/memory/CPU limits. Node.js Middleware is unsupported.

## Decision

No target selected. Build a production-like spike for auth, email queue handler, `jspdf`/React Email server dependencies, streaming, and environment handling on both candidates.

## Sources

- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://opennext.js.org/cloudflare
