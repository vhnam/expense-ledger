# Expense Ledger

API and web app for managing accounts and transactions. API is built with Go (Netlify functions); UI lives in `web/`.

## Project structure

```
expense-ledger/
├── api/
│   ├── netlify/functions/api/main.go
│   ├── internal/
│   ├── handlers/
│   ├── repositories/
│   ├── models/
│   ├── utils/
│   └── go.mod
├── web/
│   ├── src/
│   ├── index.html
│   └── package.json
├── .env
├── netlify.toml
├── Dockerfile
├── compose.yml
└── README.md
```

## Run

```bash
docker compose up
```

Server listens on **http://localhost:8080**.

### Database (Neon)

Set `DATABASE_URL` in `.env` to your [Neon](https://neon.tech) (or any Postgres) connection string to persist accounts. Example:

```
DATABASE_URL=postgres://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

If `DATABASE_URL` is unset, accounts are stored in memory (lost on restart).

### Web UI

From the repo root:

```bash
cd web && pnpm install && pnpm dev
```

Then open **http://localhost:5173** (or the port Vite prints).

## APIs

Base URL: `http://localhost:8080`

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/`  | Health check. Returns plain text `OK`. |

**Example**

```bash
curl http://localhost:8080/
```

**Response:** `200 OK` — body: `OK`

---

### Create account

| Method | Path       | Description      |
|--------|------------|------------------|
| `POST` | `/accounts`| Create an account.|

**Request**

- **Content-Type:** `application/json`
- **Body:**

| Field   | Type   | Required | Description   |
|---------|--------|----------|---------------|
| `name`  | string | yes      | Account name. |
| `type`  | string | no       | Account type. |

**Example**

```bash
curl -X POST http://localhost:8080/accounts \
  -H "Content-Type: application/json" \
  -d '{"name":"Checking","type":"bank"}'
```

**Response:** `201 Created` — body: created account (JSON)

```json
{
  "ID": "1",
  "Name": "Checking",
  "Type": "bank"
}
```

**Errors**

- `400 Bad Request` — invalid JSON or missing `name`
- `405 Method Not Allowed` — non-POST method
- `500 Internal Server Error` — create failed

---

### List accounts

| Method | Path       | Description        |
|--------|------------|--------------------|
| `GET`  | `/accounts`| List all accounts. |

**Example**

```bash
curl http://localhost:8080/accounts
```

**Response:** `200 OK` — body: array of accounts (JSON)

```json
[
  {
    "ID": "1",
    "Name": "Checking",
    "Type": "bank"
  },
  {
    "ID": "2",
    "Name": "Savings",
    "Type": "bank"
  }
]
```

**Errors**

- `405 Method Not Allowed` — non-GET method
- `500 Internal Server Error` — list failed
