# Pre-Implementation Gate

- [x] Current framework and runtime architecture documented
- [x] 31 page routes, three API routes, and two structural modules inventoried
- [x] Major domains identified
- [x] Six TanStack Server Functions classified
- [x] Three Lovable email handlers classified for replacement
- [x] Client/browser-only boundaries inventoried
- [x] Data, state, styling, assets, auth, risks, and dependencies documented
- [x] Lovable withdrawal decided (packages, routes, secrets, host hooks)
- [x] Visual style parity decided (no redesign)
- [x] Email/SMS template preservation decided and inventoried
- [x] Hosting target approved: Vercel (outside Lovable); Cloudflare/OpenNext secondary
- [x] Email delivery provider: **ACCEPTED RISK** — concrete provider deferred; use `src/lib/server/messaging/` adapter stubs until a provider is chosen
- [x] SMS provider: **ACCEPTED RISK** — channel and templates preserved; stub transport fails explicitly until a provider is chosen
- [x] Node version approved: 24 LTS for Node deploys; workerd via OpenNext if Cloudflare
- [x] Canonical package manager approved: npm (`package-lock.json`; retire `bun.lock` at implementation start)
- [x] Next.js / React / TypeScript lines approved (16.3.x / 19.2.x / 6.0.x); exact patches at implementation start
- [x] App Router architecture decisions approved (ADR-002 through ADR-007)
- [x] Approved production route map (see `docs/frontend/02-route-migration.md`; restructured App Router URLs)
- [ ] Supabase server-session / HTTP-only cookie approach proven in a spike — **BLOCKED** (see [spikes/auth-ssr-spike.md](spikes/auth-ssr-spike.md); needs service-role bootstrap or confirmed `SPIKE_TEST_*` credentials)
- [x] RLS and storage policies: **DECIDED / APPROVED** for migration scope — retain existing Lovable RLS/Storage as-is in Phase 1; Phase 2 custom Backend APIs own all data/storage access ([ADR-011](decisions/ADR-011-rls-storage-strategy.md))
- [x] Server-function → backend/BFF mapping revised to backend-primary boundary model — **DECIDED / APPROVED** (decision tree + per-function rows in [15-server-function-mapping.md](../frontend/15-server-function-mapping.md); [ADR-006](decisions/ADR-006-server-boundaries.md))
- [x] Public enrollment rate-limit/abuse controls: **DECIDED / APPROVED** — edge/server rate limit (Vercel / Cloudflare / Upstash Redis) on public signup & enrollment; HTTP 429; frontend graceful UX ([ADR-012](decisions/ADR-012-public-enrollment-rate-limiting.md))
- [x] Campaign execution runtime/queue strategy without Lovable transport: **DECIDED / APPROVED** — background processing outside Next.js (backend/messaging infra); queue product chosen later by workload ([ADR-013](decisions/ADR-013-campaign-messaging-runtime.md))
- [ ] Asset vendoring plan approved for Lovable/CDN-hosted images
- [ ] Environment inventory documented ([docs/deployment/env.md](../deployment/env.md)); confirm values set in Vercel UI without exposing secrets
- [ ] Characterization, visual, and email HTML parity baseline approved
- [ ] Coexistence/cutover mechanism approved
- [ ] Rollback owner and production acceptance criteria assigned

Migration implementation must not begin until all Critical items are `DECIDED` or explicitly `ACCEPTED RISK`.
