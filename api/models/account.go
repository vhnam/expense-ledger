package models

import "time"

type Account struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

type Transaction struct {
	ID          string    `json:"id"`
	AccountID   string    `json:"account_id"`
	Amount      float64   `json:"amount"`
	Date        time.Time `json:"date"`
	Description string    `json:"description"`
	Type        string    `json:"type"`
}
