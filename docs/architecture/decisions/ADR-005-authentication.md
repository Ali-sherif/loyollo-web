# ADR-005: Authentication and Authorization

## Status

DECIDED

**Revised 2026-08-17:** Option C. Supabase Auth is withdrawn even during Frontend Migration (ADR-011 Phase 1). NestJS owns a fully independent auth system for all roles.

## Context

The current frontend still reflects a Supabase browser client that persisted sessions in localStorage and attached bearer tokens to server functions. Protected routes redirected in client effects. Auth and permission contracts previously lived with Supabase Auth + RLS / server policies.

That model is retired. The product is **fully replacing Supabase**. Frontend Migration must not keep Supabase Auth as a bridge, adapter, or dual-write IdP.

## Options

| Option | Approach | Outcome |
|--------|----------|---------|
| A | Keep Supabase Auth during Frontend Migration; replace later | Rejected — Frontend Migration would still depend on Supabase Auth |
| B | Hybrid: NestJS for some roles, Supabase Auth for others | Rejected — two IdPs and two recovery models |
| **C** | **Independent NestJS auth for `admin`, `staff`, and `customer`; local JWT; native temp-password/reset and customer OTP** | **Chosen** |

## Decision

- **Do not use Supabase Auth** (no GoTrue, no `@supabase/ssr` session, no Supabase recovery/OTP/MFA as the IdP) even during Frontend Migration.
- Build a **fully independent auth system in NestJS** (backend program, [ADR-015](ADR-015-backend-stack.md)) for **all** roles: `admin`, `staff`, `customer`.
- NestJS issues and validates **local JWTs** (self-signed access/refresh tokens). Next.js is not the token issuer.
- NestJS natively handles:
  - `admin` / `staff` email-password sign-in
  - admin-created teammate **temporary passwords** and first-login force-change
  - `admin` / `staff` **password reset** (email link) and admin **re-issue temp password**
  - `customer` **passwordless OTP** (SMS/WhatsApp) for register, login, and lost access
- Keep authorization ownership in the backend. NestJS policies are the final source of truth for permissions. Do not use Supabase RLS as an authz substitute for this system.
- Next.js is responsible for route protection, session-aware rendering, and redirects. Client checks may remain for UX only.
- Use secure **HTTP-only cookies** on the Next.js host where applicable to hold the Nest-issued session (not `localStorage`). Forward the JWT to Nest on API calls. Do not duplicate business authorization logic in the frontend.

### Product roles (DECIDED 2026-08-14)

Locked stored names: **`admin`** · **`staff`** · **`customer`**. No other logged-in roles. Full matrix: [11-authentication-migration.md](../../frontend/11-authentication-migration.md#locked-role-matrix).

| Role | Who | Surface | Permissions |
|------|-----|---------|-------------|
| `admin` | Buys Loyollo (= today’s owner) | `/app` | Full merchant access |
| `staff` | Works for that shop | `/app` | **Same as `admin` for now.** Later split not locked |
| `customer` | Shops at that business | Customer register/login | Never `/app` as merchant |

`admin` / `staff` are never a shop customer. `customer` never gets merchant `/app`. Status/tier are not roles. Do not use stored name `purchaser`.

**Customer register / login:** role **`customer`**. Store their data; calculate KPIs. `admin` manual add remains. Routes/schema not locked. [G-33](../../frontend/gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows).

**Admin adds teammate:** an `admin` form creates `admin` or `staff`, generates a random temp password, emails added + email + password. **First login must change that password.** Implemented in NestJS, not Supabase invite. [11-authentication-migration.md](../../frontend/11-authentication-migration.md#admin-adds-admin-or-staff-decided).

**Account active/inactive/pending:** persisted on `profiles.account_status` as `active` \| `inactive` \| `pending`. `admin` sets `staff` and `customer` to `active` \| `inactive`. `pending` = teammate awaiting first-login password change. **One page, two tabs:** Team (`admin` + `staff`) and Customers (`customer`). Filters: role (Team tab), email, name, phone; active/inactive on both. [11-authentication-migration.md](../../frontend/11-authentication-migration.md#account-active--inactive-decided) · [data-contract](../../backend/data-contract.md#profiles--role-and-account-status-s-01-g-33-g-34-g-36).

**Credential recovery:** `admin` / `staff` use the owner email reset (`/auth/forgot-password`); `admin` may re-issue a temp password. Both are NestJS-native. `customer` is passwordless — lost access is a new OTP (SMS/WhatsApp) issued by NestJS, never merchant recovery. [credential recovery](../../frontend/11-authentication-migration.md#credential-recovery-decided).

`staff` subtypes and a future permission split: [deferred-decisions.md](../deferred-decisions.md). Glossary: [data-contract.md](../../backend/data-contract.md#unified-glossary).

### Migration approach

Frontend Migration replaces Supabase Auth entirely. NestJS is the only IdP. Next.js route protection and session-aware rendering consume Nest-issued JWTs (HTTP-only cookies on the frontend host). Client checks may remain for UX only.

Prove the Nest JWT cookie/SSR path in a focused spike covering redirect, refresh, MFA (if still in **Product MVP (Ship 1)** scope), recovery, customer OTP, and email verification before declaring cookie migration complete. Until that spike succeeds, do not assume authenticated Server Component reads are available for protected data. The old `@supabase/ssr` spike ([auth-ssr-spike.md](../spikes/auth-ssr-spike.md)) is **superseded** and must not be treated as the remaining proof.

## Risks

LocalStorage JWTs remain exposed to XSS until the Nest cookie session is proven. Cookie sessions require CSRF protection on cookie-authenticated mutations. Frontend route gates must never substitute for NestJS authorization checks. Dual IdPs (Supabase Auth + Nest) are forbidden.

## Verification

Test NestJS sign-up, verify, sign-in/out, JWT refresh, expiry, admin/staff temp-password + first-login change, password recovery/change, admin re-issue temp password, customer OTP register/login/lost-access, onboarding gate, direct protected URL access, cross-tab behavior, inactive-account denial, and cases where UI access and backend permission disagree (NestJS must win). Confirm no runtime dependency on Supabase Auth.
