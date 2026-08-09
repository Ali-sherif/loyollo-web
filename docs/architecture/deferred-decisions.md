# Deferred Decisions

| Decision                         | Why deferred                                                               | Revisit trigger                                 |
| -------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- |
| NestJS or custom backend         | Explicitly outside frontend migration; Supabase contracts remain unchanged | Separate backend program                        |
| Database redesign                | Would invalidate parity and expand risk                                    | Approved data initiative                        |
| RLS/schema changes               | Existing data contract is frozen                                           | Verified security defect with separate approval |
| Microservices/event architecture | No migration requirement                                                   | Scale or reliability evidence                   |
| Payment implementation           | Current billing UI is placeholder                                          | Product approval and provider selection         |
| SMS provider                     | Current server function explicitly reports unconfigured SMS                | Provider and compliance decision                |
| Internationalization             | Current app is English-only                                                | Product localization requirement                |
| Durable job platform             | Campaign/email behavior can be mapped first                                | Hosting decision and workload measurements      |
| Portable observability vendor    | Current Lovable reporting is host-specific                                 | Hosting selection                               |
