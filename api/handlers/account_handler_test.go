package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"expense-ledger/models"
	"expense-ledger/repositories"
)

// fakeAccountStore implements repositories.AccountStore for tests.
type fakeAccountStore struct {
	getAllFunc  func(ctx context.Context, page, pageSize int) ([]*models.Account, int, error)
	createFunc  func(ctx context.Context, a *models.Account) error
	updateFunc  func(ctx context.Context, a *models.Account) error
	deleteFunc  func(ctx context.Context, id string) error
}

func (f *fakeAccountStore) GetAll(ctx context.Context, page, pageSize int) ([]*models.Account, int, error) {
	if f.getAllFunc != nil {
		return f.getAllFunc(ctx, page, pageSize)
	}
	return nil, 0, nil
}

func (f *fakeAccountStore) Create(ctx context.Context, a *models.Account) error {
	if f.createFunc != nil {
		return f.createFunc(ctx, a)
	}
	return nil
}

func (f *fakeAccountStore) Update(ctx context.Context, a *models.Account) error {
	if f.updateFunc != nil {
		return f.updateFunc(ctx, a)
	}
	return nil
}

func (f *fakeAccountStore) Delete(ctx context.Context, id string) error {
	if f.deleteFunc != nil {
		return f.deleteFunc(ctx, id)
	}
	return nil
}

func TestNewAccountHandler(t *testing.T) {
	var store repositories.AccountStore = &fakeAccountStore{}
	h := NewAccountHandler(store)
	if h == nil || h.Repo != store {
		t.Error("NewAccountHandler did not set repo")
	}
}

func TestAccountHandler_ListAccounts(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		store      repositories.AccountStore
		wantStatus int
		wantBody   string
	}{
		{
			name:       "method not allowed",
			method:     http.MethodPost,
			store:      &fakeAccountStore{},
			wantStatus: http.StatusMethodNotAllowed,
			wantBody:   "method not allowed\n",
		},
		{
			name:   "success empty list",
			method: http.MethodGet,
			store: &fakeAccountStore{
				getAllFunc: func(ctx context.Context, page, pageSize int) ([]*models.Account, int, error) {
					return []*models.Account{}, 0, nil
				},
			},
			wantStatus: http.StatusOK,
			wantBody:   `{"data":[],"total":0,"page":1,"pageSize":20}`,
		},
		{
			name:   "success with accounts",
			method: http.MethodGet,
			store: &fakeAccountStore{
				getAllFunc: func(ctx context.Context, page, pageSize int) ([]*models.Account, int, error) {
					return []*models.Account{
						{ID: "1", Name: "Checking", Type: "bank"},
					}, 1, nil
				},
			},
			wantStatus: http.StatusOK,
			wantBody:   `{"data":[{"id":"1","name":"Checking","type":"bank"}],"total":1,"page":1,"pageSize":20}`,
		},
		{
			name:   "success with nil accounts normalized to empty slice",
			method: http.MethodGet,
			store: &fakeAccountStore{
				getAllFunc: func(ctx context.Context, page, pageSize int) ([]*models.Account, int, error) {
					return nil, 0, nil
				},
			},
			wantStatus: http.StatusOK,
			wantBody:   `{"data":[],"total":0,"page":1,"pageSize":20}`,
		},
		{
			name:   "repo error",
			method: http.MethodGet,
			store: &fakeAccountStore{
				getAllFunc: func(ctx context.Context, page, pageSize int) ([]*models.Account, int, error) {
					return nil, 0, context.DeadlineExceeded
				},
			},
			wantStatus: http.StatusInternalServerError,
			wantBody:   "failed to list accounts\n",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := NewAccountHandler(tt.store)
			req := httptest.NewRequest(tt.method, "/accounts", nil)
			w := httptest.NewRecorder()
			h.ListAccounts(w, req)
			if w.Code != tt.wantStatus {
				t.Errorf("status = %d; want %d", w.Code, tt.wantStatus)
			}
			body := strings.TrimSpace(w.Body.String())
			wantTrim := strings.TrimSpace(tt.wantBody)
			// For JSON responses compare normalized JSON
			if strings.HasPrefix(w.Header().Get("Content-Type"), "application/json") {
				var got, want interface{}
				if err := json.Unmarshal([]byte(body), &got); err != nil {
					t.Fatalf("response not JSON: %v", err)
				}
				if err := json.Unmarshal([]byte(wantTrim), &want); err != nil {
					t.Fatalf("want not JSON: %v", err)
				}
				gb, _ := json.Marshal(got)
				wb, _ := json.Marshal(want)
				if string(gb) != string(wb) {
					t.Errorf("body = %s; want %s", gb, wb)
				}
			} else if body != wantTrim {
				t.Errorf("body = %q; want %q", body, wantTrim)
			}
		})
	}
}

