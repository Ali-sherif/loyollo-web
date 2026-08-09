# Migration Risks

| Severity | Risk                                                                    | Mitigation / gate                                      |
| -------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| Critical | Authenticated RSC cannot access localStorage session                    | Cookie/SSR spike or retain client data path            |
| Critical | Cross-user cache leakage                                                | No-store defaults; concurrent-user tests               |
| Critical | Service-role exposure                                                   | `lib/server`, server-only guards, bundle inspection    |
| Critical | Public enrollment abuse/races                                           | Rate limit, idempotency/concurrency review, monitoring |
| Critical | No regression tests                                                     | Characterization/E2E baseline before migration         |
| High     | Campaign work exceeds runtime limits                                    | Route Handler plus queue/job strategy                  |
| High     | Lovable email/webhook/scheduler coupling                                | Preserve URLs/contracts; platform spike                |
| High     | Cloudflare workerd dependency incompatibility                           | OpenNext production preview tests                      |
| High     | Client-only current route protection                                    | Server authorization for every sensitive operation     |
| High     | npm/Bun lockfile ambiguity                                              | Select canonical manager before install                |
| Medium   | Leaflet/PDF/QR hydration or bundle regressions                          | Client islands and dynamic imports                     |
| Medium   | Tailwind/shadcn RSC assumptions                                         | Visual regression and directive audit                  |
| Medium   | Metadata/noindex regressions                                            | Route metadata checklist                               |
| Medium   | Placeholder billing/contact/integrations mistaken for migration defects | Record baseline; do not expand scope                   |
| Low      | Hard-coded production origins                                           | Centralize config during approved implementation       |
