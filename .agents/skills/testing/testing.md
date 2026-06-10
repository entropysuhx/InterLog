# Skill: Testing

InterLog uses Vitest for unit tests and Playwright for end-to-end tests. This skill documents what to test, how to structure tests, accessibility testing requirements, and the CI checks that must pass before merging.

---

## Test Locations

```
tests/
├── unit/
│   ├── actions/         # Server Action tests
│   ├── lib/             # AI lib, guest store, utility function tests
│   └── types/           # Zod schema validation tests
└── e2e/
    ├── guest-flow.spec.ts
    ├── auth-flow.spec.ts
    ├── activity.spec.ts
    ├── timer.spec.ts
    ├── reflection.spec.ts
    ├── wrapped.spec.ts
    └── accessibility.spec.ts
```

Component tests (interaction tests for complex components like `TimelineItem`) live co-located with the component:

```
src/components/timeline/TimelineItem/
├── index.tsx
├── TimelineItem.types.ts
└── TimelineItem.test.tsx    ← Vitest + React Testing Library
```

---

## Unit Tests (Vitest)

### What to Unit Test

Every function in `src/actions/` and `src/lib/` must have unit tests. No exceptions.

| Module | What to test |
|---|---|
| `actions/activity.ts` | Validation rejection, auth rejection, overlap detection, successful creation, AI fallback on error |
| `actions/reflection.ts` | Upsert behavior, schema validation, skip recording |
| `actions/focus.ts` | Session start/stop, activity creation from session |
| `lib/ai/categorize.ts` | Correct category returned, fallback to `admin` on AI error, invalid JSON handling |
| `lib/ai/insights.ts` | Output schema validation, prohibited content detection |
| `lib/ai/wrapped.ts` | Card count enforcement, achievement validation |
| `lib/guest/store.ts` | CRUD operations, `guestId` stability, SSR safety guard |
| `lib/guest/migrate.ts` | Invalid data skipping, success clears storage, failure preserves storage |
| `lib/utils.ts` | `formatDuration`, `cn`, `getGaps`, `assignLanes` |

### Mocking

```ts
// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    activity: {
      create:   vi.fn(),
      findMany: vi.fn(),
      update:   vi.fn(),
    },
  },
}))

// Mock auth — authenticated user
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user_123' } }),
}))

// Mock auth — unauthenticated
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}))

// Mock AI lib
vi.mock('@/lib/ai/categorize', () => ({
  categorizeActivity: vi.fn().mockResolvedValue({
    categoryId: 'cat_deepwork',
    confidence: 0.9,
  }),
}))
```

### Test Structure

```ts
describe('createActivity', () => {
  describe('authorization', () => {
    it('returns unauthorized error when session is null', async () => {
      mockAuth(null)
      const result = await createActivity(validInput)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized.')
    })
  })

  describe('validation', () => {
    it('rejects input with title exceeding 200 characters', async () => {
      mockAuth(validSession)
      const result = await createActivity({ ...validInput, title: 'a'.repeat(201) })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid input.')
    })

    it('rejects input where endTime precedes startTime', async () => { ... })
  })

  describe('success cases', () => {
    it('creates activity and returns it', async () => { ... })
    it('falls back to admin category when AI fails', async () => { ... })
    it('uses provided categoryId without calling AI', async () => { ... })
  })
})
```

### Zod Schema Tests

Test schemas independently — they are the validation contract:

```ts
describe('CreateActivitySchema', () => {
  it('accepts valid input', () => {
    expect(CreateActivitySchema.safeParse(validInput).success).toBe(true)
  })

  it('rejects empty title', () => {
    expect(CreateActivitySchema.safeParse({ ...validInput, title: '' }).success).toBe(false)
  })

  it('rejects unknown fields (strict mode)', () => {
    expect(CreateActivitySchema.safeParse({ ...validInput, extraField: 'x' }).success).toBe(false)
  })
})
```

---

## Component Tests (Vitest + React Testing Library)

For complex product components — `TimelineItem`, `InsightCard`, `ReflectionCard`, `WrappedCard`:

