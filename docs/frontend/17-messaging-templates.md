# Messaging Template Inventory

**Status:** DECIDED to preserve content. Email/SMS delivery providers remain undecided.

## Principle

Templates and personalization stay. Lovable transport packages and `/lovable/email/*` routes go away. Rendered content must be provider-agnostic.

## Auth email templates (React Email)

| Type               | Source                                         | Subject today          | Preserve |
| ------------------ | ---------------------------------------------- | ---------------------- | -------- |
| `signup`           | `src/lib/email-templates/signup.tsx`           | Confirm your email     | Yes      |
| `invite`           | `src/lib/email-templates/invite.tsx`           | You've been invited    | Yes      |
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

## Personalization tokens to preserve

- `{{name}}`
- `{{first_name}}`
- `{{business_name}}`

## Target structure

```text
src/
├── features/messaging/
│   ├── templates/
│   │   ├── auth/          # existing React Email components
│   │   ├── transactional/ # extracted HTML/text builders
│   │   └── campaign/      # campaign HTML wrapper + personalize helpers
│   └── types.ts
└── lib/server/messaging/
    ├── render.ts          # render templates to html/text
    └── transport.ts       # provider adapter interface (provider TBD)
```

## Adapter boundary (provider undecided)

```text
Template render (DECIDED)
        ↓
Messaging adapter interface (DECIDED)
        ↓
Concrete provider (DEFERRED: Resend / Postmark / SES / Twilio / other)
```

Until a provider is approved:

1. Keep Supabase enqueue/log RPCs if they remain useful.
2. Do not bind template modules to Lovable SDK types.
3. Keep SMS channel UX and message storage; fail explicitly when SMS transport is unconfigured.
4. Do not delete templates or change copy during framework migration.

## Acceptance checks

- Pixel/HTML diff auth emails against current renders.
- Diff transactional HTML strings for join/notification/security messages.
- Confirm campaign preview/send uses the same wrapper and tokens.
- Confirm SMS draft/send path still uses the same message body when a provider is later attached.
