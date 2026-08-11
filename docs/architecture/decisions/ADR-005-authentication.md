# ADR-005: Authentication and Authorization

## Status

PROPOSED

## Context

The current Supabase browser client persists sessions in localStorage and attaches bearer tokens to server functions. Protected routes redirect in client effects. Auth and permission contracts live with the existing backend (Supabase Auth + RLS / server policies).

## Decision

- Keep authentication and authorization ownership in the backend.
- Use secure HTTP-only cookies/session mechanisms where applicable.
- Next.js is responsible for route protection, session-aware rendering, and redirects.
- Backend authorization remains the final source of truth for permissions.
- Do not duplicate business authorization logic in the frontend.

### Migration approach

Phase 1 preserves existing Supabase Auth contracts while replacing client-only protection with Next.js route protection and session-aware rendering once a trustworthy request session is available. Client checks may remain for UX only.

Evaluate a cookie/SSR session adapter in a focused spike covering redirect, refresh, MFA, recovery, and email verification before declaring cookie migration complete. Until that spike succeeds, do not assume authenticated Server Component reads are available for protected data.

## Risks

LocalStorage exposes tokens to XSS and prevents straightforward authenticated RSC reads. A cookie transition can alter refresh and CSRF behavior. Frontend route gates must never substitute for backend authorization checks.

## Verification

Test sign-up, verify, sign-in/out, refresh, expiry, password recovery/change, MFA, onboarding gate, direct protected URL access, cross-tab behavior, and cases where UI access and backend permission disagree (backend must win).
