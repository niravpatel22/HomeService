# 01 — Requirement Specification Document (SRS)
## HomeServe Technologies — Home Services Booking SaaS Platform

**Document Version:** 1.0.0  
**Phase:** Phase 1 — Requirement Analysis & Planning  
**Single Source of Truth:** `Vibe_Coding_Capstone_Home_Services_SaaS.docx` & Master Project Prompt

---

## 1. Executive Summary & Business Case

**HomeServe Technologies** is launching a centralized, multi-tenant-ready Home Services Booking SaaS Platform designed to connect residential customers with verified professional service providers and their field technicians across eight core home service verticals.

### 1.1 Business Problems Addressed
1. **Discovery & Trust Deficit:** Customers struggle to locate background-verified, reliable professionals via informal local contacts.
2. **Customer Acquisition Bottleneck:** Skilled service providers lack a digital storefront to showcase services, pricing, service areas, and verified reviews.
3. **Scheduling & Double-Booking Friction:** Manual phone-based appointment coordination is slow, error-prone, and leads to overlapping technician assignments.
4. **Lack of Live Visibility:** Customers have no real-time visibility into booking acceptance, technician assignment, arrival timestamps, or work completion proof.
5. **Financial & Ledger Fragmentation:** Tracking advance/balance payments, discount coupons, platform commissions, invoices, receipts, refunds, and net provider earnings is unmanageable manually.
6. **Central Governance Gap:** Platform operators need unified real-time oversight over KYC verifications, complaints/disputes, subscription plans, and business analytics.

---

## 2. Exact User Roles (4 Roles)

The system implements **strictly four user roles** with backend-enforced Role-Based Access Control (RBAC) and resource-level ownership validation:

| Role ID | Role Name | Primary Scope |
| :--- | :--- | :--- |
| `super_admin` | **Super Admin** | Central governance, KYC verification (approve/reject providers), user & provider lifecycle management, category & service catalog control, global booking & payment oversight, commission & subscription plan configuration, coupon management, complaint/dispute resolution, review moderation, and platform analytics/CSV reporting. |
| `customer` | **Customer** | Self-registration, profile & multi-address management, service discovery & filtering, provider profile/review inspection, real-time slot checking, appointment booking with problem photos, live status tracking, policy-compliant cancellation/rescheduling, Razorpay Test Mode checkout, invoice/receipt download, verified post-service rating/review, complaint submission, and favorite provider management. |
| `service_provider` | **Service Provider** | Registration & KYC document submission, business profile & service area setup, service catalog & custom pricing configuration, working hours & slot availability management, booking request acceptance/rejection, technician roster creation & job assignment, status updates, before/after photo uploads, review replies, and earnings/commission analytics. |
| `technician` | **Technician** | Authenticated access to assigned field jobs, customer & service location details, job acceptance, arrival timestamp marking, in-progress/completion status updates, completion image uploads, completion remarks, and assigned job history. |

---

## 3. Core Service Categories (8 Canonical Domains)

1. **Electrical Services** (Wiring, Switchboard Repair, Fan/Light Installation, MCB/Fuse Troubleshooting)
2. **Plumbing Services** (Leakage Repair, Pipe Fitting, Tap/Mixer Installation, Drainage Unblocking)
3. **AC Repair & Maintenance** (Split/Window AC Servicing, Gas Charging, Installation/Uninstallation, PCB Repair)
4. **Home Cleaning** (Full Home Deep Cleaning, Kitchen Cleaning, Bathroom Sanitization, Sofa/Carpet Cleaning)
5. **Painting Services** (Interior/Exterior Wall Painting, Waterproofing, Wood Polishing, Texture Finishes)
6. **Carpentry Services** (Furniture Repair, Door/Window Lock Fitting, Custom Shelving, Modular Assembly)
7. **Appliance Repair** (Washing Machine, Refrigerator, Microwave, RO Water Purifier, Geyser Repair)
8. **Pest Control** (General Pest Control, Termite Treatment, Cockroach/Ant Control, Bed Bug Eradication)

---

## 4. Ten Mandatory Functional Modules

1. **Module 1: Authentication & Authorization**
2. **Module 2: Customer Management**
3. **Module 3: Service Category & Management**
4. **Module 4: Service Provider Management**
5. **Module 5: Booking & Appointment Management**
6. **Module 6: Technician Management**
7. **Module 7: Payment & Invoice Management**
8. **Module 8: Notification & Communication System**
9. **Module 9: Rating, Review & Complaint Management**
10. **Module 10: Analytics & Reporting Dashboard**

---

## 5. Scope & Assumptions Register

### 5.1 Strictly In-Scope
- All 4 roles, 10 modules, 20 core database tables, and 9 sequential development phases defined in `Vibe_Coding_Capstone_Home_Services_SaaS.docx`.
- Responsive React + Tailwind CSS UI across Desktop, Laptop, Tablet, and Mobile viewports.
- FastAPI + SQLAlchemy 2.0 + MySQL normalized relational backend.
- Razorpay Test Mode integration with server-side order creation, HMAC signature verification, webhook validation, and idempotency.
- Cloudinary file upload support with a seamless, secure local storage provider (`STORAGE_PROVIDER=local`) for deterministic local testing and CI verification.

### 5.2 Strictly Out-of-Scope (No Scope Creep)
- No additional user roles beyond Super Admin, Customer, Service Provider, and Technician.
- No real-time customer-to-provider chat system.
- No loyalty/reward points engine.
- No unrequested AI chatbots or recommendation engines.
- No microservices, Redis, Kafka, or Kubernetes infrastructure.
- No live real-money bank settlement.

---

## 6. Open Questions & Approved Engineering Baseline Register

To ensure complete determinism across Phases 2–9 without inventing silent policies, the following business rules are formally documented as the baseline specification (subject to adjustment if requested by the stakeholder):

| ID | Topic | Business Rule Specification |
| :--- | :--- | :--- |
| **BR-01** | **Cancellation & Rescheduling Policy** | Customers may cancel or reschedule a booking while status is `Pending`, `Confirmed`, or `Provider Assigned` up to **2 hours** prior to the scheduled slot start time. Cancellations of paid bookings automatically transition payment status to `Refunded` and create a refund ledger entry. Bookings in `In Progress` or `Completed` cannot be cancelled or rescheduled. |
| **BR-02** | **Advance vs. Pending Payment Split** | Customers may choose at checkout between **100% Full Payment** or **25% Advance Payment** (with the remaining **75% Pending/Balance Payment** payable upon service completion). All amounts are computed exclusively on the backend. |
| **BR-03** | **Platform Commission & Subscription Plans** | Super Admin manages platform subscription plans (`Standard Plan`: 15% commission, `Pro Plan`: 10% commission, `Enterprise Plan`: 7% commission). Each provider is linked to a plan, and platform commission is calculated dynamically on booking subtotal before discount/tax rules as configured. |
| **BR-04** | **Technician Creation & Assignment** | Service Providers manage their own technician roster and assign technicians to their `Confirmed` bookings. Super Admin also holds administrative override permission to assign or reassign technicians. |
| **BR-05** | **Double-Booking Concurrency Rule** | A provider or technician cannot be booked into overlapping time ranges on the same date where existing booking status is in `('Confirmed', 'Provider Assigned', 'In Progress')`. Enforced via backend transactional row locks (`SELECT ... FOR UPDATE`) and conflict validation (`HTTP 409 Conflict`). |
| **BR-06** | **Review Eligibility Rule** | A customer can submit a rating/review **only** when the booking belongs to that customer, booking status is `Completed`, and no prior review exists for that `booking_id` (`UNIQUE(booking_id)` constraint). |

