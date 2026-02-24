package repositories

import (
	"context"

	"expense-ledger/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// AccountStore is the interface for account persistence (e.g. Postgres).
type AccountStore interface {
	Create(ctx context.Context, a *models.Account) error
	GetAll(ctx context.Context) ([]*models.Account, error)
}

type AccountRepository struct {
	pool *pgxpool.Pool
}

func NewAccountRepository(pool *pgxpool.Pool) *AccountRepository {
	return &AccountRepository{pool: pool}
}

func (r *AccountRepository) Create(ctx context.Context, a *models.Account) error {
	a.ID = uuid.New().String()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO accounts (id, name, type) VALUES ($1::uuid, $2, $3)`,
		a.ID, a.Name, a.Type,
	)
	return err
}

func (r *AccountRepository) GetAll(ctx context.Context) ([]*models.Account, error) {
	rows, err := r.pool.Query(ctx, `SELECT id::text, name, type FROM accounts ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var accounts []*models.Account
	for rows.Next() {
		var a models.Account
		if err := rows.Scan(&a.ID, &a.Name, &a.Type); err != nil {
			return nil, err
		}
		accounts = append(accounts, &a)
	}
	return accounts, rows.Err()
}
