# Customer Authentication Flow — QA & Security Analysis

**Date:** 2026-08-15  
**Audience:** QA, security, product, engineering  
**Purpose:** Production-ready breakdown of test cases, edge cases, security considerations, and system improvements for Customer Authentication (Registration & Login), grounded in `docs/` rather than a generic auth checklist.

**See also (2026-08-16):** portal case map with every UI branch — [customer-portal-journey.md](../product/customer-portal-journey.md). Use that file for functional coverage of the customer funnel; this audit stays the security/QA analysis.

**Amendment 2026-08-18:** OTP limits are **PM-06** (180s TTL, 3 guesses, 60s resend, 5/24h per phone). UX-75 required name/email/DOB. Uniqueness is per Shop identity (independent programs, ADR-016). Do not treat “TTL not locked” as current.

**Scope sources:** [ADR-005](../architecture/decisions/ADR-005-authentication.md), [11-authentication-migration.md](../frontend/11-authentication-migration.md), [auth-ssr-spike.md](../architecture/spikes/auth-ssr-spike.md), [ADR-012](../architecture/decisions/ADR-012-public-enrollment-rate-limiting.md), [api-contract.md](../backend/api-contract.md), [data-contract.md](../backend/data-contract.md), [settings-page.md](../frontend/settings-page.md), [17-messaging-templates.md](../frontend/17-messaging-templates.md), and the [2026-08-14 security/UI/product audit](./2026-08-14-security-ui-product-audit.md).

**Important framing — there are two separate, non-overlapping auth systems, at very different maturity levels:**

