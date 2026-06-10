# AGENTS.md — InterLog

This file is the canonical reference for all AI coding agents (Claude Code, Cursor, Copilot, etc.) working on the InterLog codebase. Read it in full before making any changes.

---

## Project Overview

**InterLog** is an AI-powered interstitial journaling and productivity timeline web application. Users log activities throughout the day, the system auto-categorizes them, generates a visual timeline, and surfaces reflections and AI insights. The core philosophy is *reflection before optimization* — understanding what happened, not planning what to do next.

- **Stack:** Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui · Prisma ORM · PostgreSQL (Supabase) · Auth.js · DeepSeek API · Vercel
- **Primary surfaces:** Timeline view · Calendar view · Analytics dashboard · Reflection system · InterLog Wrapped · Guest mode

---

## Repository Structure

```
interlog/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Login, register, OAuth callback
│   │   ├── (app)/                  # Authenticated shell
│   │   │   ├── dashboard/          # Main dashboard + timeline
│   │   │   ├── calendar/           # Day / week / month calendar view
│   │   │   ├── analytics/          # Analytics dashboard
│   │   │   ├── reflection/         # Reflection prompts + history
│   │   │   └── wrapped/            # Weekly / monthly Wrapped
│   │   ├── api/                    # Route handlers (AI, auth webhooks)
│   │   └── layout.tsx              # Root layout with theme provider
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives (DO NOT hand-edit)
│   │   ├── timeline/               # TimelineItem, TimelineAxis, TimelineLane
│   │   ├── activity/               # ActivityCard, ActivityForm, CategoryBadge
│   │   ├── reflection/             # ReflectionCard, ReflectionPrompt, MoodPicker
│   │   ├── analytics/              # AnalyticsWidget, CategoryChart, TrendChart
│   │   ├── wrapped/                # WrappedCard, WrappedSlide, WrappedNav
│   │   ├── insight/                # InsightCard, InsightEvidence, InsightFeedback
│   │   ├── timer/                  # FocusTimer, TimerRing, TimerControls
│   │   └── layout/                 # AppShell, Sidebar, Topbar, MobileNav
│   ├── lib/
│   │   ├── ai/                     # DeepSeek client, categorization, insight generation
│   │   ├── auth/                   # Auth.js config, session helpers
│   │   ├── db/                     # Prisma client singleton
│   │   ├── guest/                  # localStorage guest data helpers
│   │   └── utils.ts                # cn(), formatDuration(), etc.
│   ├── actions/                    # Next.js Server Actions (activity CRUD, reflection, AI)
│   ├── hooks/                      # useTimeline, useTimer, useReflection, useGuest
│   ├── types/                      # Shared TypeScript types and Zod schemas
│   └── design-system/              # Design tokens, themes, CSS
│       ├── tokens/                 # colors.ts, spacing.ts, radius.ts, typography.ts, etc.
│       ├── themes/                 # light.ts, dark.ts, focus.ts
│       └── styles.css              # Tailwind @theme + semantic CSS variables
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
└── tests/
    ├── unit/
    └── e2e/                        # Playwright
```

---

## Design System

> **The design system is law.** Never hardcode color hex values, spacing numbers, or font sizes in components. Always use semantic tokens.

### Token Usage

All semantic tokens are defined in `src/design-system/styles.css` and exposed as Tailwind utilities via `@theme`. Use them as class names:

```tsx
// ✅ Correct
<div className="bg-surface text-text-primary border border-border rounded-lg p-ds-16">

// ❌ Wrong — never hardcode
<div style={{ background: '#ffffff', color: '#101828' }}>
```

### Semantic Token Reference

| Role | Tailwind class |
|---|---|
| Page background | `bg-background` |
| Card / panel | `bg-surface` |
| Subtle surface | `bg-surface-subtle` |
| Elevated overlay | `bg-surface-elevated` |
| Hover state | `bg-surface-hover` |
| Primary body text | `text-text-primary` |
| Secondary text | `text-text-secondary` |
| Muted / helper text | `text-text-muted` |
| Disabled text | `text-text-disabled` |
| Default border | `border-border` |
| Hover border | `border-border-hover` |
| Primary action | `bg-interactive-primary` |
| Primary action hover | `bg-interactive-primary-hover` |
| Focus ring | `outline-focus-ring` |

