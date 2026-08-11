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
- [ ] Supabase server-session / HTTP-only cookie approach proven in a spike
- [ ] RLS and storage policies independently verified
- [ ] Server-function → backend/BFF mapping revised to backend-primary boundary model
- [ ] Public enrollment rate-limit/abuse controls approved
- [ ] Campaign execution runtime/queue strategy approved without Lovable transport
- [ ] Asset vendoring plan approved for Lovable/CDN-hosted images
- [ ] Environment inventory verified in deployment without exposing values
- [ ] Characterization, visual, and email HTML parity baseline approved
- [ ] Coexistence/cutover mechanism approved
- [ ] Rollback owner and production acceptance criteria assigned

Migration implementation must not begin until all Critical items are `DECIDED` or explicitly `ACCEPTED RISK`.
