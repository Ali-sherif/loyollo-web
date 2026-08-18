# Current Frontend

## Stack

| Concern       | Observed implementation                                                     |
| ------------- | --------------------------------------------------------------------------- |
| Framework     | TanStack Start 1.x SSR                                                      |
| UI            | React/React DOM 19.2                                                        |
| Routing       | TanStack Router generated file tree                                         |
| Build/runtime | Vite 8, Nitro 3 beta, Lovable config, Cloudflare default                    |
| Data/auth     | Supabase JS for PostgreSQL + RLS data paths; **legacy** Supabase Auth in browser (withdrawn — target is NestJS Auth API per [ADR-005](../architecture/decisions/ADR-005-authentication.md)) |
| State         | Local React state, Auth Context, limited React Query                        |
| Styling       | Tailwind CSS 4, shadcn/Radix, global tokens                                 |
| Forms         | Primarily local state; Zod selectively; RHF installed but not used by pages |
| Tests         | No repository test suite or test script                                     |

## Entry points and providers

- `src/server.ts`: SSR fetch wrapper and error handling.
- `src/start.ts`: global Supabase auth attachment and error middleware.
- `src/router.tsx`: router and per-router QueryClient.
- `src/routes/__root.tsx`: document shell, metadata, QueryClientProvider, AuthProvider, Toaster, 404/error UI.

## Application structure

Routes currently own substantial UI and direct data logic. Shared components are grouped into UI primitives, landing, dashboard, loyalty, campaign, onboarding, guide, and map areas. `src/lib/*.functions.ts` contains six server functions; three email endpoints live under `src/routes/lovable/email`.

## Constraints

- Supabase schema, migrations, RLS, and contracts are frozen; the existing backend remains the primary business/API backend after migration.
- Service-role and Lovable keys must never enter client bundles.
- Lovable build, email, and error reporting integrations create platform coupling (withdrawal decided; see [ADR-009](../architecture/decisions/ADR-009-lovable-withdrawal.md)).
- Both npm and Bun lockfiles exist historically; **DECIDED:** npm is canonical (`package-lock.json`). Remove `bun.lock` at implementation start.
- Migration targets are decided: Next.js 16.3.x, React 19.2.x, TypeScript 6.0.x, Node 24 LTS on Vercel ([ADR-001](../architecture/decisions/ADR-001-nextjs-version.md), [ADR-008](../architecture/decisions/ADR-008-deployment.md)).
