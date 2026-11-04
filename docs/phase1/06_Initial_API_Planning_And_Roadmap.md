# 06 — Initial REST API Planning & 9-Phase Roadmap
## HomeServe Technologies — Home Services Booking SaaS Platform

---

## 1. Initial REST API v1 Endpoint Inventory (`/api/v1`)

All endpoints enforce Pydantic v2 request/response validation, consistent JSON envelopes, bounded pagination (`page`, `page_size`), and strict RBAC + resource ownership checks.

### 1.1 Module 1: Authentication & Authorization (`/api/v1/auth`)
| Method | Endpoint | Allowed Roles | Purpose |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register Customer or Service Provider account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user and issue JWT access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Authenticated | Exchange valid refresh token for new access token |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revoke active refresh token and clear session |
| `GET` | `/api/v1/auth/me` | Authenticated | Return current user profile, role, and verification state |
| `POST` | `/api/v1/auth/forgot-password` | Public | Generate password reset token |
| `POST` | `/api/v1/auth/reset-password` | Public | Reset password using valid token |

### 1.2 Module 2: Customer Management (`/api/v1/customers`)
| Method | Endpoint | Allowed Roles | Purpose |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/customers/me` | Customer | Get customer profile & stats |
| `PUT` | `/api/v1/customers/me` | Customer | Update customer profile |
| `GET` | `/api/v1/customers/me/addresses` | Customer | List saved service addresses |
| `POST` | `/api/v1/customers/me/addresses` | Customer | Add a new service address |
| `PUT` | `/api/v1/customers/me/addresses/{id}` | Customer (Own) | Update saved address / set default |
| `DELETE` | `/api/v1/customers/me/addresses/{id}` | Customer (Own) | Delete saved address |
| `GET` | `/api/v1/customers/me/favorites` | Customer | List favorite service providers |
| `POST` | `/api/v1/customers/me/favorites/{provider_id}` | Customer | Toggle favorite service provider |
| `GET` | `/api/v1/admin/customers` | Super Admin | Paginated list of all customers |
| `PATCH` | `/api/v1/admin/customers/{id}/status` | Super Admin | Activate or suspend customer account |

### 1.3 Module 3: Service Categories & Catalog (`/api/v1/categories`, `/api/v1/services`)
| Method | Endpoint | Allowed Roles | Purpose |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | Public | List active categories & subcategories |
| `POST` | `/api/v1/categories` | Super Admin | Create category or subcategory |
| `PUT` | `/api/v1/categories/{id}` | Super Admin | Update category or status |
| `GET` | `/api/v1/services` | Public | Search, filter & paginate services |
| `GET` | `/api/v1/services/{id}` | Public | Get detailed service info & approved providers offering it |
| `POST` | `/api/v1/services` | Super Admin | Create master service listing |
| `PUT` | `/api/v1/services/{id}` | Super Admin | Update master service listing |

### 1.4 Module 4: Service Provider Management (`/api/v1/providers`)
| Method | Endpoint | Allowed Roles | Purpose |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/providers` | Public | Search & filter approved service providers |
| `GET` | `/api/v1/providers/{id}` | Public | View public provider profile, services, areas & reviews |
| `GET` | `/api/v1/providers/me/profile` | Service Provider | View own provider profile & KYC status |
| `PUT` | `/api/v1/providers/me/profile` | Service Provider | Update provider profile |
| `POST` | `/api/v1/providers/me/documents` | Service Provider | Upload KYC identity/verification documents |
| `PUT` | `/api/v1/providers/me/services` | Service Provider (Approved) | Configure offered services & custom pricing |
| `PUT` | `/api/v1/providers/me/service-areas` | Service Provider (Approved) | Configure covered cities/pincodes |
| `PUT` | `/api/v1/providers/me/availability` | Service Provider (Approved) | Configure working hours & availability slots |
| `GET` | `/api/v1/providers/{id}/available-slots` | Public / Customer | Query available non-conflicting slots for a date |
| `GET` | `/api/v1/admin/providers` | Super Admin | List all providers (filter by KYC status) |
| `PATCH` | `/api/v1/admin/providers/{id}/verify` | Super Admin | Approve or Reject provider KYC registration |
| `GET` | `/api/v1/subscription-plans` | Public / Provider / Admin | List platform subscription plans & commission rates |
| `POST` | `/api/v1/admin/subscription-plans` | Super Admin | Create/update platform subscription plan |

### 1.5 Module 5: Booking & Appointment Management (`/api/v1/bookings`)
| Method | Endpoint | Allowed Roles | Purpose |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/v1/bookings` | Customer | Create booking with double-booking lock & problem images |
| `GET` | `/api/v1/bookings` | All (Role-Scoped) | List bookings scoped strictly to caller's role & ownership |
| `GET` | `/api/v1/bookings/{id}` | All (Owner/Admin) | Get full booking details, status timeline, images & assignment |
| `PATCH` | `/api/v1/bookings/{id}/status` | Provider / Admin | Accept (`Confirmed`) or Reject (`Rejected`) booking |
| `POST` | `/api/v1/bookings/{id}/cancel` | Customer / Provider / Admin | Cancel booking according to cancellation rules |
| `POST` | `/api/v1/bookings/{id}/reschedule` | Customer | Reschedule booking with new slot conflict validation |
| `POST` | `/api/v1/bookings/{id}/images` | Customer / Provider / Tech | Upload problem, before/after, or completion images |

### 1.6 Module 6: Technician Management (`/api/v1/technicians`)
| Method | Endpoint | Allowed Roles | Purpose |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/technicians` | Provider (Own) / Admin | List technicians under provider |
| `POST` | `/api/v1/technicians` | Provider (Approved) / Admin | Create technician account & profile |
| `PUT` | `/api/v1/technicians/{id}` | Provider (Own) / Admin | Update technician skills or active status |
| `POST` | `/api/v1/bookings/{id}/assign-technician` | Provider (Own) / Admin | Assign technician to confirmed booking (with slot check) |
| `GET` | `/api/v1/technicians/me/jobs` | Technician | List assigned jobs for logged-in technician |
| `PATCH` | `/api/v1/technicians/me/jobs/{booking_id}/status` | Technician (Assigned) | Accept job, mark arrival time, start work, or mark completed |

