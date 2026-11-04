# 03 — Non-Functional & Security Requirements Document (NFRD)
## HomeServe Technologies — Home Services Booking SaaS Platform

---

## 1. Security & Privacy Architecture

### 1.1 Authentication & Token Lifecycle
- **Password Cryptography:** All user passwords must be hashed using Argon2id or bcrypt (work factor `>= 12`). Plaintext passwords are never stored, returned in API payloads, or written to logs.
- **JWT Specification:** Short-lived Access Tokens (`30 minutes`, signed with `HS256` using a 256-bit secret) paired with Refresh Tokens (`7 days`) persisted with revocation state in the database so logout and password resets immediately invalidate active sessions.
- **Rate Limiting:** Sensitive endpoints (`/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/forgot-password`, `/api/v1/payments/*`) enforce strict IP/account rate limiting to prevent brute-force and credential-stuffing attacks.

### 1.2 Authorization & Anti-IDOR Controls
- **Dual-Layer Enforcement:** Every protected API endpoint validates:
  1. **Role-Level Permission:** Does `current_user.role` belong to the allowed roles for this route?
  2. **Resource-Level Ownership:** Does the target database entity (`booking`, `address`, `payment`, `invoice`, `complaint`, `job_assignment`) belong to `current_user.id`?
- **Strict Response Filtering:** Pydantic response schemas strip internal fields (`password_hash`, reset tokens, internal admin notes, other users' contact info).

### 1.3 File Upload & Document Privacy
- **Validation:** Enforce strict file extension and magic-byte MIME verification (`.jpg`, `.jpeg`, `.png`, `.webp` for service images; additionally `.pdf` for provider KYC documents). Reject executables, scripts, SVG with embedded scripts, and files exceeding `5 MB`.
- **Safe Naming:** Rename all uploaded files using UUIDv4 identifiers; never use raw user-supplied filenames on disk or cloud storage paths.
- **Private Document Access Control:** Provider identity/verification documents are stored as private resources and can only be viewed/downloaded by the owning Service Provider and Super Admin via authenticated access checks.

### 1.4 Payment & Financial Integrity
- **Zero Client Trust:** The backend never trusts prices, discount amounts, commission percentages, or payment statuses sent from the browser.
- **Cryptographic Verification:** Payment transitions to `Paid` require valid Razorpay HMAC-SHA256 signature verification (`razorpay_order_id + "|" + razorpay_payment_id`) or verified webhook signature.
- **Idempotency:** Duplicate callback/webhook deliveries for the same `razorpay_order_id` or `idempotency_key` return safely without creating duplicate ledger entries or double-crediting provider earnings.

---

## 2. Reliability, Concurrency & Data Integrity

### 2.1 Double-Booking Prevention
- All booking creation, rescheduling, provider acceptance, and technician assignment operations execute inside ACID database transactions.
- Row-level locking (`SELECT ... FOR UPDATE`) and range-overlap checks (`existing.start_time < new.end_time AND existing.end_time > new.start_time`) guarantee that neither a Service Provider nor a Technician can be double-booked.

### 2.2 Monetary Precision
- All monetary columns (`base_price`, `custom_price`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `commission_amount`, `net_earning`) use `DECIMAL(10, 2)` in MySQL and `Decimal` in Python to eliminate floating-point rounding errors.

### 2.3 Referential Integrity
- All 20+ tables enforce explicit `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, and `NOT NULL` constraints. Financial and booking records use soft-deactivation (`is_active`) or restricted deletion (`ON DELETE RESTRICT`) so historical invoices, payments, and audit trails are never orphaned.

---

## 3. Performance, Scalability & UX Standards

1. **Bounded Pagination:** Every list API endpoint enforces `page` (default `1`) and `page_size` (default `10`, max `100`) parameters and returns structured pagination metadata (`items`, `total`, `page`, `page_size`, `total_pages`).
2. **Query Optimization:** Eager loading (`selectinload` / `joinedload`) on relational queries prevents `N+1` query bottlenecks; composite indexes are defined on `(provider_id, scheduled_date, status)`, `(customer_id, created_at)`, and `(category_id, is_active)`.
3. **Comprehensive UX States:** Every React screen implements explicit UI states for Initial Skeleton Loading, Empty Data State, Validation Error, API/Network Error with Retry, Unauthorized Redirect, and Confirmation Modals for destructive actions (no raw browser `alert()`/`confirm()`).
4. **Responsive Multi-Device Support:** Layouts are verified across Mobile (`375px`), Tablet (`768px`), Laptop (`1280px`), and Desktop (`1440px+`) viewports.

