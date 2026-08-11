# TanStack Server Functions to Next.js Mapping

Aligned with [ADR-006](../architecture/decisions/ADR-006-server-boundaries.md).

No function is mapped mechanically. The existing backend remains the primary business/API backend. Next.js must not become a replacement for it. Prefer backend APIs; use `lib/server` orchestration, Server Actions, or Route Handlers only when there is a clear frontend-specific or BFF benefit.

| Existing function          | Current responsibility                                  | Consumers                                               | Data access                             | Recommended Next.js boundary                                                  | Reason                                                                                             | Risk                                                  |
| -------------------------- | ------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `getJoinProgram`           | Public program/profile/QR lookup                        | `/join/$programId` query                                | Service-role reads                      | Server Component → `lib/server/join` → backend                                | Render-time read; no mutation or generic client API required                                       | Medium: public data minimization/cache freshness      |
| `enrollCustomer`           | Enroll or check in customer; award reward; notify/email | Public join form                                        | Service-role read/write and RPC         | Prefer backend API; BFF Route Handler only if frontend-specific needs remain (+ messaging contracts) | Public mutation needs status codes, validation, rate limit, idempotency; keep business logic in backend | Critical: abuse, races, PII, admin bypass             |
| `sendCampaign`             | Resolve audience and enqueue each email                 | Campaigns UI                                            | Auth check then service-role writes/RPC | Prefer backend/queue; BFF Route Handler only if required → messaging contracts | Long-running workflow; not a form-only Server Action                                               | High: timeout, partial sends, duplicate execution     |
| `sendOwnerNotification`    | Preference check, in-app record, transactional email    | Client notification helper after branch/campaign events | User RLS + service-role RPC             | Backend or `lib/server/notifications` → messaging contracts                   | Clients must not supply trusted notification content                                               | High: spoofed content/duplicate notifications         |
| `sendPasswordChangedEmail` | Send security notification                              | Change-password flow                                    | User profile + service-role RPC         | Coupled to password-change flow → messaging contracts                         | Email coupled to successful security mutation; not independently callable                          | High: spoofing or missed security mail                |
| `deleteMyAccount`          | Delete current Supabase Auth user                       | Settings danger zone                                    | Service-role Auth Admin                 | Prefer backend; Server Action only if clear UI/session benefit → `lib/server/accounts` | Destructive; CSRF/session validation required                                                      | Critical: destructive action, CSRF/session validation |

## Existing route handlers (Lovable withdrawal)

These routes must leave `/lovable/*` paths. They are justified as frontend-specific BFF/webhook/scheduler endpoints. Preserve behavior and templates under `src/lib/server/messaging/`; replace Lovable transport behind provider-agnostic contracts.

| Existing route                 | Target (first-party)                   | Reason                                              | Risk                                                                |
| ------------------------------ | -------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------- |
| `/lovable/email/auth/webhook`  | `app/api/email/auth/webhook/route.ts`  | External signed webhook; keep React Email templates | High: signature/raw request/env parity; caller URL cutover          |
| `/lovable/email/auth/preview`  | `app/api/email/auth/preview/route.ts`  | Authorized HTML preview of preserved templates      | Medium: auth secret model after Lovable key removal                 |
| `/lovable/email/queue/process` | `app/api/email/queue/process/route.ts` | Scheduled worker; send via `lib/server/messaging`   | Critical: duration, scheduler auth, duplicate workers, provider TBD |

Template inventory: [17-messaging-templates.md](17-messaging-templates.md). Lovable withdrawal: [ADR-009](../architecture/decisions/ADR-009-lovable-withdrawal.md).

## Required migration checks

- Preserve Zod/input limits and response semantics where retained.
- Keep admin client and service-role key server-only.
- Authorize resource ownership after authentication; backend remains permission source of truth.
- Add explicit CSRF protection for cookie-authenticated mutations.
- Test duplicate submissions, concurrent check-ins, campaign retries, queue visibility timeout, and partial failures.
- Confirm any retained Route Handler duration and scheduling on Vercel (and OpenNext/`workerd` if Cloudflare is later evaluated).
- Confirm rendered auth/transactional/campaign email HTML matches current templates after Lovable SDK removal.
- Confirm SMS campaign message personalization remains unchanged even while SMS transport stays unconfigured.
- Record explicit justification before introducing any new Server Action or Route Handler that could otherwise call the backend API directly.
