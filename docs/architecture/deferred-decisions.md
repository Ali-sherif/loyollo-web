# Deferred Decisions

| Decision                         | Why deferred                                                                                       | Revisit trigger                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| NestJS or custom backend         | Explicitly outside frontend migration; Supabase contracts remain unchanged                         | Separate backend program                        |
| Database redesign                | Would invalidate parity and expand risk                                                            | Approved data initiative                        |
| RLS/schema changes               | Existing data contract is frozen                                                                   | Verified security defect with separate approval |
| Microservices/event architecture | No migration requirement                                                                           | Scale or reliability evidence                   |
| Payment implementation           | Current billing UI is placeholder                                                                  | Product approval and provider selection         |
| Hosting target                   | Lovable withdrawal is decided, but Vercel vs Cloudflare/OpenNext is not                            | Production spike results                        |
| Email delivery provider          | Templates are preserved; transport must become a provider-agnostic adapter first                   | Provider/cost/compliance choice                 |
| SMS provider                     | SMS channel and message content are preserved; current send path is explicitly unconfigured        | Provider and compliance decision                |
| Internationalization             | Current app is English-only                                                                        | Product localization requirement                |
| Durable job platform             | Campaign/email behavior can be mapped first; queue worker must leave Lovable paths                 | Hosting decision and workload measurements      |
| Portable observability vendor    | Lovable `window.__lovableEvents` will be removed; replacement vendor not required for architecture | Hosting selection                               |
