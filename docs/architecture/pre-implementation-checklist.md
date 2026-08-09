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
- [ ] Hosting target approved (outside Lovable)
- [ ] Email delivery provider approved (adapter remains mandatory either way)
- [ ] SMS provider approved or explicitly deferred with channel preserved
- [ ] Node version and canonical package manager approved
- [ ] Next.js exact patch approved at implementation start
- [ ] Supabase server-session approach proven in a spike
- [ ] RLS and storage policies independently verified
- [ ] Public enrollment rate-limit/abuse controls approved
- [ ] Campaign execution runtime/queue strategy approved without Lovable transport
- [ ] Asset vendoring plan approved for Lovable/CDN-hosted images
- [ ] Environment inventory verified in deployment without exposing values
- [ ] Characterization, visual, and email HTML parity baseline approved
- [ ] Coexistence/cutover mechanism approved
- [ ] Rollback owner and production acceptance criteria assigned

Migration implementation must not begin until all Critical items are `DECIDED` or explicitly `ACCEPTED RISK`.
