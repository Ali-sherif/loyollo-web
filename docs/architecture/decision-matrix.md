# Architecture Decision Matrix

| ID   | Decision          | Current state                      | Proposed decision                                                 | Impact   | Reversibility | Status              | Dependencies     |
| ---- | ----------------- | ---------------------------------- | ----------------------------------------------------------------- | -------- | ------------- | ------------------- | ---------------- |
| D-01 | Next.js line      | TanStack Start 1.x                 | Next.js 16.3.x; React/React DOM 19.2.x; TypeScript 6.0.x          | Critical | Hard          | DECIDED             | ADR-001          |
| D-02 | Node line         | Unpinned; Node 22 types installed  | Node 24 LTS for Node deploys; workerd via OpenNext if Cloudflare  | Critical | Moderate      | DECIDED             | ADR-001, ADR-008 |
| D-03 | Router            | TanStack file router               | App Router; **approved** production map in `02-route-migration.md` (restructured) | Critical | Very Hard     | DECIDED             | ADR-002, D-01    |
| D-04 | Hosting           | Lovable/Nitro Cloudflare default   | Initial target Vercel (Node 24); Cloudflare/OpenNext secondary    | Critical | Hard          | DECIDED             | ADR-008, D-24    |
| D-05 | Auth ownership    | Supabase + client localStorage     | Backend owns authz; cookies where applicable; Next route gates    | Critical | Hard          | DECIDED             | ADR-005          |
| D-06 | Protected routes  | Client redirects                   | Next.js route protection + session-aware render; backend is truth | High     | Moderate      | DECIDED             | D-05             |
| D-07 | API boundary      | Mixed server fns + client Supabase | Existing backend remains primary; Next is not a backend replace   | Critical | Hard          | DECIDED             | ADR-006          |
| D-08 | Route Handlers    | Lovable/server HTTP routes         | Only for BFF/proxy or frontend-specific server needs              | High     | Moderate      | DECIDED             | D-07             |
| D-09 | Server Actions    | TanStack Server Functions          | Use only with clear benefit; orchestrate backend, do not replace  | High     | Moderate      | DECIDED             | D-07             |
| D-10 | Read rendering    | SSR shell + client effects         | RSC by default; per-route static/SSR/ISR; small client islands    | High     | Moderate      | DECIDED             | ADR-003, D-05    |
| D-11 | Data fetching     | Effects + some React Query         | Hybrid: RSC initial reads; TanStack Query for interactive server state | High | Moderate   | DECIDED            | ADR-004, D-07    |
| D-12 | Client state      | Context/local state                | Local UI state; global only if genuinely global; no server-state dup | Medium | Easy        | DECIDED            | ADR-004          |
| D-13 | Caching           | Minimal query cache                | No-store for user data; static/ISR only where freshness agreed    | High     | Moderate      | DECIDED             | ADR-003, D-05    |
| D-14 | Project structure | Routes plus shared components      | Thin `app`; domain `features`; framework at boundary              | High     | Moderate      | DECIDED             | ADR-007, D-03    |
| D-15 | Route typing      | TanStack generated route types     | Native App Router typing; no custom generator unless required     | Medium   | Easy          | DECIDED             | ADR-002          |
| D-16 | Errors/loading    | Root error/404 UI                  | Native `error`/`not-found`/`loading`; consistent auth/API failure UX | High  | Moderate      | DECIDED             | ADR-002          |
| D-17 | Metadata/SEO      | TanStack head definitions          | Metadata API; static + `generateMetadata`; public pages primary   | Medium   | Easy          | DECIDED             | ADR-002          |
| D-18 | Styling           | Tailwind 4 + shadcn `rsc:false`    | Exact visual parity; no redesign                                  | Critical | Easy          | DECIDED             | ADR-010          |
| D-19 | Package manager   | npm and Bun lockfiles              | npm is canonical; use `package-lock.json`; remove `bun.lock` at implementation start | High | Moderate | DECIDED | Hosting/CI |
| D-20 | Testing gate      | No project tests                   | Minimal smoke + visual parity note + email template inventory at implementation start; no formal suite before coding | Critical | Easy | ACCEPTED RISK | Route inventory, [parity-baselines.md](parity-baselines.md) |
| D-21 | Email handlers    | Lovable `/lovable/email/*` routes  | First-party BFF handlers + provider-agnostic messaging adapter; replace `/lovable/email/*` at auth/messaging slices | Critical | Moderate | DECIDED | D-07, D-24, D-25, [cutover.md](cutover.md) |
| D-22 | Observability     | Lovable host hook + console        | Remove Lovable hook; select portable error tracking later         | Medium   | Moderate      | PROPOSED            | D-24, Hosting    |
| D-23 | Go-live / cutover | Pre-launch; TanStack/Lovable source only | First prod = Next on Vercel + approved map; no dual production frontends; repo may keep TanStack until retirement; rollback owner not a GO gate | Critical | Hard | DECIDED | Hosting/DNS, [cutover.md](cutover.md) |
| D-24 | Lovable platform  | Build, email, assets, error hooks  | Fully withdraw Lovable packages/routes/secrets/coupling           | Critical | Hard          | DECIDED             | ADR-009          |
| D-25 | Messaging content | Auth React Email + inline builders | Preserve templates; live under `src/lib/server/messaging/`; provider-agnostic contracts only | Critical | Easy          | DECIDED             | ADR-010          |
| D-26 | Email provider    | Lovable email transport            | Concrete provider deferred; **ACCEPTED RISK** with messaging adapter stubs under `src/lib/server/messaging/` | Critical | Moderate | ACCEPTED RISK | D-21, D-24, D-25 |
| D-27 | SMS provider      | Unconfigured (`SMS provider...`)   | Channel/templates preserved; **ACCEPTED RISK** with stub that fails explicitly until provider chosen | High | Moderate | ACCEPTED RISK | D-25 |
| D-28 | Cookie/SSR session spike | localStorage browser session only | Prove `@supabase/ssr` HTTP-only cookies in Next proxy + RSC `getUser()` after migration start; remains BLOCKED until PASSED | Critical | Moderate | ACCEPTED RISK | ADR-005, D-05, D-06, [auth-ssr-spike.md](spikes/auth-ssr-spike.md) |
| D-29 | RLS / storage policies | Existing Lovable Supabase RLS + Storage | Phase 1: retain/enforce as-is for client access; Phase 2: custom Backend APIs only (no direct client DB) | Critical | Hard | DECIDED | ADR-011, D-07 |
| D-30 | Server-function mapping | Six TanStack Server Functions + Lovable email routes | Decision tree: Backend API / Server Action / BFF; per-function map in `15-server-function-mapping.md` | Critical | Moderate | DECIDED | ADR-006, D-07, D-08, D-09 |
| D-31 | Public enrollment rate limits | No approved edge/server limit contract | Edge/server rate limit (Vercel/Cloudflare/Upstash); HTTP 429; frontend notification + disable submit | Critical | Moderate | DECIDED | ADR-012, D-07, D-08 |
| D-32 | Campaign / messaging runtime | Lovable queue transport + TanStack send paths | Background processing outside Next (backend/messaging); queue tech deferred by workload; no Lovable transport | Critical | Hard | DECIDED | ADR-013, ADR-009, D-07, D-26 |

