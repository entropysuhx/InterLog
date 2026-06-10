# Skill: Reflection System

Reflection is a core differentiator of InterLog. It must feel emotionally safe, low-friction, and never performative. This skill covers prompt structure, autosave behavior, mood handling, streak framing, and historical reflection.

---

## Design Principles for Reflection

- Present **one primary prompt** and up to **two optional prompts**. Never a long form.
- Reflection is available at the end of each day but can be completed at any time.
- Autosave aggressively — users should never lose a draft.
- Mood is **private by default** and excluded from all productivity scores and analytics.
- Streaks celebrate return, never punish absence.

---

## Data Model

```ts
// Reflection answers are per-day, not per-activity
// schema.prisma
model Reflection {
  id           String   @id @default(cuid())
  userId       String
  activityDate String   // YYYY-MM-DD — the day this reflection is about
  prompt       String   // the prompt text shown to the user
  answer       String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, activityDate, prompt])
}

model MoodEntry {
  id           String   @id @default(cuid())
  userId       String
  activityDate String   // YYYY-MM-DD
  mood         Int      // 1–5 (see scale below)
  note         String?  // optional free text — private
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, activityDate])
}
```

---

## Prompt Structure

Each reflection session presents:
- **1 primary prompt** — always shown, required to complete the reflection
- **Up to 2 optional prompts** — shown below the primary with *"Also reflect on…"* header

The primary prompt is selected based on the day's activity data:
- High focus time → *"What helped you focus today?"*
- Low tracked time → *"What felt important even if you didn't track it?"*
- Default → *"What felt meaningful today?"*

Optional prompts are drawn from the pool and rotated to avoid repetition:

```ts
const OPTIONAL_PROMPTS = [
  "What are you proud of today?",
  "What drained your energy?",
  "What distracted you the most?",
  "What would you like to do differently tomorrow?",
  "What surprised you today?",
  "What do you want to carry into tomorrow?",
]
```

**Never** ask both *"What drained your energy?"* and *"What distracted you?"* in the same session — they are too similar. Ensure prompt selection avoids near-duplicates.

---

## `ReflectionCard` Component

```tsx
// src/components/reflection/ReflectionCard/index.tsx

interface ReflectionCardProps {
  date:            string        // YYYY-MM-DD
  primaryPrompt:   string
  optionalPrompts: string[]      // max 2
  existingAnswers: ReflectionAnswer[]
  onSave:          (answers: ReflectionAnswer[]) => void
}
```

Layout:

```
┌─────────────────────────────────────────────────┐
│  Today's Reflection            [date]            │
│                                                  │
│  [Primary prompt text]                           │
│  ┌─────────────────────────────────────────────┐ │
│  │ Textarea — autosave, no character limit     │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  Also reflect on…                                │
│  [Optional prompt 1]                             │
│  ┌─────────────────────────────────────────────┐ │
│  │ Textarea                                    │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  [Mood picker — private label]                   │
│                                                  │
│  [Skip]                    [Save reflection]     │
└─────────────────────────────────────────────────┘
```

- Reading width: `max-w-[44rem]` — enforced on the card container, not just the textarea.
- Textarea has no character limit but uses `min-h-[80px]` with auto-grow.
- The *"Save reflection"* button is enabled as soon as the primary prompt has any text.
- *"Skip"* records that the user was offered a reflection for this date and declined — enables accurate streak tracking.

---

## Autosave

Autosave operates on two levels:

### Local Draft (always)

Save draft to `localStorage` on every keystroke with a **500ms debounce**:

```ts
// key: `interlog:reflection-draft:${date}`
// value: { primaryAnswer: string, optionalAnswers: string[], savedAt: string }
```

On component mount, restore the draft if no saved reflection exists for that date.

### Remote Save (authenticated users)

Call `actions/reflection.ts:saveReflection` on:
- Manual *"Save reflection"* click
- Component unmount (if unsaved changes exist)
- Page visibility change (`visibilitychange` → `hidden`)

```ts
// On unmount with unsaved changes
useEffect(() => {
  return () => {
    if (hasUnsavedChanges) {
      saveReflection(draftAnswers)  // fire-and-forget — do not await in cleanup
    }
  }
}, [hasUnsavedChanges, draftAnswers])
```

