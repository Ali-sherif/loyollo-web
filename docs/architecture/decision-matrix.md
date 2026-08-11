# Architecture Decision Matrix

| ID   | Decision          | Current state                      | Proposed decision                                                 | Impact   | Reversibility | Status              | Dependencies     |
| ---- | ----------------- | ---------------------------------- | ----------------------------------------------------------------- | -------- | ------------- | ------------------- | ---------------- |
| D-01 | Next.js line      | TanStack Start 1.x                 | Next.js 16.3.x; React/React DOM 19.2.x; TypeScript 6.0.x          | Critical | Hard          | DECIDED             | ADR-001          |
| D-02 | Node line         | Unpinned; Node 22 types installed  | Node 24 LTS for Node deploys; workerd via OpenNext if Cloudflare  | Critical | Moderate      | DECIDED             | ADR-001, ADR-008 |
| D-03 | Router            | TanStack file router               | App Router; review inventory; approved map is URL contract        | Critical | Very Hard     | PROPOSED            | ADR-002, D-01    |
| D-04 | Hosting           | Lovable/Nitro Cloudflare default   | Initial target Vercel (Node 24); Cloudflare/OpenNext secondary    | Critical | Hard          | DECIDED             | ADR-008, D-24    |
| D-05 | Auth ownership    | Supabase + client localStorage     | Backend owns authz; cookies where applicable; Next route gates    | Critical | Hard          | PROPOSED            | ADR-005          |
| D-06 | Protected routes  | Client redirects                   | Next.js route protection + session-aware render; backend is truth | High     | Moderate      | PROPOSED            | D-05             |
| D-07 | API boundary      | Mixed server fns + client Supabase | Existing backend remains primary; Next is not a backend replace   | Critical | Hard          | PROPOSED            | ADR-006          |
| D-08 | Route Handlers    | Lovable/server HTTP routes         | Only for BFF/proxy or frontend-specific server needs              | High     | Moderate      | PROPOSED            | D-07             |
| D-09 | Server Actions    | TanStack Server Functions          | Use only with clear benefit; orchestrate backend, do not replace  | High     | Moderate      | PROPOSED            | D-07             |
| D-10 | Read rendering    | SSR shell + client effects         | RSC by default; per-route static/SSR/ISR; small client islands    | High     | Moderate      | PROPOSED            | ADR-003, D-05    |
| D-11 | Data fetching     | Effects + some React Query         | Hybrid: RSC initial reads; TanStack Query for interactive server state | High | Moderate   | PROPOSED            | ADR-004, D-07    |
| D-12 | Client state      | Context/local state                | Local UI state; global only if genuinely global; no server-state dup | Medium | Easy        | PROPOSED            | ADR-004          |
| D-13 | Caching           | Minimal query cache                | No-store for user data; static/ISR only where freshness agreed    | High     | Moderate      | PROPOSED            | ADR-003, D-05    |
| D-14 | Project structure | Routes plus shared components      | Thin `app`; domain `features`; framework at boundary              | High     | Moderate      | PROPOSED            | ADR-007, D-03    |
| D-15 | Route typing      | TanStack generated route types     | Native App Router typing; no custom generator unless required     | Medium   | Easy          | PROPOSED            | ADR-002          |
| D-16 | Errors/loading    | Root error/404 UI                  | Native `error`/`not-found`/`loading`; consistent auth/API failure UX | High  | Moderate      | PROPOSED            | ADR-002          |
| D-17 | Metadata/SEO      | TanStack head definitions          | Metadata API; static + `generateMetadata`; public pages primary   | Medium   | Easy          | PROPOSED            | ADR-002          |
| D-18 | Styling           | Tailwind 4 + shadcn `rsc:false`    | Exact visual parity; no redesign                                  | Critical | Easy          | DECIDED             | ADR-010          |
| D-19 | Package manager   | npm and Bun lockfiles              | Select one; do not regenerate until approved                      | High     | Moderate      | NEEDS APPROVAL      | Hosting/CI       |
| D-20 | Testing gate      | No project tests                   | Add characterization/E2E gates before migration                   | Critical | Easy          | PROPOSED            | Route inventory  |
| D-21 | Email handlers    | Lovable `/lovable/email/*` routes  | First-party BFF handlers + provider-agnostic messaging adapter    | Critical | Moderate      | PROPOSED            | D-07, D-24, D-25 |
| D-22 | Observability     | Lovable host hook + console        | Remove Lovable hook; select portable error tracking later         | Medium   | Moderate      | PROPOSED            | D-24, Hosting    |
| D-23 | Cutover           | Single TanStack/Lovable deploy     | Route/domain slices with rollback after Lovable withdrawal        | Critical | Hard          | NEEDS APPROVAL      | Hosting/DNS      |
| D-24 | Lovable platform  | Build, email, assets, error hooks  | Fully withdraw Lovable packages/routes/secrets/coupling           | Critical | Hard          | DECIDED             | ADR-009          |
| D-25 | Messaging content | Auth React Email + inline builders | Preserve templates; live under `src/lib/server/messaging/`; provider-agnostic contracts only | Critical | Easy          | DECIDED             | ADR-010          |
| D-26 | Email provider    | Lovable email transport            | Choose replacement provider later behind adapter                  | Critical | Moderate      | DEFERRED            | D-21, D-24       |
| D-27 | SMS provider      | Unconfigured (`SMS provider...`)   | Preserve SMS channel/templates; choose provider later             | High     | Moderate      | DEFERRED            | D-25             |

High-impact hard-to-reverse decisions remain `PROPOSED` or `NEEDS APPROVAL`; none are silently treated as final.
