package repositories

import (
	"context"
	"strings"
	"testing"

	"expense-ledger/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestNewAccountRepository(t *testing.T) {
	repo := NewAccountRepository(nil)
	if repo == nil {
		t.Fatal("NewAccountRepository(nil) should not return nil")
	}
	// With a real pool, repo.pool would be set; we only check construction.
	_ = NewAccountRepository((*pgxpool.Pool)(nil))
}

func TestAccountRepository_Update_validation(t *testing.T) {
	// Validation runs before any DB call, so nil pool is safe.
	repo := NewAccountRepository(nil)
	ctx := context.Background()

	tests := []struct {
		name    string
		account *models.Account
		wantErr string
	}{
		{"empty ID", &models.Account{Name: "x", Type: "bank"}, "account ID is required"},
		{"empty name", &models.Account{ID: "123", Name: "", Type: "bank"}, "account name is required"},
		{"empty type", &models.Account{ID: "123", Name: "x", Type: ""}, "account type is required"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := repo.Update(ctx, tt.account)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
			if !strings.Contains(err.Error(), tt.wantErr) {
				t.Errorf("err = %v; want containing %q", err, tt.wantErr)
			}
		})
	}
}

func TestAccountRepository_Delete_validation(t *testing.T) {
	repo := NewAccountRepository(nil)
	ctx := context.Background()

	err := repo.Delete(ctx, "")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "account ID is required") {
		t.Errorf("err = %v; want 'account ID is required'", err)
	}
}
