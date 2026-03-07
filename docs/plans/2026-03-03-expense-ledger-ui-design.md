# Expense Ledger UI Design Plan

> **For Claude:** Use frontend-design and ui-ux-pro-max skills when implementing UI from this plan.

**Goal:** Define the UI for expense-ledger so users can manage Accounts and manage Transactions per account, with all UI aligned to the existing Account and Transaction data models.

**Architecture:** App shell (Header + nav) stays; add an accounts section and an account-scoped transactions section. Data flows from Netlify functions → TanStack Query → React; types mirror the DB schema. Use existing stack: TanStack Start/Router/Query, shadcn (base-nova, Tabler icons), Tailwind.

**Tech Stack:** React 19, TanStack Start/Router/Query, Tailwind CSS 4, shadcn/ui (base-nova), Tabler Icons, Zod, Neon serverless (via Netlify functions).

---

## Data Models (Source of Truth)

These come from `db/init.sql`. All UI and API contracts must follow them.

### Account

| Field  | Type   | Constraints                |
| ------ | ------ | -------------------------- |
| `id`   | UUID   | PK                         |
| `name` | string | NOT NULL                   |
| `type` | string | NOT NULL (e.g. bank, cash) |

### Transaction

| Field         | Type                  | Constraints                          |
| ------------- | --------------------- | ------------------------------------ |
| `id`          | UUID                  | PK                                   |
| `account_id`  | UUID                  | NOT NULL, FK → accounts(id), CASCADE |
| `amount`      | numeric(18,4)         | NOT NULL                             |
| `date`        | timestamptz           | NOT NULL                             |
| `description` | string                | NOT NULL, default ''                 |
| `type`        | 'income' \| 'expense' | NOT NULL, CHECK                      |

---

## Information Architecture

- **Home / Dashboard** (`/`) – Entry: list or summary of accounts; quick link to “Accounts” and per-account “Transactions.”
- **Accounts** (`/accounts`) – List accounts; create, edit, delete. Optional: simple balance/summary per account if we add aggregation later.
- **Account detail / Transactions** (`/accounts/$accountId` or `/accounts/$accountId/transactions`) – List transactions for one account; create, edit, delete transactions. Filter/sort by date and type (income/expense).

---

## Screens and Flows

### 1. Home / Dashboard (`/`)

- **Purpose:** Landing for the ledger; orient user to accounts and recent activity.
- **Content:**
  - App title (e.g. “Expense Ledger”) and short subtitle.
  - List of accounts (name, type, optional balance placeholder) as cards or rows; each links to that account’s transactions.
  - Primary CTA: “Add account” → Accounts or inline create.
  - Optional: “Recent transactions” across accounts or for a selected account (can be a later task).
- **Actions:** Navigate to Accounts, navigate to Account → Transactions.

### 2. Accounts (`/accounts`)

- **Purpose:** Manage all accounts (CRUD).
- **Content:**
  - Page title: “Accounts.”
  - List of accounts (name, type); each row/card has actions: Edit, Delete, “View transactions” (navigate to account-scoped transactions).
  - Empty state: “No accounts yet. Create one to get started.”
  - Button: “Add account.”
- **Actions:**
  - **Create:** Open modal or inline form: name (required), type (required; dropdown or text with suggestions, e.g. bank, cash, card).
  - **Edit:** Same form, pre-filled; submit updates name/type.
  - **Delete:** Confirm then delete (backend deletes account and cascades to transactions).
- **Validation:** Name and type required; types can be constrained to a fixed set or free text per product choice.

### 3. Transactions by account (`/accounts/$accountId` or `/accounts/$accountId/transactions`)

- **Purpose:** View and manage transactions for a single account.
- **Content:**
  - Breadcrumb or header: Account name (and type) with back link to Accounts or Home.
  - Page title: “Transactions” (and account name).
  - Table or card list: columns/cells — date, description, type (income/expense), amount (formatted; distinguish income vs expense by sign or color).
  - Empty state: “No transactions yet. Add one.”
  - Button: “Add transaction.”
- **Actions:**
  - **Create:** Form: amount (required, numeric), date (required, date/datetime), description (optional, default ''), type (required: income | expense). account_id is fixed from route.
  - **Edit:** Same form, pre-filled; submit updates.
  - **Delete:** Confirm then delete.
- **UX:** Sort by date (default descending). Optional: filter by type (income/expense) and date range (can be Phase 2).

---

## Component Outline

- **Layout**
  - Reuse `__root.tsx` and `Header`; add nav links: Home, Accounts. Optional: “Transactions” as a sub-context when viewing an account.
- **Accounts**
  - `AccountList` – list of accounts with actions.
  - `AccountForm` – create/edit form (name, type); used in modal or inline.
  - `AccountCard` or `AccountRow` – single account display + actions (edit, delete, view transactions).
- **Transactions**
  - `TransactionList` – list for one account; sort by date.
  - `TransactionForm` – create/edit (amount, date, description, type); account_id from route.
  - `TransactionRow` or table row – date, description, type, amount (with sign/color).
