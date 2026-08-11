# Authentication Migration

Aligned with [ADR-005](../architecture/decisions/ADR-005-authentication.md).

## Current behavior

Supabase browser auth persists in localStorage, auto-refreshes, and drives `AuthProvider`. A global TanStack client middleware adds the access token as Bearer for authenticated server functions. Most protected routes redirect in `useEffect`; MFA and recovery are client flows.

## Target behavior

1. Keep authentication and authorization ownership in the backend (Supabase Auth + RLS/policies remain the final source of truth for permissions).
2. Do not duplicate business authorization logic in the frontend.
3. Use secure HTTP-only cookies/session mechanisms where applicable; prove cookie/SSR session refresh in a spike before adopting it broadly.
4. Next.js is responsible for route protection, session-aware rendering, and redirects.
5. Client checks may remain for UX only; they are not authorization.
6. Build separate browser and server client factories.
7. Validate ownership even when using the service-role client on the server.
8. Preserve exact verification, recovery, MFA, onboarding, and sign-out behavior.

| Concern                                     | Backend change required                                |
| ------------------------------------------- | ------------------------------------------------------ |
| App Router pages/forms                      | No                                                     |
| Server verification of current session      | No                                                     |
| Cookie-based SSR session                    | UNKNOWN; likely configuration/adapter work, must prove |
| RLS/schema                                  | No for Phase 1 — retain existing policies ([ADR-011](../architecture/decisions/ADR-011-rls-storage-strategy.md)); Phase 2 Backend APIs only |
| Auth email webhook URLs                     | Configuration update at cutover, not contract redesign |

## Security gates

CSRF is required if cookie-authenticated mutations are introduced. XSS remains material while tokens are in localStorage. Redirect destinations must be allow-listed. Secrets are referenced by name only. Frontend route gates must never substitute for backend permission checks.
