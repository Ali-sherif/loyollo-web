# Spike: Auth Cookie / SSR Session

**Date:** 2026-08-11  
**Status:** **ACCEPTED RISK** — remain **BLOCKED** until PASSED; prove **after** migration start (foundation / server-infra / auth slices). Not APPROVED.  
**Code:** Removed from the repo (`spikes/auth-ssr/` deleted). Findings below stand; recreate an isolated Next 16.3 App Router POC (or prove in-app during auth slices) when clearing this remaining item.  
**Related:** [ADR-005](../decisions/ADR-005-authentication.md), checklist item “Supabase server-session / HTTP-only cookie approach”, D-28

## Goal

Prove that a Next.js App Router app can:

1. Persist a Supabase session in **HTTP-only cookies** via `@supabase/ssr`
2. Refresh/read that session in the Next.js **proxy** (Next.js 16 rename of middleware)
3. Validate the user with `getUser()` inside **Server Components** during SSR
4. Gate a protected route without relying on `localStorage`

This spike is intentionally isolated from the TanStack production app. No business routes or auth providers under `src/` were modified.

## What was built

| Piece (was under `spikes/auth-ssr/`) | Role |
| ----- | ---- |
| Isolated Next app | Next.js **16.3.0**, React **19.2.8**, `@supabase/ssr` |
| `proxy.ts` | Session refresh + `/protected` redirect (Next 16 proxy convention) |
| `lib/supabase/{client,server,middleware}.ts` | Browser / RSC / proxy factories |
| `app/page.tsx` | Public RSC showing SSR session + client auth panel |
| `app/protected/page.tsx` | Authenticated RSC (`getUser()` + defense-in-depth redirect) |
| `app/api/spike/{signup,login,logout,session,bootstrap}` | Cookie-setting Route Handlers + inspect endpoint |
| `scripts/validate.mjs` | Automated pass/fail harness (`npm run validate`) |

**Note:** Next.js 16.3 deprecates `middleware.ts` in favor of `proxy.ts`. The spike used `proxy.ts` and still exercised the same request-edge cookie bridge the migration docs call “middleware.”

## How to re-run

POC code is **not** in the tree. When unblocking D-28, recreate an isolated Next 16.3 App Router app (outside `src/`) with `@supabase/ssr`, `proxy.ts`, protected RSC, and a validate harness, then:

```bash
# after recreating the isolated spike app
cp .env.local.example .env.local
# set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
# and ONE of:
#   SUPABASE_SERVICE_ROLE_KEY
#   SPIKE_TEST_EMAIL + SPIKE_TEST_PASSWORD   (confirmed user)
npm install
npm run build
npx next start -p 3000
npm run validate
```

## Validation evidence (2026-08-11)

Live project Auth settings (`GET /auth/v1/settings`):

- `external.email`: true
- `mailer_autoconfirm`: **false**
- Anonymous sign-in: disabled

Automated harness against `http://127.0.0.1:3000` with live URL + anon key:

| Step | Result |
| ---- | ------ |
| Live Auth settings reachable | PASS |
| Unauthenticated `GET /protected` → `307` to `/?redirectedFrom=%2Fprotected` | PASS |
| Anonymous `GET /api/spike/session` → `user: null` | PASS |
| Establish HTTP-only session (signup/login) | **FAIL / BLOCKED** — signup creates user but no session; login returns `Email not confirmed` |
| Authenticated RSC `getUser()` after hard refresh | NOT RUN (blocked upstream) |
| Sign-out clears cookies | NOT RUN |

Disposable-inbox attempt (mail.tm) also received **no** confirmation mail — consistent with custom Lovable auth-email delivery rather than direct SMTP to the recipient inbox.

### Why blocked

The spike requires a **real validated session** (plan rule: do not approve on mocks). With `mailer_autoconfirm=false`, obtaining tokens needs either:

