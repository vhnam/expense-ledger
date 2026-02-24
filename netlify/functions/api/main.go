package main

import (
	"bytes"
	"context"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackc/pgx/v5/pgxpool"

	"expense-ledger/handlers"
	"expense-ledger/internal"
	"expense-ledger/repositories"
)

const netlifyFunctionPathPrefix = "/.netlify/functions/api"

type route struct {
	method  string
	path    string
	handler http.Handler
}

func pathMatches(routePath, requestPath string) bool {
	if routePath == requestPath {
		return true
	}
	const accountsIDPrefix = "/accounts/"
	if !strings.HasPrefix(requestPath, accountsIDPrefix) {
		return false
	}
	rest := requestPath[len(accountsIDPrefix):]
	parts := strings.SplitN(rest, "/", 4)
	switch routePath {
	case "/accounts/:id":
		return len(parts) == 1 && parts[0] != ""
	case "/accounts/:id/transactions":
		return len(parts) == 2 && parts[0] != "" && parts[1] == "transactions"
	case "/accounts/:id/transactions/:txId":
		return len(parts) == 3 && parts[0] != "" && parts[1] == "transactions" && parts[2] != ""
	default:
		return false
	}
}

func newRouter(routes ...route) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		method := r.Method
		pathMatched := false
		for _, ro := range routes {
			if !pathMatches(ro.path, path) {
				continue
			}
			pathMatched = true
			if ro.method == method {
				ro.handler.ServeHTTP(w, r)
				return
			}
		}
		if pathMatched {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		http.NotFound(w, r)
	})
}

var (
	routerOnce sync.Once
	router     http.Handler
	pool       *pgxpool.Pool
)

func getRouter() http.Handler {
	routerOnce.Do(func() {
		ctx := context.Background()
		var err error
		pool, err = internal.Connect(ctx)
		if err != nil {
			log.Fatalf("database: %v", err)
		}
		if pool == nil {
			log.Fatal("DATABASE_URL is required")
		}
		if err := internal.Migrate(ctx, pool); err != nil {
			log.Fatalf("migrate: %v", err)
		}
		accountRepo := repositories.NewAccountRepository(pool)
		transactionRepo := repositories.NewTransactionRepository(pool)
		accountHandler := handlers.NewAccountHandler(accountRepo)
		transactionHandler := handlers.NewTransactionHandler(transactionRepo)

		router = newRouter(
			route{http.MethodGet, "/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK); w.Write([]byte("OK")) })},
			route{http.MethodGet, "/accounts", http.HandlerFunc(accountHandler.ListAccounts)},
			route{http.MethodPost, "/accounts", http.HandlerFunc(accountHandler.CreateAccount)},
			route{http.MethodPut, "/accounts/:id", http.HandlerFunc(accountHandler.UpdateAccount)},
			route{http.MethodDelete, "/accounts/:id", http.HandlerFunc(accountHandler.DeleteAccount)},
			route{http.MethodGet, "/accounts/:id/transactions/:txId", http.HandlerFunc(transactionHandler.ListTransactions)},
			route{http.MethodPut, "/accounts/:id/transactions/:txId", http.HandlerFunc(transactionHandler.UpdateTransaction)},
			route{http.MethodDelete, "/accounts/:id/transactions/:txId", http.HandlerFunc(transactionHandler.DeleteTransaction)},
			route{http.MethodGet, "/accounts/:id/transactions", http.HandlerFunc(transactionHandler.ListTransactions)},
			route{http.MethodPost, "/accounts/:id/transactions", http.HandlerFunc(transactionHandler.CreateTransaction)},
		)
	})
	return router
}

// handler is the Netlify Lambda-compatible entrypoint.
// See: https://docs.netlify.com/build/functions/lambda-compatibility/?fn-language=go
func handler(request events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	path := request.Path
	if strings.HasPrefix(path, netlifyFunctionPathPrefix) {
		path = strings.TrimPrefix(path, netlifyFunctionPathPrefix)
		if path == "" {
			path = "/"
		}
	}

	req, err := http.NewRequestWithContext(
		context.Background(),
		request.HTTPMethod,
		path,
		bytes.NewReader([]byte(request.Body)),
	)
	if err != nil {
		return &events.APIGatewayProxyResponse{
			StatusCode: http.StatusBadRequest,
			Body:       `{"error":"invalid request"}`,
			Headers:    map[string]string{"Content-Type": "application/json"},
		}, nil
	}

	// Query string
	q := req.URL.Query()
	for k, v := range request.QueryStringParameters {
		q.Set(k, v)
	}
	if len(request.MultiValueQueryStringParameters) > 0 {
		for k, vals := range request.MultiValueQueryStringParameters {
			for _, v := range vals {
				q.Add(k, v)
			}
		}
	}
	req.URL.RawQuery = q.Encode()

	// Headers
	for k, v := range request.Headers {
		req.Header.Set(k, v)
	}
	req.RequestURI = req.URL.RequestURI()

	rec := httptest.NewRecorder()
	getRouter().ServeHTTP(rec, req)

	// Convert response headers to map[string]string (single value per key)
	resHeaders := make(map[string]string)
	for k, v := range rec.Header() {
		if len(v) > 0 {
			resHeaders[k] = v[0]
		}
	}

	return &events.APIGatewayProxyResponse{
		StatusCode:      rec.Code,
		Headers:         resHeaders,
		Body:            rec.Body.String(),
		IsBase64Encoded: false,
	}, nil
}

func main() {
	// Allow local HTTP server when RUN_HTTP_SERVER=1 (e.g. for netlify dev or local testing)
	if os.Getenv("RUN_HTTP_SERVER") == "1" {
		runHTTPServer()
		return
	}
	lambda.Start(handler)
}

// runHTTPServer starts a local HTTP server for development.
func runHTTPServer() {
	_ = getRouter() // init DB and router
	defer pool.Close()

	addr := ":8080"
	if p := os.Getenv("PORT"); p != "" {
		addr = ":" + p
	}
	log.Printf("listening on %s", addr)
	if err := http.ListenAndServe(addr, getRouter()); err != nil {
		log.Fatal(err)
	}
}
