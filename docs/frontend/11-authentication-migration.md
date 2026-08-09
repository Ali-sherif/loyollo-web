# Authentication Migration

## Current behavior

Supabase browser auth persists in localStorage, auto-refreshes, and drives `AuthProvider`. A global TanStack client middleware adds the access token as Bearer for authenticated server functions. Most protected routes redirect in `useEffect`; MFA and recovery are client flows.

## Target behavior

1. Preserve Supabase Auth, users, redirects, and contracts.
2. Build separate browser and server client factories.
3. Prove cookie/SSR session refresh in a spike before adopting it.
4. Enforce authorization in server services/actions/handlers; client redirects remain UX only.
5. Validate ownership even when using the service-role client.
6. Preserve exact verification, recovery, MFA, onboarding, and sign-out behavior.

| Concern                                     | Backend change required                                |
| ------------------------------------------- | ------------------------------------------------------ |
| App Router pages/forms                      | No                                                     |
| Server verification of current bearer token | No                                                     |
| Cookie-based SSR session                    | UNKNOWN; likely configuration/adapter work, must prove |
| RLS/schema                                  | No and out of scope                                    |
| Auth email webhook URLs                     | Configuration update at cutover, not contract redesign |

## Security gates

CSRF is required if cookie-authenticated mutations are introduced. XSS remains material while tokens are in localStorage. Redirect destinations must be allow-listed. Secrets are referenced by name only.
