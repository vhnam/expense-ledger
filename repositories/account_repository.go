package repositories

import (
	"context"
	"expense-ledger/models"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	defaultPageSize = 20
	maxPageSize     = 100
)

// AccountStore is the interface for account persistence (e.g. Postgres).
type AccountStore interface {
	GetAll(ctx context.Context, page, pageSize int) ([]*models.Account, int, error)
	Create(ctx context.Context, a *models.Account) error
	Update(ctx context.Context, a *models.Account) error
	Delete(ctx context.Context, id string) error
}

type AccountRepository struct {
	pool *pgxpool.Pool
}

func NewAccountRepository(pool *pgxpool.Pool) *AccountRepository {
	return &AccountRepository{pool: pool}
}

// scanAccounts reads all rows into a slice of accounts. Caller must close rows.
func scanAccounts(rows pgx.Rows) ([]*models.Account, error) {
	var accounts []*models.Account
	for rows.Next() {
		var a models.Account
		if err := rows.Scan(&a.ID, &a.Name, &a.Type); err != nil {
			return nil, err
		}
		accounts = append(accounts, &a)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return accounts, nil
}

func (r *AccountRepository) GetAll(ctx context.Context, page, pageSize int) ([]*models.Account, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM accounts`).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count accounts: %w", err)
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = defaultPageSize
	}
	if pageSize > maxPageSize {
		pageSize = maxPageSize
	}
	offset := (page - 1) * pageSize
	rows, err := r.pool.Query(ctx,
		`SELECT id::text, name, type FROM accounts ORDER BY name LIMIT $1 OFFSET $2`,
		pageSize, offset,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("query accounts: %w", err)
	}
	defer rows.Close()
	accounts, err := scanAccounts(rows)
	if err != nil {
		return nil, 0, fmt.Errorf("scan accounts: %w", err)
	}
	if accounts == nil {
		accounts = []*models.Account{}
	}
	return accounts, total, nil
}

func (r *AccountRepository) Create(ctx context.Context, a *models.Account) error {
	a.ID = uuid.New().String()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO accounts (id, name, type) VALUES ($1::uuid, $2, $3)`,
		a.ID, a.Name, a.Type,
	)
	if err != nil {
		return fmt.Errorf("insert account: %w", err)
	}
	return nil
}

func (r *AccountRepository) Update(ctx context.Context, a *models.Account) error {
	if a.ID == "" {
		return fmt.Errorf("account ID is required")
	}
	if a.Name == "" {
		return fmt.Errorf("account name is required")
	}
	if a.Type == "" {
		return fmt.Errorf("account type is required")
	}
	_, err := r.pool.Exec(ctx,
		`UPDATE accounts SET name = $1, type = $2 WHERE id = $3::uuid`,
		a.Name, a.Type, a.ID,
	)
	if err != nil {
		return fmt.Errorf("update account: %w", err)
	}
	return nil
}

func (r *AccountRepository) Delete(ctx context.Context, id string) error {
	if id == "" {
		return fmt.Errorf("account ID is required")
	}
	_, err := r.pool.Exec(ctx,
		`DELETE FROM accounts WHERE id = $1::uuid`,
		id,
	)
	if err != nil {
		return fmt.Errorf("delete account: %w", err)
	}
	return nil
}
