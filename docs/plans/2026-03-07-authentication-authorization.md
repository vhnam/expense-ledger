# Authentication and Authorization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Harden authentication (Better Auth + DB, optional flows) and implement authorization so accounts and transactions are scoped to the signed-in user; unauthenticated or unauthorized API calls are rejected.

**Architecture:** Keep Better Auth at `/api/auth` and the app auth page at `/auth`. Add a database adapter to Better Auth (Neon Postgres) so users and sessions persist. Add a `user_id` column to `accounts` and scope all account/transaction APIs to the authenticated user; Netlify functions validate the session (via cookie or token) and enforce ownership.

**Tech Stack:** Better Auth, TanStack Start/Router, Neon serverless Postgres, Netlify Functions. Use @.agents/skills/better-auth-best-practices and @.agents/skills/email-and-password-best-practices when implementing auth flows.

---

## Current State

- **Auth:** Better Auth is configured in `src/lib/auth.ts` with `emailAndPassword` and `tanstackStartCookies()`. No database adapter is set — sessions/users may not persist across restarts.
- **Auth UI:** `/auth` route (`src/routes/auth.tsx`) provides sign-in/sign-up with email/password; successful login redirects to `/`.
- **Route protection:** `src/routes/__root.tsx` runs a client-side `beforeLoad` that redirects unauthenticated users to `/auth` for any path except `/auth` and `/api/auth`.
- **APIs:** Netlify functions in `netlify/functions/api/*.mts` (accounts, account, transactions, transaction) do **not** check authentication or authorization. Any caller can list/create/update/delete any account or transaction by ID.

---

## Part A: Authentication Hardening

### Task A1: Add database adapter to Better Auth

**Files:**
- Modify: `src/lib/auth.ts`
- Reference: Better Auth Neon/Drizzle adapter docs, `src/db.ts` (Neon client)

**Steps:**

1. **Install adapter (if not present)**  
   Use the Better Auth–recommended adapter for Neon (e.g. Drizzle or raw SQL). If using Drizzle, add `drizzle-orm` and `@better-auth/drizzle` (or the adapter package from better-auth.com). If Better Auth supports Neon’s `@neondatabase/serverless` directly, use that.

2. **Run Better Auth schema generation**  
   Run: `npx @better-auth/cli@latest generate` (or `migrate`) from project root so that user/session/account tables are created in the same Neon DB (or document the SQL to run manually).

3. **Wire adapter into auth config**  
   In `src/lib/auth.ts`, pass the database option to `betterAuth({ database: ... })`. Use the same `DATABASE_URL` as the rest of the app (e.g. from `process.env.DATABASE_URL`). Ensure the adapter is compatible with serverless (Neon serverless driver).

4. **Smoke test**  
   Start the app, sign up a user, restart the server, and sign in again to confirm the user and session persist.

5. **Commit**  
   `git add src/lib/auth.ts package.json db/... ; git commit -m "chore(auth): add Better Auth database adapter for Neon"`

---

### Task A2: (Optional) Email verification and password reset

**Files:**
- Modify: `src/lib/auth.ts`
- Create (if needed): email sending helper or use a third-party (e.g. Resend) and env vars for API keys

**Steps:**

1. **Configure `emailVerification.sendVerificationEmail`**  
   In `src/lib/auth.ts`, add `emailVerification: { sendVerificationEmail: async ({ user, url }) => { ... } }`. Use a real email sender (e.g. Resend) or a stub that logs the link in development. See @.agents/skills/email-and-password-best-practices.

2. **Optional: require verification**  
   If desired, set `emailAndPassword.requireEmailVerification: true` so unverified users cannot sign in until they verify.

3. **Configure password reset**  
   Add `emailAndPassword.sendResetPassword: async ({ user, url }) => { ... }` and, if desired, `revokeSessionsOnPasswordReset: true`. Document `resetPasswordTokenExpiresIn` if you change it.

4. **Add reset-request and reset-confirm UI (optional)**  
   Add a “Forgot password?” link on `/auth` that calls `authClient.requestPasswordReset({ email, redirectTo })`, and a route (e.g. `/auth/reset-password`) that reads the token from the URL and calls the appropriate Better Auth API to set the new password.