### Activity Category Colors

Every activity category has four color roles. Always use the named token — never inline hex:

```tsx
// bg: background chip/block fill
// border: category border
// icon: icon and text
// chart: recharts/d3 data series

const categoryStyles = {
  'deep-work': 'bg-activity-deep-work-bg border-activity-deep-work-border text-activity-deep-work-icon',
  'learning':  'bg-activity-learning-bg  border-activity-learning-border  text-activity-learning-icon',
  // ... etc — see styles.css for all nine categories
}
```

Color is **never the sole identifier** for a category. Always pair with a label or icon.

### Typography

Use the design system type scale. Map to Tailwind as:

| Token | Class pattern |
|---|---|
| H1 (36px/650) | `text-heading-1 font-[650]` |
| H2 (30px/650) | `text-heading-2 font-[650]` |
| H3 (24px/600) | `text-heading-3 font-semibold` |
| H4 (20px/600) | `text-heading-4 font-semibold` |
| Body Large | `text-body-lg` |
| Body Medium | `text-body-md` |
| Body Small | `text-body-sm` |
| Label (14px/550) | `text-label font-[550]` |
| Caption (12px/450) | `text-caption` |

Use **tabular numbers** (`font-variant-numeric: tabular-nums`) for all timers, durations, and aligned data. Limit prose/reflection reading columns to `max-w-[44rem]`.

### Spacing Scale

Use `spacing-ds-*` utilities: `p-ds-8`, `gap-ds-16`, `mt-ds-32`, etc.  
Scale: `2 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`

Do not introduce arbitrary pixel values without a documented layout constraint.

### Radius

| Token | Value | Use |
|---|---|---|
| `rounded-xs` | 4px | Tiny indicators |
| `rounded-sm` | 6px | Tags, menu items |
| `rounded-md` | 8px | Buttons, inputs |
| `rounded-lg` | 12px | Cards, dropdowns |
| `rounded-xl` | 16px | Reflection cards, modals |
| `rounded-2xl` | 24px | Wrapped surfaces |
| `rounded-full` | 9999px | Avatars, pills, timer rings |

### Shadows

Use `shadow-sm / shadow-md / shadow-lg / shadow-xl`. Borders define static structure; shadows communicate elevation (popovers, drawers, modals).

### Motion

| Duration | Use |
|---|---|
| 0ms | Direct state replacement |
| 120ms | Hover, pressed, tooltip exit |
| 180ms | Menus, tabs, small transitions |
| 280ms | Drawer and page region transitions |
| 420ms | Wrapped reveals, meaningful completions |

Easings defined in `styles.css`: `--animate-in` (enter) and `--animate-out` (exit). **Always** add `prefers-reduced-motion` guards — collapse all animations to instant when set. Never animate timeline height during drag.

### Themes

Three themes are supported: `light`, `dark`, `focus`. Set on `<html data-theme="...">`. Store preference per user with local fallback. Apply pre-hydration via an inline script to prevent flash.

```tsx
// Reading the active theme
const theme = document.documentElement.getAttribute('data-theme') // 'light' | 'dark' | 'focus'
```

---

## Data Model

Defined in `prisma/schema.prisma`. Key models:

```
User         id, email, name, provider, created_at
Activity     id, user_id, title, start_time, end_time, duration, category_id, created_at
Category     id, name, color, icon
Reflection   id, user_id, activity_date, prompt, answer, created_at
FocusSession id, user_id, activity_id, start_time, end_time, duration
```

- All queries go through Prisma. No raw SQL except in migrations.
- Row-level authorization: always scope queries to `session.user.id`. Never trust client-supplied user IDs.
- Guest mode stores data in `localStorage` under a consistent schema matching these models (minus `user_id`). Migration to DB happens on account creation via `lib/guest/migrate.ts`.

---

## Server Actions & API

