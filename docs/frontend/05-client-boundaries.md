# Client Boundaries

Aligned with [ADR-003](../architecture/decisions/ADR-003-rendering-strategy.md). Introduce `"use client"` only for interactivity, browser APIs, local state, effects, or client-only libraries. Place it at the smallest interactive root—never on entire routes or large trees by default.

| Area                                 | Boundary                                 | Reason                             |
| ------------------------------------ | ---------------------------------------- | ---------------------------------- |
| Auth forms/provider                  | Client                                   | Browser session and event listener |
| Dashboard shell navigation/toasts    | Client island                            | events, responsive state           |
| Interactive tables/forms/dialogs     | Client                                   | local state and handlers           |
| Leaflet map                          | Client + dynamic import                  | DOM/window dependency              |
| QR creation, clipboard, share, print | Client                                   | canvas/navigator/window            |
| CSV/PDF export                       | Client; dynamically load heavy libraries | download APIs and bundle control   |
| Count-up/feature animation           | Client                                   | IntersectionObserver/matchMedia    |
| Marketing/legal copy                 | Server                                   | no browser requirement             |
| Initial public program lookup        | Server                                   | server-side read against backend   |
| Email templates/queue                | Server-only (`lib/server/messaging`)     | secrets and privileged data        |

Existing directives in shadcn files are not evidence that whole routes should become Client Components.
