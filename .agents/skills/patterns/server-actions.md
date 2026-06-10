# Skill: Server Actions

Server Actions are the mutation layer in InterLog. This skill documents the standard file structure, the `ActionResult<T>` pattern, validation requirements, revalidation strategy, and how actions differ from Route Handlers.

---

## When to Use Server Actions vs. Route Handlers

| Use Server Actions for | Use Route Handlers for |
|---|---|
| All data mutations (create, update, delete) | Streaming responses |
| Form submissions | Webhooks (OAuth callbacks, etc.) |
| Triggering AI categorization inline with saves | Public or guest-facing endpoints (e.g., `/api/categorize`) |
| Revalidating cached data | Endpoints that must return a specific HTTP status or header |

If you find yourself building a `POST` Route Handler that an authenticated user calls to mutate data — stop and use a Server Action instead.

---

## File Structure

One file per domain in `src/actions/`. Named exports only — no default exports.

```
src/actions/
├── activity.ts       createActivity, updateActivity, deleteActivity, updateActivityCategory
├── reflection.ts     saveReflection, skipReflection
├── focus.ts          startFocusSession, completeFocusSession, cancelFocusSession
├── wrapped.ts        generateWrapped, dismissWrapped
├── insight.ts        recordInsightFeedback, dismissInsight
├── migrate.ts        (internal — called by /api/migrate, not directly by components)
└── user.ts           updatePreferences, deleteAccount, exportData
```

---

## The Standard Action Shape

Every action follows this exact pattern. Do not deviate:

```ts
'use server'

import { auth }            from '@/lib/auth'
import { prisma }          from '@/lib/db'
import { revalidatePath }  from 'next/cache'
import { z }               from 'zod'
import type { ActionResult } from '@/types'

// 1. Define and export the input schema
export const CreateActivitySchema = z.object({
  title:      z.string().min(1).max(200).trim(),
  startTime:  z.string().datetime(),
  endTime:    z.string().datetime().optional(),
  categoryId: z.string().cuid().optional(),
}).strict()

export type CreateActivityInput = z.infer<typeof CreateActivitySchema>

// 2. Implement the action
export async function createActivity(
  input: CreateActivityInput
): Promise<ActionResult<Activity>> {

  // Step 1: Auth — always first, always required
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized.' }
  }

  // Step 2: Validate — Zod is the security boundary
  const parsed = CreateActivitySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input.' }
  }
  const data = parsed.data

  // Step 3: Business logic
  // ...

  // Step 4: Database write (always scoped to session.user.id)
  const activity = await prisma.activity.create({ ... })

  // Step 5: Revalidate relevant paths
  revalidatePath('/dashboard')

  // Step 6: Return typed result
  return { success: true, data: activity }
}
```

---

## `ActionResult<T>` Type

Defined in `src/types/index.ts`. Import and use it everywhere:

```ts
export type ActionResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string }
```

Rules:
- **Never throw** from a Server Action. Caught errors return `{ success: false, error: '...' }`.
- **Never return `null` or `undefined`** — always return the union.
- Error strings are user-facing. Keep them calm and actionable. No stack traces, no Prisma error codes.
- The `data` field is only present on success. TypeScript narrows this correctly when you check `result.success`.

```ts
// In a Client Component
const result = await createActivity(formData)

if (!result.success) {
  toast.error(result.error) // "We could not save this entry. Your draft is still here."
  return
}

// result.data is Activity here — TypeScript knows
updateTimeline(result.data)
```

---

## Validation Rules

- Validate with Zod **inside the action**, not just on the client. Client validation is UX; action validation is security.
- Use `.strict()` on all object schemas to reject unexpected fields.
- Use `.trim()` on all string fields that come from text inputs.
- Cross-field validation (e.g., `endTime` must be after `startTime`) uses `.refine()`:

```ts
const CreateActivitySchema = z.object({
  startTime: z.string().datetime(),
  endTime:   z.string().datetime().optional(),
}).strict().refine(
  data => !data.endTime || new Date(data.endTime) > new Date(data.startTime),
  { message: 'End time must be after start time.', path: ['endTime'] }
)
```

- Never use the Zod error details in the returned `error` string — they may contain field names that could aid an attacker. Return a single generic message.

---

## Revalidation Strategy

After mutations, revalidate the minimum set of paths needed:

| Action | Revalidate |
|---|---|
| createActivity, updateActivity, deleteActivity | `revalidatePath('/dashboard')` |
| updateActivityCategory | `revalidatePath('/dashboard')`, `revalidatePath('/analytics')` |
| saveReflection | `revalidatePath('/reflection')`, `revalidatePath('/dashboard')` |
| completeFocusSession | `revalidatePath('/dashboard')` |
| generateWrapped | `revalidatePath('/wrapped')` |
| deleteAccount | (handled by sign-out redirect — no revalidation needed) |

Do not call `revalidatePath('/')` as a catch-all — it invalidates too broadly and causes unnecessary re-fetches.

Use `revalidateTag` when the same data is consumed across many routes (e.g., category list).

---

## Error Handling Patterns

### Prisma Errors

```ts
import { Prisma } from '@prisma/client'

try {
  const activity = await prisma.activity.update({
    where: { id: input.id, userId: session.user.id },
    data:  { ... },
  })
  return { success: true, data: activity }
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') return { success: false, error: 'Activity not found.' }
  }
  // Re-throw unexpected errors — they will be caught by the error boundary
  throw error
}
```

### AI Errors

AI failures in the activity creation flow should **never block** the save. The activity is always saved; categorization falls back gracefully:

```ts
let categoryId = input.categoryId
if (!categoryId) {
  try {
    const result = await categorizeActivity(input.title)
    categoryId = result.categoryId
  } catch {
    // Fall back to 'admin' — silent failure
    categoryId = DEFAULT_CATEGORY_ID
  }
}
// Continue with the save regardless
```

---

## Calling Actions from Client Components

```tsx
'use client'

import { createActivity } from '@/actions/activity'

export function ActivityForm() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: ActivityFormData) {
    setIsLoading(true)
    try {
      const result = await createActivity(formData)
      if (result.success) {
        toast.success('Activity added.')
        // Update optimistic state or let revalidation handle it
      } else {
        toast.error(result.error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={...}>
      {/* ... */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
```

- Disable the submit button while `isLoading` is true to prevent double-submission.
- On success, the `revalidatePath` in the action refreshes Server Component data automatically.
- On error, keep the form populated — do not reset it.

---

## What Not to Put in Server Actions

| Don't put this in an action | Put it here instead |
|---|---|
| `fetch()` calls to external APIs (except AI) | `src/lib/` utility functions called by the action |
| Complex data transformation logic | `src/lib/` or `src/types/` |
| UI concerns (toast, navigation) | The calling Client Component |
| Multiple unrelated mutations in one action | Separate actions — one responsibility per action |
| Auth.js configuration | `src/lib/auth/` |
