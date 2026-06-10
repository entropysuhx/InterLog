# InterLog Design System

Version 1.0. This system supports a calm productivity product across logging, timelines, reflection, analytics, AI insight, and celebratory Wrapped experiences.

## 1. Brand Foundation

### Philosophy

InterLog helps people notice their time without turning their life into a performance score. The interface should make capture effortless, history understandable, and reflection emotionally safe. It is precise enough for time tracking, warm enough for journaling, and restrained enough for daily use.

### Product Personality

- Calm, never sleepy
- Insightful, never judgmental
- Capable, never corporate
- Personal, never intrusive
- Optimistic, never artificially celebratory
- Intelligent, never theatrical about AI

### Design Principles

1. **Reflection before optimization.** Explain what happened before prescribing what to change.
2. **Information earns emphasis.** Hierarchy follows user value, not visual novelty.
3. **Fast capture, slow meaning.** Logging is immediate; reflection creates deliberate space.
4. **Warmth through restraint.** Use soft surfaces, humane copy, and measured color rather than decoration.
5. **Progress without pressure.** Show continuity and patterns without punitive streak mechanics.
6. **AI shows its work.** Insights identify their evidence, period, and uncertainty.
7. **Accessible by default.** Keyboard, contrast, motion, and readable data are system constraints.

### Voice and Tone

Voice is concise, observant, supportive, and plainspoken. Use "you" and concrete language.

| Context | Tone | Example |
| --- | --- | --- |
| Logging | Direct | "What did you just do?" |
| Success | Quietly positive | "Activity added." |
| Reflection | Open, non-leading | "What felt meaningful today?" |
| Insight | Evidence-based | "Your longest focus blocks happened before noon this week." |
| Error | Calm and actionable | "We could not save this entry. Your draft is still here." |
| Empty state | Inviting | "Log an activity to begin today's timeline." |

Avoid "crush your goals", moral labels such as "unproductive", excessive exclamation marks, and anthropomorphic AI claims.

## 2. Color System

Source of truth: `tokens/colors.ts`. Primary is a warm indigo with enough depth for accessible actions. Neutrals are cool ink rather than pure gray. State colors are reserved for meaning.

### Primitive Palettes

| Step | Primary | Neutral | Success | Warning | Error | Info |
| --- | --- | --- | --- | --- | --- | --- |
| 50 | `#f2f1ff` | `#f8f9fb` | `#ecfdf5` | `#fffbeb` | `#fff1f2` | `#eff6ff` |
| 100 | `#e8e5ff` | `#f1f3f6` | `#d1fae5` | `#fef3c7` | `#ffe4e6` | `#dbeafe` |
| 200 | `#d3ceff` | `#e4e7ec` | `#a7f3d0` | `#fde68a` | `#fecdd3` | `#bfdbfe` |
| 300 | `#b5a9ff` | `#d0d5dd` | `#6ee7b7` | `#fcd34d` | `#fda4af` | `#93c5fd` |
| 400 | `#9278ff` | `#98a2b3` | `#34d399` | `#fbbf24` | `#fb7185` | `#60a5fa` |
| 500 | `#7047f5` | `#667085` | `#10b981` | `#f59e0b` | `#f43f5e` | `#3b82f6` |
| 600 | `#5b2fe0` | `#475467` | `#059669` | `#d97706` | `#e11d48` | `#2563eb` |
| 700 | `#4823b8` | `#344054` | `#047857` | `#b45309` | `#be123c` | `#1d4ed8` |
| 800 | `#3c2195` | `#1d2939` | `#065f46` | `#92400e` | `#9f1239` | `#1e40af` |
| 900 | `#331f78` | `#101828` | `#064e3b` | `#78350f` | `#881337` | `#1e3a8a` |
| 950 | `#1d104f` | `#0b0f19` | `#022c22` | `#451a03` | `#4c0519` | `#172554` |

### Semantic Tokens