- Mutations use **Next.js Server Actions** in `src/actions/`. Each file corresponds to a domain (`activity.ts`, `reflection.ts`, `focus.ts`, `wrapped.ts`).
- Use `zod` to validate all inputs at the action boundary.
- Read-only data fetching uses React Server Components where possible; fall back to Route Handlers in `src/app/api/` for streaming or webhook endpoints.
- AI calls (categorization, insight generation, Wrapped summaries) live in `src/lib/ai/`. They wrap the DeepSeek API and are always called server-side — never expose the API key to the client.

---

## Component Conventions

### Naming
- PascalCase for all components: `TimelineItem`, `InsightCard`.
- `use` prefix for all hooks: `useTimer`, `useGuest`.
- Files co-located with their component: `TimelineItem/index.tsx` + `TimelineItem.types.ts`.

### Variants
- Use `class-variance-authority` (CVA) for all variant-bearing components (buttons, badges, cards).
- shadcn/ui primitives live in `src/components/ui/` — extend them via wrapper components, never edit the primitives directly.

### Required States
Every component must handle: **default · hover · focus · active · disabled · loading · empty · error**. Loading uses skeleton placeholders matching the component's geometry (no spinners in analytics or insight cards).

### Key Product Components

**`TimelineItem`**
- Minimum visual height 36px, scales with duration.
- Shows category color block + label + icon (never color alone).
- Overlaps render in up to 3 columns; beyond 3 becomes a grouped block.
- Dashed border + "In progress" label for missing end time.
- Current-time indicator: 2px line using `border-border-active` / `border-status-error` depending on context.
- Gaps > 45 min show a subtle "Log this time" affordance on hover/focus.

**`InsightCard`**
- Clearly separate observation, interpretation, and recommendation sections.
- State evidence and timeframe inline: *"Across 8 focus sessions in the last 14 days…"*
- Include confidence label (Emerging · Consistent · Strong), "Why am I seeing this?" toggle, helpful/not-helpful feedback, and dismiss control.
- Mark AI-generated content visually but without novelty effects.
- Never infer health, diagnosis, or emotional state from time logs.

**`ReflectionCard`**
- One primary prompt + up to two optional prompts per session.
- Autosave drafts locally and (when authenticated) remotely.
- Mood: private by default, five-point named scale + optional icon. Excluded from productivity scores.
- Streak copy uses additive framing: *"6 reflection days this month"* — never loss framing.

**`WrappedCard` / `WrappedSlide`**
- Narrative structure: orientation → time overview → category story → focus pattern → reflection highlight → achievement → forward-looking prompt.
- Monthly: 5–7 cards. Yearly: 8–12 cards.
- Every animated card supports tap/click, keyboard navigation, pause, replay, and reduced-motion fallback.
- Use `rounded-2xl`, controlled gradients, and `420ms` deliberate motion.
- Achievements are factual. No invented superlatives. No comparisons without evidence.

---

## AI Integration

Provider: **DeepSeek API**, called exclusively server-side.

### Categorization Flow
```
User submits activity text
→ actions/activity.ts validates input
→ lib/ai/categorize.ts sends to DeepSeek
→ Returns { category: string, confidence: number }
→ Activity stored with category; user can override
```

### Insight Generation
- Always include: evidence period, sample size, confidence label.
- Format: observation → interpretation → optional recommendation.
- Recommendations framed as experiments, not mandates.
- Loading: stable skeleton. Failure: preserve analytics, offer retry. Never block the UI.

### Wrapped Summaries
- Aggregate activities + reflections server-side before calling AI.
- AI receives anonymized statistics, not raw journal text.
- Output is structured JSON mapped to `WrappedCard` props.

---

## Guest Mode

Guest data lives in `localStorage`. Schema mirrors the DB models.

```ts
// lib/guest/store.ts
getActivities(): Activity[]
saveActivity(a: Omit<Activity, 'user_id'>): void
getReflections(): Reflection[]
saveReflection(r: Omit<Reflection, 'user_id'>): void
```

On account creation, `lib/guest/migrate.ts` POSTs guest data to `actions/migrate.ts`, which bulk-inserts with the new `user_id`. Show progress UI during migration. If migration fails, keep guest data intact and offer retry.

