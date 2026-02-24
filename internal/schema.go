package internal

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

const accountsTable = `
CREATE TABLE IF NOT EXISTS accounts (
	id   UUID PRIMARY KEY,
	name TEXT NOT NULL,
	type TEXT NOT NULL
);
`

func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, accountsTable)
	return err
}
