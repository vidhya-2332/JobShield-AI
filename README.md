# JobShield AI — Hybrid Fake Job Detection System

An AI-powered platform that detects fraudulent job postings using a hybrid approach combining rule-based detection, NLP feature extraction, structured metadata analysis, a logistic-regression-style ML scorer, and explainable AI.

**Stack:** React + Vite + TypeScript (frontend) · Django + Django REST Framework + PostgreSQL (backend) · JWT authentication.

The frontend calls the Django REST API for authentication, job analysis, prediction storage, and history/analytics — there is no third-party BaaS involved.

## Project layout

```
job_AI-main/
├── src/              # React frontend
│   ├── lib/api.ts     # Fetch wrapper + JWT token handling
│   ├── lib/auth.tsx   # Auth context (register/login/logout/profile)
│   ├── lib/data.ts    # Calls to /analyze, /predictions, /history, /dashboard
│   └── ml/            # Client-side rule engine + scorer (instant UI feedback)
└── backend/          # Django REST API
    ├── api/           # Models, views, serializers, urls
    ├── ml/            # Server-side rule engine + scorer (authoritative, persisted)
    └── jobshield_backend/settings.py
```

Job analysis runs twice by design: instantly in the browser for responsive UI, and again on the Django server, whose result is authoritative and is what gets saved to PostgreSQL and shown in History/Dashboard/Analytics.

## 1. Backend setup

### Install PostgreSQL and create the database

```bash
psql -U postgres
```
```sql
CREATE DATABASE jobshield;
\q
```

### Set up the Python environment

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
```

### Configure environment variables

```bash
copy .env.example .env       # Windows
cp .env.example .env         # Mac/Linux
```

Edit `.env` and set `DB_PASSWORD` to your local PostgreSQL password (adjust `DB_USER`/`DB_NAME` too if you changed them).

### Run migrations and start the server

```bash
python manage.py migrate
python manage.py runserver
```

Backend is now live at `http://localhost:8000`. Verify:
- `http://localhost:8000/admin/` — should show a login page
- `http://localhost:8000/api/` — should show a 404 listing all valid routes (expected, there's no route at the bare path)

Optional — create a superuser for Django admin access:
```bash
python manage.py createsuperuser
```

## 2. Frontend setup

Open a **new terminal** (keep the backend running):

```bash
cd job_AI-main
copy .env.example .env       # Windows
cp .env.example .env         # Mac/Linux
npm install
npm run dev
```

Frontend is live at `http://localhost:5173`. The default `.env` already points `VITE_API_URL` at `http://localhost:8000/api`, matching the backend above.

## 3. Using the app

1. Go to `http://localhost:5173`, sign up with an email + password (this creates a Django `User` + `Profile` row).
2. Log in, then use **Analyze** to paste/enter a job posting — you'll get an instant risk score, explanation, and rule breakdown.
3. Check **History**, **Dashboard**, and **Analytics** — these read from PostgreSQL via the Django API, so anything you analyze will show up there.
4. **Settings** lets you update your profile and change your password.

## Docker alternative (backend only)

If you have Docker Desktop installed:

```bash
cd backend
cp .env.example .env
docker-compose up --build
```

This starts PostgreSQL and Django together, running migrations automatically.

## Notes

- The frontend also computes a full prediction client-side (`src/ml/`) so the UI feels instant; the backend's response overwrites the displayed scores once it returns, since that's the version actually stored in Postgres.
- Auth uses JWT (`djangorestframework-simplejwt`); tokens are stored in `localStorage` and refreshed automatically on expiry.
- CORS is pre-configured in `backend/.env.example` to allow `localhost:5173`.
