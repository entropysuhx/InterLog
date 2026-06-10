# Skill: Timeline Rendering

The timeline is InterLog's primary surface. It is also the most complex component to implement correctly. This skill documents the layout rules, overlap logic, interaction states, and rendering constraints.

---

## Structure Overview

```
TimelineView
├── TimelineAxis          — fixed time labels (left column)
├── TimelineTrack         — scrollable activity area
│   ├── TimelineHourLine  — major grid lines (every 60 min)
│   ├── TimelineSnapLine  — minor snap points (every 15 min, visible on drag)
│   ├── TimelineNow       — current-time indicator
│   ├── TimelineLane[]    — columns for overlapping activities
│   │   └── TimelineItem  — individual activity block
│   └── TimelineGap[]     — "Log this time" affordances
└── TimelineControls      — sticky bottom bar on mobile during edit
```

---

## Time Axis

- Display in the user's local timezone. Use `Intl.DateTimeFormat` — never assume UTC.
- Major lines every **60 minutes**, labeled with the hour (e.g., `9 AM`, `10 AM`).
- Minor snap lines every **15 minutes** — visible only during drag, not at rest.
- The axis is **fixed** (does not scroll horizontally). The track scrolls vertically.
- On initial load, scroll the track to center on the current time (or 8 AM if the day has not started).

---

## Activity Block Sizing

Every `TimelineItem` must respect these sizing rules:

| Rule | Value |
|---|---|
| Minimum visual height | 36px |
| Height calculation | `max(36px, (durationMinutes / 60) * hourHeight)` |
| Default hour height | 80px (configurable via user preference) |
| Minimum title display | Show title if block height ≥ 36px; show time range if ≥ 52px |

```ts
function getBlockHeight(durationMinutes: number, hourHeight: number): number {
  return Math.max(36, (durationMinutes / 60) * hourHeight)
}

function getBlockTop(startTime: Date, dayStart: Date, hourHeight: number): number {
  const minutesFromStart = differenceInMinutes(startTime, dayStart)
  return (minutesFromStart / 60) * hourHeight
}
```

---

## Activity Block Appearance

Each block uses the category token set:

```tsx
<div
  className={cn(
    'absolute rounded-lg border px-ds-8 py-ds-4 overflow-hidden',
    'transition-shadow duration-[120ms]',
    categoryStyles[activity.category].bg,
    categoryStyles[activity.category].border,
    categoryStyles[activity.category].text,
    // In-progress state
    activity.endTime === null && 'border-dashed',
  )}
  style={{ top: blockTop, height: blockHeight, width: laneWidth, left: laneOffset }}
>
  <span className="text-label font-[550] truncate block">{activity.title}</span>
  {blockHeight >= 52 && (
    <span className="text-caption tabular-nums">
      {formatTimeRange(activity.startTime, activity.endTime)}
    </span>
  )}
</div>
```

**In-progress state:** `border-dashed` + *"In progress"* label. No end time shown.  
**Color is never the sole identifier** — always render the title. If the block is too small for the title, show the category icon instead.

---

## Overlap Layout

Activities whose time ranges intersect are rendered in parallel lanes (columns).

### Lane Assignment Algorithm

```ts
function assignLanes(activities: Activity[]): ActivityWithLane[] {
  // Sort by start time
  const sorted = [...activities].sort((a, b) =>
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  const lanes: Activity[][] = []

  for (const activity of sorted) {
    // Find the first lane where this activity doesn't overlap the last item
    const laneIndex = lanes.findIndex(lane => {
      const last = lane[lane.length - 1]
      return new Date(last.endTime ?? last.startTime) <= new Date(activity.startTime)
    })

    if (laneIndex === -1) {
      lanes.push([activity]) // needs a new lane
    } else {
      lanes[laneIndex].push(activity)
    }
  }

  // Assign lane index and total lane count to each activity
  return lanes.flatMap((lane, laneIndex) =>
    lane.map(activity => ({ ...activity, laneIndex, totalLanes: lanes.length }))
  )
}
```

### Rendering Rules

| Overlap count | Layout |
|---|---|
| 1 lane (no overlap) | Full track width |
| 2 lanes | Each block is 50% width minus a 4px gap |
| 3 lanes | Each block is 33% width minus 4px gaps |
| 4+ lanes | Group into a single collapsed block — show count badge + "Show all" expand |

