# ADR-013: Campaign and Messaging Background Processing

## Status

DECIDED

## Context

Campaign send and email/SMS queue workers today involve TanStack server functions, Supabase enqueue/RPCs, and Lovable-hosted `/lovable/email/queue/process` transport. Next.js on Vercel is a poor default home for long-running or high-volume background work. The checklist required a campaign execution runtime/queue strategy **without Lovable transport** before migration coding.

## Decision

### Ownership

- **Campaign and messaging background processing remain outside Next.js.**
- Processing is owned by the **backend / messaging infrastructure** (enqueue, workers, retries, visibility timeouts, provider send).
- Next.js may:
  - render campaign UI,
  - call a **Backend API** (or thin BFF only if justified) to **start/enqueue** work,
  - render preserved templates through `src/lib/server/messaging/` contracts when the backend/worker asks for HTML/text,
  - expose first-party HTTP only where an external scheduler/webhook must hit the frontend host — and even then the handler must **delegate** to backend/messaging, not run the campaign fan-out inside the Next request lifecycle.
- Next.js must **not** become the durable queue runtime or the primary campaign worker process.

### Lovable withdrawal

- Remove Lovable packages, `/lovable/email/queue/*` coupling, and Lovable transport ([ADR-009](ADR-009-lovable-withdrawal.md)).
- Do **not** treat “move the worker to `app/api/email/queue/process`” as the long-term execution strategy; that path is at most a temporary cutover shim that forwards to backend/messaging.

### Queue technology

- The **specific queue product** (e.g. Supabase-backed jobs, cloud queue, worker platform) is **not locked** in this ADR.
- Selection is based on **actual workload and operational requirements** (volume, latency, retries, ops ownership).
- Until a product is chosen, preserve enqueue/log contracts where useful and keep messaging **provider-agnostic** stubs ([ADR-010](ADR-010-style-and-template-parity.md), D-26/D-27).

## Consequences

- Aligns with backend-primary mapping for `sendCampaign` ([15-server-function-mapping.md](../../frontend/15-server-function-mapping.md)).
- Reduces Vercel timeout / duplicate-worker risk for campaign fan-out.
- Durable job platform product choice remains deferred; ownership and “not in Next” are decided.

## Verification

- No production campaign fan-out relies on Lovable transport.
- No Next.js Route Handler or Server Action performs unbounded campaign recipient loops as its primary job.
- Workers/schedulers authenticate to backend/messaging infrastructure; secrets stay off the client.
- Email/SMS content parity remains under messaging contracts regardless of queue vendor.
