package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"expense-ledger/handlers"
	"expense-ledger/internal"
	"expense-ledger/repositories"
)

type route struct {
	method  string
	path    string
	handler http.Handler
}

// pathMatches returns true if requestPath matches routePath.
// Route path "/accounts/:id" matches "/accounts/<non-empty segment with no extra slashes>".
// "/accounts/:id/transactions" and "/accounts/:id/transactions/:txId" match nested paths.
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

// newRouter returns an http.Handler that matches method and path (with optional :id segment).
// Responds 405 if path exists but method does not, 404 otherwise.
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

func main() {
	ctx := context.Background()
	pool, err := internal.Connect(ctx)
	if err != nil {
		log.Fatalf("database: %v", err)
	}

	if pool == nil {
		log.Fatal("DATABASE_URL is required")
	}
	defer pool.Close()
	if err := internal.Migrate(ctx, pool); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	accountRepo := repositories.NewAccountRepository(pool)
	transactionRepo := repositories.NewTransactionRepository(pool)
	accountHandler := handlers.NewAccountHandler(accountRepo)
	transactionHandler := handlers.NewTransactionHandler(transactionRepo)

	handler := newRouter(
		route{http.MethodGet, "/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK); w.Write([]byte("OK")) })},
		route{http.MethodGet, "/accounts", http.HandlerFunc(accountHandler.ListAccounts)},
		route{http.MethodPost, "/accounts", http.HandlerFunc(accountHandler.CreateAccount)},
		route{http.MethodPut, "/accounts/:id", http.HandlerFunc(accountHandler.UpdateAccount)},
		route{http.MethodDelete, "/accounts/:id", http.HandlerFunc(accountHandler.DeleteAccount)},
		// Transactions under an account (more specific paths first)
		route{http.MethodGet, "/accounts/:id/transactions/:txId", http.HandlerFunc(transactionHandler.ListTransactions)},
		route{http.MethodPut, "/accounts/:id/transactions/:txId", http.HandlerFunc(transactionHandler.UpdateTransaction)},
		route{http.MethodDelete, "/accounts/:id/transactions/:txId", http.HandlerFunc(transactionHandler.DeleteTransaction)},
		route{http.MethodGet, "/accounts/:id/transactions", http.HandlerFunc(transactionHandler.ListTransactions)},
		route{http.MethodPost, "/accounts/:id/transactions", http.HandlerFunc(transactionHandler.CreateTransaction)},
	)

	addr := ":8080"
	if p := os.Getenv("PORT"); p != "" {
		addr = ":" + p
	}
	server := &http.Server{Addr: addr, Handler: handler}
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("server: %v", err)
		}
	}()

	ch := make(chan os.Signal, 1)
	signal.Notify(ch, syscall.SIGINT, syscall.SIGTERM)
	<-ch
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown: %v", err)
	}
}
