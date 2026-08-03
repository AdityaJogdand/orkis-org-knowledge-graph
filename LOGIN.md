# OMG-CLS Auth Backend — Setup & Test Guide

## Prerequisites

- Docker Desktop running
- Python 3.14 with packages installed (see stack below)
- Working directory: repo root

---

## 1. Start the database

```bash
docker compose up -d postgres
```

Postgres starts on **port 5433** (so it doesn't conflict with any existing Postgres on 5432).
Database name: `orkis_db`

---

## 2. Run migrations

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/orkis_db alembic upgrade head
```

Creates the tables: `roles`, `users`, `user_roles`, `refresh_tokens`.

---

## 3. Seed the Associate Dean account

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/orkis_db python -m backend.scripts.seed
```

On first run it prints a one-time password:

```
============================================================
  ASSOCIATE DEAN — FIRST-TIME LOGIN
  email:    preeti.gupta@nmims.edu.in
  password: <generated-password>
  NOTE: shown once. Change it after first login.
============================================================
```

Re-running the seed is safe — if the account already exists it prints a notice and exits.

---

## 4. Start the API server

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/orkis_db uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```

API is now live at `http://localhost:8001`.
Interactive docs: `http://localhost:8001/docs`

---

## 5. Test with Postman

Import a new HTTP request for each endpoint below.

### POST /auth/login

```
POST http://localhost:8001/auth/login
Content-Type: application/json

{
  "email": "preeti.gupta@nmims.edu.in",
  "password": "<password-from-seed-output>"
}
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "...",
  "token_type": "bearer"
}
```

Copy the `access_token` — use it as a Bearer token for protected endpoints.

---

### GET /auth/me

```
GET http://localhost:8001/auth/me
Authorization: Bearer <access_token>
```

---

### POST /auth/refresh

```
POST http://localhost:8001/auth/refresh
Content-Type: application/json

{
  "refresh_token": "<refresh_token>"
}
```

---

### POST /auth/logout

```
POST http://localhost:8001/auth/logout
Content-Type: application/json

{
  "refresh_token": "<refresh_token>"
}
```

---

### POST /auth/change-password

```
POST http://localhost:8001/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "old_password": "<current-password>",
  "new_password": "<new-password>"
}
```

---

### GET /dean/ping  (role-gated test route)

```
GET http://localhost:8001/dean/ping
Authorization: Bearer <access_token>
```

Returns `403` if the token does not carry the `associate_dean` role.

---

## 6. Test with curl

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"preeti.gupta@nmims.edu.in","password":"<PASSWORD>"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Verify token / get current user
curl -s http://localhost:8001/auth/me \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Role-gated route
curl -s http://localhost:8001/dean/ping \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## 7. Environment variables (.env)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5433/orkis_db` | Postgres connection string |
| `JWT_SECRET` | `dev-secret-change-in-production` | JWT signing secret — **change in production** |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `BCRYPT_ROUNDS` | `12` | bcrypt work factor |
| `DEAN_EMAIL` | `preeti.gupta@nmims.edu.in` | Email for the seeded dean account |

Copy `.env.example` to `.env` and update values before running.

---

## 8. File structure

```
backend/
  main.py            # FastAPI app, mounts routers
  config.py          # pydantic-settings (reads .env)
  database.py        # SQLAlchemy engine + session
  models.py          # ORM models: User, Role, UserRole, RefreshToken
  auth/
    router.py        # /auth/* endpoints
    service.py       # password hashing, JWT, token logic
    schemas.py       # Pydantic request/response models
    dependencies.py  # get_current_user, require_role()
  scripts/
    seed.py          # creates roles + dean account
alembic/
  env.py             # reads DATABASE_URL, imports Base.metadata
  versions/
    0001_initial_schema.py
docker-compose.yml   # Postgres on port 5433
.env.example         # template — copy to .env
```