1. `SUPABASE_SERVICE_ROLE_KEY` in the spike `.env.local` (uses a bootstrap Route Handler to create a confirmed user, then cookie login), or
2. `SPIKE_TEST_EMAIL` / `SPIKE_TEST_PASSWORD` for an already-confirmed user.

Neither was available in the repo env (only URL + publishable/anon key).

## Edge cases observed / anticipated

1. **Email confirmation vs cookie proof** — Cookie/SSR plumbing cannot be fully closed until a confirmed session exists; proxy/RSC unauthenticated behavior can still be proven first.
2. **Next 16 `proxy.ts`** — Migration docs saying “middleware” should mean the proxy file convention on Next 16.3.x; Node runtime default removes prior Edge friction with `@supabase/ssr`.
3. **Cookie chunking** — Large JWTs may split across `sb-*-auth-token.0`, `.1`, …; always use `getAll` / `setAll`, never single-name gets.
4. **RSC cookie mutation** — `cookies().set` in Server Components can throw; refresh belongs in proxy / Route Handlers (spike server factory already swallows read-only set errors).
5. **`getUser()` vs `getSession()`** — Server paths must call `getUser()` so Auth validates the JWT; `getSession()` alone is insufficient for gates.
6. **HttpOnly / Secure / SameSite** — Production must set Secure on HTTPS; local HTTP may omit Secure. CSRF protection is required before cookie-authenticated mutations in the real app.
7. **Dual session models** — Today’s TanStack app uses `localStorage`; Next cookie sessions must not be assumed interchangeable. Plan a single auth model for the Next go-live surface (no dual production frontends — [cutover.md](../cutover.md)).
8. **Matcher scope** — Proxy matcher must include HTML navigations and auth routes; static assets should stay excluded.
9. **Monorepo lockfiles** — Nested `package-lock.json` under `spikes/` confused Turbopack root inference; spike `next.config.ts` sets `turbopack.root` to the spike directory.
10. **Auth email delivery** — Confirmation mail did not arrive at a disposable inbox; custom Lovable email hooks mean automated confirm-link harvesting is unreliable without service-role bootstrap.

## Architectural recommendations (for future root Next app)

1. Adopt `@supabase/ssr` with separate **browser / server / proxy** factories (as in this spike).
2. Put session refresh + coarse route redirects in **`proxy.ts`**; re-check `getUser()` in protected layouts/pages.
3. Mark user-specific routes `force-dynamic` / `no-store`; never cache authenticated HTML as static.
4. Keep backend (Supabase Auth + RLS) as authorization source of truth; Next gates are not permissions.
5. Provision a **confirmed spike/test user** or allow CI a scoped service-role secret for auth smoke only.
6. Do not remove TanStack `localStorage` auth until cookie SSR is proven green and an auth slice cutover plan exists.
7. Treat MFA, recovery, verify deep links, and cross-tab sync as follow-ons (ADR-005 verification list) after this gate clears.

## Gate impact

| Item | Outcome |
| ---- | ------- |
| Cookie/SSR session spike | **ACCEPTED RISK** — remains **BLOCKED** / not APPROVED until proven after migration start |
| Overall migration Go/No-Go | May be **GO** while this item remains open (must stay documented until PASSED) |
| Create root Next.js application | Allowed once other Critical checklist items are DECIDED or ACCEPTED RISK |

### Unblock checklist (remains open)

1. Recreate the isolated Next 16.3 auth cookie/SSR POC **or** prove the same contract inside the Next foundation/auth slices (do not treat mocks as proof).
2. Add `SUPABASE_SERVICE_ROLE_KEY` **or** confirmed `SPIKE_TEST_*` credentials to local env (do not commit).
3. `npm run build && npx next start -p 3000 && npm run validate` (or equivalent in-app auth smoke).
4. On `ok: true`, update this doc Status → **PASSED**, set D-28 → **DECIDED/APPROVED**, and clear the “remains BLOCKED” notes in the checklist / decision matrix / architecture README.
