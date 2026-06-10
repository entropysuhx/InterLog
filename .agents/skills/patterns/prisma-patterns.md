# Skill: Prisma Patterns

All database access in InterLog goes through Prisma. This skill documents the patterns every agent must follow: the client singleton, authorization scoping, mutation safety, schema conventions, and migration discipline.

---

## Client Singleton

**File:** `src/lib/db/index.ts`

In Next.js, the module system re-evaluates in development due to hot reload. Without a singleton, each reload creates a new `PrismaClient` instance and exhausts the connection pool.

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

Import only from this file. Never instantiate `PrismaClient` elsewhere.

```ts
// ✅
import { prisma } from '@/lib/db'

// ❌
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```

---

## Authorization Scoping

**Every query must be scoped to `session.user.id`.** This is a security requirement, not a style preference. See `rules/security.md` for the full rationale.

```ts
// ✅ All reads scoped to the authenticated user
const activities = await prisma.activity.findMany({
  where: {
    userId:    session.user.id,
    startTime: { gte: startOfDay, lte: endOfDay },
  },
  orderBy: { startTime: 'asc' },
})

// ✅ Mutations use compound where to prevent IDOR
const updated = await prisma.activity.update({
  where: { id: input.activityId, userId: session.user.id },
  data:  { categoryId: input.categoryId },
})

// ❌ Never query without userId scope
const activities = await prisma.activity.findMany({
  where: { id: input.activityId }  // attacker can access any record
})
```

For `update` and `delete`, if the compound `where` finds no record (either the ID doesn't exist or it belongs to another user), Prisma throws `P2025`. Handle it:

```ts
try {
  const activity = await prisma.activity.update({
    where: { id: input.id, userId: session.user.id },
    data:  { ... },
  })
  return { success: true, data: activity }
} catch (e) {
  if (isPrismaError(e, 'P2025')) return { success: false, error: 'Not found.' }
  throw e
}
```

---

## Common Query Patterns

### Activities for a Day

```ts
const dayActivities = await prisma.activity.findMany({
  where: {
    userId:    userId,
    startTime: { gte: startOfDay(date) },
    endTime:   { lte: endOfDay(date) },
  },
  include: { category: true },
  orderBy: { startTime: 'asc' },
})
```

For in-progress activities (null `endTime`), use an `OR`:

```ts
where: {
  userId: userId,
  startTime: { gte: startOfDay(date) },
  OR: [
    { endTime: { lte: endOfDay(date) } },
    { endTime: null },
  ],
}
```

### Analytics Aggregation

Use `groupBy` for category breakdowns:

```ts
const breakdown = await prisma.activity.groupBy({
  by:     ['categoryId'],
  where:  { userId, startTime: { gte: periodStart, lte: periodEnd } },
  _sum:   { duration: true },
  _count: { id: true },
})
```

For weekly trends, aggregate in the application layer from daily totals — Prisma's date truncation support varies by DB dialect.

### Reflection Upsert

```ts
await prisma.reflection.upsert({
  where:  { userId_activityDate_prompt: { userId, activityDate, prompt } },
  update: { answer, updatedAt: new Date() },
  create: { id: cuid(), userId, activityDate, prompt, answer },
})
```

### Bulk Insert (Migration)

```ts
await prisma.$transaction([
  prisma.activity.createMany({
    data:            activities.map(a => ({ ...a, userId })),
    skipDuplicates:  true,
  }),
  prisma.reflection.createMany({
    data:            reflections.map(r => ({ ...r, userId })),
    skipDuplicates:  true,
  }),
])
```

Use `$transaction` for any multi-table write that must be atomic. The migration from guest data is the primary example.

---

## Schema Conventions

Follow these conventions in `prisma/schema.prisma`:

```prisma
model Activity {
  id         String    @id @default(cuid())
  userId     String
  title      String    @db.VarChar(200)
  startTime  DateTime
  endTime    DateTime?
  duration   Int?      // seconds — nullable until end time is set
  categoryId String
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id])

  @@index([userId, startTime])   // required — every timeline query filters on both
  @@index([userId, categoryId])  // required — analytics groupBy queries
}
```

Rules:
- All IDs use `cuid()` — never `autoincrement()`.
- All user-owned models have `onDelete: Cascade` on the `user` relation.
- String fields that map to user input have a `@db.VarChar(N)` constraint matching the Zod schema's `max(N)`.
- Always add indexes for fields used in `where` and `orderBy` clauses. At minimum: `[userId, startTime]` on `Activity`, `[userId, activityDate]` on `Reflection`.
- Use `DateTime` for all timestamps. Store in UTC. Convert to local time in the application layer using `Intl.DateTimeFormat`.
- Use `Int` for durations in seconds — not `Float`, not a string.

---

## Error Handling

Map Prisma error codes to user-facing messages:

```ts
import { Prisma } from '@prisma/client'

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
}

// Common codes
// P2002 — Unique constraint violation
// P2025 — Record not found (also thrown by compound where mismatches)
// P2003 — Foreign key constraint violation
```

Never expose raw Prisma error messages or stack traces to the client. Log them server-side and return a generic user-facing message.

---

## Migration Discipline

- Every schema change requires a new migration file: `npx prisma migrate dev --name <description>`
- Never edit migration files after they have been applied to any environment.
- Migration names use snake_case and describe the change: `add_focus_session_table`, `add_mood_entry_index`.
- Run `npx prisma generate` after any schema change before running the app.
- In CI: run `npx prisma migrate deploy` (not `dev`) to apply pending migrations without generating new ones.
- Never use `prisma db push` in production — it bypasses the migration history.

---

## Soft Deletes

InterLog does not use soft deletes. Activities, reflections, and focus sessions are hard-deleted when removed. The `onDelete: Cascade` on all user relations ensures that deleting a user removes all their data (required for GDPR compliance).

If a future feature requires an audit trail or undo capability, introduce a separate `ActivityArchive` table rather than adding `deletedAt` to the main model.

---

## Type Safety

Always use the types Prisma generates — do not manually redefine model types:

```ts
import type { Activity, Category, Reflection } from '@prisma/client'

// For queries with includes, use Prisma's utility types
import type { Prisma } from '@prisma/client'

type ActivityWithCategory = Prisma.ActivityGetPayload<{
  include: { category: true }
}>
```

This ensures that adding a field to the schema automatically surfaces in TypeScript without manual type updates.
