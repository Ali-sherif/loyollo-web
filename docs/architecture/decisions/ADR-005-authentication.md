# ADR-005: Supabase Authentication

## Status

PROPOSED

## Context

The current Supabase browser client persists sessions in localStorage and attaches bearer tokens to server functions. Protected routes redirect in client effects.

## Decision

Phase 1 preserves Supabase Auth and contracts. Replace client-only protection with server authorization where a trustworthy request session is available, plus client checks for UX. Evaluate a Supabase cookie/SSR adapter in a focused spike; do not declare cookie migration decided before redirect, refresh, MFA, recovery, and email verification are proven.

## Risks

LocalStorage exposes tokens to XSS and prevents straightforward authenticated RSC reads. A cookie transition can alter refresh and CSRF behavior.

## Verification

Test sign-up, verify, sign-in/out, refresh, expiry, password recovery/change, MFA, onboarding gate, direct protected URL access, and cross-tab behavior.