- **Shared**
  - Empty states (reusable message + optional illustration).
  - Confirm dialogs for delete (accounts and transactions).
  - Loading and error states (TanStack Query + simple UI feedback).

Use shadcn where applicable: Button, Input, Label, Select, Table, Card, Dialog, DropdownMenu. Add components via `pnpm dlx shadcn@latest add <component>` as needed.

---

## Routes (TanStack Router)

- `/` – Home/dashboard (account list + entry to transactions).
- `/accounts` – Accounts list and CRUD.
- `/accounts/$accountId` or `/accounts/$accountId/transactions` – Transactions for one account; CRUD for transactions.

Use route params for `accountId`; load account and transactions in loaders and bind to TanStack Query where appropriate.

---

## API Contract (Netlify Functions)

- **Accounts**
  - `GET /api/accounts` – list accounts.
  - `POST /api/accounts` – create (body: `{ name, type }`).
  - `GET /api/accounts/:id` – get one account.
  - `PATCH /api/accounts/:id` – update (body: `{ name?, type? }`).
  - `DELETE /api/accounts/:id` – delete (cascade transactions).
- **Transactions**
  - `GET /api/accounts/:accountId/transactions` – list by account (query: sort, filter optional).
  - `POST /api/accounts/:accountId/transactions` – create (body: `{ amount, date, description?, type }`).
  - `GET /api/accounts/:accountId/transactions/:id` – get one.
  - `PATCH /api/accounts/:accountId/transactions/:id` – update.
  - `DELETE /api/accounts/:accountId/transactions/:id` – delete.

Request/response bodies and TypeScript types should match the Account and Transaction models above (e.g. UUIDs, numeric amount, ISO date for `date`, type `'income' | 'expense'`).

---

## Design Direction (High Level)

- **Tone:** Clear, utilitarian, trustworthy (ledger/finance). Avoid playful or noisy UI.
- **Differentiation:** Strong readability for numbers and dates; clear visual distinction between income and expense (e.g. color or sign); minimal but consistent layout.
- **Accessibility:** Labels, focus states, and keyboard-friendly forms and dialogs; sufficient contrast for amounts and type.
- **Responsiveness:** Lists and forms work on small screens (stack or sheet/modal for forms); table can become cards on narrow viewports if needed.

When implementing, apply frontend-design and ui-ux-pro-max for typography, color, spacing, and component polish so the UI feels cohesive and production-grade, not generic.

---

## Implementation Order (Suggested)

1. **Types and API**
   - Add TS types for Account and Transaction (mirror DB) in `src/types/` or next to services.
   - Implement Netlify handlers for accounts and transactions (using existing `getClient()` and `db/init.sql`).
2. **Services and data layer**
   - Implement `account.service.ts` and `transaction.service.ts` (or call Netlify from client); TanStack Query hooks for list/create/update/delete.
3. **Routes and layout**
   - Add routes `/accounts` and `/accounts/$accountId` (or `/accounts/$accountId/transactions`); update Header nav and root layout if needed.
4. **Accounts UI**
   - Account list, form (create/edit), delete confirm; wire to API and Query.
5. **Transactions UI**
   - Transaction list (by account), form (create/edit), delete confirm; wire to API and Query.
6. **Home**
   - Replace or adapt current index content to dashboard (account list + links to transactions).
7. **Polish**
   - Empty states, loading/error states, number/date formatting, income vs expense styling, and any extra shadcn components.

---

## Files to Create or Modify (Summary)

| Area       | Create                                                                                                                    | Modify                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Types      | `src/types/account.ts`, `src/types/transaction.ts` (or single `ledger.ts`)                                                | —                                                                                                             |
| API        | —                                                                                                                         | `netlify/functions/accounts.mts`, `netlify/functions/transactions.mts` (or account-scoped transaction routes) |
| Services   | —                                                                                                                         | `src/services/account.service.ts`, `src/services/transaction.service.ts`                                      |
| Routes     | `src/routes/accounts/index.tsx`, `src/routes/accounts/$accountId.tsx` (or `$accountId/transactions.tsx`)                  | `src/routes/index.tsx`, `src/components/Header.tsx`                                                           |
| Components | AccountList, AccountForm, AccountCard; TransactionList, TransactionForm, TransactionRow; shared EmptyState, ConfirmDialog | —                                                                                                             |
| UI         | Add shadcn Table, Card, Dialog, Select as needed                                                                          | `src/styles.css` if theming for income/expense                                                                |

---

## Success Criteria

- Users can create, read, update, and delete accounts.
- Users can create, read, update, and delete transactions for a chosen account.
- All fields and constraints match the Account and Transaction models.
- Navigation between Home, Accounts, and account-scoped Transactions is clear and consistent.
- UI is readable, accessible, and responsive enough for daily use.

Plan complete. Next step is to implement types and API, then services, then routes and components in the order above.
