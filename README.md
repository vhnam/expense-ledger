# Expense Ledger

Expense Ledger is a TanStack Start app with Better Auth email/password authentication,
Neon Postgres, and typed environment validation via T3 Env.

## Tech Stack

- TanStack Start + TanStack Router
- React + TypeScript
- Better Auth
- Neon Postgres (`@neondatabase/serverless` + Kysely `PostgresDialect`)
- Tailwind CSS

## Prerequisites

- Node.js 20+
- `pnpm`
- A Postgres connection string (Neon recommended)

## Quick Start

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy and fill env vars:

   ```bash
   cp .env.example .env.local
   ```

3. Generate a Better Auth secret (must be at least 32 chars):

   ```bash
   pnpm dlx @better-auth/cli secret
   ```

4. Run Better Auth migrations:

   ```bash
   pnpm db:migrate:auth
   ```

5. Start development server:

   ```bash
   pnpm dev
   ```

The app runs on [http://localhost:3000](http://localhost:3000).

## Environment Variables

Set these in `.env.local`:

- `BETTER_AUTH_URL`: Public auth base URL (for local dev: `http://localhost:3000`)
- `BETTER_AUTH_SECRET`: Secret used to sign auth tokens/cookies (min 32 chars)
- `BETTER_AUTH_TRUSTED_ORIGINS`: Optional comma-separated list of allowed origins
- `DATABASE_URL`: Postgres connection string
- `VITE_APP_TITLE`: Optional app title
- `VITE_NETLIFY_FUNCTIONS_URL`: URL for Netlify functions in development

Use `.env.example` as the template.

## Authentication Notes

- Email/password auth is enabled with Better Auth.
- Auth handlers are exposed at `/api/auth/*`.
- Trusted origins include `BETTER_AUTH_URL` and localhost in non-production.
- Rate limiting is enabled in Better Auth config.

## Available Scripts

- `pnpm dev` - Start Vite dev server on port 3000
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm test` - Run test suite (Vitest)
- `pnpm lint` - Run ESLint
- `pnpm format` - Check formatting with Prettier
- `pnpm check` - Write Prettier fixes and run ESLint autofix
- `pnpm db:migrate:auth` - Run Better Auth migrations

## Shadcn Components

Use the latest Shadcn CLI when adding UI components:

```bash
pnpm dlx shadcn@latest add button
```

## References

- [TanStack Start docs](https://tanstack.com/start)
- [Better Auth docs](https://www.better-auth.com)
- [Neon docs](https://neon.tech/docs)
