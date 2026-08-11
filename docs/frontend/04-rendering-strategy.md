# Rendering Strategy

Aligned with [ADR-003](../architecture/decisions/ADR-003-rendering-strategy.md).

## Principles

1. Use Server Components by default; Client Components only when client capabilities are required.
2. Choose rendering at the route/component level (static, SSR, ISR, or client islands)—not one strategy for the whole app.
3. Prefer server rendering for public, data-driven pages when SEO or performance benefits.
4. Use static rendering where content is stable; ISR where cached content needs periodic regeneration.
5. Avoid defaulting to full client-side rendering for entire pages.
6. No global `"use client"`; keep Client islands small and isolated.
7. Never cache user-specific results across sessions.
8. Keep Cache Components/PPR disabled until parity and Vercel validation.
9. Use `loading.tsx` / Suspense at segment boundaries; `error.tsx` for unexpected failures; `not-found.tsx` for missing resources ([ADR-002](../architecture/decisions/ADR-002-app-router.md)).
10. Public pages are the primary SEO target via the Metadata API; authenticated pages need only basic metadata.

| Route class             | Default                                                                                | Cache policy                                                    | Client islands                      |
| ----------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------- |
| Marketing/legal         | Static Server Component                                                                | Build/static; ISR/revalidate only if content changes            | navigation, observers, map          |
| Public join             | Dynamic Server Component initial read                                                  | Short cache/ISR only if freshness is accepted                   | enrollment form/QR interactions     |
| Authentication          | Server shell + Client Component form                                                   | No-store                                                        | Auth operations, timers             |
| Protected application   | Dynamic Server Components where session auth permits; otherwise client fetch transition | No-store/private                                                | forms, tables, charts, browser APIs |
| BFF / scheduled APIs    | Route Handlers only when frontend-specific need exists                                 | Never cache mutations                                           | none                                |
