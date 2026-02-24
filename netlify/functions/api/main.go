package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"expense-ledger/handlers"
	"expense-ledger/internal"
	"expense-ledger/repositories"
)

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

	accountHandler := handlers.NewAccountHandler(accountRepo)

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/accounts":
			switch r.Method {
			case http.MethodPost:
				accountHandler.CreateAccount(w, r)
			case http.MethodGet:
				accountHandler.ListAccounts(w, r)
			default:
				http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			}
		case "/":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("OK"))
		default:
			http.NotFound(w, r)
		}
	})

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
