# Incremental Migration Plan

## Before coding

Approve hosting/runtime/auth/server-boundary ADRs; establish build, typecheck, lint, route smoke tests, and critical E2E characterization.

## Dependency-aware slices

1. Foundation spike: Next 16.3.x, selected runtime, Tailwind/assets, root layout, error/not-found, environment validation.
2. Server infrastructure: Supabase factories, secret isolation, auth proof, observability.
3. Static marketing/legal routes.
4. Auth and recovery routes, including email callback behavior.
5. Onboarding.
6. Public join read then rate-limited enrollment handler.
7. Protected shell and dashboard.
8. Customers and loyalty.
9. Branches/maps.
10. Campaigns and email queue endpoints.
11. Analytics and settings/MFA/uploads/account deletion.
12. SEO, performance, accessibility, and full parity regression.

## Coexistence and cutover

Prefer deployment-level coexistence with route ownership recorded in a manifest. Preserve URLs and avoid dual writes. Each slice requires acceptance tests and a route-level rollback to the TanStack deployment. Final cutover requires environment parity, webhook/scheduler switch plan, DNS/redirect validation, monitoring, and rollback owner.

## Retirement

Remove TanStack code only after all route/API contracts pass production smoke tests, rollback window expires, and the user explicitly approves deletion.
