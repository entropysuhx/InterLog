# Skill: Wrapped Cards

InterLog Wrapped is a narrative summary report — not a dashboard. It tells the story of a user's period in a sequence of animated cards. This skill covers card types, ordering, animation, keyboard navigation, reduced-motion behavior, and content rules.

---

## What Wrapped Is Not

- Not the primary dashboard — it is accessed intentionally.
- Not a real-time view — it is generated asynchronously and cached.
- Not a gamification system — achievements are factual, not inflated.
- Not a social share product (yet) — export strips sensitive content by default.

---

## Card Sequence

Cards follow a fixed narrative arc:

| # | Card Type | Purpose |
|---|---|---|
| 1 | `orientation` | Greet the user, name the period |
| 2 | `time-overview` | Total tracked hours, focus hours |
| 3 | `category-story` | Top categories and distribution |
| 4 | `focus-pattern` | When focus happened, longest session |
| 5 | `reflection-highlight` | Reflection days count, streak highlight |
| 6 | `achievement` | One factual, grounded accomplishment |
| 7 | `forward-prompt` | A single forward-looking question |

**Monthly reports:** 5–7 cards (omit cards with insufficient data — see below).  
**Yearly reports:** 8–12 cards (may include additional `category-story` or `focus-pattern` cards for different periods of the year).

`orientation` and `forward-prompt` are always present. All other cards require minimum data thresholds to be shown.

---

## Data Thresholds (Minimum to Show a Card)

| Card Type | Minimum required |
|---|---|
| `time-overview` | At least 1 hour of tracked time |
| `category-story` | At least 2 categories with tracked time |
| `focus-pattern` | At least 3 focus sessions |
| `reflection-highlight` | At least 1 completed reflection |
| `achievement` | AI must identify a factual accomplishment from the data |

If a card's threshold is not met, skip it silently. Do not show a placeholder or "Not enough data" card.

---

## `WrappedCard` Component

```tsx
interface WrappedCardProps {
  type:      WrappedCardType
  headline:  string
  body:      string
  stat?:     { value: string; label: string }
  ctaLabel?: string           // forward-prompt card only
  index:     number           // position in sequence (for animation delay)
  isActive:  boolean          // whether this card is currently visible
  isPaused:  boolean          // user paused auto-advance
}
```

### Visual Design

- `rounded-2xl` radius on all cards.
- Background: use `bg-surface-elevated` with a subtle gradient overlay using the period's dominant category color at **12–15% opacity** — not a solid fill.
- Headline: `text-heading-2 font-[650]` — large and confident.
- Stat (if present): `text-display-m font-[650] tabular-nums` for the value, `text-body-md text-text-secondary` for the label.
- Body: `text-body-lg` with `max-w-[44rem]`.
- `shadow-xl` elevation.
- Padding: `p-ds-48` on desktop, `p-ds-32` on mobile.

---

## Navigation

Users move through cards via:
- **Arrow keys** (`←` `→`): previous / next
- **Swipe** (mobile): left/right swipe gesture
- **Click/tap**: tapping the right half of the card advances; left half goes back
- **Dot indicators**: clickable navigation dots below the card

### Controls Bar

Always present below the card:

```
[◀ Prev]  [● ● ○ ○ ○]  [▶ Next]   [⏸ Pause / ▶ Play]   [✕ Exit]
```

- Pause/Play: toggles auto-advance (default: off — do not auto-advance without user intent).
- Exit: returns to the dashboard.
- *"Replay"* button appears on the final card.

### Keyboard Focus Order

```
Card content → Prev button → Dot indicators → Next button → Pause/Play → Exit
```

Ensure focus is trapped within the Wrapped overlay. On exit, restore focus to the element that triggered Wrapped.

---

## Animation

Each card enters with the **deliberate** motion timing:

```css
/* Enter */
animation: enter 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;

/* Exit (previous card) */
animation: exit 280ms cubic-bezier(0.4, 0, 1, 1) forwards;
```

The stat value animates as a count-up from 0 to its final value over **600ms** using the emphasized easing. The count-up starts 200ms after the card enters.

The gradient overlay fades in over **280ms** after the card enters.

### Stagger

If multiple elements enter simultaneously (e.g., category chips on the `category-story` card), stagger them by **60ms per item**.

---

## Reduced Motion

When `prefers-reduced-motion: reduce` is set:
- All card transitions become instant (0ms).
- The stat count-up is replaced by a direct display of the final value.
- The gradient overlay appears immediately at full opacity.
- All stagger delays are removed.
- The Wrapped experience remains fully understandable — no information is lost.

```ts
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const enterDuration = prefersReducedMotion ? 0 : 420
const statDuration  = prefersReducedMotion ? 0 : 600
```

---

## Achievement Card Rules

The `achievement` card is the most sensitive. Follow these rules strictly:

**Valid achievements (factual, from data):**
- *"You logged 47 activities this month — your most tracked month."* (only if history confirms it)
- *"You completed 14 focus sessions — up from 9 last month."*
- *"You reflected on 18 days this month."*
- *"Your longest focus session was 2h 15m on a Tuesday morning."*

**Invalid achievements:**
- ❌ *"You crushed it this month!"* — superlative without evidence
- ❌ *"You're more productive than most users!"* — comparison to others
- ❌ *"You're on fire!"* — vague and theatrical
- ❌ *"Your best month ever!"* — unless the data actually supports it

The AI generates the achievement text. The agent must validate it against these rules before rendering. If the AI output contains a superlative or unsupported claim, reject it and fall back to a neutral factual statement derived directly from the stats.

---

## Forward Prompt Card

The final card ends with a single, open, non-prescriptive question:

```
"What do you want more of next month?"
"What would you like to spend less time on?"
"What pattern from this month do you want to keep?"
```

This card has a `ctaLabel` (e.g., *"Start a new reflection"*) that links to today's reflection. It does not prescribe behavior — it invites intention.

---

## Generation & Caching

Wrapped is generated asynchronously by `actions/wrapped.ts`:

```ts
export async function generateWrapped(
  period: 'monthly' | 'yearly',
  date: string   // YYYY-MM for monthly, YYYY for yearly
): Promise<ActionResult<WrappedOutput>>
```

- On first request for a period: aggregate stats → call AI → cache the result in the DB (`WrappedSummary` table).
- On subsequent requests: return the cached version immediately.
- Cache invalidation: never auto-invalidate. The user can manually request a regeneration (limited to 5 per period — see `ai-integration.md`).
- Show a loading state on the Wrapped entry point while generation is in progress. Use a skeleton matching the card dimensions, not a spinner.

---

## Export

Each card can be exported as an image (canvas screenshot):

- Export strips all reflection answer text by default.
- Mood data is never included in exports.
- Stats and category data are included.
- The exported image includes the InterLog wordmark.
- A *"Shared from InterLog"* attribution appears at the bottom.
- Before exporting, show a confirmation: *"This will share your activity stats. Reflection notes are not included."*

---

## `WrappedNav` Component

The entry point to Wrapped — a card or button in the dashboard sidebar/analytics:

```tsx
// Show if a Wrapped summary exists or is generatable for the current period
<WrappedNav
  period="monthly"
  periodLabel="October"
  isGenerated={true}
  isGenerating={false}
  onOpen={() => setWrappedOpen(true)}
/>
```

- If not yet generated: *"Your October Wrapped is ready."* with a *"View"* button.
- If generating: *"Preparing your Wrapped…"* with a loading indicator.
- If unavailable (not enough data): do not show the entry point at all.