```ts
describe('TimelineItem', () => {
  it('renders category label and icon — never color alone', () => {
    render(<TimelineItem activity={deepWorkActivity} />)
    expect(screen.getByText('Deep Work')).toBeInTheDocument()
  })

  it('shows dashed border for in-progress activity', () => {
    const inProgress = { ...activity, endTime: null }
    render(<TimelineItem activity={inProgress} />)
    expect(screen.getByText('In progress')).toBeInTheDocument()
  })

  it('shows overlap warning when hasOverlaps is true', () => { ... })
})

describe('InsightCard', () => {
  it('renders observation, interpretation, and evidence', () => { ... })
  it('expands "Why am I seeing this?" on activation', () => { ... })
  it('calls onFeedback with correct args on helpful click', () => { ... })
  it('calls onDismiss on dismiss click', () => { ... })
  it('shows thanks message after feedback is given', () => { ... })
})
```

---

## End-to-End Tests (Playwright)

### Required E2E Coverage

| Spec file | Scenarios to cover |
|---|---|
| `guest-flow.spec.ts` | Land on app as guest → log activity → view timeline → complete reflection → see analytics → prompt to register |
| `auth-flow.spec.ts` | Sign up (email) → guest data migrated → redirected to dashboard with prior activities |
| `activity.spec.ts` | Create (manual) · Edit (title, time, category) · Delete · Overlap warning shown · In-progress state |
| `timer.spec.ts` | Start focus timer → runs → stop → activity created with correct duration |
| `reflection.spec.ts` | Open reflection → fill primary prompt → save → reopen and see saved answer · Skip reflection |
| `wrapped.spec.ts` | Generate monthly Wrapped → navigate all cards → keyboard nav → pause/play → exit → focus restored |
| `accessibility.spec.ts` | Run axe on timeline, reflection, analytics, Wrapped — zero violations |

### Playwright Setup

```ts
// e2e/fixtures.ts — shared test helpers

export const test = base.extend<{
  authenticatedPage: Page
  guestPage: Page
}>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: 'tests/e2e/.auth/user.json' })
    await use(await context.newPage())
    await context.close()
  },
  guestPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    await use(await context.newPage())
    await context.close()
  },
})
```

Use `page.getByRole()` and `page.getByLabel()` selectors — not `data-testid` unless there is no accessible alternative.

### Accessibility E2E

```ts
import AxeBuilder from '@axe-core/playwright'

test('timeline has no accessibility violations', async ({ page }) => {
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')

  const results = await new AxeBuilder({ page })
    .include('#timeline-view')
    .analyze()

  expect(results.violations).toHaveLength(0)
})
```

Run axe against: `#timeline-view`, `#reflection-card`, `#analytics-dashboard`, `#wrapped-overlay`.

---

## CI Requirements

The following must all pass before a PR can merge:

```yaml
# .github/workflows/ci.yml (outline)

jobs:
  test:
    steps:
      - run: pnpm vitest run          # All unit and component tests
      - run: pnpm playwright test     # All E2E tests (headless)
      - run: pnpm prisma validate     # Schema validity check
      - run: pnpm tsc --noEmit        # TypeScript type check
      - run: pnpm eslint .            # Lint — all warnings are errors
      - run: pnpm audit --audit-level high  # Dependency security

  contrast:
    steps:
      - run: pnpm test:contrast       # Automated semantic contrast check — all 3 themes

  screenshot-regression:
    steps:
      - run: pnpm playwright test --project=screenshots  # Core views: timeline, reflection, analytics, Wrapped
```

Screenshot regression tests compare against committed baseline images. On intentional visual changes, update baselines with `pnpm playwright test --update-snapshots`.

---

## Test Data

Use factories for consistent test data:

```ts
// tests/factories.ts

export function makeActivity(overrides?: Partial<Activity>): Activity {
  return {
    id:         cuid(),
    userId:     'user_test',
    title:      'Test Activity',
    startTime:  new Date('2024-10-15T09:00:00Z'),
    endTime:    new Date('2024-10-15T10:30:00Z'),
    duration:   5400,
    categoryId: 'cat_deepwork',
    createdAt:  new Date(),
    ...overrides,
  }
}

export function makeReflection(overrides?: Partial<Reflection>): Reflection { ... }
export function makeGuestActivity(overrides?: Partial<GuestActivity>): GuestActivity { ... }
```

Use these factories everywhere — do not repeat inline object literals across test files.
