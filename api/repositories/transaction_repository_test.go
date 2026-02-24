package repositories

import (
	"context"
	"strings"
	"testing"

	"expense-ledger/models"
)

func TestTransactionRepository_GetByAccountID_validation(t *testing.T) {
	repo := NewTransactionRepository(nil)
	ctx := context.Background()

	_, _, err := repo.GetByAccountID(ctx, "", 1, 20)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "account ID is required") {
		t.Errorf("err = %v; want containing 'account ID is required'", err)
	}
}

func TestTransactionRepository_GetByID_validation(t *testing.T) {
	repo := NewTransactionRepository(nil)
	ctx := context.Background()

	tests := []struct {
		name          string
		accountID     string
		transactionID string
		wantErr       string
	}{
		{"empty account ID", "", "tx-123", "account ID is required"},
		{"empty transaction ID", "acc-123", "", "transaction ID is required"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := repo.GetByID(ctx, tt.accountID, tt.transactionID)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
			if !strings.Contains(err.Error(), tt.wantErr) {
				t.Errorf("err = %v; want containing %q", err, tt.wantErr)
			}
		})
	}
}

func TestTransactionRepository_Create_validation(t *testing.T) {
	repo := NewTransactionRepository(nil)
	ctx := context.Background()

	tests := []struct {
		name    string
		tx      *models.Transaction
		wantErr string
	}{
		{"empty account ID", &models.Transaction{AccountID: "", Type: "expense"}, "account ID is required"},
		{"empty type", &models.Transaction{AccountID: "acc-1", Type: ""}, "transaction type is required"},
		{"invalid type", &models.Transaction{AccountID: "acc-1", Type: "transfer"}, "income or expense"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := repo.Create(ctx, tt.tx)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
			if !strings.Contains(err.Error(), tt.wantErr) {
				t.Errorf("err = %v; want containing %q", err, tt.wantErr)
			}
		})
	}
}

func TestTransactionRepository_Update_validation(t *testing.T) {
	repo := NewTransactionRepository(nil)
	ctx := context.Background()

	tests := []struct {
		name    string
		tx      *models.Transaction
		wantErr string
	}{
		{"empty transaction ID", &models.Transaction{ID: "", AccountID: "acc-1", Type: "expense"}, "transaction ID is required"},
		{"empty account ID", &models.Transaction{ID: "tx-1", AccountID: "", Type: "expense"}, "account ID is required"},
		{"invalid type", &models.Transaction{ID: "tx-1", AccountID: "acc-1", Type: "other"}, "income or expense"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := repo.Update(ctx, tt.tx)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
			if !strings.Contains(err.Error(), tt.wantErr) {
				t.Errorf("err = %v; want containing %q", err, tt.wantErr)
			}
		})
	}
}

func TestTransactionRepository_Delete_validation(t *testing.T) {
	repo := NewTransactionRepository(nil)
	ctx := context.Background()

	tests := []struct {
		name          string
		accountID     string
		transactionID string
		wantErr       string
	}{
		{"empty account ID", "", "tx-1", "account ID is required"},
		{"empty transaction ID", "acc-1", "", "transaction ID is required"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := repo.Delete(ctx, tt.accountID, tt.transactionID)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
			if !strings.Contains(err.Error(), tt.wantErr) {
				t.Errorf("err = %v; want containing %q", err, tt.wantErr)
			}
		})
	}
}
