---
name: frontend-patterns
version: 1.0.0
source: local-git-analysis
---

# Frontend Patterns

Frontend patterns for the new-ticket-app monorepo ticket sales platform.

## File Organization Philosophy

**ドメイン単位の縦割り構成**: Domain-driven vertical structure, NOT technical layer separation.

Each feature/page owns its UI, hooks, and utils. Related files must be placed together.

## Standard Page Structure

{route}/
├── page.tsx
├── \_components/ # Page-specific components
│ ├── component-a.tsx
│ └── component-b.tsx
├── \_hooks/ # Page-specific hooks
│ ├── useData.ts
│ └── useActions.ts
│ └── form-context.tsx
└── \_utils/ # Page-specific utilities
│ └── helpers.ts
