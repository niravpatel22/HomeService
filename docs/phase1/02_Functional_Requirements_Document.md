# 02 — Functional Requirements Document (FRD)
## HomeServe Technologies — Home Services Booking SaaS Platform

---

## Module 1: Authentication & Authorization

| Req ID | Requirement | Description & Validation Rules |
| :--- | :--- | :--- |
| **FR-1.1** | Role-Based Registration | Support self-registration for `customer` and `service_provider` roles. Validate email format (RFC 5322), 10-digit Indian mobile number (`^[6-9]\d{9}$`), and strong password (`>= 8` chars, upper, lower, digit, special char). |
| **FR-1.2** | Secure Password Storage | Hash all passwords using Argon2 or bcrypt (`passlib`/`pwdlib`). Plaintext passwords must never be logged or persisted. |
| **FR-1.3** | JWT Authentication | Issue signed short-lived JWT Access Token (30 min) and Refresh Token (7 days) upon valid credentials. Support secure logout via token revocation. |
| **FR-1.4** | Forgot & Reset Password | Generate time-bound, single-use cryptographic password reset tokens and allow password update after validation. |
| **FR-1.5** | RBAC & Ownership Enforcement | Enforce role guards on every protected endpoint and validate object-level ownership (`customer_id`, `provider_id`, `technician_id`) on every query/mutation. |
| **FR-1.6** | Provider Verification Workflow | Newly registered Service Providers default to `verification_status = 'Pending'`. Only after Super Admin sets `verification_status = 'Approved'` can the provider appear in public search or accept bookings. |

---

## Module 2: Customer Management

| Req ID | Requirement | Description & Validation Rules |
| :--- | :--- | :--- |
| **FR-2.1** | Customer Profile Management | Customers can view and update full name, phone, avatar, and notification preferences. |
| **FR-2.2** | Multiple Addresses CRUD | Customers can create, read, update, delete, and mark default service addresses (`label`, `address_line1`, `address_line2`, `landmark`, `city`, `state`, `postal_code`). |
| **FR-2.3** | Favorite Service Providers | Customers can bookmark/remove approved Service Providers to/from their Favorites list and view them on the Customer Dashboard. |
| **FR-2.4** | Service & Booking History | Customers can filter and paginate through all past and upcoming bookings, viewing full status timelines, assigned technicians, and invoices. |
| **FR-2.5** | Account Status Management | Super Admin can activate or suspend customer accounts (`is_active` toggle) with audit reason. |

---

## Module 3: Service Category & Management

| Req ID | Requirement | Description & Validation Rules |
| :--- | :--- | :--- |
| **FR-3.1** | Category & Subcategory CRUD | Super Admin can create, update, activate/deactivate top-level categories and nested subcategories (`parent_id`) across all 8 core home service domains. |
| **FR-3.2** | Master Service Definitions | Define services with title, category/subcategory, detailed scope description, representative image, base price (`DECIMAL(10,2)`), estimated duration in minutes, and active status. |
| **FR-3.3** | Search, Filter & Pagination | Public and customer views support keyword search, category/subcategory filter, price range filter, minimum rating filter, city/pincode filter, and bounded pagination. |

---

## Module 4: Service Provider Management

| Req ID | Requirement | Description & Validation Rules |
| :--- | :--- | :--- |
| **FR-4.1** | Provider Profile & KYC Upload | Providers manage business name, bio, experience years, subscription plan selection, and upload identity/business verification documents (`.pdf`, `.jpg`, `.png`, max 5 MB). |
| **FR-4.2** | Admin KYC Review | Super Admin inspects uploaded KYC documents via authenticated endpoints and approves or rejects the provider with mandatory rejection remarks if rejected. |
| **FR-4.3** | Provider Service Catalog | Approved providers link master services (`provider_services`) with custom pricing (`DECIMAL(10,2)`) and custom service notes. |
| **FR-4.4** | Service Areas Configuration | Providers define covered cities and postal codes (`service_areas`). |
| **FR-4.5** | Working Hours & Availability Slots | Providers configure recurring daily working windows and specific date availability slots (`availability_slots`). |

---

## Module 5: Booking & Appointment Management

| Req ID | Requirement | Description & Validation Rules |
| :--- | :--- | :--- |
| **FR-5.1** | Booking Creation | Customer selects service, approved provider, available date & time slot, saved address, problem description, optional coupon code, and optional problem reference images (`booking_images`), generating a unique `booking_number` (e.g., `HS-20261104-0001`). |
| **FR-5.2** | Strict Status State Machine | Enforce valid booking status transitions across the 7 required statuses: `Pending`, `Confirmed`, `Provider Assigned`, `In Progress`, `Completed`, `Cancelled`, `Rejected`. |
| **FR-5.3** | Cancellation & Rescheduling | Customers can cancel or reschedule while booking is `Pending`, `Confirmed`, or `Provider Assigned` (up to 2 hours before start time). Providers can accept (`Confirmed`) or reject (`Rejected`) `Pending` bookings. |
| **FR-5.4** | Double-Booking Prevention | Within an atomic SQLAlchemy transaction (`SELECT ... FOR UPDATE`), verify that neither the selected Service Provider nor the assigned Technician has an overlapping booking in `('Confirmed', 'Provider Assigned', 'In Progress')` for `[start_time, end_time)` on `scheduled_date`. Return `409 Conflict` if a slot collision is detected. |

