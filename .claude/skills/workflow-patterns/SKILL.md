---
name: workflow-patterns
description: Development workflow, verification, and database patterns for new-ticket-app
version: 1.0.0
source: local-git-analysis
---

# Development Workflow & Patterns

Development workflow patterns for the new-ticket-app monorepo.

## Monorepo Structure

apps/
├── admin/ # 管理画面 (Admin Dashboard) - Next.js on port 4022
├── api/ # GraphQL Backend - NestJS on port 4020
└── web/ # ユーザーフロントエンド (User Frontend) - Next.js on port 4021

### Package Manager & Build Tool

- **Package Manager**: pnpm with workspace support
- **Build Tool**: Turborepo for monorepo orchestration

### Common Scripts

```bash
pnpm dev              # Start all apps concurrently
pnpm dev:api          # Start only API server
pnpm dev:web          # Start only web frontend
pnpm db:up            # Start PostgreSQL via docker-compose
pnpm db:push          # Push Prisma schema to database
pnpm db:seed          # Seed database with test data
pnpm db:studio        # Open Prisma Studio
pnpm build            # Build all apps
pnpm test             # Run all tests
```

## Server Startup Workflow

CRITICAL: Before running pnpm dev, check port availability.

# 1. Check ports

```bash
lsof -i :4020 # API
lsof -i :4021 # Web
lsof -i :4022 # Admin

# 2. If ports are free, start servers

pnpm dev

# 3. Verify all servers started

# - API: http://localhost:4020

# - Web: http://localhost:4021

# - Admin: http://localhost:4022
```

## Verification Checklist

After code changes:

1. Server startup: All 3 servers running on correct ports
2. Page loads: Navigate to changed page
3. No errors: Check browser console AND page UI for errors
4. Figma match: If Figma link provided, verify design matches and take screenshots by using ui-auto-test skills

If verification fails, fix and re-verify.

## Troubleshooting Data Fetch Issues

If data is not loading correctly in the application, verify the following:

1. Confirm Servers Are Running

Ensure all required servers are running on the correct ports.

If a server is not running:

- Check terminal logs.
- Identify the root cause of the error.
- Fix the issue before proceeding.

```
lsof -i :4020 # API
lsof -i :4021 # Web
lsof -i :4022 # Admin
```

2. Verify Seed Data

Run the seed command to ensure test data is properly generated:

```
pnpm db:seed
```

If seeding fails:

- Analyze the error output.
- Fix the seed script.
- Re-run the seed command until successful.

3. Additional Checks

- Confirm pnpm db:push was executed after schema changes.
- Restart the API server after database updates.
- Ensure the GraphQL schema was regenerated successfully.

Always validate infrastructure (server + database) before debugging frontend logic.

## Database Workflow

```bash
# 1. Modify Prisma schema in apps/api/prisma/models/

# 2. Push to database

pnpm db:push

# 3. Restart API server (auto-generates GraphQL schema)

# NO need to run `pnpm codegen` manually
```

## GraphQL Schema Generation

IMPORTANT: GraphQL schema is auto-generated when backend server starts.

After modifying resolvers or Input/Payload types:

1. Start backend server (pnpm dev or pnpm dev:api)
2. Schema automatically generated to apps/api/src/generated/schema.gql
3. Types automatically generated to apps/{app}/src/graphql-env.d.ts

NO manual pnpm codegen required.

## API Testing Patterns

Test Framework

- Framework: Vitest
- Coverage: Aim for 80%+ coverage
- Test location: Co-locate tests with code (domain-driven)

Test Types

- Unit tests: pnpm test

## Updating GraphQL API

### example: edit user schema

```bash
# 1. Modify Prisma model and push schema if needed

vim apps/api/prisma/models/user.prisma
pnpm db:push

# 2. Update resolver

vim apps/api/src/components/user/user.resolver.ts

# 3. Create/update frontend hook

vim apps/web/src/app/profile/\_hooks/useUser.ts

# 4. Verify

open http://localhost:4021/profile
```

Key Principles

1. Domain-driven organization: Group by feature, not by tech layer
2. GraphQL-first API: Avoid REST patterns, leverage GraphQL graph traversal
3. Type safety: Use generated types, avoid any
4. Color tokens: NEVER hardcode colors, ALWAYS use tokens
5. Hook separation: Extract GraphQL logic into \_hooks
6. Auto-generation: Let tools generate schema/types, don't run codegen manually
7. Verification: Always test in browser after changes
8. Prisma optimization: Use Fluent API in ResolveField to prevent N+1

---

Generated from git history analysis - 2026-02-15
