# Hisab — Digital Khata Book (Flask + React + MySQL)

A free, full-stack web app for grocery merchants to track customer credit
(udhaar), record payments, and send payment reminder emails. This is the
Flask backend version — the React frontend is unchanged from the Django
version, since both APIs share the exact same URL structure and JSON shape.

Built entirely with free tools and free hosting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + lucide-react icons |
| Backend | Python, Flask, Flask-SQLAlchemy |
| Database | MySQL (via PyMySQL driver) |
| Auth | Custom permanent-token auth (same behavior as DRF's TokenAuthentication) |
| Email | SMTP via Brevo (free transactional email, 300/day) |
| Backend + DB hosting | Railway (free tier) |
| Frontend hosting | Vercel (free tier) |

---

## Project Structure

```
hisab_flask/               Backend
  app.py                     App factory, blueprint registration
  config.py                   Reads all settings from environment variables
  extensions.py                 Shared SQLAlchemy db instance
  models.py                      User, Token, Customer, Transaction
  auth_utils.py                   @token_required decorator
  email_utils.py                   Brevo SMTP sending helper
  routes/
    auth.py                        /api/register/, /api/login/
    customers.py                    Customer CRUD + /send-reminder/
    transactions.py                  Transaction create/delete
  init_db.py                    Run once to create tables
  create_merchant.py             Create a merchant account from the terminal
  requirements.txt
  Procfile                       Tells Railway/Render how to start the app
  .env.example

hisab_frontend_final/     Frontend (React + Vite)
  src/
    App.jsx                 Full app: login/register + dashboard
    App.css                  All styling (friendly-illustrated design system)
    index.css                 Fonts + CSS variables
    main.jsx
  package.json
  .env.example
```

---

## How Authentication Works

Same behavior as the original Django version, reimplemented in Flask:

1. `POST /api/register/` or `/api/login/` returns a permanent random token
   string tied to that user.
2. The frontend stores this token in `localStorage` and sends it on every
   request as `Authorization: Token <token>`.
3. The `@token_required` decorator (in `auth_utils.py`) checks this header
   on every protected route, looks up the matching user, and attaches it to
   `request.current_user` — every view then filters data by that user, so
   merchants can never see each other's customers.

---

## API Reference

All endpoints are prefixed with `/api/`.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/register/` | No | Create account → `{token, username}` |
| POST | `/login/` | No | Log in → `{token, username}` |
| GET | `/customers/` | Yes | List your customers (with nested transactions + live balance) |
| POST | `/customers/` | Yes | Create a customer |
| GET | `/customers/<id>/` | Yes | View one customer |
| PATCH | `/customers/<id>/` | Yes | Edit a customer |
| DELETE | `/customers/<id>/` | Yes | Delete a customer (cascades to their transactions) |
| POST | `/customers/<id>/send-reminder/` | Yes | Email a due-balance reminder |
| POST | `/transactions/` | Yes | Create a transaction (`customer`, `transaction_type`, `amount`, `note`) |
| DELETE | `/transactions/<id>/` | Yes | Delete a transaction |

Validation errors return `400` with a body shaped like
`{"field_name": ["error message"]}`, matching what the frontend already
expects. Auth errors return `401`.

---

## Local Setup

**Prerequisites:** Python 3.10+, Node.js LTS, MySQL Server, Git.

### Backend

```bash
cd hisab_flask
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt

# Copy .env.example to .env and fill in your real MySQL + Brevo credentials
copy .env.example .env        # Windows
cp .env.example .env          # Mac/Linux

# Create the database itself first, in MySQL Workbench or the mysql CLI:
#   CREATE DATABASE hisab_db;

python init_db.py             # creates all tables
python create_merchant.py     # optional: create a merchant account from the terminal
python app.py                 # runs on http://127.0.0.1:8000
```

### Frontend (separate terminal)

```bash
cd hisab_frontend_final
npm install
npm run dev                   # runs on http://localhost:5173
```

The frontend defaults to talking to `http://127.0.0.1:8000` locally — no
configuration needed for local development.

---

## Deployment (Free)

### 1. Database + Backend — Railway

1. Create a Railway project → **New → Database → MySQL**.
2. In the same project, **New → GitHub Repo**, connect your repo, and set
   the **root directory** to `hisab_flask` (since the backend lives in a
   subfolder).
3. In the Flask service's **Variables** tab, add:
   - `SECRET_KEY`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`,
     `DEFAULT_FROM_EMAIL`, `CORS_ORIGINS` (your Vercel URL, once you have it)
   - `DATABASE_URL` = `${{MySQL.MYSQL_URL}}` (reference the MySQL service directly)
4. Once deployed, go to the service's **Settings → Networking → Generate
   Domain** to get a public URL.
5. Run the one-time table creation against the live database:
   ```bash
   railway login
   railway link
   railway run python init_db.py
   railway run python create_merchant.py
   ```

### 2. Frontend — Vercel

1. Import the same GitHub repo into Vercel, setting the **root directory**
   to `hisab_frontend_final`.
2. Add an environment variable: `VITE_API_BASE` = your Railway backend URL
   (e.g. `https://hisab-backend-production.up.railway.app`).
3. Deploy. Vercel auto-detects the Vite build settings.
4. Go back to Railway and update the Flask service's `CORS_ORIGINS`
   variable to your real Vercel URL, so the backend accepts requests from it.

---

## Design Decisions Worth Remembering

- **Transactions are deleted and re-created, never edited** — preserves
  ledger integrity, same as standard accounting practice.
- **Every query is scoped to `request.current_user`** — merchant data
  isolation is enforced at the database level, not just hidden in the UI.
- **`Decimal`, never `float`, for money** — avoids binary floating-point
  rounding errors.
- **Frontend validation is for instant feedback; backend validation is the
  real security boundary** — every rule enforced in React is re-checked in
  Flask.
