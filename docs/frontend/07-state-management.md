# State Management

| State            | Current                              | Target                                                                 | Reason                     |
| ---------------- | ------------------------------------ | ---------------------------------------------------------------------- | -------------------------- |
| Local UI         | `useState`                           | Keep local                                                             | Smallest scope             |
| Server state     | effects/direct Supabase              | RSC or React Query by need                                             | Separate transport from UI |
| Auth             | React Context + localStorage session | Transitional client provider; server session spike                     | Preserve behavior first    |
| URL state        | Router params/search                 | App Router params/searchParams                                         | Shareable/navigation-safe  |
| Forms            | local state; selective Zod           | Keep existing approach per form; shared schemas where server validates | Avoid rewrite              |
| Persistent UI    | sidebar cookie                       | Cookie with explicit scope/security                                    | Existing behavior          |
| Global app state | none beyond auth/query               | Do not add Redux/Zustand                                               | No evidence of need        |

Server data must not be copied into global client context merely to imitate current route behavior.
