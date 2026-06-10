# InterLog Component Guidelines

These rules extend shadcn/ui primitives. Components consume semantic tokens only; raw palette values are reserved for data visualization and activity categories.

## Shared Rules

- Minimum pointer target: 44x44px on touch surfaces; compact desktop controls may be 32px only when surrounded by sufficient spacing.
- Focus: visible 2px `focus-ring` with 2px offset. Never remove focus without an equivalent.
- Disabled: reduce emphasis, not legibility. Use `text-disabled`; do not rely on opacity below 50%.
- Loading: preserve component dimensions. Buttons replace the leading icon with a spinner and keep the label when space allows.
- Error: pair color with an icon and text. Validation messages sit 6px below the field.
- Destructive actions require explicit labels. Use confirmation only for irreversible or high-impact actions.

## Buttons

| Size | Height | Padding | Icon | Text |
| --- | ---: | ---: | ---: | --- |
| Small | 32px | 12px | 16px | Label |
| Medium | 40px | 16px | 18px | Label |
| Large | 48px | 20px | 20px | Body Medium 550 |
| Icon | 40px | 0 | 18px | Accessible name required |

Radius is `md`; icon-only buttons may use `lg`. Gap is 8px.

Variants:

- Primary: `interactive-primary`, inverse text. Use once per decision region.
- Secondary: surface background, standard border, primary text.
- Ghost: transparent; hover uses `surface-hover`.
- Destructive: error fill for confirmation, subtle error surface for lower emphasis.
- Link: no container; underline on hover and focus.

States: default, hover, pressed, focus-visible, disabled, loading. Pressed buttons translate at most 1px; never scale text.

## Inputs, Textareas, and Selects

- Small 36px, medium 40px, large 48px. Default to medium.
- Horizontal padding 12px; icon padding 40px; radius `md`.
- Default border `border`; hover `border-hover`; focus `border-active` plus focus ring.
- Placeholder uses `text-muted`; entered values use `text-primary`.
- Labels are visible and placed 6px above. Required state is announced in text or to assistive technology.
- Textareas start at 96px and resize vertically. Reflection responses default to 128px.
- Select triggers mirror input sizing. Menus use `surface-elevated`, `shadow-lg`, radius `lg`, and 6px internal padding.
- Natural-language logging input supports `Cmd/Ctrl+Enter` to submit and exposes parsing feedback before save.

## Dropdowns

- Minimum width 192px; maximum useful width 320px.
- Item height 36px with 8px horizontal padding and radius `sm`.
- Use separators only between conceptual groups.
- Selected state uses a checkmark and `surface-active`, never color alone.
- Arrow keys navigate; Enter selects; Escape closes and returns focus.

## Cards

- Default padding 20px desktop, 16px mobile; radius `lg`; 1px border.
- Analytics cards may use 24px padding. Dense timeline containers may use 12px.
- Static cards have no shadow or `shadow-sm`; floating cards use `shadow-md`.
- Interactive cards use border and surface changes on hover. Do not make cards lift more than 2px.
- Headers align title, optional description, and actions. Avoid more than two actions in the header.

## Sidebar

- Desktop width 240px expanded and 72px collapsed.
- Background `surface`; right border; 16px outer padding.
- Navigation item: 40px height, 10px horizontal padding, 8px gap, radius `md`.
- Active item uses `surface-active`, primary icon, and primary text. Do not use a full saturated fill.
- Product switcher sits at top; settings and account anchor to bottom.
- At widths below 1024px, replace with a drawer and preserve the current route label in the navbar.

## Navbar

- Height 64px desktop and 56px mobile.
- Sticky only when navigation or primary actions would otherwise leave the viewport.
- Use a bottom border rather than shadow by default.
- Search, notifications, and appearance actions are grouped with 8px gaps.

## Tabs

- Default height 36px. Text tabs use a 2px active indicator.
- Segmented tabs use `surface-subtle` container padding of 4px and `sm` radius.
- Arrow keys move between tabs; tab panels reference triggers through ARIA.
- Keep labels short and use badges for counts.

## Modal and Drawer

- Modal widths: 400px small, 560px medium, 720px large. Maximum height `min(85vh, 800px)`.
- Padding 24px; radius `xl`; `shadow-xl`; overlay uses `--ds-overlay`.
- Drawers are 400px desktop side panels or full-width mobile sheets.
- Trap focus, close on Escape, restore focus to trigger, and label with `aria-labelledby`.
- Avoid modal workflows for frequent logging; use inline or drawer editing.

## Toasts

- Width 360px desktop, viewport minus 24px mobile.
- Padding 12px 16px; radius `lg`; `shadow-lg`.
- Informational toasts dismiss after 5 seconds. Errors remain until dismissed if recovery is required.
- Actionable toasts pause on hover/focus and expose the action before dismiss.
- Announce success with `role="status"` and urgent errors with `role="alert"`.

## Tooltips

- Use for icon meaning or terse explanation, never essential instructions.
- Maximum width 240px; padding 6px 8px; radius `sm`; Caption typography.
- Open after 500ms pointer delay and immediately on keyboard focus.

## Badges

- Height 24px, padding 8px, radius `full`, Caption 550.
- Status badges pair text with a semantic color. Category badges use category background, border, and icon tokens.
- Never encode reflection mood or analytics trend with color alone.

## Timeline Items

- Minimum visual height 36px; height grows proportionally with duration after that floor.
- Left rail reserves 56px for time labels. A current-time indicator is 2px and includes a text label.
- Activity block uses category background, category border, and category icon. Text remains a neutral semantic token.
- Show title first, then project/context, then duration aligned right.
- Hover reveals edit and overflow actions. Keyboard focus reveals the same controls.
- Overlaps use side-by-side columns. On narrow screens, use a grouped stack with an overlap count.
- Draft or missing-end-time activities use a dashed border and "In progress" label.

## Calendar Events

- Month events are compact category strips with title and optional duration.
- Week/day events preserve duration through height and position.
- Selected events add a neutral outline outside the category border.
- Overflow becomes "+N more"; opening it must be keyboard accessible.

## Reflection Cards

- Radius `xl`, padding 20px, and a quiet reflection tint or neutral surface.
- Prompt is H4; helper text is Body Small; response is Body Medium.
- States: unanswered, drafting, saved, skipped, and generated prompt unavailable.
- Autosave status appears near the action row without toast noise.
- Streaks use a number plus a plain-language label. Missing a day must never use shame-oriented language.
- Mood controls include names such as "Low", "Steady", and "Energized", not emoji alone.

## Analytics Widgets

- KPI widget minimum 200x128px. Chart widget minimum 320x240px.
- Title and period appear above the value; comparison and explanation appear below.
- Charts use activity `chart` colors and semantic text/grid tokens.
- Include accessible summaries and a data table or downloadable representation for complex charts.
- Use no more than six simultaneous series; group the remainder as "Other".
- Zero, loading, partial, and insufficient-data states require specific copy.

## Insight Cards

- Anatomy: AI marker, insight title, evidence, optional recommendation, feedback actions.
- Distinguish observed facts from recommendations. Example: "Your focus sessions start earlier on Tuesdays" versus "Try reserving Tuesday mornings."
- Show the period and data basis. Low-confidence insights use "Early pattern" language.
- Never imitate human certainty or imply clinical conclusions.
- Primary insight cards use a subtle primary tint; warnings use semantic warning tokens.
- Feedback controls are icon buttons with "Helpful" and "Not helpful" accessible names.
