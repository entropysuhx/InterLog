# Design System Rules

Source of truth: `src/design-system/styles.css` and `src/design-system/design-system.md`.  
Token definitions: `src/design-system/tokens/`.  
Theme files: `src/design-system/themes/`.

---

## Non-Negotiable Rules

- **Never hardcode a color hex, spacing value, or font size in a component.** Always use a design token.
- **Never edit `src/components/ui/`** — these are shadcn/ui primitives. Wrap them in product components and apply tokens there.
- **Color is never the sole identifier.** Every category, status, and mood must have a label or icon alongside its color.
- **Token changes require visual regression review in all three themes** (light, dark, focus) before merging.

---

## Using Tokens in Code

Tokens are exposed as Tailwind utilities via `@theme` in `styles.css`. Use them as class names:

```tsx
// ✅ Semantic tokens
<div className="bg-surface text-text-primary border border-border rounded-lg p-ds-16 shadow-md">

// ❌ Never inline
<div style={{ background: '#ffffff', color: '#101828', padding: '16px' }}>

// ❌ Never use primitive color scales directly in components
<div className="bg-primary-50 text-neutral-900">
```

Primitive scales (`primary-*`, `neutral-*`, etc.) exist only for defining semantic tokens in `themes/`. Components always use semantic names.

---

## Semantic Color Tokens

### Surface & Background

| Token class | Role |
|---|---|
| `bg-background` | Page-level background |
| `bg-surface` | Default card / panel fill |
| `bg-surface-subtle` | Inset sections, secondary panels |
| `bg-surface-elevated` | Popovers, dropdowns, tooltips |
| `bg-surface-hover` | Interactive surface hover state |
| `bg-surface-active` | Interactive surface pressed state |

### Text

| Token class | Role |
|---|---|
| `text-text-primary` | Body and heading copy |
| `text-text-secondary` | Supporting labels |
| `text-text-muted` | Helper text, placeholders, captions |
| `text-text-disabled` | Disabled controls |
| `text-text-inverse` | Text on dark/primary fills |

### Border

| Token class | Role |
|---|---|
| `border-border` | Default borders |
| `border-border-hover` | Hovered borders |
| `border-border-active` | Active / focused borders |

### Interactive

| Token class | Role |
|---|---|
| `bg-interactive-primary` | Primary CTA fill |
| `bg-interactive-primary-hover` | Primary CTA hover |
| `bg-interactive-primary-active` | Primary CTA pressed |
| `bg-interactive-secondary` | Secondary button fill |
| `bg-interactive-secondary-hover` | Secondary button hover |

### Status

| Token class | Use |
|---|---|
| `text-status-success` / `bg-status-success` | Confirmations, completed states |
| `text-status-warning` / `bg-status-warning` | Caution, partial states |
| `text-status-error` / `bg-status-error` | Errors, destructive actions |
| `text-status-info` / `bg-status-info` | Informational, neutral notices |

Never use category colors to represent success or error states.

### Focus

Always use `outline-focus-ring` with `outline-2 outline-offset-2` for focus rings. Do not override or suppress `:focus-visible` styles.

---

## Activity Category Tokens

Nine categories, four color roles each (`bg`, `border`, `icon`, `chart`):

| Category key | Background | Border | Icon / text | Chart series |
|---|---|---|---|---|
| `deep-work` | `bg-activity-deep-work-bg` | `border-activity-deep-work-border` | `text-activity-deep-work-icon` | `--color-activity-deep-work-chart` |
| `learning` | `bg-activity-learning-bg` | `border-activity-learning-border` | `text-activity-learning-icon` | `--color-activity-learning-chart` |
| `reflection` | `bg-activity-reflection-bg` | `border-activity-reflection-border` | `text-activity-reflection-icon` | `--color-activity-reflection-chart` |
| `exercise` | `bg-activity-exercise-bg` | `border-activity-exercise-border` | `text-activity-exercise-icon` | `--color-activity-exercise-chart` |
| `social` | `bg-activity-social-bg` | `border-activity-social-border` | `text-activity-social-icon` | `--color-activity-social-chart` |
| `meeting` | `bg-activity-meeting-bg` | `border-activity-meeting-border` | `text-activity-meeting-icon` | `--color-activity-meeting-chart` |
| `admin` | `bg-activity-admin-bg` | `border-activity-admin-border` | `text-activity-admin-icon` | `--color-activity-admin-chart` |
| `break` | `bg-activity-break-bg` | `border-activity-break-border` | `text-activity-break-icon` | `--color-activity-break-chart` |
| `personal` | `bg-activity-personal-bg` | `border-activity-personal-border` | `text-activity-personal-icon` | `--color-activity-personal-chart` |

Use `--color-activity-<category>-chart` (CSS variable) when passing color values to recharts or d3 — Tailwind classes don't work inside JS chart configs.

```tsx
// ✅ Chart config
const color = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-activity-deep-work-chart').trim()

// ✅ Component
<div className="bg-activity-learning-bg border border-activity-learning-border text-activity-learning-icon">
  <BookIcon />
  <span>Learning</span>
</div>
```

