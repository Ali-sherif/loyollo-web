# State Management

Aligned with [ADR-004](../architecture/decisions/ADR-004-data-and-state.md).

| State            | Current                              | Target                                                                 | Reason                     |
| ---------------- | ------------------------------------ | ---------------------------------------------------------------------- | -------------------------- |
| Local UI         | `useState`                           | Keep local                                                             | Smallest scope             |
| Server state     | effects/direct Supabase              | RSC for initial reads; TanStack Query for interactive server state     | Separate transport from UI |
| Auth             | React Context + localStorage session | NestJS-owned auth (local JWT); Next route gates; HTTP-only cookies (D-28 retargeted) | NestJS is source of truth; no Supabase Auth |
| URL state        | Router params/search                 | App Router params/searchParams                                         | Shareable/navigation-safe  |
| Forms            | local state; selective Zod           | Keep existing approach per form; shared schemas where server validates | Avoid rewrite              |
| Persistent UI    | sidebar cookie                       | Cookie with explicit scope/security                                    | Existing behavior          |
| Global app state | none beyond auth/query               | Only for genuinely global client state; avoid if local suffices        | No evidence of need yet    |

## Rules

- Treat backend/API data as server state; manage it primarily with TanStack Query on the client when interactive.
- Do not automatically put every request into TanStack Query.
- Do not duplicate the same server state between a global store (for example Redux, if retained) and TanStack Query.
- If a global client store is retained or introduced later, keep it focused on client-side application state—not backend entity caches.
- Avoid introducing global state when local state is sufficient.
- Server data must not be copied into global client context merely to imitate current route behavior.