func TestAccountHandler_CreateAccount(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		body       string
		store      repositories.AccountStore
		wantStatus int
		checkBody  func(t *testing.T, w *httptest.ResponseRecorder)
	}{
		{
			name:       "method not allowed",
			method:     http.MethodGet,
			body:       `{"name":"x","type":"bank"}`,
			store:      &fakeAccountStore{},
			wantStatus: http.StatusMethodNotAllowed,
		},
		{
			name:       "invalid JSON",
			method:     http.MethodPost,
			body:       `{invalid`,
			store:      &fakeAccountStore{},
			wantStatus: http.StatusBadRequest,
			checkBody:  func(t *testing.T, w *httptest.ResponseRecorder) { if !strings.Contains(w.Body.String(), "invalid JSON") { t.Error("expected invalid JSON message") } },
		},
		{
			name:       "name required",
			method:     http.MethodPost,
			body:       `{"type":"bank"}`,
			store:      &fakeAccountStore{},
			wantStatus: http.StatusBadRequest,
			checkBody:  func(t *testing.T, w *httptest.ResponseRecorder) { if !strings.Contains(w.Body.String(), "name is required") { t.Error("expected name is required") } },
		},
		{
			name:       "type required",
			method:     http.MethodPost,
			body:       `{"name":"Checking"}`,
			store:      &fakeAccountStore{},
			wantStatus: http.StatusBadRequest,
			checkBody:  func(t *testing.T, w *httptest.ResponseRecorder) { if !strings.Contains(w.Body.String(), "type is required") { t.Error("expected type is required") } },
		},
		{
			name:       "invalid type",
			method:     http.MethodPost,
			body:       `{"name":"x","type":"invalid"}`,
			store:      &fakeAccountStore{},
			wantStatus: http.StatusBadRequest,
			checkBody:  func(t *testing.T, w *httptest.ResponseRecorder) { if !strings.Contains(w.Body.String(), "type must be") { t.Error("expected type validation message") } },
		},
		{
			name:   "success",
			method: http.MethodPost,
			body:   `{"name":"Savings","type":"bank"}`,
			store: &fakeAccountStore{
				createFunc: func(ctx context.Context, a *models.Account) error {
					a.ID = "generated-id"
					return nil
				},
			},
			wantStatus: http.StatusCreated,
			checkBody: func(t *testing.T, w *httptest.ResponseRecorder) {
				var acc models.Account
				if err := json.NewDecoder(w.Body).Decode(&acc); err != nil {
					t.Fatalf("decode: %v", err)
				}
				if acc.ID != "generated-id" || acc.Name != "Savings" || acc.Type != "bank" {
					t.Errorf("got %+v", acc)
				}
			},
		},
		{
			name:   "create repo error",
			method: http.MethodPost,
			body:   `{"name":"x","type":"cash"}`,
			store: &fakeAccountStore{
				createFunc: func(ctx context.Context, a *models.Account) error { return context.DeadlineExceeded },
			},
			wantStatus: http.StatusInternalServerError,
			checkBody:  func(t *testing.T, w *httptest.ResponseRecorder) { if !strings.Contains(w.Body.String(), "failed to create") { t.Error("expected create error message") } },
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := NewAccountHandler(tt.store)
			req := httptest.NewRequest(tt.method, "/accounts", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			h.CreateAccount(w, req)
			if w.Code != tt.wantStatus {
				t.Errorf("status = %d; want %d", w.Code, tt.wantStatus)
			}
			if tt.checkBody != nil {
				tt.checkBody(t, w)
			}
		})
	}
}

