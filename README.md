# HomeServe Technologies — Home Services Booking SaaS Platform

> **Principal Software Architecture & Engineering Reference Manual**
> Single Source of Truth: `Vibe_Coding_Capstone_Home_Services_SaaS.docx` & Master Engineering Protocol

---

## Table of Contents

1. [Project Overview & Business Case](#1-project-overview--business-case)
2. [Comparative Analysis: Project Brief (.docx) vs. Master Project Prompt](#2-comparative-analysis-project-brief-docx-vs-master-project-prompt)
3. [Fixed Technology Stack](#3-fixed-technology-stack)
4. [The Four User Roles & Permission Model](#4-the-four-user-roles--permission-model)
5. [Complete Breakdown of All 10 Functional Modules](#5-complete-breakdown-of-all-10-functional-modules)
6. [System Architecture & Directory Structure](#6-system-architecture--directory-structure)
7. [Database Architecture (20 Core Normalized Entities)](#7-database-architecture-20-core-normalized-entities)
8. [Critical Business Workflows & State Machines](#8-critical-business-workflows--state-machines)
9. [Security, Privacy & Data Integrity Standards](#9-security-privacy--data-integrity-standards)
10. [Environment Variables & Configuration Reference](#10-environment-variables--configuration-reference)
11. [Default Seed & Test Credentials (All 4 Roles)](#11-default-seed--test-credentials-all-4-roles)
12. [Step-by-Step Setup, Execution & Verification Guide](#12-step-by-step-setup-execution--verification-guide)
13. [9-Phase Development Roadmap & Evaluation Rubric](#13-9-phase-development-roadmap--evaluation-rubric)

---

## 1. Project Overview & Business Case

**Business Name:** HomeServe Technologies  
**Platform Name:** Home Services Booking SaaS Platform  

### Problem Statement
Customers traditionally find electricians, plumbers, cleaners, AC technicians, painters, carpenters, and appliance repair professionals through informal local contacts and phone calls. This creates systemic inefficiencies:
- Customers cannot easily discover or verify trusted service providers.
- Service providers struggle to acquire customers and manage daily schedules and technicians.
- Manual appointment booking is error-prone, lacks real-time status tracking, and risks double-booking.
- Payment records, invoices, commissions, and provider earnings are difficult to reconcile.
- Platform owners lack centralized visibility into bookings, disputes, and revenue analytics.

### Business Objective
Build a centralized, multi-role, production-grade SaaS platform connecting customers with verified home service providers and their field technicians, managed centrally by a Super Admin dashboard.

---

## 2. Comparative Analysis: Project Brief (.docx) vs. Master Project Prompt

A comprehensive architectural audit comparing `Vibe_Coding_Capstone_Home_Services_SaaS.docx` with the Master Project Prompt confirms **100% alignment in business scope, roles, modules, tables, and evaluation criteria**, with the Master Prompt adding strict engineering governance and security guardrails:

| Dimension | `Vibe_Coding_Capstone_Home_Services_SaaS.docx` | Master Project Prompt | Architectural Synthesis |
| :--- | :--- | :--- | :--- |
| **User Roles (4)** | Super Admin, Customer, Service Provider, Technician | Exact same 4 roles; strictly forbids adding roles | Identical. Note: `.docx` Module 2 lists "Manage favorite service providers" & "Multiple addresses" which the Master Prompt explicitly elevates into the Customer role summary. |
| **Functional Modules (10)** | Modules 1 through 10 (Auth, Customer, Category/Service, Provider, Booking, Technician, Payment/Invoice, Notifications, Rating/Review/Complaint, Analytics) | Exact same 10 modules and sub-tasks | 100% parity across all 10 modules. |
| **Service Categories (8)** | Electrical, Plumbing, AC Repair & Maintenance, Home Cleaning, Painting, Carpentry, Appliance Repair, Pest Control | Exact same 8 categories | Seeded as the canonical initial categories with subcategory support. |
| **Database Entities (20)** | Lists 20 minimum suggested tables (`users` through `provider_earnings`) | Preserves all 20 tables; allows technical tables only if required (e.g., token revocation/audit) | All 20 tables preserved with strict 3NF relational integrity, foreign keys, and decimal monetary precision. |
| **Payment Gateway** | Mentions "Razorpay Test Mode or Stripe Test Mode" (Section 4 Module 7) and "Razorpay Test Mode" (Section 5 Tech Stack) | Standardizes strictly on **Razorpay Test Mode** with backend signature & webhook verification | Standardized on **Razorpay Test Mode** with server-side order creation, HMAC SHA256 signature verification, and idempotency. |
| **Architecture & Security** | High-level security checklist in Phase 7 | Enforces modular monolith, repository/service pattern, HttpOnly/JWT strategy, IDOR prevention, concurrency locking for double-booking, and zero fake data | Full production-grade engineering controls applied from Phase 1. |
| **Execution Governance** | 9 SDLC phases & 100-mark rubric | Strict phase-by-phase stop gates requiring `APPROVED — PROCEED TO NEXT PHASE` | Enforced at every phase boundary. |

---

## 3. Fixed Technology Stack

| Layer | Technology | Purpose & Implementation Standard |
| :--- | :--- | :--- |
| **Frontend** | React.js (Vite), Tailwind CSS, React Router v6 | Feature-based modular UI, responsive layouts, centralized Axios API client, role-protected routes |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2 | Modular monolithic REST API (`/api/v1`), strict request/response schema validation, dependency injection |
| **Database & ORM** | MySQL 8.0+, SQLAlchemy 2.0, Alembic | Normalized relational schema (20 core tables), transactional integrity, row-level locking for slot booking |
| **Authentication** | JWT (`PyJWT` / `python-jose`), Argon2 / Bcrypt (`passlib`/`pwdlib`) | Access + Refresh tokens, HttpOnly cookie / Bearer support, token revocation, RBAC + resource ownership checks |
| **Payments** | Razorpay Test Mode | Server-side calculation, Razorpay Order API, cryptographic signature & webhook validation |
| **File Storage** | Cloudinary (with secure local fallback for dev/test) | Validated MIME/size uploads, private authenticated access for identity documents, public/signed URLs for service images |
| **Testing Suite** | Pytest, Postman/Newman, Playwright | Unit tests (pricing, commissions, slots), API integration tests, E2E multi-role workflow automation |
| **Deployment** | Vercel / Netlify (Frontend), Render (Backend), Cloud MySQL | Production environment separation, CORS allowlisting, HTTPS enforcement |

---

## 4. The Four User Roles & Permission Model

1. **SUPER ADMIN (`super_admin`)**
   - Central platform governance, customer & provider lifecycle management, provider KYC verification (approve/reject), category & service catalog oversight, global booking monitoring, commission & subscription plan management, coupon management, complaint/dispute resolution, review moderation, and platform-wide financial/growth analytics with CSV export.
2. **CUSTOMER (`customer`)**
   - Registration/login, profile & multi-address management, service discovery & category filtering, provider profile & review inspection, real-time slot availability check, appointment booking with problem description & reference image uploads, live status tracking, rule-based cancellation/rescheduling, Razorpay checkout (advance/full), invoice & receipt download, post-completion rating/review submission, complaint filing, and favorite provider management.
3. **SERVICE PROVIDER (`service_provider`)**
   - Registration, KYC/identity document upload, business profile & service area configuration, service selection & custom pricing/description setup, working hours & availability slot management, booking request acceptance/rejection, technician roster management & job assignment, service status updates, before/after image uploads, review responses, and earnings/commission analytics.
4. **TECHNICIAN (`technician`)**
   - Secure login, assigned job queue & calendar view, customer booking & service address inspection, job acceptance, real-time field status transitions (mark arrival, start work, complete job), completion image upload, technical completion remarks, and historical job log.

---

## 5. Complete Breakdown of All 10 Functional Modules

### Module 1: Authentication & Authorization
- **Functionality:** Role-based registration (Customer, Service Provider), Technician credential provisioning, email/mobile validation, JWT login/logout, token refresh & revocation, forgot/reset password workflow, and Service Provider KYC verification gate (unverified/rejected providers cannot receive bookings or perform approved provider actions).
- **Security Controls:** Argon2/bcrypt password hashing, login rate limiting, RBAC decorators, and strict resource-level ownership validation (preventing IDOR).

### Module 2: Customer Management
- **Functionality:** Customer profile CRUD, multiple service addresses (`addresses` table with default flag, pin code, city, state, geo/landmark details), favorite providers list, unified booking & service history, and Admin-controlled customer account status (Active/Suspended).

### Module 3: Service Category & Management
- **Functionality:** Hierarchical categories & subcategories covering the 8 core domains (*Electrical, Plumbing, AC Repair & Maintenance, Home Cleaning, Painting, Carpentry, Appliance Repair, Pest Control*), base service definitions, service descriptions, representative images, base pricing, estimated duration (minutes), active/inactive status toggle, and multi-criteria search/filtering.

### Module 4: Service Provider Management
- **Functionality:** Provider onboarding, identity/business verification document upload, Admin verification workflow (`Pending` -> `Approved` / `Rejected` with remarks), custom provider service catalog (`provider_services`), geographic coverage (`service_areas` by city/pincode), working hours & `availability_slots` configuration, and aggregated rating calculation.

### Module 5: Booking & Appointment Management
- **Functionality:** End-to-end appointment scheduling with unique human-readable Booking Reference ID (e.g., `BK-20261104-XXXX`), date/time slot validation, address selection, problem description, reference image uploads (`booking_images`), cancellation & rescheduling rules enforcement, and **Double-Booking Prevention** using database transactions and concurrency locks so no provider or technician can be booked into overlapping incompatible time slots.
- **Valid Booking Statuses:** `Pending` -> `Confirmed` -> `Provider Assigned` -> `In Progress` -> `Completed` (plus terminal states `Cancelled` and `Rejected`).

### Module 6: Technician Management
- **Functionality:** Provider/Admin creation and management of Technicians linked to a Service Provider, assigning technicians to confirmed bookings (`booking_assignments`), technician job acceptance, marking arrival timestamp (`arrived_at`), uploading completion images, recording completion remarks, updating job status to `Completed`, and tracking technician performance metrics.

### Module 7: Payment & Invoice Management
- **Functionality:** Backend-enforced calculation of Service Charge + Taxes - Coupon Discount = Final Payable Amount, plus Platform Commission vs. Net Provider Earnings split. Supports advance and pending/balance payments via **Razorpay Test Mode**, cryptographic signature verification, webhook handling, idempotent transaction processing, automated Invoice (`invoices`) & Receipt generation, refund workflows, and `provider_earnings` ledger tracking.
- **Valid Payment Statuses:** `Pending`, `Paid`, `Failed`, `Refunded`.

### Module 8: Notification & Communication System
- **Functionality:** Real-time/persisted in-app Notification Center (`notifications` table) with unread counters, read/mark-all-read actions, and automated triggers for: Booking Confirmation, Booking Cancellation, Technician Assignment, Appointment Reminders, Service Completion, Payment Confirmation, Review Requests, and Admin Platform Announcements.

### Module 9: Rating, Review & Complaint Management
- **Functionality:** Verified post-completion 1–5 star ratings and text reviews (`reviews`) strictly restricted to completed bookings owned by the customer, automatic recalculation of provider average rating, provider review replies, Admin review moderation, and full lifecycle Complaint & Dispute Management (`complaints` linked to bookings with status transitions: `Open` -> `In Review` -> `Resolved` / `Closed` and resolution notes).

### Module 10: Analytics & Reporting Dashboard
- **Functionality:** Real-time SQL aggregation dashboards tailored per role:
  - **Super Admin:** Total customers, providers, technicians, bookings (total/pending/completed/cancelled), gross revenue, platform commission, net provider earnings, top service categories, monthly booking trends, customer growth charts, and CSV export.
  - **Service Provider:** Total bookings, today's schedule, pending requests, completed jobs, total earnings, average rating, monthly revenue charts, and CSV export.
  - **Customer:** Upcoming appointments, past bookings, pending payments, favorite services/providers, and live booking status cards.

---

## 6. System Architecture & Directory Structure

```text
Vibe_Coding_Capstone_Home_Services_SaaS/
├── README.md
├── docs/                                  # Phase 1–9 Architecture, ER Diagrams, Test & Security Reports
│   └── phase1/                            # Requirement Spec, FRD, NFRD, RBAC Matrix, API Plan, Workflows
├── backend/                               # Python FastAPI Modular Monolith
│   ├── app/
│   │   ├── main.py                        # FastAPI app initialization, middleware, router registration
│   │   ├── core/                          # Settings (config.py), JWT security, RBAC dependencies, exceptions
│   │   ├── db/                            # SQLAlchemy engine, session management, base declarative model, seed.py
│   │   ├── models/                        # All 20+ normalized SQLAlchemy ORM models
│   │   ├── schemas/                       # Pydantic v2 request/response validation schemas
│   │   ├── repositories/                  # Data access layer & transactional queries
│   │   ├── services/                      # Business logic (booking lock, pricing, Razorpay, file upload)
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── api.py                 # V1 API router aggregator
│   │   │       └── endpoints/             # Modular route handlers (auth, users, services, bookings, payments...)
│   │   ├── middleware/                    # Rate limiting, security headers, structured request logging
│   │   └── utils/                         # File validation, PDF/HTML invoice generator, CSV exporter
│   ├── migrations/                        # Alembic database migration scripts
│   ├── tests/                             # Pytest unit & API integration test suites
│   ├── requirements.txt
│   └── .env.example
└── frontend/                              # React.js + Tailwind CSS Application
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   │   ├── common/                    # Buttons, Modals, Badges, DataTables, Pagination, Empty/Error states
    │   │   ├── layout/                    # Navbar, Role Sidebar, NotificationBell, Footer
    │   │   └── forms/                     # Validated Input, Select, FileUploader, DateSlotPicker
    │   ├── features/                      # Domain modules (auth, customers, providers, technicians, bookings, etc.)
    │   ├── layouts/                       # PublicLayout, AdminLayout, CustomerLayout, ProviderLayout, TechLayout
    │   ├── pages/                         # Role-specific pages & public service discovery screens
    │   ├── routes/                        # ProtectedRoute, RoleGuard, AppRoutes
    │   ├── services/                      # Axios instance, interceptors, API service modules
    │   ├── context/                       # AuthContext, NotificationContext, ToastContext
    │   ├── hooks/                         # Custom React hooks
    │   ├── utils/                         # Formatters, validators, constants
    │   ├── App.jsx
    │   └── main.jsx
    ├── e2e/                               # Playwright End-to-End automated test specifications
    ├── package.json
    └── .env.example
```

---

## 7. Database Architecture (20 Core Normalized Entities)

The MySQL schema strictly implements all **20 required tables** from the project specification:

1. `users` — Master authentication & identity table (`id`, `email`, `phone`, `password_hash`, `role`, `is_active`, `is_verified`, timestamps).
2. `customers` — Customer profile attributes linked `1:1` with `users`.
3. `service_providers` — Provider business details, KYC document metadata, verification status (`Pending`, `Approved`, `Rejected`), subscription plan reference, average rating, linked `1:1` with `users`.
4. `technicians` — Technician profile, skills, availability status, linked `1:1` with `users` and `N:1` with `service_providers`.
5. `addresses` — Customer saved service locations (`customer_id`, `label`, `address_line1`, `city`, `state`, `postal_code`, `is_default`).
6. `service_categories` — Top-level and hierarchical subcategories (`id`, `parent_id`, `name`, `slug`, `description`, `icon_url`, `is_active`).
7. `services` — Master catalog services under categories (`category_id`, `name`, `description`, `base_price`, `duration_minutes`, `image_url`, `is_active`).
8. `provider_services` — Services offered by specific providers with custom pricing/descriptions (`provider_id`, `service_id`, `custom_price`, `is_active`).
9. `service_areas` — Geographic zones/pincodes served by each provider (`provider_id`, `city`, `postal_code`, `radius_km`).
10. `availability_slots` — Provider working hours and bookable time slots (`provider_id`, `day_of_week` / `specific_date`, `start_time`, `end_time`, `is_available`).
11. `bookings` — Core appointment record (`booking_number`, `customer_id`, `provider_id`, `service_id`, `address_id`, `scheduled_date`, `start_time`, `end_time`, `status`, `problem_description`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `cancellation_reason`).
12. `booking_assignments` — Technician allocation & field execution tracking (`booking_id`, `technician_id`, `assigned_by`, `status`, `arrived_at`, `completed_at`, `completion_remarks`).
13. `booking_images` — Categorized media attachments (`booking_id`, `uploaded_by`, `image_type` [`PROBLEM`, `BEFORE`, `AFTER`, `COMPLETION`], `file_url`).
14. `payments` — Financial transactions (`booking_id`, `customer_id`, `payment_type` [`ADVANCE`, `FULL`, `BALANCE`], `amount`, `status` [`Pending`, `Paid`, `Failed`, `Refunded`], `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `idempotency_key`).
15. `invoices` — Immutable billing & tax documents (`invoice_number`, `booking_id`, `customer_id`, `provider_id`, `subtotal`, `discount`, `tax`, `total_amount`, `issued_at`, `pdf_url`).
16. `coupons` — Promotional discount rules (`code`, `discount_type` [`PERCENTAGE`, `FLAT`], `discount_value`, `min_order_amount`, `max_discount`, `valid_from`, `valid_until`, `usage_limit`, `used_count`, `is_active`).
17. `reviews` — Verified customer ratings & provider replies (`booking_id` [UNIQUE], `customer_id`, `provider_id`, `rating` [1–5], `comment`, `provider_reply`, `is_visible`).
18. `complaints` — Customer support & dispute tickets (`complaint_number`, `booking_id`, `customer_id`, `provider_id`, `subject`, `description`, `status`, `admin_resolution_notes`, `resolved_by`).
19. `notifications` — In-app notification inbox (`user_id`, `title`, `message`, `notification_type`, `reference_id`, `is_read`, `created_at`).
20. `provider_earnings` — Financial settlement ledger (`provider_id`, `booking_id`, `payment_id`, `gross_amount`, `commission_percentage`, `commission_amount`, `net_earning`, `settlement_status`).

*(Supporting technical tables such as `subscription_plans`, `customer_favorites`, and `refresh_tokens` are documented in the Phase 3 Schema Specification to support the explicitly mandated Admin subscription plan management, Customer favorite providers, and JWT revocation requirements without scope creep.)*

---

## 8. Critical Business Workflows & State Machines

### 8.1 Provider Verification Workflow
```mermaid
stateDiagram-v2
    [*] --> Registered: Provider Signs Up
    Registered --> PendingVerification: Uploads KYC & Identity Docs
    PendingVerification --> Approved: Super Admin Approves
    PendingVerification --> Rejected: Super Admin Rejects (with reason)
    Rejected --> PendingVerification: Re-uploads Corrected Docs
    Approved --> [*]: Eligible for Public Listing & Bookings
```

### 8.2 End-to-End Booking & Field Execution State Machine
```mermaid
stateDiagram-v2
    [*] --> Pending: Customer Submits Booking
    Pending --> Confirmed: Provider Accepts Request
    Pending --> Rejected: Provider Rejects Request
    Pending --> Cancelled: Customer Cancels (within rules)
    Confirmed --> ProviderAssigned: Provider/Admin Assigns Technician
    Confirmed --> Cancelled: Customer/Provider Cancels (per policy)
    ProviderAssigned --> InProgress: Technician Accepts, Marks Arrival & Starts Job
    InProgress --> Completed: Technician Uploads Completion Images & Remarks
    Completed --> [*]: Payment Settled -> Invoice Generated -> Customer Reviews
```

---

## 9. Security, Privacy & Data Integrity Standards

1. **Zero Client Trust:** Prices, discounts, commissions, taxes, and slot availability are strictly calculated and verified on the backend.
2. **Concurrency & Double-Booking Prevention:** Booking creation and rescheduling acquire transactional locks (`SELECT ... FOR UPDATE`) and verify zero overlapping active appointments (`Confirmed`, `Provider Assigned`, `In Progress`) for both the `provider_id` and assigned `technician_id`.
3. **Authentication & RBAC:** Argon2/bcrypt password hashing, short-lived JWT access tokens + revocable refresh tokens, route-level role guards, and strict object-level ownership checks (`customer_id == current_user.id`, etc.).
4. **Payment Integrity:** Razorpay orders are generated server-side; payment status transitions to `Paid` only after cryptographic verification of `razorpay_signature` (`HMAC-SHA256(order_id + "|" + payment_id, secret)`).
5. **File Security:** Strict allowlist of extensions/MIME types (`.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`), maximum file size limits (5 MB), randomized UUID storage keys, and authenticated streaming/signed URLs for private KYC documents.

---

## 10. Environment Variables & Configuration Reference

### Backend (`backend/.env.example`)
```env
# Application Settings
APP_NAME="HomeServe Technologies SaaS API"
ENVIRONMENT="development"
DEBUG=False
API_V1_PREFIX="/api/v1"

# Server & CORS
BACKEND_HOST="0.0.0.0"
BACKEND_PORT=8000
ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"

# MySQL Database Connection
DATABASE_URL="mysql+pymysql://homeserve_user:homeserve_pass@localhost:3306/homeserve_db"

# JWT & Security
JWT_SECRET_KEY="CHANGE_THIS_TO_A_64_CHAR_CRYPTOGRAPHIC_RANDOM_SECRET"
JWT_REFRESH_SECRET_KEY="CHANGE_THIS_TO_ANOTHER_64_CHAR_RANDOM_SECRET"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Platform Business Configuration
DEFAULT_PLATFORM_COMMISSION_PERCENT=15.0
DEFAULT_TAX_PERCENT=18.0

# Razorpay Test Mode Credentials
RAZORPAY_KEY_ID="rzp_test_your_key_id_here"
RAZORPAY_KEY_SECRET="your_razorpay_test_secret_here"
RAZORPAY_WEBHOOK_SECRET="your_razorpay_webhook_secret_here"

# Cloudinary / File Storage Configuration
STORAGE_PROVIDER="local" # Set to "cloudinary" in production
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
MAX_UPLOAD_SIZE_MB=5
```

### Frontend (`frontend/.env.example`)
```env
VITE_API_BASE_URL="http://localhost:8000/api/v1"
VITE_RAZORPAY_KEY_ID="rzp_test_your_key_id_here"
VITE_APP_NAME="HomeServe Technologies"
```

---

## 11. Default Seed & Test Credentials (All 4 Roles)

When the database seed script (`python -m app.db.seed`) is executed in Phase 3/4, the following deterministic accounts are provisioned for immediate testing across all four roles:

| Role | Email Address | Password | Account State & Pre-loaded Context |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@homeserve.com` | `Admin@12345` | Active Super Admin with full platform governance permissions |
| **Customer 1** | `customer@homeserve.com` | `Customer@123` | Verified Customer with 2 saved addresses & sample bookings |
| **Customer 2** | `priya.sharma@example.com` | `Customer@123` | Verified Customer for concurrent booking & review testing |
| **Service Provider (Approved)** | `provider@homeserve.com` | `Provider@123` | KYC-Approved Provider (*Apex Electrical & AC Solutions*) with active slots & services |
| **Service Provider (Pending KYC)** | `pending.provider@homeserve.com` | `Provider@123` | Unverified Provider awaiting Super Admin document approval |
| **Technician 1** | `tech@homeserve.com` | `Tech@12345` | Active Field Technician assigned to *Apex Electrical & AC Solutions* |
| **Technician 2** | `ravi.tech@homeserve.com` | `Tech@12345` | Secondary Field Technician for multi-assignment & slot conflict testing |

### Pre-Seeded Test Coupons
- `WELCOME20` — 20% discount (up to ₹500) on minimum booking value of ₹499.
- `FLAT150` — Flat ₹150 discount on minimum booking value of ₹999.

---

## 12. Step-by-Step Setup, Execution & Verification Guide

### Prerequisites
- **Node.js** `>= 18.x` and **npm** `>= 9.x`
- **Python** `>= 3.11`
- **MySQL Server** `>= 8.0`
- **Git**

### Step 1: Database Provisioning (MySQL)
```sql
CREATE DATABASE homeserve_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'homeserve_user'@'localhost' IDENTIFIED BY 'homeserve_pass';
GRANT ALL PRIVILEGES ON homeserve_db.* TO 'homeserve_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 2: Backend Setup & Execution (Phase 3 & 4+)
```bash
cd backend

# 1. Create and activate virtual environment
python -m venv venv
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
# source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables
cp .env.example .env

# 4. Run Alembic database migrations
alembic upgrade head

# 5. Seed initial categories, services, coupons, and the 4 role accounts
python -m app.db.seed

# 6. Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **API Base URL:** `http://localhost:8000/api/v1`
- **Interactive Swagger UI:** `http://localhost:8000/docs`
- **ReDoc Specification:** `http://localhost:8000/redoc`

### Step 3: Frontend Setup & Execution (Phase 2 & 5+)
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Start Vite development server
npm run dev
```
- **Frontend Application URL:** `http://localhost:5173`

### Step 4: Automated Testing Commands (Phase 6+)
```bash
# Run Backend Unit & API Integration Tests (Pytest)
cd backend
pytest -v --tb=short

# Run End-to-End Browser Automation Suite (Playwright)
cd frontend
npx playwright test
```

---

## 13. 9-Phase Development Roadmap & Evaluation Rubric

Development strictly follows the **9 sequential phases** with mandatory user validation gates (`APPROVED — PROCEED TO NEXT PHASE`) between every phase:

| Phase | Phase Name | Key Deliverables | Evaluation Weight |
| :---: | :--- | :--- | :---: |
| **Phase 1** | **Requirement Analysis & Planning** | SRS, FRD, NFRD, User Stories, RBAC Matrix, Workflow & Architecture Diagrams, API Plan, Open Questions Register | **5 Marks** |
| **Phase 2** | **UI/UX & Frontend Development** | Design System, Landing Page, 4 Role Dashboards, Service Discovery, Booking/Checkout UI, Responsive Layouts | **15 Marks** |
| **Phase 3** | **Database Design** | ER Diagram, 20+ Normalized Tables, SQLAlchemy Models, Alembic Migrations, Seed Data, Constraint Docs | **10 Marks** |
| **Phase 4** | **Backend Development** | FastAPI Modular Monolith, JWT Auth, RBAC, All 10 Module REST APIs, Double-Booking Lock, Razorpay, Swagger | **15 Marks** |
| **Phase 5** | **Frontend & Backend Integration** | End-to-End API Integration, Live Auth Sessions, Real DB Data Across All 4 Dashboards, File Uploads, CSV Export | **10 Marks** |
| **Phase 6** | **Testing & Quality Assurance** | Pytest Unit & API Tests, Postman Collection, Playwright E2E Multi-Role Workflow Suite, Test Execution Report | **10 Marks** |
| **Phase 7** | **Security Implementation** | Argon2/Bcrypt Audit, IDOR/Ownership Verification, Rate Limiting, File MIME/Access Security, Webhook Validation | **10 Marks** |
| **Phase 8** | **GitHub & Version Control** | Clean Repository Structure, `main`/`develop`/feature Branches, Commit History, `.gitignore`, Documentation | **5 Marks** |
| **Phase 9** | **Deployment & Production** | Live Vercel/Netlify Frontend, Render FastAPI Backend, Cloud MySQL, Production Verification & Final Presentation | **10 Marks** |
| *Docs* | **Documentation & Presentation** | Comprehensive Technical Docs, AI Prompts & Development Log, Final Presentation | **10 Marks** |
| **TOTAL** | | | **100 Marks** |

