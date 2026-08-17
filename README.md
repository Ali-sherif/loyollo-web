# Loyollo Frontend

Loyalty platform frontend for local businesses: marketing site, auth/onboarding, and authenticated dashboard for customers, loyalty programs, branches, campaigns, and analytics.

This repository is a **Next.js App Router** app (slices 1–14 of the TanStack Start → Next.js migration are done; Lovable and TanStack Start are retired). Slice 15 remainder is production smoke + visual/email HTML parity.

## Current stack

| Concern      | Implementation                               |
| ------------ | -------------------------------------------- |
| Framework    | Next.js 16.3.x App Router                    |
| UI           | React / React DOM 19.2                       |
| Routing      | Next.js App Router (`src/app`)               |
| Build        | Next.js (`next build`)                       |
| Data / auth  | Supabase (cookie session + service-role)     |
| Server state | TanStack Query (interactive client state)    |
| Styling      | Tailwind CSS 4, Radix / shadcn, Figtree      |
| Forms        | Local state + selective Zod                  |
| Messaging    | `src/lib/server/messaging/` (provider-agnostic stubs) |

## Target stack (DECIDED)

| Concern   | Target                                          |
| --------- | ----------------------------------------------- |
| Framework | Next.js **16.3.x** App Router                   |
| UI        | React / React DOM **19.2.x**                    |
| Language  | TypeScript **6.0.x**                            |
| Hosting   | **Vercel** (initial)                            |
| Runtime   | Node.js **24 LTS**                              |
| Messaging | `src/lib/server/messaging/` (provider-agnostic) |

Cloudflare Workers via OpenNext/`workerd` remains a secondary option and requires separate validation.

## Quick start

```bash
# Install (canonical: npm / package-lock.json)
npm install

# Next.js development / production
npm run dev
npm run build
npm run start
npm run typecheck:next

# Lint / format
npm run lint
npm run format
```

### Environment variables

Do not commit secrets. Canonical inventory (names + classification only): [`docs/deployment/env.md`](docs/deployment/env.md). Template: [`.env.example`](.env.example).

| Name                                      | Scope           | Purpose                    |
| ----------------------------------------- | --------------- | -------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                | Client          | Supabase project URL       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`           | Client          | Public Supabase anon key   |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` | Server        | SSR fallbacks (optional)   |
| `SUPABASE_SERVICE_ROLE_KEY`               | Server only     | Privileged Supabase access |
| `EMAIL_WEBHOOK_SECRET`                    | Server only     | Auth email webhook/preview |

Service-role keys must never ship in the client bundle. Do not set `LOVABLE_*`.

## Project structure (current)

```text
src/
├── app/                    # Next.js App Router pages + API routes
├── features/               # Route page implementations
├── components/
│   ├── ui/                 # shadcn / Radix primitives
│   ├── landing/            # marketing sections
│   ├── dashboard/          # authenticated shell
│   ├── loyalty/            # loyalty program UI
│   ├── campaigns/          # campaign UI
│   ├── onboarding/         # onboarding UI
│   └── guide/              # guide illustrations
├── hooks/                  # auth and shared hooks
├── integrations/supabase/  # browser + server clients, types
├── lib/
│   ├── server/             # BFF services + messaging
│   ├── client/             # browser API helpers
│   └── navigation/         # approved path helpers
├── data/                   # static domain data
├── assets/                 # local images / logos
└── styles.css              # Tailwind tokens and global styles
```

## Product areas

| Area              | Routes                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Marketing / legal | `/`, `/about`, `/features`, `/pricing`, `/guide`, `/contact`, `/legal/terms`, `/legal/privacy` |
| Auth              | `/auth/sign-in`, `/auth/sign-up`, `/auth/verify`, `/auth/verified`, `/auth/forgot-password`, `/auth/reset-password` |
| Onboarding        | `/onboarding/*`                                                                                |
| App               | `/app/dashboard`, `/app/customers`, `/app/loyalty`, `/app/branches`, `/app/campaigns`, `/app/analytics`, `/app/settings` |
| Public join       | `/join/[programId]`                                                                            |
| Email APIs        | `/api/email/auth/webhook`, `/api/email/auth/preview`, `/api/email/queue/process`               |

## Architecture decisions (summary)

**DECIDED** (see `docs/architecture/` — ADRs 001–013)

- Withdraw Lovable packages, `/lovable/*` routes, secrets, and host hooks (**done**).
- Keep visual design and email/SMS message content (no redesign).
- Host on Vercel initially; pin Next 16.3.x / React 19.2.x / TypeScript 6.0.x / Node 24 LTS.
- Messaging templates and transport live under `src/lib/server/messaging/`; features use provider-agnostic contracts only.
- App Router, backend-primary API boundary, RSC + Query hybrid, thin `app/` — approved.

Full ADRs: [`docs/architecture/`](docs/architecture/README.md).

## Documentation

| Doc                                                                                          | Purpose                           |
| -------------------------------------------------------------------------------------------- | --------------------------------- |
| [`docs/architecture/README.md`](docs/architecture/README.md)                                 | Architecture audit and ADRs       |
| [`docs/frontend/README.md`](docs/frontend/README.md)                                         | Frontend migration blueprint      |
| [`docs/frontend/02-route-migration.md`](docs/frontend/02-route-migration.md)                 | Route inventory                   |
| [`docs/frontend/15-server-function-mapping.md`](docs/frontend/15-server-function-mapping.md) | Server function → Next.js mapping |
| [`docs/frontend/17-messaging-templates.md`](docs/frontend/17-messaging-templates.md)         | Email/SMS template inventory      |
| [`AGENTS.md`](AGENTS.md)                                                                     | Agent notes                       |

## Scripts

| Script                   | Description                |
| ------------------------ | -------------------------- |
| `npm run dev`            | Next.js development server |
| `npm run build`          | Next.js production build   |
| `npm run start`          | Serve Next.js production   |
| `npm run typecheck:next` | Typecheck Next.js project  |
| `npm run lint`           | ESLint                     |
| `npm run format`         | Prettier write             |

## Migration status

**GO** — slices **1–14** done (including Lovable/TanStack retirement). Next: slice **15** (production smoke + visual/email HTML parity). D-28 remains open until PASSED. See [`docs/frontend/12-migration-plan.md`](docs/frontend/12-migration-plan.md).

## License

Private project.
