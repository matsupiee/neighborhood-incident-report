---
name: backend-patterns
description: Hono + oRPC + Prisma backend patterns for neighborhood-incident-report
version: 1.0.0
source: local-git-analysis
---

# Backend Patterns (Hono + oRPC + Prisma)

Backend patterns for the neighborhood-incident-report monorepo.

## Directory Structure

Each domain follows this structure:

```
packages/api/src/routers/{domain}/
├── _schemas/
│   ├── index.ts                        # barrel export
│   ├── {domain}-{operation}.schema.ts
│   └── ...
├── {domain}.router.ts                  # procedure definition (auth + input binding)
└── {domain}.service.ts                 # business logic (DB calls, lib utilities)
```

Utilities are placed under `packages/api/src/lib/`:

```
packages/api/src/lib/
├── mesh/convert.ts       # latitude/longitude → mesh code
├── moderation/text-filter.ts
├── image/process.ts
└── trust/scoring.ts
```

## Procedure Definition (router file)

Router files only bind auth type + input schema + service call. No business logic here.

```typescript
import { protectedProcedure, publicProcedure } from "../../index";
import { exampleCreateSchema, exampleListSchema } from "./_schemas";
import { createExample, listExamples } from "./example.service";

export const exampleRouter = {
  // Public endpoint (no auth required)
  list: publicProcedure.input(exampleListSchema).handler(async ({ input }) => {
    return await listExamples(input);
  }),

  // Protected endpoint (auth required — context.session is guaranteed non-null)
  create: protectedProcedure.input(exampleCreateSchema).handler(async ({ input, context }) => {
    return await createExample(input, context.session.user.id);
  }),
};
```

## Procedure Base Types

Defined in `packages/api/src/index.ts`:

```typescript
import { ORPCError, os } from "@orpc/server";
import type { Context } from "./context";

export const o = os.$context<Context>();
export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({ context: { session: context.session } });
});

export const protectedProcedure = publicProcedure.use(requireAuth);
```

## Schema Pattern

Each operation has its own schema file. Export both the schema and the inferred type.

```typescript
// _schemas/example-create.schema.ts
import z from "zod";

export const exampleCreateSchema = z.object({
  description: z.string().min(1).max(200),
  timeRange: z.enum(["MIDNIGHT", "MORNING", "DAYTIME", "EVENING", "NIGHT_EARLY", "NIGHT_LATE"]),
  categoryIds: z.array(z.string().min(1)).min(1).max(5),
});

export type ExampleCreateInput = z.infer<typeof exampleCreateSchema>;
```

```typescript
// _schemas/index.ts  — barrel export
export { exampleCreateSchema, type ExampleCreateInput } from "./example-create.schema";
export { exampleListSchema, type ExampleListInput } from "./example-list.schema";
```

## Service Pattern

Service files hold all business logic and import types from `_schemas`.

```typescript
import prisma from "@neighborhood-incident-report/db";
import { ORPCError } from "@orpc/server";
import type { ExampleCreateInput } from "./_schemas";

export async function createExample(input: ExampleCreateInput, userId: string) {
  // validate, transform, write to DB
  return await prisma.example.create({
    data: { ...input, userId },
    select: { id: true, description: true }, // never expose userId/email/name
  });
}
```

## Error Handling

Always use `ORPCError` — never throw plain `Error` from handlers or services.

```typescript
throw new ORPCError("NOT_FOUND", { message: "Post not found" });
throw new ORPCError("UNAUTHORIZED");
throw new ORPCError("FORBIDDEN", { message: "Rate limit exceeded" });
throw new ORPCError("BAD_REQUEST", { message: "Invalid input" });
```

## Prisma Query Pattern

Use `select` on every query to avoid leaking sensitive fields.

```typescript
// ✅ CORRECT: explicit select
const post = await prisma.post.findUnique({
  where: { id },
  select: {
    id: true,
    meshCode: true,
    description: true,
    timeRange: true,
    status: true,
    publishedAt: true,
  },
});

// ❌ WRONG: returns all fields including userId, etc.
const post = await prisma.post.findUnique({ where: { id } });
```

### Cursor Pagination

```typescript
const rows = await prisma.post.findMany({
  take: input.limit + 1,
  ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
  orderBy: { publishedAt: "desc" },
  select: { id: true, ... },
});

const hasMore = rows.length > input.limit;
const items = hasMore ? rows.slice(0, input.limit) : rows;
const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

return { items, nextCursor };
```

## Privacy-Critical Patterns

### Location: never store raw coordinates

```typescript
// ✅ CORRECT: convert then discard
import { toMeshCode } from "../../lib/mesh/convert";

const meshCode = toMeshCode(input.latitude, input.longitude);
await prisma.post.create({ data: { meshCode, ... } }); // latitude/longitude not stored

// ❌ WRONG
await prisma.post.create({ data: { lat: input.latitude, lng: input.longitude } });
```

### Response: never expose userId / email / name

Fields to always omit from `select`: `userId`, `user.email`, `user.name`, raw coordinates.

## Registering Routers

Add new routers to `packages/api/src/routers/index.ts`:

```typescript
import { exampleRouter } from "./example/example.router";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  incident: incidentRouter,
  moderation: moderationRouter,
  example: exampleRouter, // add here
};
```

Generated from git history analysis - 2026-03-03
