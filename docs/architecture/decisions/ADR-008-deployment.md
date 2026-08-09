# ADR-008: Deployment Target

## Status

NEEDS APPROVAL

## Context

Lovable withdrawal is decided ([ADR-009](ADR-009-lovable-withdrawal.md)). The Next.js app must therefore run on a non-Lovable host. Visual style and messaging templates must remain unchanged regardless of host.

## Options

### Vercel

Native Next.js integration, preview deployments, ISR/image/cache platform support, and selectable Node 20/22/24 (24 default as of audit). Clean fit after leaving Lovable/Nitro.

### Cloudflare Workers with OpenNext

Closer to the previous Cloudflare direction, but not Lovable. Requires `@opennextjs/cloudflare`, `nodejs_compat`, workerd validation, adapter preview testing, image strategy, and awareness of Worker bundle/memory/CPU limits. Node.js Middleware is unsupported.

## Decision

No host selected yet. Build a production-like spike on both candidates covering auth, first-party email queue handler, React Email rendering of preserved templates, `jspdf`, streaming, asset hosting, and environment handling. Do not keep Lovable as a hosting fallback.

## Sources

- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://opennext.js.org/cloudflare
