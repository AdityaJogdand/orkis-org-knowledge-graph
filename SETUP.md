# Backend Setup Guide

## Prerequisites

- Python 3.11+
- Git
- A [Supabase](https://supabase.com) account (free tier works)

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Fill in:
   - **Name:** `orkis` (or anything you like)
   - **Database Password:** choose a strong password and save it
   - **Region:** pick the closest to you
4. Wait ~2 minutes for the project to be ready

---

## Step 2 — Get Your Database URL

1. In your Supabase project, go to **Settings → Database**
2. Scroll down to **Connection string**
3. Select the **URI** tab
4. Make sure **Session mode** is selected (port **5432**, not 6543)
5. Copy the string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password you set in Step 1

---

## Step 3 — Clone the Repo

```bash
git clone <repo-url>
cd orgnization_knowledge_graph
```

---

## Step 4 — Create Virtual Environment

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Mac / Linux
python -m venv .venv
source .venv/bin/activate
```

---

## Step 5 — Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Step 6 — Configure Environment Variables

```bash
# Windows
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Open `.env` and fill in:

```env
# Paste your Supabase connection string here
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Generate a secret: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET=your-long-random-secret

# Associate Dean login email (used by the seed script)
DEAN_EMAIL=preeti.gupta@nmims.edu.in

# Gmail SMTP (optional — leave blank to print emails to console instead)
SMTP_USER=your.gmail@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM=your.gmail@gmail.com
```

> **SMTP_PASSWORD** is a Gmail App Password, not your Gmail login password.
> Generate one at: Google Account → Security → 2-Step Verification → App Passwords

---

## Step 7 — Run Database Migrations

```bash
alembic upgrade head
```

This creates all tables in your Supabase database.

---

## Step 8 — Seed the Database

```bash
python -m backend.scripts.seed
```

This inserts the 4 roles and the following test accounts:

| Role | Email | Password |
|---|---|---|
| Associate Dean | `preeti.gupta@nmims.edu.in` | `Preeti@Gupta123` |
| Programme Chair | `rahul.sharma@nmims.edu.in` | `Rahul@Sharma123` |
| Faculty | `anjali.mehta@nmims.edu.in` | `Anjali@Mehta123` |
| Faculty | `vikram.kulkarni@nmims.edu.in` | `Vikram@Kulkarni123` |
| Student | `aditya.jogdand@students.nmims.in` | `Aditya@Jogdand123` |
| Student | `priya.nair@students.nmims.in` | `Priya@Nair123` |

The seed script is idempotent — safe to run multiple times.

---

## Step 9 — Start the Server

```bash
uvicorn backend.main:app --reload
```

| Endpoint | URL |
|---|---|
| API | http://127.0.0.1:8000 |
| Interactive docs | http://127.0.0.1:8000/docs |
| Health check | http://127.0.0.1:8000/health |

---

## Deploying to Render

1. Push your code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com) linked to your repo
3. Set these in Render's **Environment** tab (same values as your `.env`):
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `DEAN_EMAIL`
   - `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` (optional)
4. Set **Build Command:**
   ```
   pip install -r requirements.txt && alembic upgrade head && python -m backend.scripts.seed
   ```
5. Set **Start Command:**
   ```
   uvicorn backend.main:app --host 0.0.0.0 --port $PORT
   ```

> Supabase is used for both local dev and production — no Docker required.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `alembic upgrade head` fails | Check `DATABASE_URL` in `.env` is correct and Supabase project is not paused |
| Supabase project paused | Free tier pauses after 1 week of inactivity — go to Supabase dashboard and click **Restore** |
| Port 5432 blocked | Some networks block 5432; try the **Transaction mode** URL (port 6543) as a fallback |
| `ModuleNotFoundError` | Make sure your virtual environment is activated |
