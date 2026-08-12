# Backend contracts (product data remediation)

> **Scope warning:** This folder is a **specification for a separate Backend / Database program** ([ADR-011](../architecture/decisions/ADR-011-rls-storage-strategy.md) Phase 2, [ADR-014](../architecture/decisions/ADR-014-product-data-ownership.md)). It is **not** Next.js migration work and does **not** authorize migrations or BFF persistence in this frontend repo.

## Documents

| Doc | Purpose |
|-----|---------|
| [data-contract.md](data-contract.md) | Target schema, write rules, unified glossary |
| [api-contract.md](api-contract.md) | Endpoint shapes and client vs backend boundary |
| [remediation-roadmap.md](remediation-roadmap.md) | Phases 0–7, G-IDs, acceptance criteria |

## Gap backlog

Indexed UI vs API vs DB gaps (**G-01…G-32**): [../frontend/gaps-and-solutions.md](../frontend/gaps-and-solutions.md).

## Current system (as built)

How pages talk to Supabase / BFF today: [../frontend/system-architecture.md](../frontend/system-architecture.md).
