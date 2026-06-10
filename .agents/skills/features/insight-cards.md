# Skill: Insight Cards

`InsightCard` renders AI-generated observations about a user's activity patterns. The component must be transparent about its evidence, honest about its uncertainty, and give users full control over what they see. This skill covers structure, required controls, rendering states, and content validation.

---

## The Three-Part Structure

Every insight has three distinct sections. Never combine them or omit the evidence:

```
┌─────────────────────────────────────────────────────┐
│  [Confidence badge]          [Why am I seeing this?] │
│                                                       │
│  Observation                                          │
│  What the data shows — stated as fact.               │
│                                                       │
│  Interpretation                                       │
│  What it might mean — hedged language.               │
│                                                       │
│  Recommendation (optional)                            │
│  "You might try…" — framed as an experiment.         │
│                                                       │
│  Evidence                                             │
│  "Across 8 focus sessions in the last 14 days"       │
│                                                       │
│  [👍 Helpful]  [👎 Not helpful]         [Dismiss ✕]  │
└─────────────────────────────────────────────────────┘
```

---

## `InsightCard` Props

```tsx
interface InsightCardProps {
  observation:     string
  interpretation:  string
  recommendation?: string
  evidence:        string
  confidence:      'emerging' | 'consistent' | 'strong'
  category?:       string     // related activity category key, if applicable
  insightId:       string     // for feedback tracking
  onFeedback:      (insightId: string, helpful: boolean) => void
  onDismiss:       (insightId: string) => void
}
```

---

## Confidence Badge

| Value | Label | Visual |
|---|---|---|
| `emerging` | Emerging pattern | `bg-activity-learning-bg text-activity-learning-icon` — subtle |
| `consistent` | Consistent pattern | `bg-activity-deep-work-bg text-activity-deep-work-icon` — calm |
| `strong` | Strong pattern | `bg-interactive-primary text-text-inverse` — confident |

The badge uses `rounded-full` pill shape and `text-caption font-[550]` typography.

Do not use `status-success` / `status-warning` colors for confidence — those are reserved for system states, not AI signal strength.

---

## "Why Am I Seeing This?" Toggle

Every card has this toggle. On activation, it expands a section below the evidence line:

```
Why am I seeing this?
──────────────────────────────────────────────────
This insight is based on [evidence]. The pattern
is rated "[confidence]" because [brief explanation
of what confidence means in context].
```

This section is collapsed by default. Use a `<details>` / `<summary>` pattern or an animated expand controlled by `useState`. It must be keyboard accessible.

---

## Recommendation Rules

When a recommendation is present:
- It appears in a visually distinct section — lighter background (`bg-surface-subtle`), `rounded-lg`, and a subtle left border using `border-interactive-primary` at 40% opacity.
- Always introduced with *"You might try:"* or *"One thing to experiment with:"*
- Never prescriptive or moralistic: ❌ *"You should stop checking email."* ✅ *"You might try scheduling email to a single block."*
- Never implies the current behavior is wrong.
- The recommendation section is dismissible independently from the full card.

---

## Feedback Controls

Feedback is recorded via `onFeedback(insightId, helpful: boolean)`.

```ts
// src/actions/insight.ts
export async function recordInsightFeedback(
  insightId: string,
  helpful:   boolean
): Promise<ActionResult<void>>
```

After feedback is given:
- Replace the feedback buttons with a quiet confirmation: *"Thanks for the feedback."*
- Do not remove the card — the user may still want to read it or dismiss it.
- Do not ask for more detail (no follow-up prompt or text field).

---

## Dismiss Behavior

Dismissed insights are stored server-side per user:

```ts
export async function dismissInsight(insightId: string): Promise<ActionResult<void>>
```

- Dismissed insights are hidden from the insights panel for the current period.
- They are not permanently deleted — they inform the AI to not regenerate the same insight.
- The dismiss animation: card fades out and collapses over `180ms` with `exit` easing, and the next card slides up to fill the space.

---

## Loading State

Insights load in a **separate Suspense boundary** from the main analytics. Analytics renders immediately; insights load independently.

While loading, render a stable skeleton matching the card's geometry:

```tsx
<div className="rounded-xl bg-surface-subtle animate-pulse">
  <div className="h-5 w-24 rounded-sm bg-surface-hover mb-ds-12" /> {/* badge */}
  <div className="h-4 w-full rounded-sm bg-surface-hover mb-ds-8" />  {/* observation line 1 */}
  <div className="h-4 w-3/4 rounded-sm bg-surface-hover mb-ds-16" /> {/* observation line 2 */}
  <div className="h-4 w-full rounded-sm bg-surface-hover mb-ds-8" />  {/* interpretation */}
  <div className="h-3 w-1/2 rounded-sm bg-surface-hover" />           {/* evidence */}
</div>
```

Do not use a spinner. Do not block the analytics view.

---

## Error State

If insight generation fails (network error, AI error, timeout):

- Show a calm, non-alarming error card in place of the skeletons.
- Copy: *"Insights could not be loaded."* with a *"Try again"* button.
- Analytics remain fully functional — insights failing should never degrade the core analytics view.
- Log the error server-side. Do not surface technical error details to the user.

---

## AI Content Marking

AI-generated content is visually distinguished — but without novelty effects:

```tsx
// Subtle AI attribution at the bottom of the card
<span className="text-caption text-text-muted flex items-center gap-ds-4">
  <SparkleIcon className="w-3 h-3" aria-hidden="true" />
  AI-generated insight
</span>
```

Rules:
- Small, muted attribution — not a badge, not a glowing border, not animated.
- The sparkle icon is decorative (`aria-hidden`). The text carries the semantic meaning.
- Do not use phrases like *"Claude thinks…"* or *"AI says…"* — the insight text speaks for itself.

---

## What Insights Must Never Contain

Validate AI output before rendering. Reject and retry (once) or omit if any of these are present:

| Prohibited | Example | Why |
|---|---|---|
| Health inference | *"You may be sleep-deprived"* | Not derived from time logs |
| Emotional state diagnosis | *"You seem stressed"* | Private, not inferable |
| Moral labels | *"unproductive", "lazy", "wasted time"* | Judgmental |
| User comparisons | *"Most users focus more in the morning"* | No comparative data |
| Unsupported claims | *"This will improve your performance"* | Not evidence-based |
| PII echoing | Repeating the user's name or email | Unnecessary |

If the AI output contains any of the above after a retry, omit the insight entirely. Do not render a degraded version.

---

## InsightCard in the Analytics Layout

Insights appear in a dedicated panel below the primary analytics widgets:

```
┌─────────────────────────────────────────────────────┐
│  Your Insights              [Refresh ↻]  [2 of 4 ›] │
├─────────────────────────────────────────────────────┤
│  InsightCard (active)                                │
├─────────────────────────────────────────────────────┤
│  InsightCard (collapsed preview)                     │
│  InsightCard (collapsed preview)                     │
└─────────────────────────────────────────────────────┘
```

- Show the first insight expanded; remaining insights as collapsed previews (headline only).
- *"Refresh"* triggers regeneration (subject to rate limits — see `ai-integration.md`).
- Pagination shows current/total: *"2 of 4"* — allows cycling through all insights.
- On mobile: full-width stacked cards, each fully expanded.
