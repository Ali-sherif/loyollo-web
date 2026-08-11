# Migration Risks

| Severity | Risk                                                                    | Mitigation / gate                                                        |
| -------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Critical | Authenticated RSC cannot access localStorage session                    | Cookie/SSR spike; Next route gates; retain client data path until proven |
| Critical | Cross-user cache leakage                                                | No-store defaults; concurrent-user tests                                 |
| Critical | Service-role exposure                                                   | `lib/server`, server-only guards, bundle inspection                      |
| Critical | Public enrollment abuse/races                                           | Rate limit, idempotency/concurrency review, monitoring                   |
| Critical | No regression tests                                                     | Characterization/E2E baseline before migration                           |
| Critical | Lovable withdrawal breaks email delivery                                | `lib/server/messaging` adapter + template parity before removing SDKs    |
| Critical | Style drift during Next.js remount                                      | Visual parity gates; no redesign; side-by-side checks                    |
| Critical | Next.js accidentally becomes a second backend                           | ADR-006 gate: business logic/persistence stay in existing backend        |
| High     | Campaign work exceeds runtime limits                                    | Prefer backend/queue; BFF Route Handler only if justified                |
| High     | Auth/campaign callers still hit `/lovable/email/*` after cutover        | First-party `/api/email/*` paths + caller/scheduler cutover checklist    |
| High     | CDN/Lovable assets break after withdrawal                               | Vendor/re-host assets before removing manifests                          |
| High     | Email/SMS provider undecided                                            | Keep templates under messaging contracts; fail SMS explicitly            |
| High     | Frontend duplicates backend authorization                               | Backend remains source of truth; Next only route-gates                   |
| High     | Unapproved URL redesigns after route map freeze                         | Approve route map; treat as production contract thereafter               |
| High     | Cloudflare workerd dependency incompatibility                           | OpenNext production preview only if Cloudflare is later chosen           |
| High     | Client-only current route protection                                    | Next.js route protection + backend authorization                         |
| High     | npm/Bun lockfile ambiguity                                              | Select canonical manager before install                                  |
| High     | TypeScript 6.0.x tooling friction with Next 16.3.x                      | Validate in foundation spike                                             |
| Medium   | Leaflet/PDF/QR hydration or bundle regressions                          | Client islands and dynamic imports                                       |
| Medium   | Tailwind/shadcn RSC assumptions                                         | Visual regression and directive audit                                    |
| Medium   | Metadata/noindex regressions                                            | Metadata API checklist; public pages primary SEO target                  |
| Medium   | Server state duplicated in global store and TanStack Query              | ADR-004: one owner for server state                                      |
| Medium   | Placeholder billing/contact/integrations mistaken for migration defects | Record baseline; do not expand scope                                     |
| Low      | Hard-coded production origins                                           | Centralize config during approved implementation                         |
| Low      | Custom route-type generator creep                                       | Prefer native App Router typing unless requirement emerges               |
