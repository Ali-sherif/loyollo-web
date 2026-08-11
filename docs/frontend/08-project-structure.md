# Target Project Structure

Aligned with [ADR-007](../architecture/decisions/ADR-007-project-structure.md) and [ADR-010](../architecture/decisions/ADR-010-style-and-template-parity.md).

```text
src/
├── app/                 # routing, layouts, loading/error/not-found, metadata, page composition only
├── features/            # auth, onboarding, customers, loyalty, branches, campaigns, analytics, settings
├── components/
│   ├── ui/              # generic shadcn/Radix primitives
│   └── shared/          # app-wide shell, pagination, empty/error UI
├── lib/
│   ├── server/          # privileged orchestration; server-only
│   │   └── messaging/   # templates + provider-agnostic messaging contracts/adapters
│   └── client/          # browser-only infrastructure
├── integrations/
│   └── supabase/        # browser/server factories and generated types
├── config/              # validated non-secret configuration
└── types/               # truly shared cross-domain types
```

## Rules

- Keep `app/` focused on routing, layouts, loading/error states, metadata, and page composition.
- Keep business/domain logic inside domain-oriented feature modules.
- Avoid turning route files into large components containing business logic.
- Keep framework-specific concerns at the application boundary; reusable business logic stays in features/domain modules.
- Messaging templates and server-side messaging infrastructure live under `src/lib/server/messaging/`.
- Business features may invoke messaging through provider-agnostic contracts and must not depend directly on delivery providers.
- Prevent feature-to-feature deep imports.

Migrate structure incrementally with each route slice—not as a big-bang refactor.
