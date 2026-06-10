# Architecture Rules

## App Router Conventions

- All routes live under `src/app/`. Use route groups for layout separation: `(auth)` for unauthenticated pages, `(app)` for the authenticated shell.
- Every route segment gets a `page.tsx` (UI), optional `layout.tsx` (persistent shell), optional `loading.tsx` (Suspense fallback), and optional `error.tsx` (error boundary).
- Prefer **React Server Components** by default. Add `"use client"` only when the component needs browser APIs, event handlers, or client state. Do not add `"use client"` to a layout or page just to avoid thinking about it.
- Co-locate data fetching with the Server Component that renders it. Do not lift fetches to layouts unless the data is genuinely shared by every child route.

## Data Fetching

- **Reads:** React Server Components fetch directly via Prisma (server) or via `fetch` with appropriate caching hints. Never fetch from the DB in a Client Component.
- **Mutations:** Next.js **Server Actions** in `src/actions/`. One file per domain: `activity.ts`, `reflection.ts`, `focus.ts`, `wrapped.ts`, `migrate.ts`. Validate every input with Zod at the action boundary before touching the DB.
- **Streaming / webhooks:** Route Handlers in `src/app/api/` only. Do not put mutation logic in Route Handlers — keep mutations in Server Actions.
- Never call the DeepSeek API from a Client Component or a Route Handler that lacks authentication. All AI calls go through `src/lib/ai/` and are invoked from Server Actions or authenticated Route Handlers.

## Folder Responsibilities

| Folder | What belongs here |
|---|---|
| `src/app/` | Routes, layouts, pages, loading/error boundaries |
| `src/actions/` | Server Actions (mutations, AI triggers) |
| `src/components/ui/` | shadcn/ui primitives — do not hand-edit |
| `src/components/<domain>/` | Product components (timeline, activity, reflection, etc.) |
| `src/lib/ai/` | DeepSeek client, categorization, insight, wrapped generation |
| `src/lib/auth/` | Auth.js config, session helpers, middleware |
| `src/lib/db/` | Prisma client singleton |
| `src/lib/guest/` | localStorage schema, read/write helpers, migration |
| `src/hooks/` | Client-side hooks (`useTimer`, `useGuest`, `useTimeline`, etc.) |
| `src/types/` | Shared TypeScript interfaces and Zod schemas |
| `src/design-system/` | Tokens, themes, `styles.css` — source of truth for all visual values |
| `prisma/` | `schema.prisma` and migrations |
| `tests/unit/` | Vitest unit tests |
| `tests/e2e/` | Playwright end-to-end tests |

Do not create folders outside this structure without updating this file.

## State Management

- Server state: React Server Components + Server Actions + `revalidatePath` / `revalidateTag`.
- Client state: `useState` / `useReducer` for local UI state. `useContext` for lightweight cross-component state (theme, active timer). Do not reach for a global state library unless server state tools are genuinely insufficient.
- Guest state: `src/lib/guest/store.ts` is the single interface for all localStorage reads and writes. No component reads `localStorage` directly.

## Database

- Use the Prisma client singleton from `src/lib/db/`. Never instantiate `PrismaClient` outside that file.
- All queries must be scoped to the authenticated `session.user.id`. Never trust a user ID from the request body or query params.
- Raw SQL is allowed only in migration files. Use Prisma's query API everywhere else.
- Schema changes require a new migration. Never edit migration files after they have been applied.

## Guest → Registered Migration

- `lib/guest/migrate.ts` reads all guest data, bulk-inserts it via `actions/migrate.ts` using the new `user_id`, then clears localStorage on success.
- Show a progress indicator during migration. If it fails, keep guest data intact and surface a retry option. Never silently discard data.

## Performance Constraints

- Use `next/dynamic` with `ssr: false` for heavy client components (charts, Wrapped animations) to keep server HTML lean.
- Use `React.Suspense` with skeleton fallbacks for any async Server Component.
- Timeline renders a virtualized list for days with more than 50 activity blocks.
- Analytics charts use `recharts` loaded dynamically. Do not block the analytics page on AI insight loading — render analytics immediately and load insights in a separate Suspense boundary.
