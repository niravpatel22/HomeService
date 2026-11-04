# PHASE 8 — GITHUB & VERSION CONTROL DOCUMENTATION
## HomeServe Technologies — Home Services Booking SaaS Platform

---

## 1. Repository Overview & Target Remote

- **GitHub Account:** [`https://github.com/niravpatel22`](https://github.com/niravpatel22)
- **Configured Remote (`origin`):** `https://github.com/niravpatel22/HomeServe-Booking-SaaS-Platform.git`
- **Git User Identity:** `niravpatel22 <niravpatel.tops@gmail.com>`
- **Primary Branches:**
  - `main`: Production-ready release branch
  - `develop`: Active integration branch
  - `feature/*`: Modular feature branches (`feature/phase1-architecture`, `feature/phase2-frontend-ui`, `feature/phase3-database-schema`, `feature/phase4-backend-api`, `feature/phase5-integration`, `feature/phase6-qa-testing`, `feature/phase7-security-hardening`)

---

## 2. Clean Repository Directory Structure

```text
Vibe_Coding_Capstone_Home_Services_SaaS/
├── .github/
│   └── workflows/
│       └── ci.yml                       # GitHub Actions CI (Pytest + Vite Build)
├── backend/
│   ├── alembic.ini                      # Alembic migration configuration
│   ├── migrations/                      # Database schema migration scripts
│   ├── app/
│   │   ├── api/v1/endpoints/            # FastAPI REST controllers (40+ endpoints)
│   │   ├── core/                        # Config & JWT/Bcrypt/HMAC security
│   │   ├── db/                          # SQLAlchemy session & canonical seed data
│   │   ├── models/                      # 20 core + 3 support normalized ORM models
│   │   ├── schemas/                     # Pydantic v2 request/response schemas
│   │   ├── services/                    # Transactional business logic & serializers
│   │   └── main.py                      # FastAPI application entrypoint & middleware
│   ├── tests/                           # 24 automated Pytest tests (Phases 3, 4, 6, 7)
│   ├── .env.example                     # Backend environment template
│   ├── pytest.ini                       # Pytest configuration
│   └── requirements.txt                 # Pinned Python dependencies
├── frontend/
│   ├── e2e/                             # Playwright E2E test specifications
│   ├── src/
│   │   ├── components/common/           # Reusable UI components
│   │   ├── constants/                   # Role, status & category constants
│   │   ├── context/                     # PlatformContext (live API + fallback sync)
│   │   ├── layouts/                     # Public & role-specific dashboard layouts
│   │   ├── pages/                       # Landing, Auth, Catalog, Booking & 4 Role Dashboards
│   │   ├── routes/                      # ProtectedRoute & RoleGuard routing
│   │   ├── services/                    # Axios apiClient with JWT interceptors
│   │   ├── styles/                      # Tailwind CSS design system
│   │   └── utils/                       # Currency, date & badge formatters
│   ├── .env.example                     # Frontend environment template
│   ├── index.html                       # Entry HTML
│   ├── package.json                     # Frontend dependencies & scripts
│   ├── playwright.config.js             # Playwright E2E configuration
│   ├── postcss.config.js                # PostCSS configuration
│   ├── tailwind.config.js               # Tailwind theme configuration
│   └── vite.config.js                   # Vite bundler configuration
├── docs/
│   ├── phase1/                          # 6 Architecture, SRS, FRD, RBAC & API planning docs
│   ├── phase3/                          # ER Diagram & MySQL 8.0 DDL SQL script
│   ├── phase6/                          # Postman Collection JSON & QA Test Report
│   ├── phase7/                          # Security Audit & Penetration Test Report
│   └── phase8/                          # Git & Version Control Documentation
├── .env.example                         # Root environment variable reference
├── .gitignore                           # Strict exclusion of secrets, venv, node_modules, DBs
└── README.md                            # Complete setup, architecture & credentials guide
```

---

## 3. `.gitignore` & Secret Hygiene Audit

The root `.gitignore` strictly prevents accidental commits of:
- `.env`, `.env.*`, `frontend/.env`, `backend/.env` (while explicitly keeping `!.env.example`, `!frontend/.env.example`, `!backend/.env.example`)
- `node_modules/`, `frontend/node_modules/`, `frontend/dist/`
- `.venv/`, `venv/`, `__pycache__/`, `.pytest_cache/`
- `*.db`, `*.sqlite3`, `backend/homeserve.db`, `backend/uploads/`

Verification command:
```powershell
git status --ignored
```
Result: Zero `.env` secrets, zero `node_modules`, zero `__pycache__`, and zero `.db` binary files are tracked in Git.

---

## 4. Branching Strategy & Structured Commit History

The repository is organized with clean, phase-aligned commits across `main` and `develop`:

1. `chore(repo): initialize git repository with .gitignore, .env.example and root README`
2. `docs(phase1): add SRS, FRD, NFR, RBAC matrix, architecture diagrams and API roadmap`
3. `feat(phase2-frontend): build React 18 + Tailwind CSS customer portal and 4 role dashboards`
4. `feat(phase3-database): implement 20-table normalized SQLAlchemy schema, MySQL DDL, Alembic migrations and seed data`
5. `feat(phase4-backend): implement FastAPI REST endpoints, JWT RBAC, double-booking lock and Razorpay HMAC verification`
6. `feat(phase5-integration): connect React frontend context and booking checkout to live FastAPI backend`
7. `test(phase6-qa): add Pytest unit/API suite, Postman collection and Playwright E2E specs`
8. `sec(phase7-security): harden IDOR ownership, private KYC endpoint, webhook HMAC verification and penetration tests`
9. `ci(phase8-vcs): add GitHub Actions CI workflow and version control documentation`

---

## 5. Pushing to `https://github.com/niravpatel22`

The local repository has `origin` pre-configured to:
`https://github.com/niravpatel22/HomeServe-Booking-SaaS-Platform.git`

### Option A: Create & Push via GitHub Web UI + Git CLI (2 Commands)
1. Create a new empty repository named **`HomeServe-Booking-SaaS-Platform`** (without initializing README/.gitignore) at:
   👉 [https://github.com/new](https://github.com/new) (under owner **`niravpatel22`**)
2. Run in the project root terminal:
   ```powershell
   git push -u origin main
   git push -u origin develop
   ```

### Option B: Create & Push via GitHub CLI (`gh`)
If GitHub CLI (`gh`) is installed and authenticated (`gh auth login`):
```powershell
gh repo create niravpatel22/HomeServe-Booking-SaaS-Platform --public --source=. --remote=origin --push
git push -u origin develop
```