---

## Typography

Use Inter variable font. Map tokens to Tailwind:

| Token | Tailwind size class | Weight |
|---|---|---|
| Display XL | `text-display-xl` | `font-[650]` |
| Display L | `text-display-l` | `font-[650]` |
| Display M | `text-display-m` | `font-[650]` |
| H1 | `text-heading-1` | `font-[650]` |
| H2 | `text-heading-2` | `font-[650]` |
| H3 | `text-heading-3` | `font-semibold` |
| H4 | `text-heading-4` | `font-semibold` |
| Body Large | `text-body-lg` | `font-normal` |
| Body Medium | `text-body-md` | `font-normal` |
| Body Small | `text-body-sm` | `font-normal` |
| Label | `text-label` | `font-[550]` |
| Caption | `text-caption` | `font-[450]` |

- **Tabular numbers:** add `tabular-nums` to all timers, durations, scorecard values, and aligned tables.
- **Reading width:** reflection and journal content must use `max-w-[44rem]`.
- Use `tracking-*` utilities only via the token letter-spacing values; do not introduce arbitrary tracking.

---

## Spacing

Use `spacing-ds-*` utilities exclusively. The scale is:  
`ds-2 · ds-4 · ds-8 · ds-12 · ds-16 · ds-20 · ds-24 · ds-32 · ds-40 · ds-48 · ds-64 · ds-80 · ds-96`

```tsx
// ✅
<div className="p-ds-16 gap-ds-8 mt-ds-32">

// ❌
<div className="p-4 gap-2 mt-8">   // Tailwind default scale — don't use
<div style={{ padding: '16px' }}>  // Never inline
```

When a layout constraint genuinely requires a value outside the scale, document it with a comment.

---

## Radius

| Class | Value | Correct use |
|---|---|---|
| `rounded-xs` | 4px | Tiny indicators, pip dots |
| `rounded-sm` | 6px | Tags, menu items |
| `rounded-md` | 8px | Buttons, input fields |
| `rounded-lg` | 12px | Cards, dropdowns |
| `rounded-xl` | 16px | Reflection cards, modals |
| `rounded-2xl` | 24px | Wrapped surfaces, feature cards |
| `rounded-full` | 9999px | Avatars, pills, timer rings |

---

## Shadows

Use `shadow-sm / shadow-md / shadow-lg / shadow-xl`. Rules:

- Borders (`border border-border`) define static structure — use for cards, panels, inputs.
- Shadows communicate elevation — use only for popovers, drawers, modals, and floating overlays.
- Do not combine both a border and a shadow on the same static card surface.

---

## Motion

### Durations

| Name | Duration | Apply to |
|---|---|---|
| Instant | 0ms | Direct state replacement (tab swap, toggle) |
| Fast | 120ms | Hover color, pressed, tooltip exit |
| Normal | 180ms | Menus, dropdowns, small state transitions |
| Slow | 280ms | Drawers, page region transitions |
| Deliberate | 420ms | Wrapped reveals, meaningful completion moments |

### Easings (from `styles.css`)

| Name | Value | Use |
|---|---|---|
| Standard | `cubic-bezier(0.2, 0, 0, 1)` | Most transitions |
| Enter | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering the screen |
| Exit | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving the screen |
| Emphasized | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Celebratory / reward moments |

Use the pre-built `animate-in` / `animate-out` keyframes from `styles.css` for modal and menu transitions.

### Hard Rules

- **Always** add a `prefers-reduced-motion` guard. Collapse all animation to instant when set.
- **Never** animate timeline item height while the user is dragging or editing.
- Hover may translate interactive cards up `1–2px` with a color/shadow change — no larger movements.
- Modals: fade overlay + 4px vertical enter + 0.99→1 scale.
- Drawers: translate from their physical edge.

---

## Themes

Three supported themes: `light`, `dark`, `focus`. Set on `<html data-theme="...">`.

- Store preference in the user record with `localStorage` fallback.
- Apply pre-hydration via an inline nonce-compatible script to prevent flash.
- **Focus mode** is a visual mode (warm parchment surface, muted palette). It is not a density mode. Do not introduce `data-density` or `data-calm` without updating the theme architecture.
- In dark mode: use chart colors at full saturation; category surfaces as 12–18% tints if needed.

All three themes must pass automated contrast checks in CI before a token change merges.

---

## Layout

| Breakpoint | Gutters | Grid |
|---|---|---|
| Mobile (320–767px) | 16px | 4 col, 16px gap |
| Tablet (768–1279px) | 24px | 8 col, 20px gap |
| Desktop (1280px+) | 32px (40px at 1536px+) | 12 col, 24px gap |

- App shell: 240px sidebar + 64px top bar. Collapse sidebar at 1024px.
- Dashboard cards span 3, 4, 6, or 12 columns only.
- Reflection / editor: `max-w-[704px]` readable column.
- Mobile timeline: editing controls stay sticky at the bottom.
