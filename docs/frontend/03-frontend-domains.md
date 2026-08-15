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
| Customer portal (DECIDED, not in approved map) | Shop-customer register/login — **passwordless OTP**; **routes not locked**; not `/app` `admin` / `staff` auth. Wallet: **one card per program** (points + expiry + share) | customer identity + stored activity + calculated KPIs + per-program wallet | [G-33](gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows), [credential recovery](11-authentication-migration.md#credential-recovery-decided), [loyalty-page.md](loyalty-page.md#customer-wallet-per-program-decided), Auth |
| Branches       | `/app/branches`, `/app/branches/[branchId]`                                                                         | branches, maps                                    | Auth                                  |
| Campaigns      | `/app/campaigns`, `/app/campaigns/[campaignId]`                                                                     | campaigns, recipients, email queue                | Customers, messaging contracts        |
| Analytics      | `/app/analytics`                                                                                                    | customer/reward aggregates                        | Customers                             |
| Settings       | `/app/settings`, `/app/settings/password`                                                                           | profile, MFA, uploads, integrations, password     | Auth, storage                         |
| Accounts (DECIDED, not in approved map) | **One** `/app` page, **two tabs:** Team (`admin`+`staff`) and Customers (`customer`); active/inactive + filters. Route not locked (likely Settings / team). | `account_status`; not member `customers.status` | [G-36](gaps-and-solutions.md#g-36--no-admin-account-list-or-activeinactive-for-staffcustomer), [account status](11-authentication-migration.md#account-active--inactive-decided) |
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
