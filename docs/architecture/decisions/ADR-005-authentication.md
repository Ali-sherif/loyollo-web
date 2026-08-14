# ADR-005: Authentication and Authorization

## Status

DECIDED

## Context

The current Supabase browser client persists sessions in localStorage and attaches bearer tokens to server functions. Protected routes redirect in client effects. Auth and permission contracts live with the existing backend (Supabase Auth + RLS / server policies).

## Decision

- Keep authentication and authorization ownership in the backend.
- Use secure HTTP-only cookies/session mechanisms where applicable.
- Next.js is responsible for route protection, session-aware rendering, and redirects.
- Backend authorization remains the final source of truth for permissions.
- Do not duplicate business authorization logic in the frontend.

### Product roles (DECIDED 2026-08-14)

Locked stored names: **`admin`** · **`staff`** · **`customer`**. No other logged-in roles. Full matrix: [11-authentication-migration.md](../../frontend/11-authentication-migration.md#locked-role-matrix).

| Role | Who | Surface | Permissions |
|------|-----|---------|-------------|
| `admin` | Buys Loyollo (= today’s owner) | `/app` | Full merchant access |
| `staff` | Works for that shop | `/app` | **Same as `admin` for now.** Later split not locked |
| `customer` | Shops at that business | Customer register/login | Never `/app` as merchant |

`admin` / `staff` are never a shop customer. `customer` never gets merchant `/app`. Status/tier are not roles. Do not use stored name `purchaser`.

**Customer register / login:** role **`customer`**. Store their data; calculate KPIs. `admin` manual add remains. Routes/schema not locked. [G-33](../../frontend/gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows).

**Admin adds teammate:** an `admin` form creates `admin` or `staff`, generates a random temp password, emails added + email + password. **First login must change that password.** [11-authentication-migration.md](../../frontend/11-authentication-migration.md#admin-adds-admin-or-staff-decided).

**Account active/inactive:** `admin` sets `staff` and `customer` to `active` \| `inactive`. Management page filters by role, email, name, phone. [11-authentication-migration.md](../../frontend/11-authentication-migration.md#account-active--inactive-decided).

`staff` subtypes and a future permission split: [deferred-decisions.md](../deferred-decisions.md). Glossary: [data-contract.md](../../backend/data-contract.md#unified-glossary).

### Migration approach

Phase 1 preserves existing Supabase Auth contracts while replacing client-only protection with Next.js route protection and session-aware rendering once a trustworthy request session is available. Client checks may remain for UX only.

Evaluate a cookie/SSR session adapter in a focused spike covering redirect, refresh, MFA, recovery, and email verification before declaring cookie migration complete. Until that spike succeeds, do not assume authenticated Server Component reads are available for protected data.

## Risks

LocalStorage exposes tokens to XSS and prevents straightforward authenticated RSC reads. A cookie transition can alter refresh and CSRF behavior. Frontend route gates must never substitute for backend authorization checks.

## Verification

Test sign-up, verify, sign-in/out, refresh, expiry, password recovery/change, MFA, onboarding gate, direct protected URL access, cross-tab behavior, and cases where UI access and backend permission disagree (backend must win).
