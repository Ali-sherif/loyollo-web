# Migration Risks

| Severity | Risk                                                                    | Mitigation / gate                                                        |
| -------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Critical | Authenticated RSC cannot access localStorage session                    | Cookie/SSR spike or retain client data path                              |
| Critical | Cross-user cache leakage                                                | No-store defaults; concurrent-user tests                                 |
| Critical | Service-role exposure                                                   | `lib/server`, server-only guards, bundle inspection                      |
| Critical | Public enrollment abuse/races                                           | Rate limit, idempotency/concurrency review, monitoring                   |
| Critical | No regression tests                                                     | Characterization/E2E baseline before migration                           |
| Critical | Lovable withdrawal breaks email delivery                                | Provider-agnostic adapter + template parity before removing Lovable SDKs |
| Critical | Style drift during Next.js remount                                      | Visual parity gates; no redesign; side-by-side checks                    |
| High     | Campaign work exceeds runtime limits                                    | Route Handler plus queue/job strategy                                    |
| High     | Auth/campaign callers still hit `/lovable/email/*` after cutover        | First-party `/api/email/*` paths + caller/scheduler cutover checklist    |
| High     | CDN/Lovable assets break after withdrawal                               | Vendor/re-host assets before removing manifests                          |
| High     | Email/SMS provider undecided                                            | Keep templates; defer provider; fail SMS explicitly until configured     |
| High     | Cloudflare workerd dependency incompatibility                           | OpenNext production preview tests if Cloudflare is chosen                |
| High     | Client-only current route protection                                    | Server authorization for every sensitive operation                       |
| High     | npm/Bun lockfile ambiguity                                              | Select canonical manager before install                                  |
| Medium   | Leaflet/PDF/QR hydration or bundle regressions                          | Client islands and dynamic imports                                       |
| Medium   | Tailwind/shadcn RSC assumptions                                         | Visual regression and directive audit                                    |
| Medium   | Metadata/noindex regressions                                            | Route metadata checklist                                                 |
| Medium   | Placeholder billing/contact/integrations mistaken for migration defects | Record baseline; do not expand scope                                     |
| Low      | Hard-coded production origins                                           | Centralize config during approved implementation                         |
