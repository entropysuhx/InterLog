# Skill: Guest Mode

Guest mode lets users experience InterLog immediately without registration. All data lives in `localStorage`. This skill covers the storage schema, read/write API, migration on sign-up, and the UI rules around prompting registration.

---

## Core Rule

**No component reads or writes `localStorage` directly.** All guest data access goes through `src/lib/guest/store.ts`. This is the single interface — treat it like a DB client.

---

## localStorage Schema

Keys are namespaced under `interlog:` to avoid collisions.

| Key | Value |
|---|---|
| `interlog:activities` | `GuestActivity[]` (JSON) |
| `interlog:reflections` | `GuestReflection[]` (JSON) |
| `interlog:focus-sessions` | `GuestFocusSession[]` (JSON) |
| `interlog:categories` | `GuestCategory[]` (JSON) — seeded from the canonical list on first use |
| `interlog:guest-id` | `string` — a locally generated `cuid()` used as a stable identifier |
| `interlog:created-at` | `string` — ISO datetime of first guest session |

Guest types mirror DB models exactly, using `guestId` in place of `userId`:

```ts
// src/types/guest.ts

export interface GuestActivity {
  id:          string   // cuid()
  guestId:     string
  title:       string
  startTime:   string   // ISO 8601
  endTime:     string | null
  duration:    number | null  // seconds
  categoryId:  string
  createdAt:   string   // ISO 8601
}

export interface GuestReflection {
  id:           string
  guestId:      string
  activityDate: string  // YYYY-MM-DD
  prompt:       string
  answer:       string
  createdAt:    string
}

export interface GuestFocusSession {
  id:          string
  guestId:     string
  activityId:  string | null
  startTime:   string
  endTime:     string | null
  duration:    number | null
}

export interface GuestCategory {
  id:    string
  key:   string   // 'deep-work', 'learning', etc.
  name:  string
  color: string
  icon:  string
}
```

---

## `guestStore` API

`src/lib/guest/store.ts` exports a single `guestStore` object:

```ts
export const guestStore = {
  // Identity
  getGuestId():     string
  getCreatedAt():   string

  // Activities
  getActivities():                    GuestActivity[]
  getActivitiesByDate(date: string):  GuestActivity[]   // date: YYYY-MM-DD
  createActivity(a: Omit<GuestActivity, 'id' | 'guestId' | 'createdAt'>): GuestActivity
  updateActivity(id: string, patch: Partial<GuestActivity>):               GuestActivity | null
  deleteActivity(id: string):         void

  // Reflections
  getReflections():                         GuestReflection[]
  getReflectionByDate(date: string):        GuestReflection | null
  saveReflection(r: Omit<GuestReflection, 'id' | 'guestId' | 'createdAt'>): GuestReflection

  // Focus Sessions
  getFocusSessions():         GuestFocusSession[]
  createFocusSession():       GuestFocusSession
  completeFocusSession(id: string, title: string, endTime: string): GuestFocusSession | null

  // Utilities
  clear():   void   // used after successful migration
  export():  GuestDataExport
}
```

Implementation notes:
- Every write calls `JSON.stringify` and `localStorage.setItem` immediately — no batching.
- Every read calls `JSON.parse` with a try/catch. If parsing fails, return an empty array and log the error — never crash.
- `getGuestId()` generates a `cuid()` on first call and stores it under `interlog:guest-id`. Subsequent calls return the stored value.

---

## Seeding Categories

On the first `guestStore` read, if `interlog:categories` is empty, seed it from the canonical list:

```ts
const DEFAULT_CATEGORIES: GuestCategory[] = [
  { id: 'cat_deepwork',   key: 'deep-work',  name: 'Deep Work',  color: '#0f9f94', icon: 'brain' },
  { id: 'cat_learning',   key: 'learning',   name: 'Learning',   color: '#805ad5', icon: 'book' },
  { id: 'cat_reflection', key: 'reflection', name: 'Reflection', color: '#9b51c8', icon: 'leaf' },
  { id: 'cat_exercise',   key: 'exercise',   name: 'Exercise',   color: '#f06449', icon: 'dumbbell' },
  { id: 'cat_social',     key: 'social',     name: 'Social',     color: '#6366f1', icon: 'users' },
  { id: 'cat_meeting',    key: 'meeting',    name: 'Meeting',    color: '#2496d8', icon: 'video' },
  { id: 'cat_admin',      key: 'admin',      name: 'Admin',      color: '#667085', icon: 'inbox' },
  { id: 'cat_break',      key: 'break',      name: 'Break',      color: '#d69e16', icon: 'coffee' },
  { id: 'cat_personal',   key: 'personal',   name: 'Personal',   color: '#db5f91', icon: 'heart' },
]
```

