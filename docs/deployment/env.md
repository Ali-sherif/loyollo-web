# Environment variable inventory

**Audit date:** 2026-08-11 (updated 2026-08-17 for Lovable/TanStack retirement)  
**Scope:** Names and metadata only. **Never commit or paste secret values into this file, tickets, or chat.**  
**Hosting target:** Vercel + Node.js 24 LTS ([ADR-008](../architecture/decisions/ADR-008-deployment.md)).

This inventory is the canonical list for deployment configuration. Source of truth for _usage_ is the codebase.

## How to use

1. Copy [`.env.example`](../../.env.example) → `.env` (local Next.js app). Never commit `.env`.
2. In Vercel: Project → Settings → Environment Variables. Set **Development**, **Preview**, and **Production** as indicated below.
3. Prefer the same Supabase project URL/keys across Preview and Production only when intentional; use separate projects if Preview must not touch production data.

## Security rules

| Rule                | Detail                                                                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server-only secrets | `SUPABASE_SERVICE_ROLE_KEY`, `EMAIL_WEBHOOK_SECRET`, spike passwords — never prefix with `VITE_` or `NEXT_PUBLIC_`                                                                             |
| Client-safe         | `NEXT_PUBLIC_*` (and leftover `VITE_*` mapped in `next.config.ts`) and publishable/anon keys are embeddable in the browser bundle by design                                                   |
| Do not restore      | `LOVABLE_*` is withdrawn ([ADR-009](../architecture/decisions/ADR-009-lovable-withdrawal.md)) — do not set it on Vercel                                                                        |
| Tracked secrets     | Root `.env` has historically been **git-tracked**. Remove it from the index (`git rm --cached .env`) after confirming local/Vercel copies exist, then rotate any keys that were ever committed |

---

## A. Current production app (Next.js)

Runtime: Next.js App Router (`npm run dev` / `npm run build`). Public client names are `NEXT_PUBLIC_*`. `next.config.ts` still maps leftover `VITE_*` / `SUPABASE_*` into public names if `NEXT_PUBLIC_*` is unset.

| Variable                        | Required | Scope            | Environments | Used In                                                                 | Purpose                                       | Secret                |
| ------------------------------- | -------- | ---------------- | ------------ | ----------------------------------------------------------------------- | --------------------------------------------- | --------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Client (+ build) | All          | `src/config/env.ts`; `@supabase/ssr` factories                          | Supabase API URL                              | No                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Client (+ build) | All          | `src/config/env.ts`; `@supabase/ssr` factories                          | Supabase anon/publishable key                 | No (public by design) |
| `SUPABASE_URL`                  | No*      | Server           | All          | `requireSupabaseUrl()` fallback                                         | Server URL if public name unset               | No                    |
| `SUPABASE_PUBLISHABLE_KEY`      | No*      | Server           | All          | `resolvePublicSupabaseAnonKey()` fallback                               | Anon key if public name unset                 | No (public by design) |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes†     | Server           | All†         | `src/integrations/supabase/admin.ts`; email queue / join / campaigns    | Privileged Supabase client (bypasses RLS)     | Yes                   |
| `EMAIL_WEBHOOK_SECRET`          | Yes‡     | Server           | All‡         | `src/app/api/email/auth/{webhook,preview}/route.ts`                     | Authorize auth email webhook and preview      | Yes                   |
| `VITE_SUPABASE_URL`             | No       | Legacy           | Local        | `next.config.ts` / `env.ts` fallback only                               | Leftover Vite name; prefer `NEXT_PUBLIC_*`    | No                    |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | No       | Legacy           | Local        | `next.config.ts` / `env.ts` fallback only                               | Leftover Vite name; prefer `NEXT_PUBLIC_*`    | No (public by design) |

\* Optional if the matching `NEXT_PUBLIC_*` value is set.  
† Required for admin/BFF paths (join, campaigns, queue process, account APIs).  
‡ Required for `/api/email/auth/webhook` and `/api/email/auth/preview`. Queue process uses `SUPABASE_SERVICE_ROLE_KEY` as bearer.

Do **not** set `LOVABLE_API_KEY` or `LOVABLE_SEND_URL`.

### Client vs server pairing

| Browser (`NEXT_PUBLIC_*`)       | Server (`process.env`)     | Same value?                                |
| ------------------------------- | -------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | `SUPABASE_URL`             | Yes — set both to the project URL          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `SUPABASE_PUBLISHABLE_KEY` | Yes — same anon/publishable key            |

