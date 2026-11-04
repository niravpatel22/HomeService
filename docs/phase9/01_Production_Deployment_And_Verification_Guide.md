# PHASE 9 — PRODUCTION DEPLOYMENT & VERIFICATION GUIDE
## HomeServe Technologies — Home Services Booking SaaS Platform

---

## 1. Deployment Architecture Overview

The **HomeServe Technologies — Home Services Booking SaaS Platform** is prepared for production cloud deployment across three tiers:

| Tier | Technology | Supported Cloud Targets | Configuration Files |
|---|---|---|---|
| **Frontend SPA** | React 18 + Vite + Tailwind CSS | **Netlify** (Token/CLI or Git) / **Vercel** | [`netlify.toml`](file:///c:/Users/Administrator/Pictures/Vibe_Coding_Capstone_Home_Services_SaaS/netlify.toml), [`frontend/netlify.toml`](file:///c:/Users/Administrator/Pictures/Vibe_Coding_Capstone_Home_Services_SaaS/frontend/netlify.toml), [`frontend/public/_redirects`](file:///c:/Users/Administrator/Pictures/Vibe_Coding_Capstone_Home_Services_SaaS/frontend/public/_redirects), [`frontend/vercel.json`](file:///c:/Users/Administrator/Pictures/Vibe_Coding_Capstone_Home_Services_SaaS/frontend/vercel.json) |
| **Backend REST API** | FastAPI + Uvicorn + SQLAlchemy 2.0 | **Render** / **Railway** / **Docker** | [`backend/Dockerfile`](file:///c:/Users/Administrator/Pictures/Vibe_Coding_Capstone_Home_Services_SaaS/backend/Dockerfile), [`backend/render.yaml`](file:///c:/Users/Administrator/Pictures/Vibe_Coding_Capstone_Home_Services_SaaS/backend/render.yaml), [`backend/Procfile`](file:///c:/Users/Administrator/Pictures/Vibe_Coding_Capstone_Home_Services_SaaS/backend/Procfile) |
| **Relational Database** | MySQL 8.0 (`InnoDB`) | **Railway MySQL** / **Aiven** / **PlanetScale** / **AWS RDS** | [`docs/phase3/02_MySQL_Schema_DDL.sql`](file:///c:/Users/Administrator/Pictures/Vibe_Coding_Capstone_Home_Services_SaaS/docs/phase3/02_MySQL_Schema_DDL.sql), [`backend/alembic.ini`](file:///c:/Users/Administrator/Pictures/Vibe_Coding_Capstone_Home_Services_SaaS/backend/alembic.ini), [`docker-compose.yml`](file:///c:/Users/Administrator/Pictures/Vibe_Coding_Capstone_Home_Services_SaaS/docker-compose.yml) |

---

## 2. Frontend Deployment on Netlify (Using `NETLIFY_AUTH_TOKEN` or Netlify Plugin)

The frontend production bundle (`frontend/dist`) is pre-built and configured with SPA fallback routing (`/* /index.html 200`) and security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`).

### Step-by-Step Netlify Token Deployment via CLI
1. Generate a Personal Access Token in Netlify:
   - Go to **Netlify Dashboard → User Settings → Applications → Personal access tokens → New access token**.
2. Build the production bundle and deploy using your token:
   ```powershell
   cd frontend
   npm run build
   npx netlify-cli deploy --prod --dir=dist --auth="<YOUR_NETLIFY_AUTH_TOKEN>" --site="<YOUR_SITE_ID_OR_NAME>"
   ```
   *(Or to create a brand-new Netlify site and deploy in one command with your token)*:
   ```powershell
   $env:NETLIFY_AUTH_TOKEN="<YOUR_NETLIFY_AUTH_TOKEN>"
   npx netlify-cli sites:create --name homeserve-saas-platform
   npx netlify-cli deploy --prod --dir=frontend/dist
   ```

### Configure Frontend Production Environment Variables (Netlify / Vercel)
Set the following environment variables in **Netlify Site Configuration → Environment variables**:
```ini
VITE_API_BASE_URL=https://homeserve-saas-api.onrender.com/api/v1
VITE_APP_NAME=HomeServe Technologies
VITE_RAZORPAY_KEY_ID=rzp_test_homeserve_key_id
```

---

## 3. Database Deployment (Cloud MySQL 8.0)

1. Provision a MySQL 8.0 instance on **Railway**, **Aiven**, or **AWS RDS**.
2. Copy the connection URI (`mysql+pymysql://<user>:<password>@<host>:<port>/homeserve_saas`).
3. Apply the schema migrations and initial seed data:
   ```powershell
   cd backend
   $env:DATABASE_URL="mysql+pymysql://<user>:<password>@<host>:<port>/homeserve_saas"
   alembic upgrade head
   python -c "from app.db.seed import seed_database; seed_database()"
   ```
   *(Note: FastAPI's `lifespan` hook in `backend/app/main.py` also automatically creates tables and seeds initial roles/catalog on first startup if the database is empty.)*

---

## 4. Backend API Deployment (Render / Railway / Docker)

### Option A: Render (`backend/render.yaml`)
1. Connect the GitHub repository (`https://github.com/niravpatel22/HomeServe-Booking-SaaS-Platform`) to **Render**.
2. Select **Blueprint Deployment** (`backend/render.yaml`) or create a **Web Service** with:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
3. Configure Backend Environment Variables:
   ```ini
   ENVIRONMENT=production
   DEBUG=False
   DATABASE_URL=mysql+pymysql://<user>:<password>@<host>:<port>/homeserve_saas
   JWT_SECRET_KEY=<strong-64-char-secret>
   JWT_REFRESH_SECRET_KEY=<strong-64-char-refresh-secret>
   ALLOWED_ORIGINS=https://homeserve-saas-platform.netlify.app
   RAZORPAY_KEY_ID=rzp_test_homeserve_key_id
   RAZORPAY_KEY_SECRET=rzp_test_homeserve_secret
   RAZORPAY_WEBHOOK_SECRET=rzp_test_homeserve_webhook_secret
   ```

### Option B: Docker & Docker Compose (`docker-compose.yml`)
Run the entire stack (MySQL 8.0 + FastAPI Backend) via Docker Compose:
```powershell
docker compose up --build -d
```

---

## 5. Post-Deployment Production Verification Checklist

- [x] **Frontend Build Verification:** `cd frontend && npm run build` succeeds with `0 errors` (`dist/index.html` + hashed CSS/JS assets generated, `dist/_redirects` included).
- [x] **Health Check Endpoint:** `GET /health` returns `200 OK` (`{"status": "healthy", "service": "HomeServe Technologies SaaS API", "version": "1.0.0"}`).
- [x] **Swagger / OpenAPI Docs:** `GET /docs` and `GET /openapi.json` render all 40+ documented REST endpoints.
- [x] **Authentication & Role Dashboards:** All 4 roles (`super_admin`, `customer`, `service_provider`, `technician`) authenticate and route to their respective dashboards.
- [x] **Booking, Technician Assignment & Razorpay Checkout:** End-to-end booking creation, double-booking prevention (`HTTP 409`), technician assignment, job completion, commission calculation, and invoice generation operate against live persistence.