---

## Module 6: Technician Management

| Req ID | Requirement | Description & Validation Rules |
| :--- | :--- | :--- |
| **FR-6.1** | Technician Roster Management | Service Providers (and Super Admin) can add technicians (`users` record with `role='technician'` + `technicians` profile linked to `provider_id`), manage specialization skills, and toggle availability. |
| **FR-6.2** | Booking Assignment | Provider or Admin assigns an available technician to a `Confirmed` booking (`booking_assignments`), transitioning booking status to `Provider Assigned`. |
| **FR-6.3** | Field Execution Workflow | Technician accepts assigned job, marks arrival timestamp (`arrived_at`), transitions status to `In Progress`, uploads before/after/completion images (`booking_images`), adds work completion remarks, and marks job `Completed`. |
| **FR-6.4** | Job History & Performance | Technicians view their assigned and historical jobs; providers view completed job counts and turnaround metrics per technician. |

---

## Module 7: Payment & Invoice Management

| Req ID | Requirement | Description & Validation Rules |
| :--- | :--- | :--- |
| **FR-7.1** | Server-Side Price & Coupon Calculation | Backend computes `subtotal` (from `provider_services.custom_price` or `services.base_price`), validates `coupons` (expiry, min order amount, max discount, usage limit), adds applicable tax, and calculates `total_amount`. Client-submitted amounts are ignored. |
| **FR-7.2** | Advance & Pending Payments | Support 25% advance payment or 100% full payment via **Razorpay Test Mode** (`Pending`, `Paid`, `Failed`, `Refunded`). |
| **FR-7.3** | Signature & Webhook Verification | Verify `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` using HMAC-SHA256 before marking payment `Paid`. Enforce idempotency keys to prevent duplicate processing. |
| **FR-7.4** | Invoices, Receipts & Earnings | Automatically generate structured Invoices (`invoices`) and downloadable Payment Receipts upon payment confirmation. Record `provider_earnings` calculating `gross_amount`, `commission_percentage`, `commission_amount`, and `net_earning`. |
| **FR-7.5** | Refund Management | Process refunds on eligible cancelled/disputed bookings, transitioning payment status to `Refunded` and adjusting provider earnings. |

---

## Module 8: Notification & Communication System

| Req ID | Requirement | Description & Validation Rules |
| :--- | :--- | :--- |
| **FR-8.1** | Automated Event Triggers | Persist in-app notifications (`notifications`) for: Booking Confirmation, Booking Cancellation, Technician Assignment, Appointment Reminders, Service Completion, Payment Confirmation, Review Requests, and Admin Announcements. |
| **FR-8.2** | In-App Notification Center | Users can view chronological notifications, unread badge count, filter unread items, and mark individual or all notifications as read. |

---

## Module 9: Rating, Review & Complaint Management

| Req ID | Requirement | Description & Validation Rules |
| :--- | :--- | :--- |
| **FR-9.1** | Verified Customer Reviews | Customers can submit a 1–5 star rating and text review strictly for their own `Completed` bookings (`1:1` per booking). |
| **FR-9.2** | Provider Rating Aggregation & Replies | Automatically recalculate `service_providers.average_rating` and `total_reviews` on review creation/moderation. Allow providers to post an official reply (`provider_reply`). |
| **FR-9.3** | Complaint & Dispute Lifecycle | Customers can raise complaints linked to a booking (`subject`, `description`). Super Admin reviews complaints, adds resolution notes, and updates status (`Open` -> `In Review` -> `Resolved` / `Closed`). |

---

## Module 10: Analytics & Reporting Dashboard

| Req ID | Requirement | Description & Validation Rules |
| :--- | :--- | :--- |
| **FR-10.1** | Super Admin Analytics | Live database aggregations for total customers, providers, technicians, bookings (total, pending, completed, cancelled), total revenue, platform commission, provider earnings, popular categories chart, monthly booking trends, and customer growth chart. |
| **FR-10.2** | Service Provider Analytics | Live aggregations for total bookings, today's bookings, pending requests, completed services, total net earnings, average customer rating, and monthly revenue chart. |
| **FR-10.3** | Customer Dashboard Metrics | Live summary of upcoming appointments, previous bookings, pending payments, favorite providers/services, and active booking status tracker. |
| **FR-10.4** | CSV Export | Role-scoped server-side CSV export for bookings, payments/revenue, and provider earnings reports. |

