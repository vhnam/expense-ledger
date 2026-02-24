package repositories

import (
	"context"
	"expense-ledger/models"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TransactionStore is the interface for transaction persistence.
type TransactionStore interface {
	GetByAccountID(ctx context.Context, accountID string, page, pageSize int) ([]*models.Transaction, int, error)
	GetByID(ctx context.Context, accountID, transactionID string) (*models.Transaction, error)
	Create(ctx context.Context, tx *models.Transaction) error
	Update(ctx context.Context, tx *models.Transaction) error
	Delete(ctx context.Context, accountID, transactionID string) error
}

type TransactionRepository struct {
	pool *pgxpool.Pool
}

func NewTransactionRepository(pool *pgxpool.Pool) *TransactionRepository {
	return &TransactionRepository{pool: pool}
}

func scanTransactions(rows pgx.Rows) ([]*models.Transaction, error) {
	var list []*models.Transaction
	for rows.Next() {
		var t models.Transaction
		if err := rows.Scan(&t.ID, &t.AccountID, &t.Amount, &t.Date, &t.Description, &t.Type); err != nil {
			return nil, err
		}
		list = append(list, &t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *TransactionRepository) GetByAccountID(ctx context.Context, accountID string, page, pageSize int) ([]*models.Transaction, int, error) {
	if accountID == "" {
		return nil, 0, fmt.Errorf("account ID is required")
	}
	var total int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM transactions WHERE account_id = $1::uuid`,
		accountID,
	).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count transactions: %w", err)
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
		`SELECT id::text, account_id::text, amount, date, description, type
		 FROM transactions
		 WHERE account_id = $1::uuid
		 ORDER BY date DESC, id
		 LIMIT $2 OFFSET $3`,
		accountID, pageSize, offset,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("query transactions: %w", err)
	}
	defer rows.Close()
	list, err := scanTransactions(rows)
	if err != nil {
		return nil, 0, fmt.Errorf("scan transactions: %w", err)
	}
	if list == nil {
		list = []*models.Transaction{}
	}
	return list, total, nil
}

func (r *TransactionRepository) GetByID(ctx context.Context, accountID, transactionID string) (*models.Transaction, error) {
	if accountID == "" {
		return nil, fmt.Errorf("account ID is required")
	}
	if transactionID == "" {
		return nil, fmt.Errorf("transaction ID is required")
	}
	var t models.Transaction
	err := r.pool.QueryRow(ctx,
		`SELECT id::text, account_id::text, amount, date, description, type
		 FROM transactions
		 WHERE account_id = $1::uuid AND id = $2::uuid`,
		accountID, transactionID,
	).Scan(&t.ID, &t.AccountID, &t.Amount, &t.Date, &t.Description, &t.Type)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get transaction: %w", err)
	}
	return &t, nil
}

func (r *TransactionRepository) Create(ctx context.Context, tx *models.Transaction) error {
	if tx.AccountID == "" {
		return fmt.Errorf("account ID is required")
	}
	if tx.Type == "" {
		return fmt.Errorf("transaction type is required")
	}
	if tx.Type != "income" && tx.Type != "expense" {
		return fmt.Errorf("transaction type must be income or expense")
	}
	tx.ID = uuid.New().String()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO transactions (id, account_id, amount, date, description, type)
		 VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6)`,
		tx.ID, tx.AccountID, tx.Amount, tx.Date, tx.Description, tx.Type,
	)
	if err != nil {
		return fmt.Errorf("insert transaction: %w", err)
	}
	return nil
}

func (r *TransactionRepository) Update(ctx context.Context, tx *models.Transaction) error {
	if tx.ID == "" {
		return fmt.Errorf("transaction ID is required")
	}
	if tx.AccountID == "" {
		return fmt.Errorf("account ID is required")
	}
	if tx.Type == "" {
		return fmt.Errorf("transaction type is required")
	}
	if tx.Type != "income" && tx.Type != "expense" {
		return fmt.Errorf("transaction type must be income or expense")
	}
	result, err := r.pool.Exec(ctx,
		`UPDATE transactions SET amount = $1, date = $2, description = $3, type = $4
		 WHERE account_id = $5::uuid AND id = $6::uuid`,
		tx.Amount, tx.Date, tx.Description, tx.Type, tx.AccountID, tx.ID,
	)
	if err != nil {
		return fmt.Errorf("update transaction: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("transaction not found")
	}
	return nil
}

func (r *TransactionRepository) Delete(ctx context.Context, accountID, transactionID string) error {
	if accountID == "" {
		return fmt.Errorf("account ID is required")
	}
	if transactionID == "" {
		return fmt.Errorf("transaction ID is required")
	}
	result, err := r.pool.Exec(ctx,
		`DELETE FROM transactions WHERE account_id = $1::uuid AND id = $2::uuid`,
		accountID, transactionID,
	)
	if err != nil {
		return fmt.Errorf("delete transaction: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("transaction not found")
	}
	return nil
}
