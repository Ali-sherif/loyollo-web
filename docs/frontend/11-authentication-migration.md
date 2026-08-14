# Authentication Migration

Aligned with [ADR-005](../architecture/decisions/ADR-005-authentication.md).

## Current behavior

Supabase browser auth persists in localStorage, auto-refreshes, and drives `AuthProvider`. A global TanStack client middleware adds the access token as Bearer for authenticated server functions. Most protected routes redirect in `useEffect`; MFA and recovery are client flows.

## Target behavior

1. Keep authentication and authorization ownership in the backend (Supabase Auth + RLS/policies remain the final source of truth for permissions).
2. Do not duplicate business authorization logic in the frontend.
3. Use secure HTTP-only cookies/session mechanisms where applicable; prove cookie/SSR session refresh in a spike before adopting it broadly.
4. Next.js is responsible for route protection, session-aware rendering, and redirects.
5. Client checks may remain for UX only; they are not authorization.
6. Build separate browser and server client factories.
7. Validate ownership even when using the service-role client on the server.
8. Preserve exact verification, recovery, MFA, onboarding, and sign-out behavior.

## Locked role matrix

**DECIDED.** Canonical stored names: `admin` · `staff` · `customer`. There are no other logged-in roles.

This is **not** [ADR-011](../architecture/decisions/ADR-011-rls-storage-strategy.md) “Phase 1 — frontend migration” and **not** [remediation-roadmap](../backend/remediation-roadmap.md) Phase 1 (tier ladder).

| Role | Who | Surface | Permissions |
|------|-----|---------|-------------|
| **`admin`** | Buys Loyollo (the shop). Same as today’s **owner** (`owner_id`). | Merchant **`/app`** | Full merchant access. Product Phase 1: the software-purchase account is this role. |
| **`staff`** | Works for that shop (team). | Merchant **`/app`** | **For now: same permissions as `admin`.** A later split (limited staff) is not locked. Subtypes (manager / cashier / …) are **not** locked. |
| **`customer`** | Shops at that business (loyalty member). | Customer register/login — **not** `/app` | Customer data + calculated KPIs only. Never merchant `/app`. |

**Today:** there is typically one `/app` login per shop; it is **`admin`**. When `staff` accounts exist, they may use `/app` with **the same permissions as `admin`** until a split is approved. `staff` is a **different role name**, not a different permission set yet.

**Not a role:** marketing-site visitor; QR join before register. **Status** and **tier** on a customer are not roles.

Rules: `admin` / `staff` are never a shop `customer`. `customer` never gets `/app` as merchant. Do not call the buyer role `purchaser` — stored name is **`admin`**.

Today there is no `profiles.role` column. Implicit merchant role is **`admin`**. Do not add a roles table from this frontend repo ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).

Canonical glossary: [data-contract.md](../backend/data-contract.md#unified-glossary). Product note: [product-manager-meeting-report.md](../product-manager-meeting-report.md).

## Admin adds admin or staff (DECIDED)

**An `admin` will have a form to add another `admin` or `staff`.** This is not shipped. Route in `/app` is **not** locked (likely Settings / team). Backend-owned ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)). Gap: [G-34](gaps-and-solutions.md#g-34--admin-cannot-create-adminstaff-with-emailed-temp-password).

### Form

The `admin` enters the new person’s **information** and chooses role **`admin`** or **`staff`**. Locked fields: at least **name**, **email**, **role**. Other profile fields (phone, etc.) are **not** locked.

This is **not** the shop-`customer` register form.

### Create account

On **Create account** the backend:

1. Creates the `/app` auth user with the chosen role (`admin` | `staff`).
2. Generates a **random temporary password** (the `admin` does not pick it).
3. Sends that person an **email** (messaging contracts only — [17-messaging-templates.md](17-messaging-templates.md), [ADR-010](../architecture/decisions/ADR-010-style-and-template-parity.md)).

### Email (required facts)

The mail must tell them they were **added**, and include:

| Fact | Required |
|------|----------|
| They were added to the shop’s Loyollo `/app` | Yes |
| Their **email** | Yes |
| The **temporary password** (the random one) | Yes |

Exact copy, subject, and layout are **not** locked. The existing auth **`invite`** template is an **accept-link / create-your-account** flow (`You've been invited`). **Do not replace that template’s current meaning.** Add (or extend via contracts) a **teammate-created** email that carries the three facts above.

### Permissions

`staff` still has **the same `/app` permissions as `admin` for now**. The **create teammate** action is described as an **`admin`** action. Whether `staff` can also open this form is **not** locked.

### First login (DECIDED)

On **first login** with the temporary password, the new `admin` / `staff` **must change that password** before using `/app`. They cannot skip it. After they set their own password, later logins are normal.

## Shop-customer register and login (DECIDED)

**We will add register and login for Customers of the shop** — not only the current behavior where the shop owner types customers in by hand.

| Who | Auth | Role |
|-----|------|------|
| Buys Loyollo | `/app` sign-up / sign-in (today) | **`admin`** |
| Works for that shop | `/app` (when invited) | **`staff`** — **same permissions as `admin` for now** |
| Customer of that shop | Customer register / login (routes not locked; **not** `/app`) | **`customer`** |

Purpose:

1. **Store their data** on a customer account (profile + activity), not only an owner-created row.
2. **Calculate KPIs** from that stored data (visits, stamps, points, redemptions, recency) — merchant Analytics/Dashboard and customer-facing progress — instead of relying only on fields the owner typed.

**Today:** owner **Add Customer** in `/app/customers`, plus unauthenticated QR join/enroll (`/join/[programId]`). Owner (`admin`) manual add **remains** as a merchant tool. Join/check-in remains a capture path until (and likely after) customer auth; enroll should **link** to the customer account when that identity exists.

Customer auth must **not** grant `admin` / `staff` `/app` access. Rate-limit public signup/enrollment ([ADR-012](../architecture/decisions/ADR-012-public-enrollment-rate-limiting.md)). Schema and APIs are backend-owned ([ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)). Gap: [G-33](gaps-and-solutions.md#g-33--shop-customers-have-no-registerlogin-kpis-rely-on-owner-typed-rows).

## Backend change required

| Concern                                | Backend change required                                                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| App Router pages/forms                 | No                                                                                                                                          |
| Server verification of current session | No                                                                                                                                          |
| Cookie-based SSR session               | UNKNOWN; likely configuration/adapter work, must prove                                                                                      |
| RLS/schema                             | No for Phase 1 — retain existing policies ([ADR-011](../architecture/decisions/ADR-011-rls-storage-strategy.md)); Phase 2 Backend APIs only |
| Auth email webhook URLs                | Configuration update at cutover, not contract redesign                                                                                      |

## Security gates

CSRF is required if cookie-authenticated mutations are introduced. XSS remains material while tokens are in localStorage. Redirect destinations must be allow-listed. Secrets are referenced by name only. Frontend route gates must never substitute for backend permission checks.
