-- Rename accounts table to bank_accounts.
-- Safe to run once after existing account migrations.

ALTER TABLE IF EXISTS accounts RENAME TO bank_accounts;

-- Keep a stable index name after table rename.
DROP INDEX IF EXISTS idx_accounts_user_id;
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
