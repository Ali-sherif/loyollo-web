# Loyollo glossary

Canonical product and scope terminology for specs, tickets, PRs, and QA. For data-model terms (At risk, Revenue formula, roles), see [docs/backend/data-contract.md § Unified glossary](docs/backend/data-contract.md#unified-glossary).

---

## Product MVP (Ship 1)

**Product MVP (Ship 1)** is the **current trimmed merchant launch** — the first customer-facing ship the product owner commits to. It is **not** bare “Phase 1.”

| Attribute | Detail |
| --- | --- |
| **Scope doc** | [docs/product/phase-1-scope.md](docs/product/phase-1-scope.md) |
| **In scope (core)** | Merchant `/app` for `admin` and `staff`; NestJS JWT auth; independent programs (one ACTIVE); **in-shop customer join via QR** on `/app/loyalty`; public enroll OTP; staff cashier POS; catalog redemption scan |
| **Explicitly out (Ship 1 UI)** | 2FA/MFA setup; Revenue tab and revenue impact widgets; Integrations settings tab; Apple/Google Wallet pass flows; customer portal login sessions |
| **Implementation** | Excluded merchant UI is **commented out** in source (not feature flags). See [Ship 1 UI exclusion lock](docs/product/phase-1-scope.md#implementation--comment-out-do-not-refactor-decided). |

Do not confuse with:

| Label | Meaning |
| --- | --- |
| **Frontend Migration** | TanStack → Next.js App Router (ADR-011 Phase 1) |
| **Backend Remediation P[N]** | Ordered backend fix ladder — not the product ship list |
| **Feature [In/Out of Scope]** | Inclusion/exclusion for **Product MVP (Ship 1)** only |

---

## Related terms

| Term | Meaning |
| --- | --- |
| **Shop join QR** | Merchant-printable QR on `/app/loyalty` linking to public enroll — **in** Product MVP (Ship 1) |
| **Wallet QR** | Customer membership QR scanned at staff POS — **in** Product MVP (Ship 1); distinct from Apple/Google Wallet passes |
| **Staff cashier POS** | Bill Amount + Invoice Number earn flow — **in** Product MVP (Ship 1) |
| **Third-party POS** | Square, Clover, Toast, etc. — **out** of Product MVP (Ship 1) |
| **DG-*** | Deferred product/design decisions from the [2026-08-14 audit](docs/audit/2026-08-14-security-ui-product-audit.md). `DG-01`, `DG-02`, and `DG-03` are **resolved** by the Ship 1 UI exclusion lock. |
