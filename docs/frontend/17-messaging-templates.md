# Messaging Template Inventory

**Status:** DECIDED to preserve content. Email/SMS delivery providers are **ACCEPTED RISK** — use adapter stubs until a real provider is chosen.

## Principle

Templates and personalization stay. Lovable transport packages and `/lovable/email/*` routes go away. Rendered content must be provider-agnostic.

## Auth email templates (React Email)

| Type               | Source                                         | Subject today          | Preserve |
| ------------------ | ---------------------------------------------- | ---------------------- | -------- |
| `signup`           | `src/lib/email-templates/signup.tsx`           | Confirm your email     | Yes      |
| `invite`           | `src/lib/email-templates/invite.tsx`           | You've been invited    | Yes      |

**Teammate created by `admin` (DECIDED, not shipped):** when an `admin` creates an `admin` or `staff` account, send a **separate** email with: they were added, their **email**, and a **random temporary password**. That is not the current `invite` accept-link. Add via messaging contracts; do not delete or silently overwrite `invite.tsx`. See [11-authentication-migration.md](11-authentication-migration.md#admin-adds-admin-or-staff-decided).
| `magiclink`        | `src/lib/email-templates/magic-link.tsx`       | Your login link        | Yes      |
| `recovery`         | `src/lib/email-templates/recovery.tsx`         | Reset your password    | Yes      |
| `email_change`     | `src/lib/email-templates/email-change.tsx`     | Confirm your new email | Yes      |
| `reauthentication` | `src/lib/email-templates/reauthentication.tsx` | Your verification code | Yes      |

These are currently rendered by Lovable auth webhook/preview routes. After withdrawal they must be rendered by first-party Route Handlers or server services through a messaging adapter.

## Transactional / campaign templates (inline builders)

| Message                       | Source                                                       | Channel        | Notes                                                                                |
| ----------------------------- | ------------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------ |
| New customer joined           | `src/lib/join.functions.ts`                                  | Email + in-app | HTML/text builders with brand navy CTA                                               |
| Reward earned (owner)         | `src/lib/join.functions.ts`                                  | Email + in-app | Preserve subject/body structure                                                      |
| Reward earned (customer)      | `src/lib/join.functions.ts`                                  | Email          | Preserve celebration markup                                                          |
| Owner preference notification | `src/lib/notifications.functions.ts`                         | Email + in-app | Title/message/CTA path                                                               |
| Password changed              | `src/lib/security.functions.ts`                              | Email          | Security notice copy                                                                 |
| Campaign email                | `src/lib/campaigns.functions.ts` `buildHtml` / `personalize` | Email          | User-authored subject/message + HTML wrapper                                         |
| Campaign SMS                  | `src/lib/campaigns.functions.ts`                             | SMS            | Same personalization tokens; provider currently throws `SMS provider not configured` |
| Join / register OTP           | **DECIDED, not shipped** — messaging contracts               | SMS or WhatsApp | Code only; never log plaintext. Channel chosen at `POST /api/join/otp/request`. [OTP](loyalty-page.md#otp-verification-decided) |

## Personalization tokens to preserve

- `{{name}}`
- `{{first_name}}`
- `{{business_name}}`

## Target structure

```text
src/lib/server/messaging/
├── templates/
│   ├── auth/              # existing React Email components (migrated from src/lib/email-templates/)
│   ├── transactional/     # extracted HTML/text builders
│   └── campaign/          # campaign HTML wrapper + personalize helpers
├── contracts.ts           # provider-agnostic send/render interfaces for features
├── render.ts              # render templates to html/text
└── transport.ts           # provider adapter interface + stubs (real provider later)
```

Business features invoke messaging only through the provider-agnostic contracts in `src/lib/server/messaging/`. They must not import delivery provider SDKs or concrete transport implementations.

## Adapter boundary (**ACCEPTED RISK**: stubs until provider chosen)

```text
Feature / BFF handler
        ↓
Provider-agnostic messaging contracts (DECIDED: src/lib/server/messaging/)
        ↓
Template render (DECIDED: preserve content)
        ↓
Transport stub (ACCEPTED RISK) → later: Resend / Postmark / SES / Twilio / other
```

Until a real provider replaces the stubs:

1. Keep Supabase enqueue/log RPCs if they remain useful.
2. Do not bind template modules to Lovable SDK types.
3. Keep SMS **and WhatsApp** channel UX for OTP; stub transport fails explicitly when send is attempted.
4. Do not delete templates or change copy during framework migration.
5. Do not let features depend directly on delivery providers.
6. Email stub must not silently pretend success in production paths without an explicit no-op/log policy recorded at stub implementation.

## Acceptance checks

- Pixel/HTML diff auth emails against current renders.
- Diff transactional HTML strings for join/notification/security messages.
- Confirm campaign preview/send uses the same wrapper and tokens.
- Confirm SMS draft/send path still uses the same message body when a provider is later attached.
