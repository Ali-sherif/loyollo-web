# Incremental Migration Plan

## Locked product constraints

- Keep current visual styles (no redesign).
- Preserve current email/SMS templates and personalization under `src/lib/server/messaging/`.
- Features invoke messaging through provider-agnostic contracts only.
- Withdraw Lovable packages, routes, secrets, and host coupling.
- Initial hosting is Vercel on Node 24 LTS; email/SMS providers remain undecided behind the messaging adapter.
- Target lines: Next.js 16.3.x, React/React DOM 19.2.x, TypeScript 6.0.x.
- Existing backend remains the primary API; Next.js is not a backend replacement.

## Before coding

1. Approve proposed ADRs 002–007 (or record ACCEPTED RISK).
2. Approve the production route map (pre-launch restructuring allowed until then).
3. Approve email/SMS provider or temporary ACCEPTED RISK with adapter stub in `src/lib/server/messaging/`.
4. Select canonical package manager.
5. Prove cookie/SSR session spike for auth.
6. Establish build, typecheck, lint, route smoke tests, visual parity checks, and email HTML diffs.

## Dependency-aware slices

1. Foundation spike: Next 16.3.x, TypeScript 6.0.x, Node 24 / Vercel, Tailwind/assets parity, root layout, `error`/`not-found`/`loading`, Metadata API, environment validation.
2. Vendor/re-host assets currently tied to Lovable/CDN manifests.
3. Server infrastructure: backend/Supabase factories, secret isolation, auth proof (route protection + session-aware rendering), portable logging.
4. Messaging skeleton under `src/lib/server/messaging/` that renders existing templates without Lovable SDKs or direct provider coupling.
5. Static marketing/legal routes with visual and SEO metadata parity.
6. Auth and recovery routes, including first-party auth email webhook/preview BFF handlers (not `/lovable/*`).
7. Onboarding.
8. Public join read (RSC) then enrollment via backend or justified BFF handler + rate limits.
9. Protected shell and dashboard (RSC where session permits; TanStack Query for interactive server state).
10. Customers and loyalty.
11. Branches/maps (client islands for maps).
12. Campaigns + queue worker via messaging contracts; preserve SMS channel content.
13. Analytics and settings/MFA/uploads/account deletion.
14. Remove remaining Lovable packages/env references.
15. SEO, performance, accessibility, visual, and messaging parity regression.

## Coexistence and cutover

Prefer deployment-level coexistence with route ownership recorded against the **approved** route map. Replace `/lovable/email/*` callers with new first-party API paths as part of cutover. Avoid dual writes. Each slice requires acceptance tests and a route-level rollback. Final cutover requires environment parity, webhook/scheduler switch plan, DNS/redirect validation, monitoring, and rollback owner.

## Retirement

Remove TanStack and Lovable code only after all route/API contracts pass production smoke tests, rollback window expires, and the user explicitly approves deletion.
