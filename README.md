# Loyollo Frontend

Loyalty platform frontend for local businesses: marketing site, auth/onboarding, and authenticated dashboard for customers, loyalty programs, branches, campaigns, and analytics.

This repository is currently a **TanStack Start** SSR app with an in-progress migration to **Next.js App Router**. Critical gates are **GO**; slices 1–2 are done (foundation + asset vendoring). TanStack remains the primary running app until route cutover.

## Current stack

| Concern | Implementation |
| --- | --- |
| Framework | TanStack Start 1.x (SSR) |
| UI | React / React DOM 19.2 |
| Routing | TanStack Router (file-based) |
| Build | Vite 8, Nitro |
| Data / auth | Supabase (browser RLS + server service-role) |
| Server state | React Query (limited use today) |
| Styling | Tailwind CSS 4, Radix / shadcn, Figtree |
| Forms | Local state + selective Zod |

## Target stack (DECIDED)

| Concern | Target |
| --- | --- |
| Framework | Next.js **16.3.x** App Router |
| UI | React / React DOM **19.2.x** |
| Language | TypeScript **6.0.x** |
| Hosting | **Vercel** (initial) |
| Runtime | Node.js **24 LTS** |
| Messaging | `src/lib/server/messaging/` (provider-agnostic) |

Cloudflare Workers via OpenNext/`workerd` remains a secondary option and requires separate validation.

## Quick start

```bash
# Install (canonical: npm / package-lock.json)
npm install

# TanStack development (current primary app)
npm run dev

# Next.js foundation (migration)
npm run dev:next
npm run build:next
npm run typecheck:next

# TanStack production build / preview
npm run build
npm run preview

# Lint / format
npm run lint
npm run format
```

### Environment variables

Do not commit secrets. Canonical inventory (names + classification only): [`docs/deployment/env.md`](docs/deployment/env.md). Template: [`.env.example`](.env.example).

| Name | Scope | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | Client / server | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | Client / server | Public Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Privileged Supabase access |
| `LOVABLE_API_KEY` | Server only | Lovable email routes (to be removed) |
| `LOVABLE_SEND_URL` | Server only | Lovable send endpoint (to be removed) |

Service-role and Lovable keys must never ship in the client bundle.

## Project structure (current)

```text
src/
├── routes/                 # TanStack file-based pages + Lovable email APIs
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
├── lib/                    # server functions, email templates, utilities
├── data/                   # static domain data
├── assets/                 # local SVGs + hosted.ts URL map (binaries in public/assets)
└── styles.css              # Tailwind tokens and global styles
```

Route conventions: see [`src/routes/README.md`](src/routes/README.md).

## Product areas

| Area | Routes (current) |
| --- | --- |
| Marketing / legal | `/`, `/about`, `/features`, `/pricing`, `/guide`, `/contact`, `/terms`, `/privacy` |
| Auth | `/signin`, `/signup`, `/verify`, `/verified`, `/forgot-password`, `/reset-password`, `/change-password` |
| Onboarding | `/onboarding/*` |
| App | `/dashboard`, `/customers`, `/loyalty-program`, `/branches`, `/campaigns`, `/analytics`, `/settings` |
| Public join | `/join/$programId` |
| Email APIs (Lovable) | `/lovable/email/*` → will move to first-party `/api/email/*` |

## Architecture decisions (summary)

**DECIDED** (see `docs/architecture/` — ADRs 001–013)

- Withdraw Lovable packages, `/lovable/*` routes, secrets, and host hooks.
- Keep visual design and email/SMS message content (no redesign).
- Host on Vercel initially; pin Next 16.3.x / React 19.2.x / TypeScript 6.0.x / Node 24 LTS.
- Messaging templates and transport live under `src/lib/server/messaging/`; features use provider-agnostic contracts only.
- App Router, backend-primary API boundary, RSC + Query hybrid, thin `app/` — approved.

Full ADRs: [`docs/architecture/`](docs/architecture/README.md).

## Documentation

| Doc | Purpose |
| --- | --- |
| [`docs/architecture/README.md`](docs/architecture/README.md) | Architecture audit and ADRs |
| [`docs/frontend/README.md`](docs/frontend/README.md) | Frontend migration blueprint |
| [`docs/frontend/02-route-migration.md`](docs/frontend/02-route-migration.md) | Route inventory |
| [`docs/frontend/15-server-function-mapping.md`](docs/frontend/15-server-function-mapping.md) | Server function → Next.js mapping |
| [`docs/frontend/17-messaging-templates.md`](docs/frontend/17-messaging-templates.md) | Email/SMS template inventory |
| [`AGENTS.md`](AGENTS.md) | Agent / Lovable sync notes |

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Vite/TanStack Start development server |
| `npm run build` | TanStack production build |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview TanStack production build |
| `npm run dev:next` | Next.js development server |
| `npm run build:next` | Next.js production build |
| `npm run start:next` | Serve Next.js production build |
| `npm run typecheck:next` | Typecheck Next.js project |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |

## Migration status

**GO** — Critical gates cleared. Slices **1** (foundation) and **2** (asset vendoring) are done. Next: slice **3** (server infra + auth cookie/SSR proof). See [`docs/frontend/12-migration-plan.md`](docs/frontend/12-migration-plan.md). D-28 remains open until PASSED.

## License

Private project.
