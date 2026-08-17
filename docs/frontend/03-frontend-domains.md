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
| Loyalty        | `/app/loyalty`, `/join/[programId]` (approved); Shop QR always **this Shop** | capabilities, rewards, QR settings, catalog redeem QR verify | Customers, notifications; [program-model.md](../product/program-model.md) · [counter QR](../product/counter-qr-and-program-membership.md) · [redemption](../product/reward-redemption-flow.md) |
| Customer portal (DECIDED, not in approved map) | Shop-customer register/login — **passwordless OTP**; **routes not locked**; not `/app` `admin` / `staff` auth. Wallet: **one card per Shop** (available points + reserved + expiry + share + **reward progress** + catalog redeem pending QR) | customer identity + stored activity + calculated KPIs + per-Shop wallet | [G-33](gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows), [credential recovery](11-authentication-migration.md#credential-recovery-decided), [program-model.md](../product/program-model.md), [loyalty-page.md](loyalty-page.md#customer-wallet-per-shop-decided), [reward progress](../product/customer-reward-progress.md), [redemption](../product/reward-redemption-flow.md), Auth |
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
