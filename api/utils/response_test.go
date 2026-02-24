package utils

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestParsePagination(t *testing.T) {
	tests := []struct {
		name           string
		query          string
		wantPage       int
		wantPageSize   int
	}{
		{"defaults", "", 1, defaultPageSize},
		{"page only", "page=2", 2, defaultPageSize},
		{"pageSize only", "pageSize=50", 1, 50},
		{"both valid", "page=3&pageSize=10", 3, 10},
		{"invalid page ignored", "page=0", 1, defaultPageSize},
		{"invalid page negative", "page=-1", 1, defaultPageSize},
		{"invalid page non-number", "page=abc", 1, defaultPageSize},
		{"invalid pageSize ignored", "pageSize=0", 1, defaultPageSize},
		{"invalid pageSize non-number", "pageSize=xyz", 1, defaultPageSize},
		{"pageSize capped at max", "pageSize=500", 1, maxPageSize},
		{"pageSize at max", "pageSize=100", 1, maxPageSize},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var url string
			if tt.query != "" {
				url = "http://test/?" + tt.query
			} else {
				url = "http://test/"
			}
			req := httptest.NewRequest(http.MethodGet, url, nil)
			gotPage, gotPageSize := ParsePagination(req)
			if gotPage != tt.wantPage || gotPageSize != tt.wantPageSize {
				t.Errorf("ParsePagination() = page %d, pageSize %d; want %d, %d",
					gotPage, gotPageSize, tt.wantPage, tt.wantPageSize)
			}
		})
	}
}

func TestWriteJSON(t *testing.T) {
	tests := []struct {
		name       string
		status     int
		data       any
		wantStatus int
		wantBody   string
	}{
		{
			name:       "object",
			status:     http.StatusOK,
			data:       map[string]string{"message": "hello"},
			wantStatus: http.StatusOK,
			wantBody:   `{"message":"hello"}`,
		},
		{
			name:       "created",
			status:     http.StatusCreated,
			data:       map[string]int{"id": 42},
			wantStatus: http.StatusCreated,
			wantBody:   `{"id":42}`,
		},
		{
			name:       "empty object",
			status:     http.StatusOK,
			data:       map[string]interface{}{},
			wantStatus: http.StatusOK,
			wantBody:   `{}`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			WriteJSON(w, tt.status, tt.data)
			if w.Code != tt.wantStatus {
				t.Errorf("status = %d; want %d", w.Code, tt.wantStatus)
			}
			if ct := w.Header().Get("Content-Type"); ct != "application/json" {
				t.Errorf("Content-Type = %q; want application/json", ct)
			}
			// Normalize body: decoder may reorder keys; compare as JSON.
			var gotJSON, wantJSON interface{}
			if err := json.Unmarshal(w.Body.Bytes(), &gotJSON); err != nil {
				t.Fatalf("response body not valid JSON: %v", err)
			}
			if err := json.Unmarshal([]byte(tt.wantBody), &wantJSON); err != nil {
				t.Fatalf("want body not valid JSON: %v", err)
			}
			gotBytes, _ := json.Marshal(gotJSON)
			wantBytes, _ := json.Marshal(wantJSON)
			if string(gotBytes) != string(wantBytes) {
				t.Errorf("body = %s; want %s", gotBytes, wantBytes)
			}
		})
	}
}
