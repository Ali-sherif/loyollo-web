# Architecture Decision Matrix

| ID   | Decision          | Current state                      | Proposed decision                                                 | Impact   | Reversibility | Status              | Dependencies     |
| ---- | ----------------- | ---------------------------------- | ----------------------------------------------------------------- | -------- | ------------- | ------------------- | ---------------- |
| D-01 | Next.js line      | TanStack Start 1.x                 | Next.js 16.3.x stable patch                                       | Critical | Hard          | PROPOSED            | Hosting, Node    |
| D-02 | Node line         | Unpinned; Node 22 types installed  | Node 22 or 24; pin after hosting choice                           | Critical | Moderate      | NEEDS INVESTIGATION | Hosting          |
| D-03 | Router            | TanStack file router               | App Router                                                        | Critical | Very Hard     | PROPOSED            | D-01             |
| D-04 | Hosting           | Lovable/Nitro Cloudflare default   | Leave Lovable; compare Vercel and Cloudflare/OpenNext             | Critical | Hard          | NEEDS APPROVAL      | D-01, D-02, D-19 |
| D-05 | Auth storage      | Supabase session in localStorage   | Preserve first, evaluate cookie SSR separately                    | Critical | Hard          | PROPOSED            | RLS, hosting     |
| D-06 | Protected routes  | Client redirects                   | Server authorization plus client UX checks                        | High     | Moderate      | PROPOSED            | D-05             |
| D-07 | Public enrollment | Public server fn with admin key    | Rate-limited Route Handler + server service                       | Critical | Moderate      | PROPOSED            | Hosting          |
| D-08 | Campaign send     | Auth server fn loops synchronously | Auth Route Handler + server service; queue preferred              | High     | Moderate      | PROPOSED            | Runtime limits   |
| D-09 | Read rendering    | SSR shell + client effects         | Server Component initial reads where auth permits                 | High     | Moderate      | PROPOSED            | D-05             |
| D-10 | Client state      | Context/local state                | Keep local; React Query only for live server state                | Medium   | Easy          | PROPOSED            | Rendering        |
| D-11 | Caching           | Minimal query cache                | No-store for user data; bounded cache for public program metadata | High     | Moderate      | PROPOSED            | Auth, hosting    |
| D-12 | Project structure | Routes plus shared components      | Thin `app`, domain `features`, server-only `lib/server`           | High     | Moderate      | PROPOSED            | Router           |
| D-13 | Styling           | Tailwind 4 + shadcn `rsc:false`    | Exact visual parity; no redesign                                  | Critical | Easy          | DECIDED             | ADR-010          |
| D-14 | Package manager   | npm and Bun lockfiles              | Select one; do not regenerate until approved                      | High     | Moderate      | NEEDS APPROVAL      | Hosting/CI       |
| D-15 | Testing gate      | No project tests                   | Add characterization/E2E gates before migration                   | Critical | Easy          | PROPOSED            | Route inventory  |
| D-16 | Email handlers    | Lovable `/lovable/email/*` routes  | First-party Route Handlers + provider-agnostic messaging adapter  | Critical | Moderate      | PROPOSED            | D-19, D-20       |
| D-17 | Observability     | Lovable host hook + console        | Remove Lovable hook; select portable error tracking later         | Medium   | Moderate      | PROPOSED            | D-19, Hosting    |
| D-18 | Cutover           | Single TanStack/Lovable deploy     | Route/domain slices with rollback after Lovable withdrawal        | Critical | Hard          | NEEDS APPROVAL      | Hosting/DNS      |
| D-19 | Lovable platform  | Build, email, assets, error hooks  | Fully withdraw Lovable packages/routes/secrets/coupling           | Critical | Hard          | DECIDED             | ADR-009          |
| D-20 | Messaging content | Auth React Email + inline builders | Preserve email/SMS templates and personalization tokens           | Critical | Easy          | DECIDED             | ADR-010          |
| D-21 | Email provider    | Lovable email transport            | Choose replacement provider later behind adapter                  | Critical | Moderate      | DEFERRED            | D-16, D-19       |
| D-22 | SMS provider      | Unconfigured (`SMS provider...`)   | Preserve SMS channel/templates; choose provider later             | High     | Moderate      | DEFERRED            | D-20             |

High-impact hard-to-reverse decisions remain `PROPOSED` or `NEEDS APPROVAL`; none are silently treated as final.
