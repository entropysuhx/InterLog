# Skill: Activity Logging

The activity logging flow is the most frequent user action in InterLog. Every part of the pipeline — validation, AI categorization, persistence, and UI update — must work correctly for both authenticated and guest users. This skill documents exactly how to implement it.

---

## The Full Pipeline

```
User submits activity input
  → Client validates with Zod (UX only)
  → Server Action validates with Zod (security boundary)
  → DeepSeek categorizes the activity title
  → Activity written to DB (authenticated) or localStorage (guest)
  → Timeline revalidated / local state updated
  → UI confirms success
```

---

## Input Schema

Defined in `src/types/activity.ts`. Use `z.infer<>` to derive the TypeScript type:

```ts
export const CreateActivitySchema = z.object({
  title:     z.string().min(1).max(200),
  startTime: z.string().datetime(),               // ISO 8601
  endTime:   z.string().datetime().optional(),    // absent = in progress
  categoryId: z.string().cuid().optional(),       // absent = let AI decide
}).strict()

export type CreateActivityInput = z.infer<typeof CreateActivitySchema>
```

The `categoryId` field is optional on creation. When absent, the Server Action calls the AI categorization service. When present (user manually selected), skip the AI call entirely.

---

## Server Action: `actions/activity.ts`

```ts
'use server'

export async function createActivity(
  input: CreateActivityInput
): Promise<ActionResult<Activity>> {
  // 1. Auth check — always first
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized.' }

  // 2. Validate
  const parsed = CreateActivitySchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Invalid input.' }
  const data = parsed.data

  // 3. Overlap check (warn only — never block)
  const overlaps = await checkOverlaps(session.user.id, data.startTime, data.endTime)
  // overlaps returned in the success response so the client can show a warning

  // 4. AI categorization (if no categoryId provided)
  let categoryId = data.categoryId
  if (!categoryId) {
    const result = await categorizeActivity(data.title)
    categoryId = result.categoryId
  }

  // 5. Persist
  const activity = await prisma.activity.create({
    data: {
      userId:     session.user.id,
      title:      data.title,
      startTime:  new Date(data.startTime),
      endTime:    data.endTime ? new Date(data.endTime) : null,
      duration:   data.endTime
        ? differenceInSeconds(new Date(data.endTime), new Date(data.startTime))
        : null,
      categoryId,
    },
  })

  // 6. Revalidate the timeline route
  revalidatePath('/dashboard')

  return { success: true, data: { activity, hasOverlaps: overlaps.length > 0 } }
}
```

**Do not** combine the overlap check and the save into a single transaction that rolls back on overlap — overlaps are warnings, not errors.

---

## Overlap Handling

- Check for activities belonging to `session.user.id` where time ranges intersect.
- Return the conflicting activities in the success payload.
- The client shows a non-blocking inline warning: *"This overlaps with [Activity Name]."*
- Never prevent saving due to overlaps.

```ts
// Overlap query
async function checkOverlaps(userId: string, startTime: string, endTime?: string) {
  return prisma.activity.findMany({
    where: {
      userId,
      OR: [
        // New activity starts during an existing one
        { startTime: { lte: new Date(startTime) }, endTime: { gt: new Date(startTime) } },
        // New activity ends during an existing one
        ...(endTime ? [{ startTime: { lt: new Date(endTime) }, endTime: { gte: new Date(endTime) } }] : []),
        // New activity fully contains an existing one
        ...(endTime ? [{ startTime: { gte: new Date(startTime) }, endTime: { lte: new Date(endTime) } }] : []),
      ],
    },
  })
}
```

---

## Missing End Time (In Progress)

- `endTime` is optional. An activity without an end time is "in progress."
- Store it with `endTime: null` and `duration: null`.
- The timeline renders it with a **dashed border** and an *"In progress"* label.
- When the user later adds an end time, call `updateActivity` which calculates `duration` from `startTime` and the new `endTime`.
- Prompt the user to complete in-progress entries at the start of a new day — do not auto-close them.

---

## Focus Timer Flow

The Focus Timer creates an activity on stop, not on start.

```
User clicks Start Focus
  → FocusSession created in DB (or localStorage) with startTime
  → Timer runs client-side (useTimer hook)
  → User clicks Stop
  → Server Action: completeFocusSession(sessionId, endTime)
  → Activity created from session data
  → FocusSession updated with endTime + duration
  → Timeline updated
```

```ts
export async function completeFocusSession(
  sessionId: string,
  title: string,
  endTime: string
): Promise<ActionResult<Activity>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized.' }

  const focusSession = await prisma.focusSession.findUnique({
    where: { id: sessionId, userId: session.user.id },
  })
  if (!focusSession) return { success: false, error: 'Session not found.' }

  // Create the activity (reuses createActivity logic)
  const activityResult = await createActivity({
    title,
    startTime: focusSession.startTime.toISOString(),
    endTime,
  })
  if (!activityResult.success) return activityResult

  // Link the focus session to the activity
  await prisma.focusSession.update({
    where: { id: sessionId },
    data: {
      endTime:    new Date(endTime),
      duration:   differenceInSeconds(new Date(endTime), focusSession.startTime),
      activityId: activityResult.data.activity.id,
    },
  })

  return activityResult
}
```

---

## Guest Mode Path

Guest activities follow the same validation schema. Storage goes through `src/lib/guest/store.ts` — never `localStorage` directly.

```ts
// In the client component (guest path)
import { guestStore } from '@/lib/guest/store'

const result = guestStore.createActivity({
  title:     input.title,
  startTime: input.startTime,
  endTime:   input.endTime,
  // categoryId assigned by calling the AI via a guest-specific Route Handler
  // or assigned locally from a lightweight client-side heuristic as fallback
})
```

Guest AI categorization: call `/api/categorize` (a public-but-rate-limited Route Handler) since guest users have no session. This endpoint accepts only `{ title: string }` and returns `{ categoryId: string }`. It does not receive any other user data.

---

## Category Override

Users can change a category after creation. The update action:

```ts
export async function updateActivityCategory(
  activityId: string,
  categoryId: string
): Promise<ActionResult<Activity>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized.' }

  const activity = await prisma.activity.update({
    where: { id: activityId, userId: session.user.id }, // compound where = IDOR protection
    data: { categoryId },
  })

  revalidatePath('/dashboard')
  return { success: true, data: activity }
}
```

---

## Client-Side Form

- Use `react-hook-form` with the Zod resolver for the activity form.
- Show inline field errors immediately on blur.
- On submit: set `isLoading` state, call the Server Action, handle the result.
- On `hasOverlaps: true`: show a dismissible inline warning alongside the success confirmation — do not re-open the form.
- On error: surface via toast using `text-status-error` token. Keep the form populated so the user does not lose their input.
- Success confirmation copy: *"Activity added."* — no exclamation mark.

---

## Edge Cases

| Situation | Behavior |
|---|---|
| Start time after end time | Rejected by Zod (add `.refine()` for cross-field validation) |
| Title is only whitespace | Rejected by `.trim().min(1)` |
| AI categorization fails | Fall back to "Admin" category; surface a subtle notice; allow user to change |
| Activity during a gap > 45 min | Timeline shows "Log this time" affordance — tapping pre-fills the form with the gap's time range |
| Duplicate submission (double-click) | Disable submit button while `isLoading` is true |
| Guest clears browser storage | Data is gone — the registration prompt exists precisely to prevent this |
