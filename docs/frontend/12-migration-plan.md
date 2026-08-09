# Incremental Migration Plan

## Locked product constraints

- Keep current visual styles (no redesign).
- Preserve current email/SMS templates and personalization.
- Withdraw Lovable packages, routes, secrets, and host coupling.
- Hosting and email/SMS providers remain undecided; use adapters and first-party APIs.

## Before coding

Approve hosting, email/SMS provider (or temporary ACCEPTED RISK with adapter stub), runtime/auth/server-boundary ADRs; establish build, typecheck, lint, route smoke tests, visual parity checks, and email HTML diffs.

## Dependency-aware slices

1. Foundation spike: Next 16.3.x, selected runtime, Tailwind/assets parity, root layout, error/not-found, environment validation.
2. Vendor/re-host assets currently tied to Lovable/CDN manifests.
3. Server infrastructure: Supabase factories, secret isolation, auth proof, portable logging.
4. Messaging adapter skeleton that renders existing templates without Lovable SDKs.
5. Static marketing/legal routes with visual parity.
6. Auth and recovery routes, including first-party auth email webhook/preview handlers (not `/lovable/*`).
7. Onboarding.
8. Public join read then rate-limited enrollment handler.
9. Protected shell and dashboard.
10. Customers and loyalty.
11. Branches/maps.
12. Campaigns + queue worker using the messaging adapter; preserve SMS channel content.
13. Analytics and settings/MFA/uploads/account deletion.
14. Remove remaining Lovable packages/env references.
15. SEO, performance, accessibility, visual, and messaging parity regression.

## Coexistence and cutover

Prefer deployment-level coexistence with route ownership recorded in a manifest. Preserve public app URLs. Replace `/lovable/email/*` callers with new first-party API paths as part of cutover. Avoid dual writes. Each slice requires acceptance tests and a route-level rollback. Final cutover requires environment parity, webhook/scheduler switch plan, DNS/redirect validation, monitoring, and rollback owner.

## Retirement

Remove TanStack and Lovable code only after all route/API contracts pass production smoke tests, rollback window expires, and the user explicitly approves deletion.