func TestAccountHandler_UpdateAccount(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		path       string
		body       string
		store      repositories.AccountStore
		wantStatus int
	}{
		{
			name:       "method not allowed",
			method:     http.MethodGet,
			path:       "/accounts/abc",
			body:       `{"name":"x","type":"bank"}`,
			store:      &fakeAccountStore{},
			wantStatus: http.StatusMethodNotAllowed,
		},
		{
			name:       "invalid path no prefix",
			method:     http.MethodPut,
			path:       "/accounts",
			body:       `{"name":"x","type":"bank"}`,
			store:      &fakeAccountStore{},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "invalid path no id",
			method:     http.MethodPut,
			path:       "/accounts/",
			body:       `{"name":"x","type":"bank"}`,
			store:      &fakeAccountStore{},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "invalid path with slash in id",
			method:     http.MethodPut,
			path:       "/accounts/foo/bar",
			body:       `{"name":"x","type":"bank"}`,
			store:      &fakeAccountStore{},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "invalid JSON",
			method:     http.MethodPut,
			path:       "/accounts/acc-123",
			body:       `{bad`,
			store:      &fakeAccountStore{},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "name required",
			method:     http.MethodPut,
			path:       "/accounts/acc-123",
			body:       `{"type":"bank"}`,
			store:      &fakeAccountStore{},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "type required",
			method:     http.MethodPut,
			path:       "/accounts/acc-123",
			body:       `{"name":"x"}`,
			store:      &fakeAccountStore{},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:   "success",
			method: http.MethodPut,
			path:   "/accounts/acc-123",
			body:   `{"name":"Updated","type":"cash"}`,
			store: &fakeAccountStore{
				updateFunc: func(ctx context.Context, a *models.Account) error {
					if a.ID != "acc-123" || a.Name != "Updated" || a.Type != "cash" {
						return context.DeadlineExceeded
					}
					return nil
				},
			},
			wantStatus: http.StatusOK,
		},
		{
			name:   "update repo error",
			method: http.MethodPut,
			path:   "/accounts/acc-123",
			body:   `{"name":"x","type":"bank"}`,
			store: &fakeAccountStore{
				updateFunc: func(ctx context.Context, a *models.Account) error { return context.DeadlineExceeded },
			},
			wantStatus: http.StatusInternalServerError,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := NewAccountHandler(tt.store)
			req := httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			h.UpdateAccount(w, req)
			if w.Code != tt.wantStatus {
				t.Errorf("status = %d; want %d", w.Code, tt.wantStatus)
			}
		})
	}
}

func TestAccountHandler_DeleteAccount(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		path       string
		query      string
		store      repositories.AccountStore
		wantStatus int
	}{
		{
			name:       "method not allowed",
			method:     http.MethodGet,
			path:       "/accounts/abc",
			store:      &fakeAccountStore{},
			wantStatus: http.StatusMethodNotAllowed,
		},
		{
			name:       "no id in path or query",
			method:     http.MethodDelete,
			path:       "/accounts/",
			store:      &fakeAccountStore{},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:   "delete by path",
			method: http.MethodDelete,
			path:   "/accounts/acc-456",
			store: &fakeAccountStore{
				deleteFunc: func(ctx context.Context, id string) error {
					if id != "acc-456" {
						return context.DeadlineExceeded
					}
					return nil
				},
			},
			wantStatus: http.StatusOK,
		},
		{
			name:   "delete by query id",
			method: http.MethodDelete,
			path:   "/accounts/",
			query:  "id=query-id",
			store: &fakeAccountStore{
				deleteFunc: func(ctx context.Context, id string) error {
					if id != "query-id" {
						return context.DeadlineExceeded
					}
					return nil
				},
			},
			wantStatus: http.StatusOK,
		},
		{
			name:   "delete repo error",
			method: http.MethodDelete,
			path:   "/accounts/acc-789",
			store: &fakeAccountStore{
				deleteFunc: func(ctx context.Context, id string) error { return context.DeadlineExceeded },
			},
			wantStatus: http.StatusInternalServerError,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := NewAccountHandler(tt.store)
			url := "http://test" + tt.path
			if tt.query != "" {
				url += "?" + tt.query
			}
			req := httptest.NewRequest(tt.method, url, nil)
			w := httptest.NewRecorder()
			h.DeleteAccount(w, req)
			if w.Code != tt.wantStatus {
				t.Errorf("status = %d; want %d", w.Code, tt.wantStatus)
			}
		})
	}
}
