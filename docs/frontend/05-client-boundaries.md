# Client Boundaries

| Area                                 | Boundary                                 | Reason                                      |
| ------------------------------------ | ---------------------------------------- | ------------------------------------------- |
| Auth forms/provider                  | Client                                   | Supabase browser session and event listener |
| Dashboard shell navigation/toasts    | Client island                            | events, responsive state                    |
| Interactive tables/forms/dialogs     | Client                                   | local state and handlers                    |
| Leaflet map                          | Client + dynamic import                  | DOM/window dependency                       |
| QR creation, clipboard, share, print | Client                                   | canvas/navigator/window                     |
| CSV/PDF export                       | Client; dynamically load heavy libraries | download APIs and bundle control            |
| Count-up/feature animation           | Client                                   | IntersectionObserver/matchMedia             |
| Marketing/legal copy                 | Server                                   | no browser requirement                      |
| Initial public program lookup        | Server                                   | server-only privileged read                 |
| Email templates/queue                | Server-only                              | secrets and privileged data                 |

Place `"use client"` at the smallest interactive root. Existing directives in shadcn files are not evidence that whole routes should become client components.
