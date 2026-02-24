package handlers

import (
	"encoding/json"
	"net/http"

	"expense-ledger/models"
	"expense-ledger/repositories"
)

type AccountHandler struct {
	Repo repositories.AccountStore
}

func NewAccountHandler(repo repositories.AccountStore) *AccountHandler {
	return &AccountHandler{Repo: repo}
}

type createAccountRequest struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

func (h *AccountHandler) CreateAccount(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req createAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}
	acc := &models.Account{Name: req.Name, Type: req.Type}
	if err := h.Repo.Create(r.Context(), acc); err != nil {
		http.Error(w, "failed to create account", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(acc)
}

func (h *AccountHandler) ListAccounts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	accounts, err := h.Repo.GetAll(r.Context())
	if err != nil {
		http.Error(w, "failed to list accounts", http.StatusInternalServerError)
		return
	}
	if accounts == nil {
		accounts = []*models.Account{}
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(accounts)
}
