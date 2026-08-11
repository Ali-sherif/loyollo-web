# ADR-012: Public Enrollment Rate Limiting

## Status

DECIDED

## Context

Public join / enrollment (`enrollCustomer` and related signup/enrollment routes) is abuse-sensitive: unauthenticated or lightly authenticated traffic can hammer enroll/check-in mutations. The pre-implementation checklist required rate-limit and abuse controls to be approved before migration coding. Client-only throttling is insufficient.

## Decision

### Enforcement (server / edge)

- Enforce rate limiting at the **Edge / Server layer** on **public signup and enrollment** routes.
- Allowed implementations (choose at slice implementation; one is enough to start):
  - **Vercel** platform rate limiting, and/or
  - **Cloudflare** rate limiting (if/when that edge is in path), and/or
  - **Upstash Redis** (or equivalent) middleware / proxy guard in front of the enrollment handler
- On limit exceeded, the server must respond with **HTTP 429**.
- Rate limits apply to the mediated public mutation path (Backend API call or justified BFF Route Handler per [15-server-function-mapping.md](../../frontend/15-server-function-mapping.md)) — not only to UI clicks.
- Exact numeric thresholds, keying (IP / fingerprint / program id), and provider product selection are set at implementation of the join/enrollment slice; this ADR locks the **layer, status code, and UX contract**.

### Frontend handling

- The Next.js frontend must handle **429** gracefully:
  - clear user-visible notification (existing toast/alert patterns; no redesign),
  - disable submit controls on enrollment/signup forms while limited or while a request is in flight after a 429,
  - avoid silent retries that amplify abuse.
- Client-side disable controls are **UX only**; they are not the security control.

### Out of scope for this gate

- Full bot/CAPTCHA product selection (may be added later if abuse evidence requires it).
- Idempotency and concurrency review for check-ins remain required at the enrollment slice (see ADR-006 verification) but are separate from this rate-limit decision.

## Consequences

- Public enrollment abuse risk is mitigated at the edge/server with a uniform 429 contract.
- Frontend slices for `/join/[programId]` and related public auth/signup surfaces must include 429 UX.
- Backend remains source of truth for enrollment business rules; rate limiting does not replace authorization or validation.

## Verification

- Exceeding the limit on public enrollment returns **429** from edge/server, not only a client message.
- Form shows a clear notification and submit stays disabled appropriately after 429.
- Service-role and privileged keys remain server-only; rate-limit config secrets stay server/edge-only.