| Plane | Identity | Password | Status |
|---|---|---|---|
| **Merchant** (`admin`/`staff`) | Supabase Auth email/password | Yes (+ TOTP MFA) | **Partially shipped** — sign-up/sign-in/verify/reset UI exists; `staff` invite, `role`, `account_status` do **not exist in schema** |
| **Customer** (shop loyalty member) | Phone-based OTP (SMS/WhatsApp) | **Never** — passwordless by lock ([11-auth §Shop-customer register](../frontend/11-authentication-migration.md#shop-customer-register-and-login-decided)) | **DECIDED, not shipped.** Today the customer has no login at all — only `POST /api/join/enroll` with OTP, no session, no wallet, no return login |

Every test case below is tagged **[SHIPPED]**, **[DECIDED-NOT-SHIPPED]**, or **[NOT-IN-DOCS]** so QA knows what's testable today vs. what should be written as pre-emptive specs for the customer-auth build.

---

## 1. Standard Functional Test Cases (Happy Path)

### 1.1 Registration

| # | Test Case | Plane | Status |
|---|---|---|---|
| R-01 | `admin` signs up with valid email + password → account created, `signup` confirmation email enqueued | Merchant | [SHIPPED] |
| R-02 | Clicking the confirmation link verifies email → user can complete onboarding | Merchant | [SHIPPED] (mail delivery is a stub — see §3) |
| R-03 | Post-verify, onboarding profile steps persist (name, business fields) | Merchant | [SHIPPED] |
| R-04 | Onboarding plan selection writes `profiles.plan` | Merchant | [SHIPPED as UI] — **no real checkout**, writes for free (`G-07`) |
| R-05 | `admin` fills "add teammate" form (name, email, role `admin`\|`staff`) → backend creates auth user, generates random temp password, sends "teammate created" email with email + temp password | Merchant | [DECIDED-NOT-SHIPPED] — `G-34`, no UI/API exists |
| R-06 | New teammate's **first login** with temp password forces a password-change screen before `/app` access; subsequent logins do not re-trigger it | Merchant | [DECIDED-NOT-SHIPPED] |
| R-07 | Customer scans QR → `/join/[programId]` → requests OTP (`POST /api/join/otp/request`, channel `sms`\|`whatsapp`) → enters code → `POST /api/join/enroll` verifies OTP in the same transaction as the `customers` INSERT | Customer | [DECIDED-NOT-SHIPPED for OTP gate] — enroll route exists today **without** the OTP step; add OTP-gated version per [api-contract §Join — OTP + enroll](../backend/api-contract.md) |
| R-08 | Enroll with a valid `?ref=` referral code grants the **referred** party a reward (points/voucher) in the same transaction, immediately | Customer | [DECIDED-NOT-SHIPPED] |
| R-09 | Returning phone/email in the same program on scan = check-in, **not** a new OTP, **not** a second referral | Customer | [DECIDED-NOT-SHIPPED] |
| R-10 | Social auth registration (Google/Facebook/Apple) | Either | **[NOT-IN-DOCS]** — `DG-01` in the audit: never mentioned as included or excluded from Phase 1. Flag to PM before writing test cases against it. |
| R-11 | Magic-link sign-up/sign-in | Merchant | **Template exists** (`magiclink` React Email component, [17-messaging-templates.md](../frontend/17-messaging-templates.md)) but no UI flow is documented as wired — verify with engineering before testing as a real flow. |

### 1.2 Login

| # | Test Case | Plane | Status |
|---|---|---|---|
| L-01 | `admin`/`staff` sign in with email + correct password → session established → redirect to `/app` | Merchant | [SHIPPED] |
| L-02 | Unverified email + correct password → session exists but client bounces to `/verify` | Merchant | [SHIPPED, but **client-only** gate — flag as risk, see §3 S-01] |
| L-03 | `admin`/`staff` with TOTP MFA enrolled completes password step, then is challenged for a 6-digit TOTP code (AAL2) before session is fully trusted | Merchant | **Enroll is real; the sign-in-side challenge is documented as possibly missing** (`G-26`: "Sign-in MFA challenge incomplete"). Must be tested explicitly — do not assume it works because enrollment works. |
| L-04 | Direct navigation to a protected `/app/*` URL while unauthenticated → redirected to sign-in | Merchant | [SHIPPED] via proxy `PROTECTED_PREFIXES` |
| L-05 | Direct navigation to `/onboarding/*` while unauthenticated | Merchant | **Proxy does NOT gate `/onboarding`** — only the RSC layout's `requireUser()` does, and that check does not verify email/role/status either. Test this path specifically (`S-01`). |
| L-06 | Customer requests OTP → enters correct code within TTL → gets a session/portal access (never `/app`) | Customer | [DECIDED-NOT-SHIPPED] — no customer session model exists yet at all |
| L-07 | Cross-tab session sync: sign out in one tab reflects in another | Merchant | Listed in ADR-005 verification list — not confirmed tested |
| L-08 | Refresh/expiry: silent token refresh keeps user logged in past the JWT's short expiry | Merchant | [SHIPPED via Supabase localStorage auto-refresh] — **but this is the pre-migration model; the Next.js cookie/SSR equivalent is unproven** (`D-28`, see §3) |

---

## 2. Edge Cases & Boundary Conditions

### 2.1 Input validation

| Severity | Test Case | Notes |
|---|---|---|
| **High** | SQLi payloads (`' OR '1'='1`, `; DROP TABLE`) in email/phone/name fields on sign-up, add-teammate form, and OTP request | Supabase/PostgREST parameterizes queries, but **any raw string concatenation in custom RPCs/SQL functions** (e.g. `handle_new_user`, future OTP verify RPC) must be checked. `handle_new_user` already has a flagged `search_path` issue (`S-09`) — a different but related class of injection (function hijack via poisoned `public` schema). |
| **High** | XSS payloads (`<script>`, `javascript:` URI, `onerror=`) in name/business fields that later render in emails or the dashboard | The audit found a **live** stored-XSS/open-redirect bug in a related surface (`notifications.linkPath`, unsanitized — `S-05`) proving this class of bug exists in this codebase; the same discipline (zod schema + allow-list) is not yet proven on auth-adjacent forms like add-teammate. Test rendering of injected names in the "teammate created" email and in `/app` UI headers. |
| **Medium** | Leading/trailing/internal whitespace in email, e.g. `" user@x.com "`, `"us er@x.com"` | Verify normalization before Supabase Auth call and before OTP phone match (`otp_verifications` keys on exact phone). |
| **Medium** | Extremely long strings (name field 10,000 chars, email 500 chars) | No documented max-length constraints on `profiles`/`customers` text columns found in `data-contract.md` — likely relies on Postgres `text` (unbounded). Confirm app-level caps exist; otherwise a DoS/storage-bloat vector. |
| **High** | International phone numbers for OTP: non-E.164 formats, numbers with country-code ambiguity (e.g. `+1` vs local), numbers with letters | `otp_verifications.phone` is documented as **E.164, required**. Test rejection of malformed numbers, and correct channel routing (`sms` vs `whatsapp`) for numbers that only support one channel in a given country. |
| **Medium** | Unicode/RTL text in name fields (Arabic given the merchant base) mixed with LTR punctuation | Loyollo's audience is Arabic-first (`نشط`/`غير نشط` used in product docs for active/inactive). Test bidi rendering in emails and UI, not just storage. |
| **Low** | Case sensitivity in email (`User@Example.com` vs `user@example.com`) creating duplicate accounts | Supabase Auth normally lower-cases emails; confirm this is not bypassable via sign-up API directly. |
| **High** | Duplicate `customers` row race: two concurrent enroll requests with the same email/phone in the same Shop | **Confirmed gap** (`S-17`). Uniqueness is per **Shop identity** (2026-08-18 independent programs; phone unique per Shop when present). Still an unresolved defect — write a load-test case. |

### 2.2 Concurrency, timeouts, duplicate requests, device switching

| Severity | Test Case | Notes |
|---|---|---|
| **High** | Double-submit of the enroll/OTP-verify form (double-click, or slow network + retry) | `otp_verifications` has a unique index `(loyalty_program_id, phone) WHERE status = 'pending'` and a `consumed_at` one-time-use column — this is good design, but must be tested: does the second concurrent request get a clean 409/idempotent response, or a raw DB constraint error leaking to the client (pattern already seen in `S-08`)? |
| **High** | Concurrent QR re-scans (check-in) on the same customer at the same second | **Confirmed defect** (`S-04`): check-in is "a non-atomic read-modify-write... Concurrent QR scans can both read the same balance" → lost update, double-award of points/visits. Must be a P1 regression test once a ledger/atomic update ships. |
| **Medium** | Referral self-invite / same device+IP invite-then-enroll within the same UTC minute | Product has an explicit fraud rule: same device-hash or IP-hash + same-minute invite/enroll → `status = pending_review`, referrer grant blocked. Test the boundary exactly at the minute rollover (23:59:59 → 00:00:00) and hash collisions across unrelated users on shared NAT/WiFi (false positive risk). |
| **Medium** | Network timeout mid-OTP-verify transaction | Contract says OTP-verify + customer INSERT + referral INSERT happen in **one transaction**; if the client times out after the server commits, does the UI retry and hit the `consumed_at` "already used" state gracefully, or show a raw error? |
| **Medium** | Device switching mid-flow: request OTP on phone A's browser, enter code on a different device/tab | No documented binding between OTP request and the entering client (no CSRF/session token tying request to verify) — test whether OTP+phone alone is sufficient to hijack someone else's pending code from a different device (this overlaps with §3 OTP interception risk). |
| **Low** | Sign-in on device A, then password change on device B (merchant) | Verify old sessions are invalidated — see §3 "session revocation on password change." |

### 2.3 Expired tokens, invalid OTPs, lockouts

| Severity | Test Case | Notes |
|---|---|---|
| **High** | OTP entered after `expires_at` | Contract: expired/invalid/missing OTP → `401`/`410`, **no member row created**. Test exact boundary (code entered 1s after expiry) and that no partial `customers` row leaks. |
| **High** | OTP attempt cap / brute-force of the 6-digit code | **Explicitly documented as an open question**: *"OTP challenge TTL and attempt cap"* is listed under "Not decided in this discussion" in [product-manager-meeting-report.md](../product-manager-meeting-report.md). **There is currently no locked attempt-cap policy.** This is a real gap QA/security should escalate — a 6-digit OTP with unlimited guesses is brute-forceable in ~10⁶ tries with no rate limiting beyond the generic enroll endpoint limit. |
| **High** | Expired/invalid Supabase email confirmation or password-reset link | Merchant plane — verify link expiry behavior and that resubmission works without ambiguous state. |
| **High** | Account lockout after N failed password attempts (merchant) | **Not found in any doc.** ADR-005/11-auth describe MFA, recovery, verification — no failed-login lockout/backoff policy is specified anywhere in `docs/`. This is a genuine spec gap (see §5 Recommendations) — write it as a "cannot test, no defined behavior" finding, not a pass/fail. |
| **Medium** | `account_status = inactive` staff/customer attempting login | **Cannot be tested today** — `account_status` column does not exist in schema (`S-01`, `G-36`). Once shipped: test that inactive staff get blocked at `/app` and inactive customers get blocked from the OTP login, distinctly from a "wrong OTP" error (no enumeration — see §4). |
| **Medium** | First-login forced password change — user tries to skip it (browser back button, direct `/app` URL) | Test that the gate cannot be bypassed by navigating away from the force-change screen. |
| **Medium** | `staff` uses the owner's `/auth/forgot-password` screen **before** `G-34` ships (today) | Documented current behavior: *"the audit warning that staff using that screen resets the buyer applies today, while staff have no auth user."* — i.e., today there is no staff account to protect, but once one exists, verify reset is scoped to the individual email, not "the buyer's account." |

---

## 3. Security & Compliance Edge Cases

### 3.1 Rate limiting & brute-force prevention

| Severity | Finding / Test Case | Source |
|---|---|---|
| **Critical** | `/api/join/enroll` and `/api/join/otp/request` rate limiting is an **in-memory `Map`, 10/min per IP** — resets on every serverless cold start and is **per-instance**, so it does nothing on multi-instance Vercel deployment. Test: hit from many concurrent requests until they clearly bypass the "10/min" intent by landing on different instances. | `S-07`, `G-18` |
| **Critical** | `GET /api/join/program` **defines** a `rateLimit` function and **never calls it**. Program lookup (and by extension UUID enumeration / QR scraping) is completely unthrottled today. | `S-07` |
| **High** | No CAPTCHA on public join/enroll/OTP-request — explicitly "out of scope" for the current rate-limit ADR (ADR-012 §Out of scope), to be revisited only "if abuse evidence requires it." Flag as accepted risk, not a bug, but worth a monitoring/alerting test. | ADR-012 |
| **High** | OTP request flooding a single phone number (SMS/WhatsApp cost-bombing a victim's phone) — no attempt cap decided (see §2.3). This is a distinct abuse vector from "attempts to guess a code": it's "attempts to spam a victim with codes." | product-manager-meeting-report.md (open question) |
| **Medium** | Rate limit response contract: server must return **HTTP 429** (locked), frontend must show a clear toast and disable the submit button, and must **not silently retry**. Test that a 429 is never retried automatically by client code, and that the UI never allows rapid resubmission. | ADR-012 |

### 3.2 Password reset abuses & token leakage

| Severity | Finding / Test Case |
|---|---|
| **Critical** | The entire merchant password-reset flow is dependent on the email transport, which is **a stub that always returns `{ ok: false }`**. Any pen-test / QA pass on "reset password" today will find that **no reset email is ever delivered** — this isn't a bug to file per-test, it's a go/no-go blocker for the whole flow (`S-02`, action item `C1`). |
| **Critical** | Failed queue sends are logged but **not deleted from the queue** — the failure path `continue`s without `delete_email`, so the queue **re-reads the same failed message forever**. Test for queue growth/duplicate-send risk once a real transport is wired in (a backlog of stuck "failed" reset emails could all fire at once). |
| **High** | Password-reset token/link — verify it's single-use, and that requesting a second reset invalidates the first link (standard Supabase behavior, but must be re-verified once Next.js owns redirect handling). |
| **High** | Admin's "re-issue temporary password" path for a locked-out teammate — since this bypasses the normal Supabase recovery-link email in favor of the "teammate created" template carrying a **plaintext temp password in email**, test: (a) that this email requires the same delivery guarantees as recovery mail, (b) that the temp password is invalidated/forced-changed on first use, and (c) that email transport/logging never persists the plaintext password anywhere retrievable after use (e.g. queue logs, `email_send_log`). |
| **Medium** | `redirectedFrom` query param is set by the proxy from pathname but **never consumed** by sign-in today. Flag as low current risk, but the moment someone wires `navigate(redirectedFrom)` without an allow-list, it becomes an **open redirect** (`S-16`). Add a regression test *now* that fails if `redirectedFrom` is ever used unsanitized. |

### 3.3 Session hijacking, CSRF, token revocation

| Severity | Finding / Test Case |
|---|---|
| **Critical** | Today's session model persists the Supabase JWT in **`localStorage`**, which is inherently exposed to XSS (ADR-005 Risks section states this explicitly). Any XSS anywhere in the app (and one is already confirmed elsewhere in the codebase — `S-05`, stored XSS via unsanitized `linkPath`) is a session-theft vector until the cookie/SSR migration (`D-28`) lands. This should be treated as an **open Critical risk**, not a hypothetical. |
| **Critical** | The Next.js cookie/SSR migration (`D-28`) remains **BLOCKED / ACCEPTED RISK, not PASSED** as of the last spike — signup/login could not even establish a real HTTP-only cookie session in the isolated POC (`Email not confirmed` blocked it). **Do not write test cases assuming cookie-based sessions work in the Next.js app yet** — verify which session model (legacy TanStack localStorage vs. new Next cookie) is actually live before testing session-hijack scenarios, or you will get false results. |
| **High** | CSRF: ADR-005/11-auth state "CSRF is required if cookie-authenticated mutations are introduced." Since D-28 is not yet proven/shipped, **no CSRF protection has been verified to exist at all** for any future cookie-based mutation path. This must be a gating test before cookie auth ships — not an afterthought. |
| **High** | Session revocation on password change: verify that changing a password (Settings or reset flow) invalidates **all other active sessions/refresh tokens**, not just the current one. Not explicitly confirmed anywhere in the docs — test explicitly. |
| **High** | Server-side auth checks (`requireUser()`, the `/app` proxy) currently validate **only that a session exists** — no check for email verification, role, or account status (`S-01`). This means a session hijacked from an *unverified* account, or (once shipped) an *inactive* account, would still pass every server gate today. Concretely: `if (user) return user;` is the entire guard. |
| **Medium** | Service-role client `client.server.ts` (legacy TanStack) lacks the `import "server-only"` guard that its Next.js equivalent (`admin.ts`) has — a theoretical accidental client-bundle import could leak `SUPABASE_SERVICE_ROLE_KEY` (`S-10`). Test bundle analysis / static import graph as a CI check, not just runtime. |
| **Medium** | MFA/AAL2 bypass: if the sign-in MFA challenge is genuinely incomplete (`G-26`), a session could reach `/app` at AAL1 despite the user having enrolled TOTP — effectively silently disabling their own 2FA. This is a **security regression waiting to be confirmed** — test explicitly rather than trusting the enroll UI as proof MFA is enforced. |

### 3.4 Compliance / data-handling edge cases

| Severity | Test Case |
|---|---|
| **Medium** | Referral fraud hashes: `invite_ip_hash` / `enroll_ip_hash` are documented as **hashed, never raw IP** ("Hash IP and device; do not store raw IP as the product field"). Test that no code path logs/persists a raw IP anywhere in the auth or join pipeline (console logs count — logger is `console.*` JSON today with no audit-log redaction layer, `S-19`). |
| **Medium** | No `audit_log` exists for auth-adjacent sensitive changes (role grants, account status flips, plan/points changes) (`S-19`). Compliance test: can you reconstruct "who changed X and when" for any auth-relevant mutation today? Currently: no. |
| **Low** | Marketing consent at enroll: "disclaimer copy, no stored opt-in" — join does not check `suppressed_emails` before adding a new contact. Test whether a previously-suppressed/unsubscribed phone/email can re-enter the messaging pipeline via a fresh enroll. |

---

## 4. UX & Error-Handling Edge Cases

### 4.1 User enumeration / generic vs. friendly errors

| Severity | Test Case | Notes |
|---|---|---|
| **High** | Sign-up with an already-registered email — does the error say "email already registered" (enumeration) or something generic? | Not explicitly locked in docs; test current behavior and flag to product if it enumerates. |
| **High** | OTP request for a phone that doesn't match any pending program vs. one that does — response timing/shape must not reveal which case occurred | No documented timing-safe design here (contrast with `email/queue/process`, which *is* documented as timing-safe today for its bearer check). Test for response-time or payload differences that leak existence. |
| **High** | Login with wrong password for a real vs. non-existent email — must return the same generic message/timing | Standard Supabase Auth behavior is generally safe here, but must be verified post-migration since Next.js now owns more of the request path. |
| **High** | Raw backend error messages leaking to the browser | **Confirmed existing bug, not hypothetical**: `POST /api/join/enroll` returns `{ error: error.message }` directly (`S-08`), same for `/api/campaigns/send`. Internal PostgREST/RPC error text (e.g. constraint names, column names) can reach the client. This is directly adjacent to the auth/enroll flow — write a specific regression test asserting enroll never echoes a raw DB error string. |
| **Medium** | Inactive-account error message parity: once `account_status` ships, does "your account is inactive" read differently from "wrong OTP/password" in a way that lets an attacker distinguish valid-but-disabled accounts from invalid ones? | Design this generically now, before `G-36` ships, to avoid retrofitting. |

### 4.2 Autofill, copy-paste, state persistence on drop-off

| Severity | Test Case |
|---|---|
| **Medium** | Password managers/autofill correctly populate email+password on `/auth/sign-in`, and the new-password field on `/auth/reset-password` and `/app/settings/password` triggers "save new password" prompts correctly (correct `autocomplete` attributes: `username`, `current-password`, `new-password`). |
| **Medium** | OTP input field: verify `autocomplete="one-time-code"` is set so mobile browsers can auto-fill from SMS, and that paste is **not blocked** on the 6-digit code field (blocking paste on OTP fields is a common anti-pattern that actively hurts legitimate autofill/copy from SMS apps). |
| **Low** | Copy-paste on password fields should **not** be disabled — disabling paste on password fields is a known anti-UX pattern that discourages password-manager use and pushes users toward weaker, memorable passwords. No doc currently mandates blocking paste; flag as a "do not implement" guardrail. |
| **Medium** | Drop-off recovery: user abandons the multi-step onboarding after email verify but before finishing profile — returning later resumes at the correct step rather than restarting. Confirmed as intended behavior for onboarding steps generally, but not explicitly tested for every abandonment point. |
| **Medium** | Drop-off on the customer join/OTP flow: user requests OTP, backgrounds the browser/app to fetch the SMS, returns — form state (phone, program, referral code) must persist, and the OTP input should still be focused/ready rather than resetting the whole form. |
| **Low** | Add-teammate form: `admin` fills the form, network drops before submit — no partial teammate record should be creatable, and the form should retain typed values on retry. |

---

## 5. Proposed System & Architecture Improvements

### 5.1 Gaps found in the docs (things QA should raise with PM/architecture, not file as "bugs")

| ID | Gap | Why it matters |
|---|---|---|
| DG-01 (audit) | **No product-Phase-1 decision on social login (Google/Facebook/Apple).** Never mentioned as in, out, or deferred. | You cannot write conformance test cases against an undecided feature — get an explicit yes/no before the QA suite includes/excludes it. |
| — | **No account-lockout / failed-login-attempt policy** for the merchant password login, anywhere in `docs/`. | Currently untestable as pass/fail; the system may be wide open to unlimited password guessing at the Supabase Auth layer with only whatever Supabase's own defaults provide (undocumented here). |
| — | **No OTP attempt-cap / TTL** — explicitly listed as "not decided" in the product meeting report. | A 6-digit OTP with no attempt cap is a textbook brute-force target. This should be escalated as a **security-blocking** decision before OTP-based customer login ships, not filed as a low-priority doc gap. |
| S-01 | **Server-side auth guards check session existence only** — no verification/role/status checks in `requireUser()` or the proxy. | Every rule the product has "locked" (customer never reaches `/app`, inactive staff blocked, unverified users blocked) is currently **unenforceable at the server**, only simulated by client-side redirects. This is the single most important thing for QA to keep testing every release until closed. |
| S-15 / D-28 | **Cookie/SSR session migration is unproven** — the last spike could not even complete a signup→login round trip in an isolated POC. | Any test plan for the Next.js app's auth must first confirm *which* session mechanism is actually live (legacy localStorage vs. new cookie) before writing hijack/CSRF/XSS test cases against the wrong model. |
| — | **No documented backoff/lockout UX** (e.g., exponential delay, temporary lock, "too many attempts" messaging) for merchant login — contrast with the OTP flow, which at least has a 429 contract via ADR-012. | Password login and OTP login have asymmetric protection levels documented; worth normalizing. |

### 5.2 Recommended authentication best practices

| Recommendation | Rationale |
|---|---|
| **Passkeys / WebAuthn for `admin`/`staff`** | Removes password-brute-force and phishing risk entirely for the merchant plane, which today has no documented lockout policy. Complements the existing real TOTP MFA rather than replacing it. |
| **Move merchant sessions off `localStorage` to HTTP-only cookies as a hard prerequisite**, not an "accepted risk" | ADR-005 already flags this as the top risk; the audit independently confirms a stored-XSS bug already exists elsewhere in the app (`S-05`). The combination (XSS bug + localStorage token) is a realistic full-account-takeover chain today, not a theoretical one. This should be re-prioritized above "accepted risk, prove later." |
| **Define and enforce a failed-login backoff/lockout policy** (e.g., exponential delay after 5 attempts, hard lock + email notice after 10) for merchant password login | Currently entirely undocumented — a clear near-term security debt. |
| **Define OTP TTL + attempt cap + per-phone request cooldown**, distinct from the per-IP enroll rate limit | Needed before customer OTP login ships; currently explicitly "not decided." |
| **Server-side role + account_status enforcement** at every layer (proxy, `requireUser()`, every merchant-only API route) — not just schema addition | This is already the audit's top Critical item (`C2`) and should be the single highest-priority item before any customer-auth or staff-auth work is trusted in production. |
| **Real, structured audit logging** for auth-relevant events (login, failed login, password change, MFA enroll/disable, role/status change, temp-password issuance) | No `audit_log` and no structured logger (only `console.*` JSON) exists today (`S-19`). Without this, support cannot answer "who did this and when," and no security investigation is possible after an incident. |
| **Timing-safe, generic responses everywhere identity is checked** (login, OTP verify, password reset request) | Only one endpoint in the codebase is documented as timing-safe today (the internal queue-processor bearer check); the user-facing identity checks have no such guarantee documented. |
| **Redis/Upstash-backed rate limiting at the edge**, replacing the in-memory `Map`, before any multi-instance production deploy | Already flagged as Critical/High in the audit (`S-07`, `G-18`) — this is a hosting-correctness bug, not just a security nice-to-have, since the current limiter literally does nothing under normal serverless scaling. |
| **Passwordless-first design for the customer plane is good** (already locked) — extend it with a **magic-link fallback** for customers on channels where SMS/WhatsApp delivery is unreliable | Since email OTP/magic-link templates already exist (`magiclink.tsx`) but aren't wired to a flow, this could reuse existing template infrastructure with low incremental cost, and gives customers a fallback if SMS/WhatsApp delivery fails (the docs already flag SMS/WhatsApp as stub transports today). |
| **Close the email-transport stub before relying on any password-reset or verification testing being meaningful** | Every reset/verify/invite test case in this whole document is gated on real mail delivery, which the audit confirms is **currently always failing** (`S-02`). This is the actual first blocker to make any of §1–§4 executable against a real environment. |

---

**Bottom line for planning QA work:** the merchant password/MFA flow is the only piece mature enough for a normal regression suite today, and even that has two confirmed server-side authorization gaps (`S-01`, MFA challenge `G-26`) and one delivery blocker (`S-02`, email stub) that will make most "happy path" reset/verify tests fail in any real environment until fixed. The customer OTP flow, staff invite flow, and account-status gating are all **DECIDED product requirements with zero shipped schema or API** — QA's most valuable near-term contribution is turning the test cases above (especially OTP attempt-cap, lockout policy, and role/status enforcement) into acceptance criteria attached to those backend tickets *before* they're built, rather than testing them after the fact.

---

*This file is documentation extracted from the 2026-08-15 QA analysis conversation. It does not authorize implementation, schema changes, or a visual redesign ([ADR-010](../architecture/decisions/ADR-010-style-and-template-parity.md), [ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)).*
