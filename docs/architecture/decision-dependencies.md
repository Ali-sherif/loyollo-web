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
  Auth[Supabase auth model] --> Protected[Protected routing]
  Auth --> ServerData[Server-side data access]
  Auth --> Mutations[Actions and handlers]
  ServerBoundaries[Server boundary mapping] --> Secrets[Secret isolation]
  ServerBoundaries --> RuntimeLimits[Runtime limits]
  Rendering --> ClientBoundaries[Client boundaries]
  Rendering --> DataStrategy[Data strategy]
  Routes --> MigrationOrder[Migration order]
  DataStrategy --> Testing[Parity tests]
  VisualGates --> Testing
  Hosting --> Cutover[Cutover and rollback]
  MessagingAdapter --> Cutover
  Testing --> Cutover
```

Hosting (Vercel) and runtime pins (Next.js 16.3.x, React 19.2.x, TypeScript 6.0.x, Node 24 LTS) are decided. Resolve the messaging adapter before freezing email route cutover. Style/template parity is already decided and must gate every migrated surface.
