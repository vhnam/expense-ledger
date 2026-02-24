# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Cache go mod download
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .

RUN --mount=type=cache,target=/go/pkg/mod \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o server ./netlify/functions/api

# Run stage
FROM alpine:3.20

RUN apk add --no-cache wget \
    && adduser -D -g "" appuser

WORKDIR /app

COPY --from=builder /app/server .

RUN chown appuser:appuser /app/server

USER appuser

# Run Netlify Lambda-compatible function as local HTTP server.
# See: https://docs.netlify.com/build/functions/lambda-compatibility/?fn-language=go
ENV RUN_HTTP_SERVER=1

EXPOSE 8080

CMD ["./server"]
