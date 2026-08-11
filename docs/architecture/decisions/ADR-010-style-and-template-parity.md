# ADR-010: Style and Messaging Template Parity

## Status

DECIDED

## Context

Product owners require the Next.js migration to keep the current visual design and to retain existing email/SMS messaging content. Initial hosting is Vercel ([ADR-008](ADR-008-deployment.md)); concrete email/SMS delivery providers are **ACCEPTED RISK** deferred behind adapter stubs, so transport must stay separable from presentation.

## Decision

### Visual style

Preserve current visual parity as a hard requirement:

- Keep Tailwind CSS 4 tokens and global styles from `src/styles.css`.
- Keep Radix/shadcn primitives, spacing, typography, brand colors, and Figtree usage.
- Keep existing icons, logo variants, marketing/dashboard imagery, and layout composition.
- Do not redesign the UI during migration. Framework changes may only remount the same styles and components under App Router boundaries.

### Messaging templates

Preserve current email and SMS message content as a hard requirement, independent of transport provider:

- Keep current React Email auth templates and transactional/campaign HTML/text builders during migration (today under `src/lib/email-templates/` and related server functions).
- Keep campaign subject/body personalization (`{{name}}`, `{{first_name}}`, `{{business_name}}`) and channel UX for email and SMS.
- Messaging templates and server-side messaging infrastructure live under `src/lib/server/messaging/`.
- Business features may invoke messaging through provider-agnostic contracts and must not depend directly on delivery providers.
- Concrete providers (Resend, Postmark, SES, Twilio, or other) remain deferred behind the adapter interface (**ACCEPTED RISK**; ship stubs until a provider is chosen).

## Non-goals

- Selecting the email or SMS delivery provider.
- Implementing a real SMS gateway if one is still unconfigured.
- Changing copy, branding, or layout for emails/SMS.

## Consequences

- Style and template parity become acceptance criteria for every migrated route and messaging workflow.
- Provider selection is **ACCEPTED RISK** deferred; the `src/lib/server/messaging/` adapter boundary (with stubs) is mandatory before Lovable email packages are removed.
- Features import messaging contracts only; delivery SDKs and secrets stay inside `lib/server/messaging`.
- Visual regression checks and rendered email HTML diffs are required before cutover.

## Verification

- Side-by-side screenshots for marketing and authenticated screens show no intentional design drift.
- Auth email types (`signup`, `invite`, `magiclink`, `recovery`, `email_change`, `reauthentication`) render the same subjects/body structure.
- Transactional notifications and campaign HTML retain current markup and personalization tokens.
- SMS channel continues to accept and store the same message content; provider absence remains an explicit runtime error until a provider is approved.
