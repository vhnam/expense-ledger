package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"expense-ledger/models"
	"expense-ledger/repositories"
)

type fakeTransactionStore struct {
	getByAccountIDFunc func(ctx context.Context, accountID string, page, pageSize int) ([]*models.Transaction, int, error)
	getByIDFunc        func(ctx context.Context, accountID, transactionID string) (*models.Transaction, error)
	createFunc         func(ctx context.Context, tx *models.Transaction) error
	updateFunc         func(ctx context.Context, tx *models.Transaction) error
	deleteFunc         func(ctx context.Context, accountID, transactionID string) error
}

func (f *fakeTransactionStore) GetByAccountID(ctx context.Context, accountID string, page, pageSize int) ([]*models.Transaction, int, error) {
	if f.getByAccountIDFunc != nil {
		return f.getByAccountIDFunc(ctx, accountID, page, pageSize)
	}
	return nil, 0, nil
}

func (f *fakeTransactionStore) GetByID(ctx context.Context, accountID, transactionID string) (*models.Transaction, error) {
	if f.getByIDFunc != nil {
		return f.getByIDFunc(ctx, accountID, transactionID)
	}
	return nil, nil
}

func (f *fakeTransactionStore) Create(ctx context.Context, tx *models.Transaction) error {
	if f.createFunc != nil {
		return f.createFunc(ctx, tx)
	}
	return nil
}

func (f *fakeTransactionStore) Update(ctx context.Context, tx *models.Transaction) error {
	if f.updateFunc != nil {
		return f.updateFunc(ctx, tx)
	}
	return nil
}

func (f *fakeTransactionStore) Delete(ctx context.Context, accountID, transactionID string) error {
	if f.deleteFunc != nil {
		return f.deleteFunc(ctx, accountID, transactionID)
	}
	return nil
}

func Test_accountIDAndTransactionIDFromPath(t *testing.T) {
	tests := []struct {
		path             string
		wantAccountID    string
		wantTransactionID string
	}{
		{"/accounts/acc-1/transactions", "acc-1", ""},
		{"/accounts/acc-1/transactions/tx-1", "acc-1", "tx-1"},
		{"/accounts/acc-1/transactions/", "acc-1", ""},
		{"/accounts/acc-1/other", "", ""},
		{"/accounts/acc-1", "", ""},
		{"/accounts/", "", ""},
		{"/other/acc-1/transactions", "", ""},
	}
	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			accID, txID := accountIDAndTransactionIDFromPath(tt.path)
			if accID != tt.wantAccountID || txID != tt.wantTransactionID {
				t.Errorf("accountIDAndTransactionIDFromPath(%q) = %q, %q; want %q, %q",
					tt.path, accID, txID, tt.wantAccountID, tt.wantTransactionID)
			}
		})
	}
}

func TestTransactionHandler_ListTransactions(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		path       string
		store      repositories.TransactionStore
		wantStatus int
		wantBody   string
	}{
		{
			name:       "method not allowed",
			method:     http.MethodPost,
			path:       "/accounts/acc-1/transactions",
			store:      &fakeTransactionStore{},
			wantStatus: http.StatusMethodNotAllowed,
			wantBody:   "method not allowed\n",
		},
		{
			name:       "invalid path no account id",
			method:     http.MethodGet,
			path:       "/accounts//transactions",
			store:      &fakeTransactionStore{},
			wantStatus: http.StatusBadRequest,
			wantBody:   "invalid account ID in path\n",
		},
		{
			name:   "success empty list",
			method: http.MethodGet,
			path:   "/accounts/acc-1/transactions",
			store: &fakeTransactionStore{
				getByAccountIDFunc: func(ctx context.Context, accountID string, page, pageSize int) ([]*models.Transaction, int, error) {
					return []*models.Transaction{}, 0, nil
				},
			},
			wantStatus: http.StatusOK,
			wantBody:   `{"data":[],"total":0,"page":1,"pageSize":20}`,
		},
		{
			name:   "success get one",
			method: http.MethodGet,
			path:   "/accounts/acc-1/transactions/tx-1",
			store: &fakeTransactionStore{
				getByIDFunc: func(ctx context.Context, accountID, transactionID string) (*models.Transaction, error) {
					return &models.Transaction{ID: "tx-1", AccountID: "acc-1", Amount: 10.5, Type: "expense"}, nil
				},
			},
			wantStatus: http.StatusOK,
			wantBody:   `"id":"tx-1"`,
		},
		{
			name:   "get one not found",
			method: http.MethodGet,
			path:   "/accounts/acc-1/transactions/tx-missing",
			store: &fakeTransactionStore{
				getByIDFunc: func(ctx context.Context, accountID, transactionID string) (*models.Transaction, error) {
					return nil, nil
				},
			},
			wantStatus: http.StatusNotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := NewTransactionHandler(tt.store)
			req := httptest.NewRequest(tt.method, tt.path, nil)
			w := httptest.NewRecorder()
			h.ListTransactions(w, req)
			if w.Code != tt.wantStatus {
				t.Errorf("status = %d; want %d", w.Code, tt.wantStatus)
			}
			body := strings.TrimSpace(w.Body.String())
			if tt.wantBody != "" && !strings.Contains(body, strings.TrimSpace(tt.wantBody)) {
				t.Errorf("body = %s; want containing %q", body, tt.wantBody)
			}
		})
	}
}