5. **Commit**  
   `git add src/lib/auth.ts src/routes/auth.tsx ... ; git commit -m "feat(auth): add email verification and password reset"`

---

## Part B: Authorization (User-Scoped Data)

### Task B1: Add user_id to accounts and migration

**Files:**
- Create: `db/migrations/YYYYMMDD_add_user_id_to_accounts.sql` (or append to a single migration file)
- Modify: `db/init.sql` (optional, for new installs) — add `user_id` to accounts definition

**Steps:**

1. **Design**  
   Add nullable `user_id` first if there is existing data (then backfill); or add `user_id NOT NULL` and a foreign key to Better Auth’s `user` table. Better Auth typically uses a `user` table with `id` (e.g. text or uuid). Match that type for `accounts.user_id`.

2. **Write migration**  
   - `ALTER TABLE accounts ADD COLUMN user_id TEXT REFERENCES user(id) ON DELETE CASCADE;` (adjust table name and type to match Better Auth schema; e.g. if Better Auth uses `users`, reference `users(id)`).
   - If existing rows: `UPDATE accounts SET user_id = '<default-system-user>' WHERE user_id IS NULL;` then `ALTER TABLE accounts ALTER COLUMN user_id SET NOT NULL;` (only if you want NOT NULL).
   - Create index: `CREATE INDEX idx_accounts_user_id ON accounts(user_id);`

3. **Document**  
   In the plan or README, note that new installs should run migrations in order; for `init.sql`, add the `user_id` column and FK so fresh installs are consistent.

4. **Commit**  
   `git add db/ ; git commit -m "feat(db): add user_id to accounts for authorization"`

---

### Task B2: Obtain session in Netlify functions and enforce auth

**Files:**
- Modify: `netlify/functions/api/accounts.mts`
- Modify: `netlify/functions/api/account.mts`
- Modify: `netlify/functions/api/transactions.mts`
- Modify: `netlify/functions/api/transaction.mts`
- Reference: `src/lib/auth.ts` — use the same Better Auth instance or its API to validate the request (see below).

**Steps:**

1. **Decide how to validate session in Netlify**  
   Netlify functions receive `Request`. Better Auth stores session in a cookie. Options: (a) Call Better Auth’s getSession API from the function (same origin) by forwarding the request cookies; (b) Use a shared auth library that can verify the session cookie/server-side. Prefer reusing Better Auth’s server API: e.g. `auth.api.getSession({ headers: request.headers })` if the auth server and the function share the same app (or pass cookies to the auth handler and get session). Implement a small helper in the functions codebase, e.g. `getSessionFromRequest(req: Request): Promise<{ user: { id: string } } | null>`.

2. **Implement the helper**  
   In a shared file (e.g. `netlify/functions/_auth.mts` or `netlify/functions/lib/auth.mts`), import or invoke the logic that validates the Better Auth cookie and returns the session (or null). Use the same secret and config as `src/lib/auth.ts` so cookie verification succeeds.

3. **Require auth in each handler**  
   At the start of each API handler (accounts, account, transactions, transaction), call the helper. If no session, return `401 Unauthorized` with a JSON body like `{ error: 'Unauthorized' }`. Otherwise, set `userId = session.user.id` for use in Task B3.

4. **Commit**  
   `git add netlify/functions/ ; git commit -m "feat(api): require authentication in all account/transaction APIs"`

---

### Task B3: Scope accounts and transactions to the authenticated user

**Files:**
- Modify: `netlify/functions/api/accounts.mts`
- Modify: `netlify/functions/api/account.mts`
- Modify: `netlify/functions/api/transactions.mts`
- Modify: `netlify/functions/api/transaction.mts`

**Steps:**

1. **GET /accounts**  
   In `accounts.mts`, after resolving `userId`, change the list query to: `SELECT id, name, type FROM accounts WHERE user_id = ${userId} ORDER BY name`. Only return accounts owned by that user.

2. **POST /accounts**  
   When creating an account, set `user_id` to `userId` in the INSERT so the new account is owned by the signed-in user.

