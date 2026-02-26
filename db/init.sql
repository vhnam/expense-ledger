-- ACCOUNTS
CREATE TABLE IF NOT EXISTS accounts (
	id   UUID PRIMARY KEY,
	name TEXT NOT NULL,
	type TEXT NOT NULL
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
	id         UUID PRIMARY KEY,
	account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
	amount     NUMERIC(18,4) NOT NULL,
	date       TIMESTAMPTZ NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	type       TEXT NOT NULL CHECK (type IN ('income', 'expense'))
);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(account_id, date DESC);
