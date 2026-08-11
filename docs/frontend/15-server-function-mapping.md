# TanStack Server Functions to Next.js Mapping

Aligned with [ADR-006](../architecture/decisions/ADR-006-server-boundaries.md).

**Status:** **DECIDED / APPROVED** for migration scope (backend-primary boundary model).

No function is mapped mechanically. The existing backend remains the primary business/API backend. Next.js must not become a replacement for it.

## Decision tree (canonical)

Apply this in order for every former TanStack Server Function (and before adding any new Server Action or Route Handler):

```text
Old Server Function
       │
       ├── Backend business logic?
       │       └── → Backend API
       │
       ├── UI-specific server operation?
       │       └── → Next.js Server Action
       │
       └── Needs server-side mediation?
               └── → Next.js BFF
```

### Branch meanings

| Branch                    | Use when                                                                                                                                                                   | Typical Next surface                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Backend API**           | Persistence, authorization, domain rules, queues, or any logic that must remain the system of record                                                                       | Call existing backend / Supabase contracts; Next only orchestrates |
| **Next.js Server Action** | Narrow **UI-specific** server work (form/mutation UX) with clear benefit over a direct client→API call; still orchestrates backend — does not own business persistence     | `action` / server function in App Router                           |
| **Next.js BFF**           | Server-side mediation required: webhooks, schedulers, public HTTP contracts, secret isolation, or proxy that is not expressible as a pure Backend API call from the client | Route Handler and/or `lib/server/*`                                |

**Defaults:** Prefer **Backend API**. Choose Server Action or BFF only with recorded justification. Render-time reads with a trustworthy session may use Server Components calling backend or `lib/server` (BFF-style mediation when secrets/service-role are involved) — they are not automatic Server Actions.

## Per-function mapping

| Existing function          | Decision-tree branch                                          | Current responsibility                                  | Consumers                                               | Data access                             | Recommended Next.js boundary                                                                                                                                                                                             | Reason                                                                                              | Risk                                                  |
| -------------------------- | ------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `getJoinProgram`           | Next.js BFF (mediation) then Backend/contracts                | Public program/profile/QR lookup                        | `/join/$programId` query                                | Service-role reads                      | Server Component → `lib/server/join` → backend/contracts                                                                                                                                                                 | Render-time read; service-role must stay server-side; not a mutation Server Action                  | Medium: public data minimization/cache freshness      |
| `enrollCustomer`           | Backend API (BFF only if residual frontend HTTP needs)        | Enroll or check in customer; award reward; notify/email | Public join form                                        | Service-role read/write and RPC         | Prefer backend API; BFF Route Handler only if frontend-specific needs remain (+ messaging contracts); **edge/server rate limit → 429** ([ADR-012](../architecture/decisions/ADR-012-public-enrollment-rate-limiting.md)) | Public mutation: status codes, validation, rate limit, idempotency; business logic stays in backend | Critical: abuse, races, PII, admin bypass             |
| `sendCampaign`             | Backend API / queue (outside Next)                            | Resolve audience and enqueue each email                 | Campaigns UI                                            | Auth check then service-role writes/RPC | **Backend/messaging queue** ([ADR-013](../architecture/decisions/ADR-013-campaign-messaging-runtime.md)); Next only triggers enqueue via Backend API (BFF only if justified) → messaging contracts for content           | Long-running workflow must not run inside Next request lifecycle                                    | High: timeout, partial sends, duplicate execution     |
| `sendOwnerNotification`    | Backend API                                                   | Preference check, in-app record, transactional email    | Client notification helper after branch/campaign events | User RLS + service-role RPC             | Backend or `lib/server/notifications` → messaging contracts                                                                                                                                                              | Clients must not supply trusted notification content                                                | High: spoofed content/duplicate notifications         |
| `sendPasswordChangedEmail` | UI-specific Server Action orchestration → messaging / Backend | Send security notification                              | Change-password flow                                    | User profile + service-role RPC         | Server Action (or backend hook) after successful password change → messaging contracts                                                                                                                                   | Email is UI/security-flow coupled; not an independent public API; no new business ownership in Next | High: spoofing or missed security mail                |
| `deleteMyAccount`          | Backend API (Server Action only if clear UI/session benefit)  | Delete current Supabase Auth user                       | Settings danger zone                                    | Service-role Auth Admin                 | Prefer backend; Server Action only if clear UI/session benefit → `lib/server/accounts`                                                                                                                                   | Destructive; CSRF/session validation required                                                       | Critical: destructive action, CSRF/session validation |

## Existing route handlers (Lovable withdrawal)

These are **Next.js BFF** endpoints (server-side mediation). They must leave `/lovable/*` paths. Preserve behavior and templates under `src/lib/server/messaging/`; replace Lovable transport behind provider-agnostic contracts.

| Existing route                 | Target (first-party)                                                                                         | Decision-tree branch                                                                      | Reason                                                                                             | Risk                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `/lovable/email/auth/webhook`  | `app/api/email/auth/webhook/route.ts`                                                                        | Next.js BFF                                                                               | External signed webhook; keep React Email templates                                                | High: signature/raw request/env parity; caller URL cutover          |
| `/lovable/email/auth/preview`  | `app/api/email/auth/preview/route.ts`                                                                        | Next.js BFF                                                                               | Authorized HTML preview of preserved templates                                                     | Medium: auth secret model after Lovable key removal                 |
| `/lovable/email/queue/process` | Backend/messaging worker (not Next runtime); optional thin first-party trigger only if scheduler requires it | Outside Next ([ADR-013](../architecture/decisions/ADR-013-campaign-messaging-runtime.md)) | Withdraw Lovable transport; durable processing in backend/messaging; queue product TBD by workload | Critical: duration, scheduler auth, duplicate workers, provider TBD |

Template inventory: [17-messaging-templates.md](17-messaging-templates.md). Lovable withdrawal: [ADR-009](../architecture/decisions/ADR-009-lovable-withdrawal.md).

## Required migration checks

- Apply the decision tree before implementing each former server function; record the chosen branch in the PR/slice notes.
- Preserve Zod/input limits and response semantics where retained.
- Keep admin client and service-role key server-only.
- Authorize resource ownership after authentication; backend remains permission source of truth ([ADR-011](../architecture/decisions/ADR-011-rls-storage-strategy.md) for Phase 1 RLS/storage).
- Add explicit CSRF protection for cookie-authenticated mutations.
- Test duplicate submissions, concurrent check-ins, campaign retries, queue visibility timeout, and partial failures.
- Confirm any retained Route Handler duration and scheduling on Vercel (and OpenNext/`workerd` if Cloudflare is later evaluated).
- Confirm rendered auth/transactional/campaign email HTML matches current templates after Lovable SDK removal.
- Confirm SMS campaign message personalization remains unchanged even while SMS transport stays unconfigured.
- Record explicit justification before introducing any new Server Action or Route Handler that could otherwise call the backend API directly.
