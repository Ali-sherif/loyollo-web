# ADR-017: CSRF for cookie-authenticated mutations

## Status

DECIDED (2026-08-18)

## Context

[ADR-005](ADR-005-authentication.md) Option C puts Nest-issued JWTs in **HTTP-only cookies on the Next.js host**. Next forwards the token to Nest on BFF/RSC calls. Cookie-authenticated mutations are therefore CSRF-sensitive.

Prior docs said CSRF is **required** and never picked a mechanism. Three options were left open:

1. Rely on Next.js built-in Server Action CSRF only
2. Double-Submit cookie + header
3. `SameSite=Strict` as the CSRF control

That is a false choice for this topology. Session cookies live on Next, not Nest. [ADR-006](ADR-006-server-boundaries.md) prefers Backend API / BFF Route Handlers; Server Actions are rare ([15-server-function-mapping.md](../../frontend/15-server-function-mapping.md)). Next.js Origin checks apply to Server Actions only — they do **not** cover `app/api/*/route.ts`. Nest currently has no browser session cookie.

D-28 (cookie/SSR proof) remains **BLOCKED** until Nest JWT cookies work in `proxy.ts` + RSC. This ADR locks the CSRF mechanism so that proof tests the right control. It does not unblock D-28 and does not authorize application code.

## Options

| Option | Approach | Outcome |
|--------|----------|---------|
| A | Server Action Origin check only | Rejected — Route Handlers / cookie BFF are unprotected |
| B | Double-Submit as the default | Rejected as primary — extra token plumbing for a same-origin Next cookie |
| C | `SameSite=Strict` as the CSRF control | Rejected — drops cookies on email/SMS/WhatsApp top-level GET (verify, reset, join QR) and future payment-return navigations |
| **D** | **Origin/Host allow-list on cookie-authenticated mutations + `SameSite=Lax`** | **Chosen** |

## Decision

**Primary control: Origin/Host allow-list on every cookie-authenticated mutating request, plus `SameSite=Lax`.**

| Control | Role |
|---------|------|
| Next.js Server Action Origin check | Use as-is. Do not reimplement. Set `serverActions.allowedOrigins` only if preview/proxy hosts need it. |
| Explicit Origin/Host check on cookie-authenticated Route Handlers / BFF | Required. Mutating methods must present `Origin` (fallback `Referer`) matching the Next host. Reject otherwise (403). |
| `SameSite=Lax` | Defense in depth. Blocks classic cross-site POST. Keeps top-level GET from email/SMS/WhatsApp. |
| Cookie flags | `HttpOnly`; `Secure` in production (HTTPS); local HTTP may omit `Secure`; `Path=/`; **Next.js host only**. |

**Nest:** must **not** accept browser session cookies as mutation auth. Browser → Nest is **Bearer** from the Next server (BFF / RSC). If a later same-site deploy (`app.` + `api.` under one registrable domain) starts sending cookies to Nest, Nest must apply the same Origin/Host check — do not discover that at go-live.

**Login CSRF:** the Next auth BFF that `Set-Cookie`s (sign-in / OTP verify) uses the same Origin/Host check.

**Out of this ADR:** public unauthenticated enroll/OTP abuse ([ADR-012](ADR-012-public-enrollment-rate-limiting.md)). Those paths are not cookie-authenticated.

**Revisit Double-Submit** only if `SameSite=None` becomes required (cross-site cookie to Nest, WebView, embedded checkout).

## Consequences

- Cookie-authenticated Next mutations (Server Actions and cookie BFF) share one CSRF rule.
- Nest stays Bearer-from-Next; it is not a cookie CSRF target unless cookies later reach it.
- D-28 must prove CSRF rejection, not only cookie round-trip.

## Verification

When D-28 runs (not a separate spike):

1. Foreign-origin `POST`/`PUT`/`PATCH`/`DELETE` that includes the session cookie is **rejected**.
2. Same-origin cookie-authenticated mutation is **accepted** (still subject to Nest authz).
3. Session cookie attributes match this ADR (`HttpOnly`, `SameSite=Lax`, `Secure` in production).
4. Nest mutation auth is Bearer from Next, not a browser cookie.

Tracked as **D-37**. Cookie/SSR plumbing remains **D-28**.
