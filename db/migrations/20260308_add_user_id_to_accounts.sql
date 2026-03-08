-- Add user_id to accounts for per-user data scoping.
-- Run AFTER 20260307_better_auth_schema.sql.
--
-- Step 1: add nullable column (safe for existing rows)
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE;

-- Step 2: create index for query performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- NOTE: After backfilling existing rows (if any), you may tighten to NOT NULL:
--   UPDATE accounts SET user_id = '<your-user-id>' WHERE user_id IS NULL;
--   ALTER TABLE accounts ALTER COLUMN user_id SET NOT NULL;