func TestTransactionHandler_CreateTransaction(t *testing.T) {
	validBody := map[string]interface{}{
		"amount":       -25.50,
		"date":         "2025-02-25T12:00:00Z",
		"description":  "Coffee",
		"type":         "expense",
	}
	tests := []struct {
		name       string
		method     string
		path       string
		body       interface{}
		store      repositories.TransactionStore
		wantStatus int
		wantBody   string
	}{
		{
			name:       "method not allowed",
			method:     http.MethodGet,
			path:       "/accounts/acc-1/transactions",
			body:       validBody,
			store:      &fakeTransactionStore{},
			wantStatus: http.StatusMethodNotAllowed,
		},
		{
			name:       "invalid path with tx id",
			method:     http.MethodPost,
			path:       "/accounts/acc-1/transactions/tx-1",
			body:       validBody,
			store:      &fakeTransactionStore{},
			wantStatus: http.StatusBadRequest,
			wantBody:   "invalid path for create",
		},
		{
			name:       "missing type",
			method:     http.MethodPost,
			path:       "/accounts/acc-1/transactions",
			body:       map[string]interface{}{"amount": 10, "date": "2025-02-25T12:00:00Z"},
			store:      &fakeTransactionStore{},
			wantStatus: http.StatusBadRequest,
			wantBody:   "type is required",
		},
		{
			name:       "invalid type",
			method:     http.MethodPost,
			path:       "/accounts/acc-1/transactions",
			body:       map[string]interface{}{"amount": 10, "date": "2025-02-25T12:00:00Z", "type": "transfer"},
			store:      &fakeTransactionStore{},
			wantStatus: http.StatusBadRequest,
			wantBody:   "income, expense",
		},
		{
			name:       "missing date",
			method:     http.MethodPost,
			path:       "/accounts/acc-1/transactions",
			body:       map[string]interface{}{"amount": 10, "type": "expense"},
			store:      &fakeTransactionStore{},
			wantStatus: http.StatusBadRequest,
			wantBody:   "date is required",
		},
		{
			name:   "success created",
			method: http.MethodPost,
			path:   "/accounts/acc-1/transactions",
			body:   validBody,
			store: &fakeTransactionStore{
				createFunc: func(ctx context.Context, tx *models.Transaction) error {
					if tx.AccountID != "acc-1" || tx.Type != "expense" || tx.Amount != -25.50 {
						t.Errorf("unexpected transaction: %+v", tx)
					}
					tx.ID = "new-id"
					return nil
				},
			},
			wantStatus: http.StatusCreated,
			wantBody:   `"id":"new-id"`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var bodyBytes []byte
			if tt.body != nil {
				var err error
				bodyBytes, err = json.Marshal(tt.body)
				if err != nil {
					t.Fatal(err)
				}
			}
			h := NewTransactionHandler(tt.store)
			req := httptest.NewRequest(tt.method, tt.path, bytes.NewReader(bodyBytes))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			h.CreateTransaction(w, req)
			if w.Code != tt.wantStatus {
				t.Errorf("status = %d; want %d\nbody: %s", w.Code, tt.wantStatus, w.Body.String())
			}
			if tt.wantBody != "" && !strings.Contains(w.Body.String(), tt.wantBody) {
				t.Errorf("body = %s; want containing %q", w.Body.String(), tt.wantBody)
			}
		})
	}
}

