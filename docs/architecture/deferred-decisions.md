# Deferred Decisions

| Decision                         | Why deferred                                                                                       | Revisit trigger                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| NestJS or custom backend         | Explicitly outside frontend migration; Supabase contracts remain unchanged                         | Separate backend program; Phase 2 of [ADR-011](decisions/ADR-011-rls-storage-strategy.md) |
| Database redesign                | Would invalidate parity and expand risk                                                            | Approved data initiative                        |
| RLS/schema changes               | Existing data contract frozen for Phase 1 frontend migration ([ADR-011](decisions/ADR-011-rls-storage-strategy.md)) | Verified security defect with separate approval; or Phase 2 Backend cutover |
| Microservices/event architecture | No migration requirement                                                                           | Scale or reliability evidence                   |
| Payment implementation           | Current billing UI is placeholder                                                                  | Product approval and provider selection         |
| Email delivery provider          | **ACCEPTED RISK:** templates preserved; ship provider-agnostic adapter stubs; no real send until provider chosen | Provider/cost/compliance choice; swap stub for real transport |
| SMS provider                     | **ACCEPTED RISK:** channel and message content preserved; stub fails explicitly until configured               | Provider and compliance decision                              |
| Internationalization             | Current app is English-only                                                                        | Product localization requirement                |
| Durable job platform             | **Ownership DECIDED** ([ADR-013](decisions/ADR-013-campaign-messaging-runtime.md)): workers outside Next.js; **product still deferred** by workload | Workload/ops evidence; choose queue vendor without Lovable transport |
| Portable observability vendor    | Lovable `window.__lovableEvents` will be removed; replacement vendor not required for architecture | Production observability needs after Vercel cutover |
| Cloudflare Workers path          | Initial host is Vercel; OpenNext/`workerd` remains secondary                                       | Explicit decision to evaluate Workers            |
