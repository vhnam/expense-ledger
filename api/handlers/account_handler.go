package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"expense-ledger/models"
	"expense-ledger/repositories"
	"expense-ledger/utils"
)

const accountsPathPrefix = "/accounts/"

const maxBodyBytes = 1 << 20 // 1 MiB

var allowedAccountTypes = map[string]bool{"bank": true, "cash": true, "other": true}

type AccountHandler struct {
	Repo repositories.AccountStore
}

type createAccountRequest struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type listAccountsResponse struct {
	Data     []*models.Account `json:"data"`
	Total    int               `json:"total"`
	Page     int               `json:"page"`
	PageSize int               `json:"pageSize"`
}

func NewAccountHandler(repo repositories.AccountStore) *AccountHandler {
	return &AccountHandler{Repo: repo}
}

func (handler *AccountHandler) ListAccounts(response http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodGet {
		http.Error(response, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	page, pageSize := utils.ParsePagination(request)
	accounts, total, err := handler.Repo.GetAll(request.Context(), page, pageSize)
	if err != nil {
		http.Error(response, "failed to list accounts", http.StatusInternalServerError)
		return
	}
	if accounts == nil {
		accounts = []*models.Account{}
	}
	utils.WriteJSON(response, http.StatusOK, listAccountsResponse{
		Data:     accounts,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

func (handler *AccountHandler) CreateAccount(response http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		http.Error(response, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	body := http.MaxBytesReader(response, request.Body, maxBodyBytes)
	var req createAccountRequest
	if err := json.NewDecoder(body).Decode(&req); err != nil {
		http.Error(response, "invalid JSON", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		http.Error(response, "name is required", http.StatusBadRequest)
		return
	}
	if req.Type == "" {
		http.Error(response, "type is required", http.StatusBadRequest)
		return
	}
	if !allowedAccountTypes[req.Type] {
		http.Error(response, "type must be one of: bank, cash, credit, other", http.StatusBadRequest)
		return
	}
	acc := &models.Account{Name: req.Name, Type: req.Type}
	if err := handler.Repo.Create(request.Context(), acc); err != nil {
		http.Error(response, "failed to create account", http.StatusInternalServerError)
		return
	}
	utils.WriteJSON(response, http.StatusCreated, acc)
}

// accountIDFromPath returns the account ID from a path like "/accounts/<id>", or "" if invalid.
func accountIDFromPath(path string) string {
	if !strings.HasPrefix(path, accountsPathPrefix) {
		return ""
	}
	id := strings.TrimPrefix(path, accountsPathPrefix)
	if id == "" || strings.Contains(id, "/") {
		return ""
	}
	return id
}

func (handler *AccountHandler) UpdateAccount(response http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPut {
		http.Error(response, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := accountIDFromPath(request.URL.Path)
	if id == "" {
		http.Error(response, "invalid account ID in path", http.StatusBadRequest)
		return
	}
	body := http.MaxBytesReader(response, request.Body, maxBodyBytes)
	var req struct {
		Name string `json:"name"`
		Type string `json:"type"`
	}
	if err := json.NewDecoder(body).Decode(&req); err != nil {
		http.Error(response, "invalid JSON", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		http.Error(response, "name is required", http.StatusBadRequest)
		return
	}
	if req.Type == "" {
		http.Error(response, "type is required", http.StatusBadRequest)
		return
	}
	if !allowedAccountTypes[req.Type] {
		http.Error(response, "type must be one of: bank, cash, other", http.StatusBadRequest)
		return
	}
	acc := &models.Account{ID: id, Name: req.Name, Type: req.Type}
	if err := handler.Repo.Update(request.Context(), acc); err != nil {
		http.Error(response, "failed to update account", http.StatusInternalServerError)
		return
	}
	utils.WriteJSON(response, http.StatusOK, acc)
}

func (handler *AccountHandler) DeleteAccount(response http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodDelete {
		http.Error(response, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	accID := accountIDFromPath(request.URL.Path)
	if accID == "" {
		accID = request.URL.Query().Get("id") // fallback for ?id= for backwards compatibility
	}
	if accID == "" {
		http.Error(response, "ID is required (path or query)", http.StatusBadRequest)
		return
	}
	if err := handler.Repo.Delete(request.Context(), accID); err != nil {
		http.Error(response, "failed to delete account", http.StatusInternalServerError)
		return
	}
	utils.WriteJSON(response, http.StatusOK, map[string]string{"message": "account deleted"})
}