These IDs are deterministic so that guest data migrated to the DB maps to the correct category rows.

---

## Migration Flow

Triggered when a guest user creates an account (Google OAuth or email sign-up).

**File:** `src/lib/guest/migrate.ts`

```ts
export async function migrateGuestData(userId: string): Promise<MigrationResult> {
  const exported = guestStore.export()

  // Validate all guest data with the same Zod schemas used for authenticated inputs
  const validActivities   = exported.activities.filter(a => CreateActivitySchema.safeParse(toAuthShape(a)).success)
  const validReflections  = exported.reflections.filter(r => SaveReflectionSchema.safeParse(toAuthShape(r)).success)
  // Silently skip invalid records — log them server-side

  const response = await fetch('/api/migrate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ activities: validActivities, reflections: validReflections }),
  })

  if (!response.ok) {
    // Do NOT clear guest data — return error so the user can retry
    return { success: false, error: 'Migration failed. Your data is still here.' }
  }

  // Only clear after confirmed success
  guestStore.clear()
  return { success: true }
}
```

**`/api/migrate` Route Handler** (`src/app/api/migrate/route.ts`):

```ts
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  // Re-validate server-side — never trust client input
  const activities  = body.activities.filter(...)
  const reflections = body.reflections.filter(...)

  await prisma.$transaction([
    prisma.activity.createMany({
      data: activities.map(a => ({ ...a, userId: session.user.id })),
      skipDuplicates: true,
    }),
    prisma.reflection.createMany({
      data: reflections.map(r => ({ ...r, userId: session.user.id })),
      skipDuplicates: true,
    }),
  ])

  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
```

### Migration UI

Show a progress state during migration — do not silently redirect. Use this pattern in the post-auth callback:

```
Account created
  → Show "Saving your data..." with a loading indicator
  → Call migrateGuestData(userId)
  → On success: "All set! Your activities have been saved." → redirect to /dashboard
  → On failure: "We couldn't save your guest data. Try again?" with a Retry button
               + "Skip and continue" option (data loss acknowledged)
```

---

## Registration Prompts

Guest users should be nudged toward registration — but never blocked.

### When to Prompt

| Trigger | Prompt |
|---|---|
| After 3 days of usage | Persistent but dismissible banner in the top bar |
| After the first Wrapped summary is generated | Inline CTA at the end of Wrapped: *"Save your history — create a free account."* |
| After 10+ activities logged | Subtle nudge in the sidebar |
| On browser storage warning (approaching quota) | Elevated prompt: *"Your data is at risk — back it up with a free account."* |

### Prompt Copy Rules

- Never use fear-based language: ❌ *"You'll lose everything!"*
- Frame around value: ✅ *"Create an account to keep your history safe and access it anywhere."*
- Always include a *"Maybe later"* / dismiss option.
- Do not re-show a dismissed prompt for at least 24 hours.

### What Guests Cannot Do

Surface these limitations contextually, not as a gate:

- No cloud sync
- No cross-device access
- No backup
- No Wrapped history beyond the current session

---

## SSR Safety

`guestStore` accesses `localStorage`, which is unavailable during SSR. All calls must be inside:
- A `"use client"` component
- A `useEffect`
- Or guarded with `typeof window !== 'undefined'`

The `useGuest` hook handles this automatically — prefer it over calling `guestStore` directly from components.

```ts
// src/hooks/useGuest.ts
export function useGuest() {
  const [activities, setActivities] = useState<GuestActivity[]>([])

  useEffect(() => {
    setActivities(guestStore.getActivities())
  }, [])

  // ...
}
```
