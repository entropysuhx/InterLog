# Security Rules

These rules are non-negotiable. Every rule here maps to a real attack vector.

---

## Authentication & Sessions

- Auth is handled exclusively by **Auth.js**. Do not implement custom session logic.
- Session tokens are stored in **secure, HTTP-only cookies**. Never store session tokens in `localStorage` or expose them to JavaScript.
- Always call `auth()` (or `getServerSession()`) at the top of every Server Action and authenticated Route Handler. Reject unauthenticated requests immediately — do not rely on middleware alone.

```ts
// ✅ Every protected Server Action
export async function createActivity(input: CreateActivityInput) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized.' }
  // ...
}
```

- Google OAuth and email/password are the only supported providers. Do not add providers without a security review.
- JWT sessions use `AUTH_SECRET`. Rotate this secret immediately if it is ever exposed. Treat it as a root credential.

---

## Authorization

- **Every database query must be scoped to `session.user.id`.** Never query by a user ID received from the client.

```ts
// ✅ Scoped to authenticated user
const activities = await prisma.activity.findMany({
  where: { userId: session.user.id, ... }
})

// ❌ Never trust client-supplied IDs
const activities = await prisma.activity.findMany({
  where: { userId: input.userId }
})
```

- Apply this rule to all reads, updates, and deletes. An attacker who discovers another user's ID must not be able to read or modify their data.
- Use Prisma's `update` with a compound `where: { id, userId }` on mutations to prevent IDOR on individual records.

```ts
// ✅ Prevents IDOR
await prisma.activity.update({
  where: { id: input.id, userId: session.user.id },
  data: { ... }
})
```

---

## Input Validation

- Validate **all** Server Action inputs with Zod before they touch the database or are passed to the AI layer.
- Validation happens server-side. Client-side validation is UX only — it is not a security control.
- Reject unexpected fields. Use `.strict()` on Zod objects for mutation schemas or strip unknown keys explicitly.
- Enforce reasonable length limits on all string fields (titles `max(200)`, reflection answers `max(5000)`, etc.) to prevent oversized payloads.
- Sanitize rich text inputs before storage. Do not store raw HTML from user input — strip it or use a safe serialization format (e.g., ProseMirror JSON).

---

## API Keys & Secrets

- **`DEEPSEEK_API_KEY` must never appear in client-side code, browser network requests, or client-accessible Route Handlers.**
- All AI calls go through `src/lib/ai/` and are invoked from Server Actions or authenticated Route Handlers behind session checks.
- All secrets live in environment variables. Never commit them to the repository. Reference `.env.example` for required keys with placeholder values.
- If a secret is accidentally committed, rotate it immediately — do not just delete the commit.

---

## API Route Security

- Every Route Handler in `src/app/api/` must authenticate the request before doing any work:

```ts
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })
  // ...
}
```

- **Rate limiting** is applied at the Vercel edge for all `/api/` routes. Configure limits in `vercel.json`. AI endpoints have stricter per-user limits.
- **CSRF protection** is handled by Auth.js for form submissions. For JSON API endpoints called from the browser, verify the `Content-Type: application/json` header and the `Origin` header matches the app domain.
- Validate and sanitize all query parameters and URL segments — do not use them raw in database queries.

---

## Guest Mode

- Guest data lives in `localStorage`. It never touches the server until the user creates an account.
- Do not use guest data to make assumptions about identity — a guest session has no verified claims.
- During migration (`lib/guest/migrate.ts`), validate guest data with the same Zod schemas used for authenticated inputs before inserting into the database. Malformed guest data is silently skipped (log it server-side), not inserted.
- Do not expose a public migration endpoint. The migrate Server Action requires an authenticated session.

---

## Data Privacy

- **Mood data is private by default.** It must never appear in analytics aggregates, AI inputs, or exported Wrapped cards unless the user explicitly enables it.
- **Reflection answers are private.** They are excluded from AI insight generation by default. If a future feature requires AI to read reflections, it must be opt-in with clear disclosure.
- The DeepSeek API receives activity titles and durations for categorization and insight generation. It does not receive reflection text, mood data, or any PII (name, email).
- Implement user data export and deletion per GDPR requirements. Deletion must cascade across all tables for the given `user_id`.

---

## Encrypted Storage & Transport

- All data in transit uses HTTPS. Vercel enforces this by default — do not disable it.
- Sensitive fields (if any are added in future — passwords, tokens) must be encrypted at rest before storage. Use a well-audited library; do not implement custom encryption.
- Database connection strings include SSL. Do not use `?sslmode=disable` in `DATABASE_URL`.

---

## Dependency Security

- Run `pnpm audit` in CI. Fail the build on high-severity vulnerabilities.
- Keep dependencies up to date. Do not pin to very old versions of auth, database, or AI client packages.
- Do not add new dependencies to handle tasks that the existing stack already covers. Every new dependency is an attack surface.

---

## What to Do If Something Goes Wrong

1. If a secret is exposed: rotate it immediately, then investigate.
2. If a security bug is found: do not push a fix directly to `main` — open a private draft PR, assess impact, then deploy.
3. If user data is affected: follow GDPR breach notification requirements (72-hour window to notify the supervisory authority if required).