---

## B. Auth SSR spike (D-28) extra names

The isolated `spikes/auth-ssr/` POC was **removed** from the repo. When D-28 is re-run, expect these extra names (see [auth-ssr-spike.md](../architecture/spikes/auth-ssr-spike.md)).

| Variable                        | Required  | Scope           | Environments | Purpose                                                | Secret |
| ------------------------------- | --------- | --------------- | ------------ | ------------------------------------------------------ | ------ |
| `SPIKE_TEST_EMAIL`              | Optional  | Server (script) | Spike local  | Confirmed test user email                              | No     |
| `SPIKE_TEST_PASSWORD`           | Optional  | Server (script) | Spike local  | Confirmed test user password                           | Yes    |

Validation needs **either** service-role bootstrap **or** confirmed `SPIKE_TEST_*` credentials.

### Retired names (do not carry forward)

| Retired                              | Next.js convention                         | Notes                                                                                      |
| ------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`                  | `NEXT_PUBLIC_SUPABASE_URL`                 | Optional fallback only                                                                     |
| `VITE_SUPABASE_PUBLISHABLE_KEY`      | `NEXT_PUBLIC_SUPABASE_ANON_KEY`            | Optional fallback only                                                                     |
| `LOVABLE_API_KEY` / `LOVABLE_SEND_URL` | **Removed**                              | Withdrawn with Lovable ([ADR-009](../architecture/decisions/ADR-009-lovable-withdrawal.md)) |

---

## C. Deferred / planned (not in application code yet)

These appear in architecture docs as future needs. **Do not invent Vercel values until the feature lands.**

| Concern                      | Status                                | Likely future env area                                         |
| ---------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| Email delivery provider      | ACCEPTED RISK — adapter stubs         | Provider API keys (e.g. Resend/Postmark/SES) — TBD             |
| SMS provider                 | ACCEPTED RISK — stub throws           | Provider credentials — TBD                                     |
| Public enrollment rate limit | ADR-012 decided; product TBD          | Possibly Upstash Redis / Vercel / Cloudflare platform config   |
| Campaign queue runtime       | ADR-013 decided; product TBD          | Queue/worker credentials outside Next — TBD                    |
| Payments                     | Deferred                              | Payment provider secrets — TBD                                 |
| Custom backend API base URL  | Backend remains primary API (ADR-006) | Public or server API URL when BFF calls external backend — TBD |

---

## Integrations cross-check

| Integration                       | Vars in use today                                          | Notes                                    |
| --------------------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| Supabase (DB + Auth + Storage)    | `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_*`, service role       | Primary data/auth plane                  |
| Auth email BFF                    | `EMAIL_WEBHOOK_SECRET`                                     | `/api/email/auth/{webhook,preview}`      |
| Email queue process               | `SUPABASE_SERVICE_ROLE_KEY`                                | Bearer for `/api/email/queue/process`    |
| Lovable email transport           | None                                                       | Retired (ADR-009)                        |
| Redis / queues                    | None in code                                               | Deferred                                 |
| Email provider (non-Lovable)      | None                                                       | Deferred stubs                           |
| SMS                               | None (hard error string)                                   | Deferred                                 |
| Payments                          | None                                                       | UI placeholder                           |
| Analytics / Sentry / OAuth extras | None found                                                 | —                                        |
| Vercel platform                   | No app-level `VERCEL_*` reads                              | Platform injects its own vars at runtime |

---

## Vercel checklist (configure before deploy)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (admin / queue / join / campaigns)
- [ ] `EMAIL_WEBHOOK_SECRET` (auth email webhook + preview)
- [ ] Optional: `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` if not relying solely on `NEXT_PUBLIC_*`
- [ ] Do **not** set `LOVABLE_*` ([ADR-009](../architecture/decisions/ADR-009-lovable-withdrawal.md))

### Gate status

Checklist item _Environment inventory_ in [pre-implementation-checklist.md](../architecture/pre-implementation-checklist.md) is **ACCEPTED RISK** for migration GO: this inventory is the documentation source of truth.

**Remember (still open):** confirm values in the Vercel project UI before a Next deploy (Development / Preview / Production) **without** pasting secret values into git, tickets, or chat. Mark this follow-up done in [deferred-decisions.md](../architecture/deferred-decisions.md) when confirmed.
