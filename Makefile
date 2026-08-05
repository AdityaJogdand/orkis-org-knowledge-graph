DATABASE_URL ?= postgresql://postgres:postgres@localhost:5433/orkis_db

dev:
	DATABASE_URL=$(DATABASE_URL) .venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload

migrate:
	DATABASE_URL=$(DATABASE_URL) .venv/bin/alembic upgrade head
