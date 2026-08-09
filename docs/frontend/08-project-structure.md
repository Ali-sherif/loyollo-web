# Target Project Structure

```text
src/
├── app/                 # routes, layouts, metadata, loading/error/not-found
├── features/            # auth, onboarding, customers, loyalty, branches, campaigns, analytics, settings
├── components/
│   ├── ui/              # generic shadcn/Radix primitives
│   └── shared/          # app-wide shell, pagination, empty/error UI
├── lib/
│   ├── server/          # privileged services; server-only
│   └── client/          # browser-only infrastructure
├── integrations/
│   └── supabase/        # browser/server factories and generated types
├── config/              # validated non-secret configuration
└── types/               # truly shared cross-domain types
```

`app` composes features and owns Next.js conventions; it does not own business logic. Migrate structure incrementally with each route slice.
