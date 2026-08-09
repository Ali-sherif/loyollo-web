# Rendering Strategy

| Route class             | Default                                                                                | Cache policy                                                    | Client islands                      |
| ----------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------- |
| Marketing/legal         | Static Server Component                                                                | Build/static; explicit revalidation only if content changes     | navigation, observers, map          |
| Public join             | Dynamic Server Component initial read                                                  | Short cache only if program configuration freshness is accepted | enrollment form/QR interactions     |
| Authentication          | Server shell + Client Component form                                                   | No-store                                                        | Supabase auth operations, timers    |
| Protected application   | Dynamic Server Components where cookie auth permits; otherwise client fetch transition | No-store/private                                                | forms, tables, charts, browser APIs |
| External/scheduled APIs | Route Handlers                                                                         | Never cache mutations                                           | none                                |

Principles:

1. No global `"use client"`.
2. Never cache user-specific Supabase results across sessions.
3. Keep Cache Components/PPR disabled until parity and hosting validation.
4. Use Suspense/loading files at route segment boundaries; use error files for recoverable segment errors.
5. Preserve existing metadata and `noindex` rules.