Critical checklist items for GO are DECIDED or ACCEPTED RISK. **Remaining open proof (not a GO blocker):** D-28 cookie/SSR session remains **BLOCKED** until authenticated `getUser()` SSR is proven after migration start ([auth-ssr-spike.md](spikes/auth-ssr-spike.md)). Architecture ADRs 001ΓÇô013 are decided where applicable; production route map is approved; email/SMS providers are ACCEPTED RISK with stubs; D-20 baselines, env Vercel confirm, and rollback-owner are ACCEPTED RISK; **asset vendoring DONE (slice 2)**; D-21 email handlers and D-23 pre-launch go-live are DECIDED.

## Migration Go / No-Go

**GO** for migration implementation and root Next.js application creation (slice 1+).

- Cookie/SSR spike (D-28): **ACCEPTED RISK** ΓÇö remains **BLOCKED** until proven after migration start (service-role or confirmed test user).
- Characterization / visual / email baselines (D-20): **ACCEPTED RISK** ΓÇö [parity-baselines.md](parity-baselines.md).
- Email handlers (D-21) / go-live (D-23): **DECIDED** ΓÇö pre-launch framing in [cutover.md](cutover.md) (no dual production frontends); rollback owner **ACCEPTED RISK** (not a gate).
- Asset vendoring: **DONE (slice 2)** ΓÇö local assets + `public/og-image.png`; env inventory still **ACCEPTED RISK** (confirm Vercel values at deploy without secrets in git).
- RLS/storage (D-29), server-function mapping (D-30), enrollment rate limits (D-31), campaign runtime (D-32): **DECIDED**.
