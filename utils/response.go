package utils

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

const (
	defaultPageSize = 20
	maxPageSize     = 100
)

func ParsePagination(request *http.Request) (page, pageSize int) {
	page, pageSize = 1, defaultPageSize
	if p := request.URL.Query().Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v >= 1 {
			page = v
		}
	}
	if ps := request.URL.Query().Get("pageSize"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v >= 1 {
			pageSize = v
		}
	}
	if pageSize > maxPageSize {
		pageSize = maxPageSize
	}
	return page, pageSize
}

func WriteJSON(response http.ResponseWriter, status int, data any) {
	response.Header().Set("Content-Type", "application/json")
	response.WriteHeader(status)
	_ = json.NewEncoder(response).Encode(data)
}

func ParseDate(s string) (time.Time, error) {
	return time.Parse(time.RFC3339, s)
}
