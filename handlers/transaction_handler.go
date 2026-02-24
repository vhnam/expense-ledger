package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"expense-ledger/models"
	"expense-ledger/repositories"
	"expense-ledger/utils"
)

const transactionsPathPrefix = "/accounts/"
const transactionsPathSuffix = "/transactions"

var allowedTransactionTypes = map[string]bool{"income": true, "expense": true}

type TransactionHandler struct {
	Repo repositories.TransactionStore
}

type createTransactionRequest struct {
	Amount      float64 `json:"amount"`
	Date        string  `json:"date"` // RFC3339
	Description string  `json:"description"`
	Type        string  `json:"type"`
}

type listTransactionsResponse struct {
	Data     []*models.Transaction `json:"data"`
	Total    int                   `json:"total"`
	Page     int                   `json:"page"`
	PageSize int                   `json:"pageSize"`
}

func NewTransactionHandler(repo repositories.TransactionStore) *TransactionHandler {
	return &TransactionHandler{Repo: repo}
}

// accountIDFromTransactionsPath returns accountID from "/accounts/<id>/transactions" or "/accounts/<id>/transactions/<txId>".
// Returns ("", "") if path does not match, (accountID, "") for list/create, (accountID, txID) for get/update/delete.
func accountIDAndTransactionIDFromPath(path string) (accountID, transactionID string) {
	if !strings.HasPrefix(path, transactionsPathPrefix) {
		return "", ""
	}
	rest := strings.TrimPrefix(path, transactionsPathPrefix)
	parts := strings.SplitN(rest, "/", 3) // ["id", "transactions"] or ["id", "transactions", "txId"]
	if len(parts) < 2 || parts[0] == "" || parts[1] != "transactions" {
		return "", ""
	}
	accountID = parts[0]
	if len(parts) == 3 && parts[2] != "" && !strings.Contains(parts[2], "/") {
		transactionID = parts[2]
	}
	return accountID, transactionID
}

func (h *TransactionHandler) ListTransactions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	accountID, txID := accountIDAndTransactionIDFromPath(r.URL.Path)
	if accountID == "" {
		http.Error(w, "invalid account ID in path", http.StatusBadRequest)
		return
	}
	if txID != "" {
		// Path was /accounts/id/transactions/txId -> treat as get one
		tx, err := h.Repo.GetByID(r.Context(), accountID, txID)
		if err != nil {
			http.Error(w, "failed to get transaction", http.StatusInternalServerError)
			return
		}
		if tx == nil {
			http.NotFound(w, r)
			return
		}
		utils.WriteJSON(w, http.StatusOK, tx)
		return
	}
	page, pageSize := utils.ParsePagination(r)
	list, total, err := h.Repo.GetByAccountID(r.Context(), accountID, page, pageSize)
	if err != nil {
		http.Error(w, "failed to list transactions", http.StatusInternalServerError)
		return
	}
	if list == nil {
		list = []*models.Transaction{}
	}
	utils.WriteJSON(w, http.StatusOK, listTransactionsResponse{
		Data:     list,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

func (h *TransactionHandler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	accountID, txID := accountIDAndTransactionIDFromPath(r.URL.Path)
	if accountID == "" || txID != "" {
		http.Error(w, "invalid path for create transaction", http.StatusBadRequest)
		return
	}
	body := http.MaxBytesReader(w, r.Body, maxBodyBytes)
	var req createTransactionRequest
	if err := json.NewDecoder(body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}
	if req.Type == "" {
		http.Error(w, "type is required", http.StatusBadRequest)
		return
	}
	if !allowedTransactionTypes[req.Type] {
		http.Error(w, "type must be one of: income, expense", http.StatusBadRequest)
		return
	}
	if req.Date == "" {
		http.Error(w, "date is required", http.StatusBadRequest)
		return
	}
	date, err := utils.ParseDate(req.Date)
	if err != nil {
		http.Error(w, "invalid date (use RFC3339)", http.StatusBadRequest)
		return
	}
	tx := &models.Transaction{
		AccountID:   accountID,
		Amount:      req.Amount,
		Date:        date,
		Description: req.Description,
		Type:        req.Type,
	}
	if err := h.Repo.Create(r.Context(), tx); err != nil {
		http.Error(w, "failed to create transaction", http.StatusInternalServerError)
		return
	}
	utils.WriteJSON(w, http.StatusCreated, tx)
}

func (h *TransactionHandler) UpdateTransaction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	accountID, txID := accountIDAndTransactionIDFromPath(r.URL.Path)
	if accountID == "" || txID == "" {
		http.Error(w, "invalid path for update transaction", http.StatusBadRequest)
		return
	}
	body := http.MaxBytesReader(w, r.Body, maxBodyBytes)
	var req struct {
		Amount      *float64 `json:"amount"`
		Date        *string  `json:"date"`
		Description *string  `json:"description"`
		Type        *string  `json:"type"`
	}
	if err := json.NewDecoder(body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}
	existing, err := h.Repo.GetByID(r.Context(), accountID, txID)
	if err != nil {
		http.Error(w, "failed to get transaction", http.StatusInternalServerError)
		return
	}
	if existing == nil {
		http.NotFound(w, r)
		return
	}
	if req.Amount != nil {
		existing.Amount = *req.Amount
	}
	if req.Date != nil {
		date, err := utils.ParseDate(*req.Date)
		if err != nil {
			http.Error(w, "invalid date (use RFC3339)", http.StatusBadRequest)
			return
		}
		existing.Date = date
	}
	if req.Description != nil {
		existing.Description = *req.Description
	}
	if req.Type != nil {
		if *req.Type == "" || !allowedTransactionTypes[*req.Type] {
			http.Error(w, "type must be one of: income, expense", http.StatusBadRequest)
			return
		}
		existing.Type = *req.Type
	}
	if err := h.Repo.Update(r.Context(), existing); err != nil {
		http.Error(w, "failed to update transaction", http.StatusInternalServerError)
		return
	}
	utils.WriteJSON(w, http.StatusOK, existing)
}

func (h *TransactionHandler) DeleteTransaction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	accountID, txID := accountIDAndTransactionIDFromPath(r.URL.Path)
	if accountID == "" || txID == "" {
		http.Error(w, "invalid path for delete transaction", http.StatusBadRequest)
		return
	}
	if err := h.Repo.Delete(r.Context(), accountID, txID); err != nil {
		if strings.Contains(err.Error(), "not found") {
			http.NotFound(w, r)
			return
		}
		http.Error(w, "failed to delete transaction", http.StatusInternalServerError)
		return
	}
	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "transaction deleted"})
}
