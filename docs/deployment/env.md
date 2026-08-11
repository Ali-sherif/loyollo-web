# Environment variable inventory

**Audit date:** 2026-08-11  
**Scope:** Names and metadata only. **Never commit or paste secret values into this file, tickets, or chat.**  
**Hosting target:** Vercel + Node.js 24 LTS ([ADR-008](../architecture/decisions/ADR-008-deployment.md)).

This inventory is the canonical list for deployment configuration. Source of truth for *usage* is the codebase; this document classifies what the code actually references (plus Next naming expected when the auth SSR spike is recreated).

## How to use

1. Copy [`.env.example`](../../.env.example) → `.env` (local TanStack app). Never commit `.env`.
2. In Vercel: Project → Settings → Environment Variables. Set **Development**, **Preview**, and **Production** as indicated below.
3. Prefer the same Supabase project URL/keys across Preview and Production only when intentional; use separate projects if Preview must not touch production data.

## Security rules

| Rule | Detail |
| --- | --- |
| Server-only secrets | `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, spike passwords — never prefix with `VITE_` or `NEXT_PUBLIC_` |
| Client-safe | `VITE_*` / `NEXT_PUBLIC_*` and publishable/anon keys are embeddable in the browser bundle by design |
| Do not rename | This audit documents current names; do not rename variables without an explicit migration |
| Tracked secrets | Root `.env` has historically been **git-tracked**. Remove it from the index (`git rm --cached .env`) after confirming local/Vercel copies exist, then rotate any keys that were ever committed |

---

## A. Current production app (TanStack Start / Vite)

Runtime today: Vite + TanStack Start (`npm run dev` / `npm run build`). Client reads `import.meta.env.VITE_*`; SSR middleware and some server paths read `process.env.SUPABASE_*`.

| Variable | Required | Scope | Environments | Used In | Purpose | Secret |
| --- | --- | --- | --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Client (+ build) | All | `src/integrations/supabase/client.ts`; Lovable email routes | Supabase API URL (browser / `import.meta.env`) | No |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Client (+ build) | All | `src/integrations/supabase/client.ts` | Supabase anon/publishable key (browser) | No (public by design) |
| `SUPABASE_URL` | Yes | Server | All | `client.ts` SSR fallback; `auth-middleware.ts`; `client.server.ts` | Supabase API URL for Node/SSR | No |
| `SUPABASE_PUBLISHABLE_KEY` | Yes | Server | All | `client.ts` SSR fallback; `auth-middleware.ts` | Anon/publishable key for SSR auth client | No (public by design) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | Server | All* | `client.server.ts`; Lovable email webhook/queue | Privileged Supabase client (bypasses RLS) | Yes |
| `LOVABLE_API_KEY` | Yes† | Server | All† | `src/routes/lovable/email/auth/{preview,webhook}.ts`; `queue/process.ts` | Authorize Lovable email HTTP handlers | Yes |
| `LOVABLE_SEND_URL` | Yes† | Server | All† | `src/routes/lovable/email/queue/process.ts` | Lovable email send endpoint | Yes (sensitive config) |
| `SUPABASE_PROJECT_ID` | No | — | — | Present in local `.env` only | Project id mirror; **not referenced in app code** | No |
| `VITE_SUPABASE_PROJECT_ID` | No | — | — | Present in local `.env` only | Vite-prefixed project id; **not referenced in app code** | No |

\* Required for any code path that constructs the service-role client or runs Lovable email webhook/queue. Without it, admin server functions and `/lovable/email/*` fail.  
† Required only while Lovable email routes remain. Per [ADR-009](../architecture/decisions/ADR-009-lovable-withdrawal.md), these must be withdrawn; do not treat them as long-term Vercel requirements for the Next.js app.

### Client vs server pairing (current app)

| Browser (`VITE_*`) | Server (`process.env`) | Same value? |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `SUPABASE_URL` | Yes — set both to the project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `SUPABASE_PUBLISHABLE_KEY` | Yes — set both to the anon/publishable key |

`auth-middleware.ts` and `client.server.ts` do **not** read `VITE_*`; SSR will break if only the Vite-prefixed names are set.

---

## B. Auth SSR spike / future Next.js (naming)

The isolated `spikes/auth-ssr/` POC was **removed** from the repo. When D-28 is re-run, expect these Next-oriented names (see [auth-ssr-spike.md](../architecture/spikes/auth-ssr-spike.md)).

| Variable | Required | Scope | Environments | Used In | Purpose | Secret |
| --- | --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client | Spike local / Preview if deployed | Next Supabase client factories | Supabase URL (Next public) | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client | Spike local / Preview if deployed | Next Supabase client factories | Maps from current `VITE_SUPABASE_PUBLISHABLE_KEY` / anon key | No (public by design) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional‡ | Server | Spike local | Bootstrap + validate harness | Create confirmed users when `mailer_autoconfirm=false` | Yes |
| `SPIKE_TEST_EMAIL` | Optional‡ | Server (script) | Spike local | Validate harness | Confirmed test user email | No |
| `SPIKE_TEST_PASSWORD` | Optional‡ | Server (script) | Spike local | Validate harness | Confirmed test user password | Yes |

‡ Validation needs **either** service-role bootstrap **or** confirmed `SPIKE_TEST_*` credentials (see [auth-ssr-spike.md](../architecture/spikes/auth-ssr-spike.md)).

### Name map (current app → Next spike / future Next app)

| Current (Vite / TanStack) | Next.js convention | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` | Public |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same key; different name in spike |
| `SUPABASE_URL` | Keep server-only or derive from public URL | Avoid duplicating secrets |
| `SUPABASE_PUBLISHABLE_KEY` | Prefer `NEXT_PUBLIC_SUPABASE_ANON_KEY` on Next | Spike uses public name only |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` | Server-only; never `NEXT_PUBLIC_` |
| `LOVABLE_API_KEY` / `LOVABLE_SEND_URL` | **Do not carry forward** | Withdraw with Lovable ([ADR-009](../architecture/decisions/ADR-009-lovable-withdrawal.md)) |

---

## C. Deferred / planned (not in application code yet)

These appear in architecture docs as future needs. **Do not invent Vercel values until the feature lands.**

| Concern | Status | Likely future env area |
| --- | --- | --- |
| Email delivery provider | ACCEPTED RISK — adapter stubs | Provider API keys (e.g. Resend/Postmark/SES) — TBD |
| SMS provider | ACCEPTED RISK — stub throws | Provider credentials — TBD |
| Public enrollment rate limit | ADR-012 decided; product TBD | Possibly Upstash Redis / Vercel / Cloudflare platform config |
| Campaign queue runtime | ADR-013 decided; product TBD | Queue/worker credentials outside Next — TBD |
| Payments | Deferred | Payment provider secrets — TBD |
| Custom backend API base URL | Backend remains primary API (ADR-006) | Public or server API URL when BFF calls external backend — TBD |

---

## Integrations cross-check

| Integration | Vars in use today | Notes |
| --- | --- | --- |
| Supabase (DB + Auth + Storage) | `VITE_SUPABASE_*`, `SUPABASE_*`, service role | Primary data/auth plane |
| Lovable email transport | `LOVABLE_API_KEY`, `LOVABLE_SEND_URL` | Withdraw; not for long-term Next deploy |
| Redis / queues | None in code | Deferred |
| Email provider (non-Lovable) | None | Deferred stubs |
| SMS | None (hard error string) | Deferred |
| Payments | None | UI placeholder |
| Analytics / Sentry / OAuth extras | None found | — |
| Cloudflare | Build tooling / `.wrangler` artifacts only | Hosting target is Vercel; CF secondary |
| Vercel platform | No app-level `VERCEL_*` reads | Platform injects its own vars at runtime |

---

## Inconsistencies and findings

1. **No root `.env.example` existed** before this audit — required names were only partially listed in `README.md`.
2. **Used in code but missing from local `.env` (typical):** `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, `LOVABLE_SEND_URL` (must be supplied where those features run; often only on host/CI).
3. **Defined locally but unused in code:** `SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PROJECT_ID`.
4. **Dual naming:** Client uses `VITE_*`; SSR middleware uses non-prefixed `SUPABASE_*`. Both pairs must be set for full SSR + browser operation.
5. **Spike naming drift:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` vs app `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` (same credential, three names).
6. **Lovable vars obsolete by policy** but still required by live `/lovable/email/*` routes until withdrawal.
7. **Root `.gitignore` did not ignore `.env`**; `.env` has been git-tracked — treat as a credential exposure risk and rotate after untracking.
8. **Spike `.env.local.example` had real values appended** during the POC (sanitized in the audit; spike tree later deleted).
9. **No incorrect secret exposure via `NEXT_PUBLIC_*` in the production app** (production still uses `VITE_*`). Keep service role server-only when recreating the Next spike.
10. **Preview vs Production:** use distinct Supabase projects (or carefully scoped keys) if Preview must not mutate production Auth/DB; URL and all key pairs must stay consistent within each environment.

---

## Vercel checklist (configure before deploy)

### Minimum for current TanStack app behavior on a Node host

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_PUBLISHABLE_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (server functions + email admin paths)
- [ ] `LOVABLE_API_KEY` / `LOVABLE_SEND_URL` only if Lovable email routes remain enabled

### For Next.js migration / spike (when that app is what Vercel builds)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only if server bootstrap/admin paths need it
- [ ] Do **not** set `LOVABLE_*` on the long-term Next project ([ADR-009](../architecture/decisions/ADR-009-lovable-withdrawal.md))

### Gate status

Checklist item *Environment inventory* in [pre-implementation-checklist.md](../architecture/pre-implementation-checklist.md) is **ACCEPTED RISK** for migration GO: this inventory is the documentation source of truth.

**Remember (still open):** confirm values in the Vercel project UI before a Next deploy (Development / Preview / Production) **without** pasting secret values into git, tickets, or chat. Mark this follow-up done in [deferred-decisions.md](../architecture/deferred-decisions.md) when confirmed.