func TestTransactionHandler_UpdateTransaction(t *testing.T) {
	tx := &models.Transaction{ID: "tx-1", AccountID: "acc-1", Amount: 50, Date: time.Now(), Description: "old", Type: "income"}
	tests := []struct {
		name       string
		method     string
		path       string
		body       map[string]interface{}
		store      repositories.TransactionStore
		wantStatus int
	}{
		{
			name:       "method not allowed",
			method:     http.MethodGet,
			path:       "/accounts/acc-1/transactions/tx-1",
			store:      &fakeTransactionStore{},
			wantStatus: http.StatusMethodNotAllowed,
		},
		{
			name:       "path without tx id",
			method:     http.MethodPut,
			path:       "/accounts/acc-1/transactions",
			body:       map[string]interface{}{"type": "expense"},
			store:      &fakeTransactionStore{},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:   "not found",
			method: http.MethodPut,
			path:   "/accounts/acc-1/transactions/tx-missing",
			body:   map[string]interface{}{"amount": 100},
			store: &fakeTransactionStore{
				getByIDFunc: func(ctx context.Context, accountID, transactionID string) (*models.Transaction, error) {
					return nil, nil
				},
			},
			wantStatus: http.StatusNotFound,
		},
		{
			name:   "success partial update",
			method: http.MethodPut,
			path:   "/accounts/acc-1/transactions/tx-1",
			body:   map[string]interface{}{"amount": 75.25},
			store: &fakeTransactionStore{
				getByIDFunc: func(ctx context.Context, accountID, transactionID string) (*models.Transaction, error) {
					return tx, nil
				},
				updateFunc: func(ctx context.Context, updated *models.Transaction) error {
					if updated.Amount != 75.25 {
						t.Errorf("amount = %v; want 75.25", updated.Amount)
					}
					return nil
				},
			},
			wantStatus: http.StatusOK,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var bodyBytes []byte
			if tt.body != nil {
				var err error
				bodyBytes, err = json.Marshal(tt.body)
				if err != nil {
					t.Fatal(err)
				}
			}
			h := NewTransactionHandler(tt.store)
			req := httptest.NewRequest(tt.method, tt.path, bytes.NewReader(bodyBytes))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			h.UpdateTransaction(w, req)
			if w.Code != tt.wantStatus {
				t.Errorf("status = %d; want %d\nbody: %s", w.Code, tt.wantStatus, w.Body.String())
			}
		})
	}
}

func TestTransactionHandler_DeleteTransaction(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		path       string
		store      repositories.TransactionStore
		wantStatus int
	}{
		{
			name:       "method not allowed",
			method:     http.MethodGet,
			path:       "/accounts/acc-1/transactions/tx-1",
			store:      &fakeTransactionStore{},
			wantStatus: http.StatusMethodNotAllowed,
		},
		{
			name:       "path without tx id",
			method:     http.MethodDelete,
			path:       "/accounts/acc-1/transactions",
			store:      &fakeTransactionStore{},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:   "not found",
			method: http.MethodDelete,
			path:   "/accounts/acc-1/transactions/tx-missing",
			store: &fakeTransactionStore{
				deleteFunc: func(ctx context.Context, accountID, transactionID string) error {
					return fmt.Errorf("transaction not found")
				},
			},
			wantStatus: http.StatusNotFound,
		},
		{
			name:   "success",
			method: http.MethodDelete,
			path:   "/accounts/acc-1/transactions/tx-1",
			store: &fakeTransactionStore{
				deleteFunc: func(ctx context.Context, accountID, transactionID string) error {
					return nil
				},
			},
			wantStatus: http.StatusOK,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := NewTransactionHandler(tt.store)
			req := httptest.NewRequest(tt.method, tt.path, nil)
			w := httptest.NewRecorder()
			h.DeleteTransaction(w, req)
			if w.Code != tt.wantStatus {
				t.Errorf("status = %d; want %d\nbody: %s", w.Code, tt.wantStatus, w.Body.String())
			}
		})
	}
}
