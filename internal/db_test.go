package internal

import (
	"context"
	"os"
	"testing"
)

func TestConnect_emptyURL(t *testing.T) {
	ctx := context.Background()
	orig := os.Getenv("DATABASE_URL")
	defer func() { _ = os.Setenv("DATABASE_URL", orig) }()

	_ = os.Unsetenv("DATABASE_URL")

	pool, err := Connect(ctx)
	if err != nil {
		t.Errorf("Connect() err = %v; want nil", err)
	}
	if pool != nil {
		t.Error("Connect() with empty DATABASE_URL should return nil pool")
	}
}

func TestConnect_invalidURL(t *testing.T) {
	ctx := context.Background()
	orig := os.Getenv("DATABASE_URL")
	defer func() { _ = os.Setenv("DATABASE_URL", orig) }()

	_ = os.Setenv("DATABASE_URL", "postgres://invalid-host:99999/bad")

	pool, err := Connect(ctx)
	if err == nil {
		t.Error("Connect() with invalid URL should return error")
	}
	if pool != nil {
		t.Error("Connect() on error should return nil pool")
	}
}