### 1.7 Module 7: Payments, Invoices & Coupons (`/api/v1/payments`, `/api/v1/invoices`, `/api/v1/coupons`)
| Method | Endpoint | Allowed Roles | Purpose |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/v1/coupons/validate` | Customer | Validate coupon code and preview server-side discount |
| `GET` | `/api/v1/admin/coupons` | Super Admin | List all discount coupons |
| `POST` | `/api/v1/admin/coupons` | Super Admin | Create/update discount coupon |
| `POST` | `/api/v1/payments/create-order` | Customer (Owner) | Compute payable amount & create Razorpay Test Order |
| `POST` | `/api/v1/payments/verify` | Customer (Owner) | Verify Razorpay HMAC signature, mark Paid, generate Invoice |
| `POST` | `/api/v1/payments/webhook` | Razorpay Webhook | Idempotent server-to-server webhook verification |
| `POST` | `/api/v1/payments/{id}/refund` | Super Admin | Process refund and update provider earnings |
| `GET` | `/api/v1/invoices/{booking_id}` | Customer / Provider / Admin | View/download structured invoice & payment receipt |
| `GET` | `/api/v1/providers/me/earnings` | Service Provider | View provider earnings & commission ledger |

### 1.8 Module 8: Notifications (`/api/v1/notifications`)
| Method | Endpoint | Allowed Roles | Purpose |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | Authenticated | List user's notifications & unread count |
| `PATCH` | `/api/v1/notifications/{id}/read` | Authenticated (Owner) | Mark single notification as read |
| `PATCH` | `/api/v1/notifications/read-all` | Authenticated | Mark all notifications as read |
| `POST` | `/api/v1/admin/announcements` | Super Admin | Broadcast platform announcement to target roles |

### 1.9 Module 9: Ratings, Reviews & Complaints (`/api/v1/reviews`, `/api/v1/complaints`)
| Method | Endpoint | Allowed Roles | Purpose |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/v1/reviews` | Customer (Owner, Completed) | Submit rating (1–5) & review for completed booking |
| `POST` | `/api/v1/reviews/{id}/reply` | Service Provider (Owner) | Post provider response to customer review |
| `PATCH` | `/api/v1/admin/reviews/{id}/visibility` | Super Admin | Moderate review visibility |
| `POST` | `/api/v1/complaints` | Customer (Owner) | Raise complaint/dispute on a booking |
| `GET` | `/api/v1/complaints` | Customer / Provider / Admin | List complaints scoped to role |
| `PATCH` | `/api/v1/admin/complaints/{id}` | Super Admin | Update complaint resolution status & notes |

### 1.10 Module 10: Analytics & Reporting (`/api/v1/analytics`)
| Method | Endpoint | Allowed Roles | Purpose |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/admin` | Super Admin | Complete platform KPIs, category distribution & monthly charts |
| `GET` | `/api/v1/analytics/provider` | Service Provider | Provider KPIs, earnings, ratings & monthly revenue chart |
| `GET` | `/api/v1/analytics/customer` | Customer | Customer appointment summary & spend metrics |
| `GET` | `/api/v1/analytics/export-csv` | Admin / Provider | Download role-scoped CSV report (bookings, revenue, earnings) |

---

## 2. Phase-Wise Development Roadmap

1. **Phase 1: Requirement Analysis & Planning** *(Completed in `docs/phase1/`)*
2. **Phase 2: UI/UX & Frontend Development** — Design system, reusable components, public landing page, 4 role dashboards, discovery/detail/booking/checkout/tracking/invoice screens, form validation, search/filter/pagination, responsive layouts.
3. **Phase 3: Database Design** — 20 normalized MySQL tables, ER diagram, SQLAlchemy 2.0 models, Alembic migrations, deterministic seed data.
4. **Phase 4: Backend Development** — FastAPI modular monolith, JWT auth, RBAC, all 10 module REST APIs, double-booking concurrency lock, Razorpay Test Mode, Swagger documentation.
5. **Phase 5: Frontend & Backend Integration** — Replace all temporary frontend mock data with live FastAPI + MySQL calls across all 4 roles.
6. **Phase 6: Testing & Quality Assurance** — Pytest unit & API test suites, Postman collection, Playwright E2E multi-role workflow automation.
7. **Phase 7: Security Implementation** — Argon2/bcrypt verification, IDOR/ownership tests, rate limiting, file upload MIME/privacy checks, webhook verification.
8. **Phase 8: GitHub & Version Control** — Clean branch structure (`main`, `develop`, feature branches), commit history, `.gitignore`, `.env.example`, setup guides.
9. **Phase 9: Deployment & Production** — Production builds, Vercel/Netlify + Render + Cloud MySQL deployment, production verification, and final presentation package.

