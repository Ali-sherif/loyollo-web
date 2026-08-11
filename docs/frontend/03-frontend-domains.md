# Frontend Domains

Route paths below match the **APPROVED** production map in [02-route-migration.md](02-route-migration.md).

| Domain         | Routes                                                                                                              | Principal code/data                               | Dependencies                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------- |
| Marketing      | `/`, `/about`, `/features`, `/pricing`, `/guide`, `/contact`                                                        | landing/guide/map components                      | assets, metadata                      |
| Legal          | `/legal/terms`, `/legal/privacy`                                                                                    | legal copy                                        | metadata                              |
| Authentication | `/auth/sign-in`, `/auth/sign-up`, `/auth/verify`, `/auth/verified`, `/auth/forgot-password`, `/auth/reset-password` | Auth UX; backend-owned authz                      | messaging contracts, Next route gates |
| Onboarding     | `/onboarding/*`                                                                                                     | profiles, business taxonomy, plan selection       | Auth                                  |
| App shell      | `/app`, `/app/dashboard`                                                                                            | profile/program/customer summaries                | Auth, backend                         |
| Customers      | `/app/customers`, `/app/customers/[customerId]`                                                                     | customers/rewards, CSV                            | Loyalty                               |
| Loyalty        | `/app/loyalty`, `/join/[programId]`                                                                                 | programs, rewards, QR settings                    | Customers, notifications              |
| Branches       | `/app/branches`, `/app/branches/[branchId]`                                                                         | branches, maps                                    | Auth                                  |
| Campaigns      | `/app/campaigns`, `/app/campaigns/[campaignId]`                                                                     | campaigns, recipients, email queue                | Customers, messaging contracts        |
| Analytics      | `/app/analytics`                                                                                                    | customer/reward aggregates                        | Customers                             |
| Settings       | `/app/settings`, `/app/settings/password`                                                                           | profile, MFA, uploads, integrations, password     | Auth, storage                         |
| Messaging      | `/api/email/*` BFF (was `/lovable/email/*`)                                                                         | `src/lib/server/messaging/` templates + contracts | adapter stubs (ACCEPTED RISK)         |

```mermaid
flowchart LR
  Auth --> Onboarding
  Auth --> AppShell[App shell]
  AppShell --> Customers
  AppShell --> Loyalty
  AppShell --> Branches
  Customers --> Campaigns
  Loyalty --> Join
  Campaigns --> Messaging
  Settings --> Auth
  Analytics --> Customers
```

Target `features/` modules should follow these domains; generic UI remains shared. Domain features call the existing backend / API layer; they must not own delivery providers.
