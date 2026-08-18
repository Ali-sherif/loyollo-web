# Decision Dependencies

```mermaid
flowchart TD
  LovableOut[Lovable withdrawal] --> Hosting[Hosting target]
  LovableOut --> MessagingAdapter[Messaging adapter]
  StyleParity[Style and template parity] --> VisualGates[Visual parity gates]
  StyleParity --> TemplateModules[Template modules]
  Hosting --> Node[Node and runtime]
  Hosting --> Adapter[Deployment adapter]
  MessagingAdapter --> EmailProvider[Email provider]
  MessagingAdapter --> SmsProvider[SMS provider]
  TemplateModules --> MessagingAdapter
  NextVersion[Next.js version] --> AppRouter[App Router]
  NextVersion --> ReactVersion[React version]
  Node --> Dependencies[Dependency compatibility]
  AppRouter --> Rendering[Rendering and caching]
  AppRouter --> Routes[Route mapping]
  Auth[Backend auth model] --> Protected[Protected routing]
  Auth --> ServerData[Server-side data access]
  Auth --> Mutations[Actions and handlers]
  Backend[Existing backend API] --> ApiBoundary[Next.js API boundary]
  NestStack[NestJS Prisma PostgreSQL] --> Backend
  ApiBoundary --> ServerBoundaries[BFF and server orchestration]
  ServerBoundaries --> Secrets[Secret isolation]
  ServerBoundaries --> RuntimeLimits[Runtime limits]
  AppRouter --> Errors[Error not-found loading]
  AppRouter --> Metadata[Metadata and SEO]
  AppRouter --> RouteTypes[Native route typing]
  Rendering --> ClientBoundaries[Client boundaries]
  Rendering --> DataStrategy[Data strategy]
  Routes --> MigrationOrder[Migration order]
  DataStrategy --> Testing[Parity tests]
  VisualGates --> Testing
  Hosting --> Cutover[Cutover and rollback]
  MessagingAdapter --> Cutover
  Testing --> Cutover
  Routes --> Cutover
```

Hosting (Vercel) and runtime pins (Next.js 16.3.x, React 19.2.x, TypeScript 6.0.x, Node 24 LTS) are decided. Email/SMS providers are **ACCEPTED RISK** behind messaging adapter stubs. Production route map is **APPROVED** ([02-route-migration.md](../frontend/02-route-migration.md)). Style/template parity is already decided and must gate every migrated surface. Backend remains the primary API; Next.js adds BFF only where justified. **Auth is NestJS from Product MVP (Ship 1)** (local JWT; no Supabase Auth — [ADR-005](decisions/ADR-005-authentication.md) Option C). Remaining product APIs cut over to NestJS 11.x, Prisma 7.x, PostgreSQL 18.x ([ADR-015](decisions/ADR-015-backend-stack.md)). Scope labels: [phase-1-scope.md](../product/phase-1-scope.md).