Components use semantic names such as `background`, `surface`, `surface-hover`, `surface-active`, `text-primary`, `text-secondary`, `text-muted`, `text-disabled`, `border`, `border-hover`, `border-active`, `focus-ring`, `interactive-primary`, and `interactive-secondary`.

The light, dark, and focus assignments live in `themes/` and `styles.css`. `surface-subtle` and `surface-elevated` support density and layering without hardcoded colors. Status semantics expose success, warning, error, and info.

### Usage Rules

- Reserve primary 600/400 for key actions and focus states.
- Body text always uses semantic text tokens, including inside colored category blocks.
- Never use category colors to represent success or error.
- Data charts use `chart` colors; UI containers use category backgrounds and borders.
- In dark mode, use chart colors at full value and category surfaces as 12-18% tints where necessary.

## 3. Activity Color System

| Category | Background | Border | Icon | Chart |
| --- | --- | --- | --- | --- |
| Deep Work | `#e6f7f5` | `#9ddfd8` | `#087f78` | `#0f9f94` |
| Learning | `#f0ebff` | `#cbbcff` | `#6941c6` | `#805ad5` |
| Reflection | `#f5edff` | `#dcc3fa` | `#7e3faf` | `#9b51c8` |
| Exercise | `#fff0ed` | `#ffc3b6` | `#d9452f` | `#f06449` |
| Social | `#eef2ff` | `#c7d2fe` | `#4f46e5` | `#6366f1` |
| Meeting | `#eaf5ff` | `#b6dcfa` | `#1476b8` | `#2496d8` |
| Admin | `#f2f4f7` | `#d0d5dd` | `#475467` | `#667085` |
| Break | `#fff8df` | `#f5da85` | `#a66b08` | `#d69e16` |
| Personal | `#ffedf5` | `#f5bfd5` | `#c13f77` | `#db5f91` |

Every category appears with text or iconography. Color is never the sole identifier.

## 4. Typography

Use Inter variable font. Prefer weight 650 for major headings where supported; 600 is the fallback.

| Token | Size | Weight | Line height | Letter spacing |
| --- | ---: | ---: | ---: | ---: |
| Display XL | 72px | 650 | 1.05 | -0.04em |
| Display L | 60px | 650 | 1.08 | -0.035em |
| Display M | 48px | 650 | 1.10 | -0.03em |
| H1 | 36px | 650 | 1.20 | -0.025em |
| H2 | 30px | 650 | 1.25 | -0.02em |
| H3 | 24px | 600 | 1.30 | -0.015em |
| H4 | 20px | 600 | 1.40 | -0.01em |
| Body Large | 18px | 400 | 1.60 | -0.005em |
| Body Medium | 16px | 400 | 1.50 | 0 |
| Body Small | 14px | 400 | 1.50 | 0 |
| Label | 14px | 550 | 1.25 | 0.005em |
| Caption | 12px | 450 | 1.40 | 0.01em |

Use tabular numbers for timers, durations, score cards, and aligned tables. Limit reflection reading width to 44rem.

## 5. Spacing

Scale: `2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`.

- 2-4px: optical correction, indicators, very tight icon geometry.
- 8px: icon-label gaps and related control groups.
- 12px: compact control padding.
- 16px: default mobile/card spacing.
- 20-24px: standard desktop cards and sections.
- 32-48px: component group separation.
- 64-96px: page-level vertical rhythm and marketing surfaces.

Prefer fewer, larger gaps over separators. Do not introduce arbitrary spacing values without a layout constraint.

## 6. Radius

| Token | Value | Use |
| --- | ---: | --- |
| xs | 4px | tiny indicators |
| sm | 6px | menu items, small tags |
| md | 8px | buttons and fields |
| lg | 12px | cards and dropdowns |
| xl | 16px | reflection cards and modals |
| 2xl | 24px | Wrapped and feature surfaces |
| full | 9999px | avatars, pills, timer rings |

## 7. Shadows