After remote save: clear the localStorage draft and update the local state to match.

---

## Mood Picker

The mood picker is a five-point named scale. It is **private by default**.

| Value | Name | Icon |
|---|---|---|
| 1 | Difficult | `😔` or abstract icon |
| 2 | Low | `😕` |
| 3 | Okay | `😐` |
| 4 | Good | `🙂` |
| 5 | Great | `😊` |

Rules:
- Use icon + name together — never emoji alone (accessibility).
- The selected state uses `bg-surface-active border-border-active` — do not use a specific mood color that implies judgment.
- Mood value is never shown in analytics dashboards unless the user explicitly navigates to a mood-specific view.
- Mood is never sent to the AI layer.
- In the historical reflection view, mood is shown only if the user enabled *"Show mood in history"* in settings.

```tsx
<fieldset aria-label="How did today feel?">
  <legend className="text-label font-[550] text-text-secondary mb-ds-8">
    How did today feel? <span className="text-caption text-text-muted">(private)</span>
  </legend>
  {MOOD_SCALE.map(({ value, name, icon }) => (
    <button
      key={value}
      role="radio"
      aria-checked={selectedMood === value}
      onClick={() => setMood(value)}
      className={cn('...', selectedMood === value && 'bg-surface-active border-border-active')}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="text-caption">{name}</span>
    </button>
  ))}
</fieldset>
```

---

## Streak Tracking

Streaks measure *reflection days*, not consecutive days without a break.

### What Counts

- A day counts if the user saved at least one reflection answer (even a single word).
- A day does not count if the user only skipped.
- There is no "broken streak" concept — the streak is a count, not a chain.

### Copy Rules

| ❌ Loss framing | ✅ Additive framing |
|---|---|
| "You broke your 7-day streak!" | "6 reflection days this month" |
| "Don't lose your streak" | "You've reflected 3 days in a row — nice." |
| "Streak lost" | (never show this) |

Streak display in the UI:
- Show in the sidebar or dashboard as a quiet stat: *"12 reflection days this month"*
- On a new reflection save: a brief, quiet confirmation — *"Reflection saved."* — optionally followed by the count if it is a notable milestone (e.g., first 5 days, first 10 days).
- Never show a punitive badge, flame icon, or loss notification.

---

## Server Actions

```ts
// src/actions/reflection.ts

export async function saveReflection(input: SaveReflectionInput): Promise<ActionResult<Reflection[]>>
export async function skipReflection(date: string): Promise<ActionResult<void>>
export async function getReflectionHistory(limit?: number): Promise<ActionResult<ReflectionWithTimeline[]>>
```

`SaveReflectionInput` schema:

```ts
export const SaveReflectionSchema = z.object({
  activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  answers: z.array(z.object({
    prompt: z.string().min(1).max(500),
    answer: z.string().min(1).max(5000),
  })).min(1).max(3),
  mood: z.number().int().min(1).max(5).optional(),
}).strict()
```

`saveReflection` uses `upsert` on `[userId, activityDate, prompt]` — re-saving the same day overwrites rather than creating duplicates.

---

## Historical Reflection View

When a user revisits a past reflection, the UI pairs three data sources side by side:

```
┌──────────────┬────────────────────┬──────────────┐
│  Timeline    │  Reflection        │  Analytics   │
│  (that day)  │  (answers + mood)  │  (that day)  │
└──────────────┴────────────────────┴──────────────┘
```

- The timeline is read-only in this view — no editing.
- Reflection answers are shown as plain text (no textarea).
- Analytics shows that day's category breakdown and focus hours.
- Mood is shown only if the user has *"Show mood in history"* enabled.
- If no reflection was completed for a date, show the prompts that were available that day with an option to complete them now (late reflection is allowed).

---

## End-of-Day Prompt Timing

- Surface the reflection prompt when the user opens the app after **8 PM local time** on any day that has logged activities but no reflection.
- Do not interrupt an active focus session.
- Do not show the prompt more than once per day — if the user dismisses it, do not re-show it that day.
- The prompt appears as a card at the top of the dashboard, not as a modal — it should not block access to the rest of the app.