3. **GET/PATCH/DELETE /account?id=...**  
   In `account.mts`, after resolving `userId`, add a predicate to every query: `WHERE id = ${id} AND user_id = ${userId}`. If no row is found, return 404 (do not leak existence of other users’ accounts).

4. **GET /transactions?accountId=...**  
   In `transactions.mts`, ensure the requested `accountId` belongs to `userId`: e.g. `SELECT ... FROM transactions t JOIN accounts a ON t.account_id = a.id WHERE a.id = ${accountId} AND a.user_id = ${userId}`. If the account is not found or not owned, return 404 or 403.

5. **POST /transactions**  
   Verify that `body.account_id` (or the target account) belongs to `userId` before inserting. Otherwise return 403.

6. **GET/PATCH/DELETE /transaction?accountId=...&id=...**  
   Ensure the transaction’s account is owned by `userId` (via join or two-step lookup). If not, return 404 or 403.

7. **Commit**  
   `git add netlify/functions/ ; git commit -m "feat(api): scope accounts and transactions to authenticated user"`

---

### Task B4: Send session cookie (or token) from the client to Netlify functions

**Files:**
- Modify: `src/lib/api.ts` (or wherever fetch to Netlify functions is done)
- Check: All call sites that use `fetch(transactionsUrl(...))`, `fetch(accountsUrl(...))`, etc.

**Steps:**

1. **Use credentials on fetch**  
   Ensure every request to the Netlify API includes cookies: `fetch(url, { credentials: 'include', ... })`. If the app and the functions are on the same origin (or CORS is set to allow credentials and the functions are on a subdomain with same-site cookies), the Better Auth session cookie will be sent and the functions can validate it.

2. **If cross-origin**  
   If the functions are on a different origin, configure CORS to allow the front-end origin and `credentials: 'include'`. Ensure the auth cookie is set with `SameSite` and domain so it is sent to the functions (or document using a different method, e.g. Bearer token, and adapt Task B2 accordingly).

3. **Commit**  
   `git add src/lib/api.ts ... ; git commit -m "fix(api): send credentials with API requests for auth"`

---

## Part C: Optional Improvements

### Task C1: Redirect to /auth after sign-out

**Files:**
- Modify: `src/integrations/better-auth/header-user.tsx` (and any other sign-out buttons)

**Steps:**

1. After calling `authClient.signOut()`, navigate to `/auth` (e.g. via TanStack Router’s `useNavigate()` or `router.navigate({ to: '/auth' })`).

2. Commit: `git add src/integrations/better-auth/header-user.tsx ; git commit -m "fix(auth): redirect to /auth after sign out"`

---

### Task C2: Server-side route protection (optional)

**Files:**
- Modify: `src/routes/__root.tsx` or a layout that has access to the request

**Steps:**

1. In TanStack Start, if the framework provides the request in a loader/beforeLoad on the server, call the same session validation used in Netlify functions (or call Better Auth getSession with request headers). If the user is not authenticated and the path is protected, throw a redirect to `/auth` so that SSR does not render protected content.

2. This reduces a brief flash of protected content before client-side redirect. Document any env or shared secret needed for server-side session check.

3. Commit: `git add src/routes/__root.tsx ; git commit -m "feat(auth): add server-side route protection when request is available"`

---

## Testing Checklist

- [ ] Sign up at `/auth` → user and session persist after server restart (Task A1).
- [ ] Sign in at `/auth` → redirect to `/`; visiting `/accounts` shows only that user’s accounts (Tasks B1–B4).
- [ ] Unauthenticated request to GET /accounts (e.g. curl without cookie) → 401 (Task B2).
- [ ] Authenticated user A cannot see or modify user B’s accounts by guessing IDs (Tasks B2, B3).
- [ ] Sign out → redirect to `/auth` (Task C1, if implemented).
- [ ] Optional: Email verification and password reset flows work (Task A2).

---

## Execution

**Plan complete and saved to `docs/plans/2026-03-07-authentication-authorization.md`.**

Two execution options:

1. **Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel Session (separate)** — Open a new session with executing-plans and run with checkpoints.

Which approach do you prefer?
