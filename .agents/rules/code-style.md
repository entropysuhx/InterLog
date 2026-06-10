# Code Style Rules

## TypeScript

- **Strict mode on.** `"strict": true` in `tsconfig.json`. No exceptions.
- Prefer `type` for object shapes and unions. Use `interface` only when you need declaration merging.
- No `any`. Use `unknown` and narrow it, or define a proper type. `as unknown as X` is a code smell — leave a `// TODO` comment if it is genuinely unavoidable.
- All Server Actions and API handlers must have explicitly typed parameters and return types.
- Export Zod schemas from `src/types/` and derive TypeScript types from them with `z.infer<>` to keep validation and types in sync.

```ts
// ✅
export const CreateActivitySchema = z.object({
  title: z.string().min(1).max(200),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
})
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>

// ❌
export type CreateActivityInput = {
  title: string
  startTime: string
  endTime?: string
}
```

## Naming

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `TimelineItem`, `InsightCard` |
| Hooks | camelCase with `use` prefix | `useTimer`, `useGuest` |
| Server Actions | camelCase verbs | `createActivity`, `saveReflection` |
| Utility functions | camelCase | `formatDuration`, `cn` |
| Types / interfaces | PascalCase | `Activity`, `ReflectionPrompt` |
| Zod schemas | PascalCase + `Schema` suffix | `CreateActivitySchema` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_OVERLAP_LANES` |
| CSS variables | kebab-case with `ds-` prefix | `--ds-text-primary` |
| Files | kebab-case for routes and utilities; PascalCase for component files | `activity-utils.ts`, `TimelineItem.tsx` |

## Component Structure

Each product component lives in its own folder:

```
src/components/timeline/TimelineItem/
├── index.tsx          # Component implementation + default export
├── TimelineItem.types.ts  # Props interface, variant types
└── TimelineItem.test.tsx  # Unit tests co-located
```

Internal order within a component file:

1. Imports (React, third-party, internal — separated by blank lines)
2. Types and interfaces
3. CVA variant definitions (if any)
4. Component function
5. Subcomponents (if small and tightly coupled)
6. Default export

```tsx
import { type VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

import type { Activity } from '@/types'
import { cn, formatDuration } from '@/lib/utils'

interface TimelineItemProps extends VariantProps<typeof timelineItemVariants> {
  activity: Activity
  className?: string
}

const timelineItemVariants = cva('...base classes...', {
  variants: { ... }
})

export default function TimelineItem({ activity, className }: TimelineItemProps) {
  // ...
}
```

## React Patterns

- **No default exports from `src/actions/`** — named exports only so action names are explicit at the call site.
- Prefer Server Components. Add `"use client"` as low in the tree as possible.
- Do not use `useEffect` to sync derived state — compute it during render or use `useMemo`.
- Event handlers are named `handle<Event>`: `handleSubmit`, `handleCategoryChange`.
- Boolean props are named with `is` or `has` prefix: `isLoading`, `hasError`, `isDisabled`.
- Do not pass raw `className` strings to shadcn primitives to override styles — wrap them in a product component and use CVA variants.

## Imports

- Use the `@/` path alias for all internal imports. No relative `../../` chains beyond one level.
- Group imports: React → third-party → internal types → internal components → internal utils. Separate groups with a blank line.
- Do not barrel-export everything from `index.ts` files in component folders — import the specific component to keep tree-shaking effective.

## Formatting & Linting

- **Prettier** for formatting. Config in `.prettierrc`. Run on save. Do not manually format files.
- **ESLint** with `eslint-config-next`. All warnings are errors in CI.
- No commented-out code in committed files. Use `// TODO:` or `// FIXME:` with a brief explanation if work is deferred.
- No `console.log` in committed code. Use a proper logger in server code; remove debug logs from client code.

## Error Handling

Server Actions return a typed result union — never throw to the client:

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createActivity(input: CreateActivityInput): Promise<ActionResult<Activity>> {
  const parsed = CreateActivitySchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Invalid input.' }
  // ...
}
```

Client components check `result.success` before using `result.data`. Surface errors via toast notifications using the design system error token — never alert().

## Comments

- Write comments to explain *why*, not *what*. Code explains what; comments explain intent, constraints, and tradeoffs.
- JSDoc on all exported functions in `src/lib/` and `src/actions/`.
- Mark non-obvious accessibility decisions with `// a11y:` prefix.