```ts
function getLaneWidth(totalLanes: number, trackWidth: number, laneIndex: number): {
  width: number
  left: number
} {
  if (totalLanes <= 3) {
    const gap = 4
    const width = (trackWidth - gap * (totalLanes - 1)) / totalLanes
    return { width, left: laneIndex * (width + gap) }
  }
  // 4+ lanes: collapse to grouped block (handled separately)
  return { width: trackWidth, left: 0 }
}
```

**Grouped block (4+ overlaps):**
- Full-width block with a neutral `bg-surface-subtle` fill
- *"4 activities"* label with an expand chevron
- On expand: renders a popover/drawer listing the activities, not inline lanes

---

## Current Time Indicator

A 2px horizontal line that marks the present moment:

```tsx
<div
  className="absolute left-0 right-0 z-10 pointer-events-none"
  style={{ top: getNowTop(currentTime, dayStart, hourHeight) }}
  aria-hidden="true"
>
  {/* Dot on the axis side */}
  <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-interactive-primary" />
  {/* Line across the track */}
  <div className="h-[2px] bg-interactive-primary opacity-80" />
  {/* Time label */}
  <span className="absolute left-0 -top-5 text-caption tabular-nums text-interactive-primary font-[550]">
    {format(currentTime, 'h:mm a')}
  </span>
</div>
```

- Update position every minute using `setInterval` — not every second (no need for second-level precision, and frequent DOM updates cause jank).
- Do not announce the time update via `aria-live` — it would be disruptive. Announce only on start/stop of focus sessions.

---

## Gap Affordances

For gaps longer than **45 minutes** between consecutive activities:

- Render a subtle dashed placeholder in the gap.
- On hover or focus: show *"Log this time"* with the gap's time range pre-filled.
- Clicking/tapping opens the activity form with `startTime` and `endTime` pre-populated.
- This affordance is **hover/focus only** — it must be keyboard-reachable (tabindex, Enter/Space to activate).

```ts
function getGaps(activities: Activity[]): Gap[] {
  const sorted = [...activities].sort((a, b) =>
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  const gaps: Gap[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const endOfCurrent = new Date(sorted[i].endTime ?? sorted[i].startTime)
    const startOfNext  = new Date(sorted[i + 1].startTime)
    const gapMinutes   = differenceInMinutes(startOfNext, endOfCurrent)

    if (gapMinutes >= 45) {
      gaps.push({ startTime: endOfCurrent, endTime: startOfNext, durationMinutes: gapMinutes })
    }
  }
  return gaps
}
```

---

## Drag and Edit

### Drag Rules

- Activities are draggable by their drag handle (visible on hover/focus).
- Snap to **15-minute** intervals during drag.
- While dragging: show the new start/end time in a floating tooltip, updated in real time.
- **Never animate the block's height while dragging.** Only `top` and `left` transitions are allowed.
- On drop: call `updateActivity` Server Action with the new `startTime` and `endTime`. Optimistic update the UI immediately, roll back on error.

### Keyboard Edit

Provide keyboard increment controls when an activity block is focused:
- `↑` / `↓`: move start time by 15 minutes
- `Shift + ↑` / `Shift + ↓`: extend/shrink end time by 15 minutes
- `Enter`: confirm and save
- `Escape`: cancel

Announce the new time range via `aria-live="polite"` on each increment.

### Overlap Warnings During Edit

If a drag or keyboard edit creates an overlap, show a warning inline — do not prevent the drop or block saving.

---

## Performance

The timeline for a full day can contain 50+ activity blocks. Apply these constraints:

- Use `position: absolute` for all blocks within a `position: relative` container — no flexbox or grid for layout inside the track. This avoids layout recalculations on scroll.
- For days with more than 50 blocks, use a virtual list — render only the blocks visible in the scroll viewport plus a buffer of 10 above and below.
- Memoize `assignLanes` and `getGaps` results with `useMemo` keyed on the activities array reference.
- The time axis updates every minute via a stable `setInterval` in `useTimeline`. Do not put the interval in a per-block component.

---

## Accessibility

- Each `TimelineItem` is a `role="article"` with an accessible name: *"[Title], [Category], [Time range]"*.
- The drag handle has `aria-label="Drag to reschedule [Title]"`.
- The gap affordance has `aria-label="Log activity from [start] to [end]"`.
- The current-time indicator is `aria-hidden="true"` — it is decorative.
- The grouped overlap block has `aria-label="[N] overlapping activities. Activate to expand."`.
- Timeline controls on mobile are sticky at the bottom of the viewport — ensure they do not cover active blocks without scroll compensation.