- `sm`: `0 1px 2px 0 rgb(16 24 40 / .05), 0 1px 3px 0 rgb(16 24 40 / .04)`
- `md`: `0 4px 8px -2px rgb(16 24 40 / .08), 0 2px 4px -2px rgb(16 24 40 / .04)`
- `lg`: `0 12px 24px -8px rgb(16 24 40 / .12), 0 4px 8px -4px rgb(16 24 40 / .06)`
- `xl`: `0 24px 48px -12px rgb(16 24 40 / .16), 0 8px 16px -8px rgb(16 24 40 / .08)`

Borders define static structure. Shadows communicate elevation for popovers, drawers, modals, and temporary overlays.

## 8. Layout

| Breakpoint | Viewport | Max/content width | Gutters | Grid |
| --- | --- | --- | --- | --- |
| Desktop | 1280px+ | 1440px shell, fluid content | 32px, 40px at 1536px+ | 12 columns, 24px gap |
| Tablet | 768-1279px | Fluid | 24px | 8 columns, 20px gap |
| Mobile | 320-767px | Fluid | 16px | 4 columns, 16px gap |

The desktop app shell uses a 240px sidebar and a 64px top bar. Collapse the sidebar at 1024px. Dashboard cards span 3, 4, 6, or 12 columns. Reflection/editor content uses a 704px readable column. On mobile, timeline controls remain sticky at the bottom when editing.

## 9. Component Inventory

Production specifications for buttons, fields, selects, dropdowns, cards, sidebar, navbar, tabs, modal, drawer, toast, tooltips, badges, timeline items, calendar events, reflection cards, analytics widgets, and insight cards live in [`components/guidelines.md`](./components/guidelines.md).

Use shadcn/ui for accessible behavior and Radix primitives. Wrap variants with `class-variance-authority`; keep product patterns such as `TimelineItem` and `InsightCard` in the application component layer.

## 10. Motion

Durations:

- Instant 0ms: direct state replacement.
- Fast 120ms: hover, pressed, tooltip exit.
- Normal 180ms: menus, tabs, small state transitions.
- Slow 280ms: drawer and page region transitions.
- Deliberate 420ms: Wrapped reveals and meaningful completion.

Easing:

- Standard `cubic-bezier(0.2, 0, 0, 1)`
- Enter `cubic-bezier(0, 0, 0.2, 1)`
- Exit `cubic-bezier(0.4, 0, 1, 1)`
- Emphasized `cubic-bezier(0.2, 0.8, 0.2, 1)`

Hover changes color/border and may translate interactive cards up 1-2px. Modals fade the overlay and enter with 4px vertical movement plus 0.99-to-1 scale. Drawers translate from their physical edge. Never animate timeline height while a user is dragging or editing. Respect `prefers-reduced-motion`; Wrapped remains understandable with all animation removed.

## 11. Accessibility

- Target WCAG 2.2 AA for all product workflows.
- Normal text needs 4.5:1 contrast; large text and meaningful UI graphics need 3:1.
- All workflows must be keyboard complete, including logging, timeline edit, chart period selection, reflection, and modal dismissal.
- Maintain a visible focus ring and logical DOM/focus order.
- Modal and drawer focus is trapped and restored to the trigger.
- Announce timer changes sparingly; do not update live regions every second. Announce milestones and stopped/started state.
- Charts include a text summary and accessible tabular equivalent.
- Category, trend, mood, and validation states include non-color cues.
- Touch targets are 44px minimum. Do not require hover for discovery.
- Use headings in order, landmarks, explicit labels, and descriptive button names.
- Preserve zoom to 200% without lost content or two-dimensional scrolling outside data views.

## Theme Architecture

Set the theme on the document root:

```tsx
<html data-theme="light">
```

Supported values are `light`, `dark`, and `focus`. Theme selection should be stored per user with local fallback. Before hydration, an inline nonce-compatible script may apply the stored theme to avoid flashing. Focus Mode is a visual mode, not a replacement for light/dark preference; if future demand requires it, introduce `data-density` or `data-calm` separately instead of multiplying theme files.

