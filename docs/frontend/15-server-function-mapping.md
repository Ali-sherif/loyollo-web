# TanStack Server Functions to Next.js Mapping

No function is mapped mechanically. Recommendations consider consumers, HTTP semantics, secrets, authorization, cache behavior, duration, and abuse exposure.

| Existing function          | Current responsibility                                  | Consumers                                               | Data access                             | Recommended Next.js boundary                                                  | Reason                                                                                             | Risk                                                  |
| -------------------------- | ------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `getJoinProgram`           | Public program/profile/QR lookup                        | `/join/$programId` query                                | Service-role reads                      | Server Component calling `lib/server/join`                                    | Render-time read; no mutation or generic client API required                                       | Medium: public data minimization/cache freshness      |
| `enrollCustomer`           | Enroll or check in customer; award reward; notify/email | Public join form                                        | Service-role read/write and RPC         | POST Route Handler calling `lib/server/enrollment`                            | Public mutation needs explicit status codes, validation, rate limit, idempotency and observability | Critical: abuse, races, PII, admin bypass             |
| `sendCampaign`             | Resolve audience and enqueue each email                 | Campaigns UI                                            | Auth check then service-role writes/RPC | Authenticated POST Route Handler + `lib/server/campaigns`                     | Potentially long-running workflow with progress/retry semantics; not a form-only action            | High: timeout, partial sends, duplicate execution     |
| `sendOwnerNotification`    | Preference check, in-app record, transactional email    | Client notification helper after branch/campaign events | User RLS + service-role RPC             | `lib/server/notifications`, invoked by the mutation that caused the event     | Clients should not supply trusted notification content; it is internal business logic              | High: spoofed content/duplicate notifications         |
| `sendPasswordChangedEmail` | Send security notification                              | Change-password flow                                    | User profile + service-role RPC         | `lib/server/security`, invoked by authenticated password-change Server Action | Email should be coupled to the successful security mutation, not independently callable            | High: spoofing or missed security mail                |
| `deleteMyAccount`          | Delete current Supabase Auth user                       | Settings danger zone                                    | Service-role Auth Admin                 | Authenticated Server Action calling `lib/server/accounts`                     | First-party UI mutation with confirmation, redirect, and cache invalidation                        | Critical: destructive action, CSRF/session validation |

## Existing route handlers

| Existing route                 | Target                  | Reason                                                 | Risk                                                          |
| ------------------------------ | ----------------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| `/lovable/email/auth/webhook`  | Route Handler, same URL | External signed webhook and explicit responses         | High: signature/raw request/environment parity                |
| `/lovable/email/auth/preview`  | Route Handler, same URL | Bearer-authenticated HTML endpoint                     | Medium: secret comparison and information exposure            |
| `/lovable/email/queue/process` | Route Handler, same URL | Scheduled/service caller, retries, DLQ and rate limits | Critical: runtime duration, scheduler auth, duplicate workers |

## Required migration checks

- Preserve Zod/input limits and response semantics.
- Keep admin client and service-role key server-only.
- Authorize resource ownership after authentication.
- Add explicit CSRF protection for cookie-authenticated mutations.
- Test duplicate submissions, concurrent check-ins, campaign retries, queue visibility timeout, and partial failures.
- Confirm Route Handler duration and scheduling on the selected host.
