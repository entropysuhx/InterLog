# InterLog

InterLog is a local-first productivity timeline, reflection, analytics, and Wrapped application built with Next.js 15, TypeScript, Prisma, PostgreSQL, Auth.js, DeepSeek, and the InterLog design system.

## Local Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the required values.
3. Create the PostgreSQL schema with `npm run prisma:migrate`.
4. Seed the nine canonical categories with `npm run prisma:seed`.
5. Start the app with `npm run dev`.

`DATABASE_URL`, `AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL` are required. Google, Resend, and DeepSeek variables enable their corresponding integrations; the application keeps deterministic fallbacks when AI is unavailable.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run test:contrast
npx playwright install chromium
npm run test:e2e
npm run build
```

Guest data remains in versioned browser storage until an authenticated user explicitly imports it. Reflection answers and mood entries are excluded from AI requests and account exports.

## Deployment

Provision PostgreSQL or Supabase, apply Prisma migrations, seed categories, and configure the environment variables in Vercel. Set the Google OAuth callback and Resend sender domain to the production URL before enabling those providers.