CSS utilities resolve semantic roles:

```tsx
<section className="bg-surface text-text-primary border border-border rounded-lg">
  <p className="text-text-muted">Weekly focus</p>
  <button className="bg-interactive-primary hover:bg-interactive-primary-hover">
    Start Focus
  </button>
</section>
```

## InterLog Product Patterns

### Timeline View

- Use a stable time axis with 60-minute major lines and optional 15-minute snap points.
- Activities have a 36px minimum visual height, then scale with duration.
- Current time uses a 2px semantic error/primary line selected for context, with a visible time label.
- Overlaps render in columns up to three lanes. More than three become a grouped block with count and expanded detail.
- Gaps longer than 45 minutes may show a subtle "Log this time" affordance on hover/focus.
- Dragging announces start/end changes and offers keyboard increment controls.
- Missing end time uses dashed border and "In progress"; overlap warnings do not block saving.

### Reflection System

- End-of-day reflection is available after activity review, but can be completed at any time.
- Present one primary prompt and up to two optional prompts. Avoid long forms.
- Autosave drafts locally and remotely when authenticated.
- Streaks celebrate return, not perfection. Prefer "6 reflection days this month" over loss framing.
- Mood uses a named five-point scale and optional icon. It is private by default and excluded from productivity scores.
- Historical reflection pairs the journal entry with that day's timeline and analytics.

### Analytics Dashboard

- Lead with tracked time, focus time, reflection consistency, and category distribution.
- "Productivity score" is optional and must show its factors. Never combine mood with output.
- Weekly trends default to the user's locale and week start preference.
- Compare against the user's own baseline, not anonymous users.
- Explain partial data, local-only guest data, timezone changes, and untracked time.
- Charts use activity chart tokens and direct labels when space allows.

### Wrapped Experience

- Wrapped is a narrative report, not the primary dashboard.
- Structure: orientation, time overview, category story, focus pattern, reflection highlight, achievement, forward-looking prompt.
- Monthly reports use 5-7 cards; yearly reports use 8-12.
- Celebration uses larger type, `2xl` radius, controlled gradients, and deliberate motion.
- Every animated card supports tap/click, keyboard navigation, pause, replay, and reduced motion.
- Achievements remain factual. Avoid invented superlatives and comparisons without evidence.
- Export cards omit sensitive journal text by default.

### AI Insights

- Separate observation, interpretation, and recommendation.
- State evidence and timeframe: "Across 8 focus sessions in the last 14 days..."
- Use confidence labels only when meaningful: Emerging, Consistent, or Strong pattern.
- Provide "Why am I seeing this?", helpful/not helpful feedback, and dismiss controls.
- Do not infer health, diagnosis, intent, or emotional state from time logs.
- Recommendations are optional, reversible, and framed as experiments.
- Loading uses a stable skeleton; failures preserve analytics and offer retry.
- AI-generated content is visually marked but not surrounded by novelty effects.

## File Map

```text
src/design-system/
|-- tokens/
|   |-- colors.ts
|   |-- spacing.ts
|   |-- radius.ts
|   |-- typography.ts
|   |-- shadows.ts
|   |-- motion.ts
|   |-- z-index.ts
|   `-- index.ts
|-- themes/
|   |-- light.ts
|   |-- dark.ts
|   |-- focus.ts
|   |-- types.ts
|   `-- index.ts
|-- components/
|   `-- guidelines.md
|-- styles.css
`-- design-system.md
```

## Governance

- Token changes require visual regression review in all three themes.
- New raw colors need a documented data or brand use case.
- Component additions require keyboard states, empty/loading/error states, and responsive behavior.
- Deprecate tokens for one minor release before removal.
- Add Storybook or an equivalent catalog when the first shared product components are implemented.
- Test semantic contrast in CI and use screenshot regression for core timeline, reflection, analytics, and Wrapped views.