**Guest limitations to surface in UI:** no cloud sync, no backup, no cross-device access. Prompt (but don't block) registration after 3 days of usage or after the first Wrapped summary.

---

## Accessibility Requirements (WCAG 2.2 AA)

These are non-negotiable system constraints, not aspirational goals.

- **Contrast:** body text 4.5:1 minimum; large text and UI graphics 3:1 minimum.
- **Keyboard:** every workflow completable by keyboard — logging, timeline editing, chart period selection, reflection, modal dismissal.
- **Focus:** visible focus ring (`outline-focus-ring`), logical DOM order, no focus traps outside modals/drawers.
- **Modals/Drawers:** trap focus on open; restore to trigger on close.
- **Timer announcements:** announce milestone and start/stopped state via `aria-live="polite"`. Do not update a live region every second.
- **Charts:** include a text summary and an accessible tabular equivalent for every chart.
- **Non-color cues:** category, trend, mood, and validation states always include a label or icon alongside color.
- **Touch targets:** 44px minimum. No hover-only discovery.
- **Zoom:** content must remain usable at 200% zoom without two-dimensional scrolling (data-heavy views excepted).
- **Headings:** use in order; include landmarks, explicit labels, and descriptive button names.

---

## Voice & Copy Guidelines

The product voice is: **concise · observant · supportive · plainspoken**.

| Context | Tone | Example |
|---|---|---|
| Logging prompt | Direct | "What did you just do?" |
| Success confirmation | Quietly positive | "Activity added." |
| Reflection prompt | Open, non-leading | "What felt meaningful today?" |
| AI insight | Evidence-based | "Your longest focus blocks happened before noon this week." |
| Error | Calm and actionable | "We could not save this entry. Your draft is still here." |
| Empty state | Inviting | "Log an activity to begin today's timeline." |

**Never use:** "crush your goals", moral labels like "unproductive", excessive exclamation marks, anthropomorphic AI claims, invented superlatives, or comparisons without evidence.

---

## Testing

- **Unit tests** (`tests/unit/`): Vitest. Cover all Server Actions, AI lib functions, guest store, and utility helpers.
- **E2E tests** (`tests/e2e/`): Playwright. Cover the full guest flow, auth flow, activity CRUD, focus timer, reflection completion, and Wrapped navigation.
- **Accessibility:** run `axe-core` in Playwright on core views (timeline, reflection, analytics, Wrapped).
- **Contrast:** automated semantic contrast check in CI against all three themes.
- **Screenshot regression:** core timeline, reflection card, analytics dashboard, and Wrapped slides.

---

## Environment Variables

```env
# Database
DATABASE_URL=

# Auth.js
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# AI
DEEPSEEK_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

Never commit secrets. Use Vercel environment variable UI for production. Reference `.env.example` for local setup.

---

## Common Pitfalls

- **Do not** hardcode colors, spacing, or type sizes — use design tokens.
- **Do not** expose `DEEPSEEK_API_KEY` in client components or Route Handlers accessible without auth.
- **Do not** combine mood data with productivity scores or surface mood in analytics without explicit user action.
- **Do not** use loss-framing in streak or consistency copy.
- **Do not** animate timeline height during drag/edit — causes layout thrash and disorientation.
- **Do not** block saving on overlap warnings — warn, but allow.
- **Do not** edit files in `src/components/ui/` directly — wrap shadcn primitives instead.
- **Do not** skip loading/empty/error states — every component must handle all states.

## Skills Reference

Some implementation details are intentionally separated from AGENTS.md.

Before modifying code, identify the affected area and read the
corresponding skill document.

### Workflows
- skills/workflows/activity-logging.md
- skills/workflows/ai-integration.md
- skills/workflows/guest-mode.md

### Features
- skills/features/timeline-rendering.md
- skills/features/reflection-system.md
- skills/features/insight-cards.md
- skills/features/wrapped-cards.md

### Patterns
- skills/patterns/prisma-patterns.md
- skills/patterns/server-actions.md

### Testing
- skills/testing/testing.md

If a skill conflicts with AGENTS.md:
AGENTS.md is the source of truth.