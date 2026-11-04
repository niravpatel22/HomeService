# 04 — Role & Permission Matrix and User Stories
## HomeServe Technologies — Home Services Booking SaaS Platform

---

## 1. Comprehensive Role & Permission Matrix (RBAC + Ownership)

**Legend:**
- `ALLOW (ALL)` — Unrestricted platform-wide access (Super Admin)
- `ALLOW (OWN)` — Strictly restricted to records owned by or assigned to the authenticated user
- `ALLOW (PUBLIC)` — Accessible for active/approved records
- `DENY` — Strictly forbidden (`HTTP 403 Forbidden`)

| Module / Capability | Super Admin | Customer | Service Provider | Technician |
| :--- | :---: | :---: | :---: | :---: |
| **1. Auth & Identity** | | | | |
| Self-Registration | DENY (Seeded) | ALLOW | ALLOW | DENY (Created by Provider/Admin) |
| Login / Logout / Refresh / Password Reset | ALLOW (OWN) | ALLOW (OWN) | ALLOW (OWN) | ALLOW (OWN) |
| **2. Customer Management** | | | | |
| View / Edit Customer Profile | ALLOW (ALL) | ALLOW (OWN) | View Booking Customer Info Only | View Job Customer Info Only |
| Manage Customer Addresses | ALLOW (ALL) | ALLOW (OWN) | Read Booking Address Only | Read Job Address Only |
| Manage Favorite Providers | DENY | ALLOW (OWN) | DENY | DENY |
| Suspend / Activate Customer Account | ALLOW (ALL) | DENY | DENY | DENY |
| **3. Service Categories & Catalog** | | | | |
| Create / Update / Toggle Categories & Services | ALLOW (ALL) | DENY | DENY | DENY |
| Browse & Filter Categories / Services | ALLOW (ALL) | ALLOW (PUBLIC) | ALLOW (PUBLIC) | ALLOW (PUBLIC) |
| **4. Service Provider Management** | | | | |
| Upload KYC / Verification Documents | ALLOW (ALL) | DENY | ALLOW (OWN) | DENY |
| Verify / Approve / Reject Provider KYC | ALLOW (ALL) | DENY | DENY | DENY |
| Configure Custom Service Pricing & Areas | ALLOW (ALL) | DENY | ALLOW (OWN - Approved) | DENY |
| Manage Working Hours & Availability Slots | ALLOW (ALL) | Read Slots | ALLOW (OWN - Approved) | DENY |
| Manage Platform Subscription Plans | ALLOW (ALL) | DENY | View & Subscribe (OWN) | DENY |
| **5. Booking & Appointment Management** | | | | |
| Create Booking & Upload Problem Images | DENY | ALLOW (OWN) | DENY | DENY |
| View Bookings | ALLOW (ALL) | ALLOW (OWN) | ALLOW (OWN Assigned) | ALLOW (OWN Assigned) |
| Accept (`Confirmed`) / Reject (`Rejected`) Booking | ALLOW (ALL) | DENY | ALLOW (OWN Assigned) | DENY |
| Cancel / Reschedule Booking (per rules) | ALLOW (ALL) | ALLOW (OWN) | Cancel if Emergency (OWN) | DENY |
| **6. Technician Management** | | | | |
| Add / Manage Technicians | ALLOW (ALL) | DENY | ALLOW (OWN Roster) | DENY |
| Assign Technician to Booking | ALLOW (ALL) | DENY | ALLOW (OWN Bookings) | DENY |
| Accept Job, Mark Arrival, Update Job Status | ALLOW (ALL) | DENY | ALLOW (OWN Bookings) | ALLOW (OWN Assigned Job) |
| Upload Before/After/Completion Images & Remarks | ALLOW (ALL) | Read Only (OWN) | ALLOW (OWN Bookings) | ALLOW (OWN Assigned Job) |
| **7. Payments, Invoices & Coupons** | | | | |
| Create / Manage Discount Coupons | ALLOW (ALL) | Read/Apply Valid Code | DENY | DENY |
| Initiate & Complete Razorpay Payment | DENY | ALLOW (OWN Booking) | DENY | DENY |
| View Invoices & Download Receipts | ALLOW (ALL) | ALLOW (OWN) | ALLOW (OWN Bookings) | DENY |
| Process Refunds & Manage Commissions | ALLOW (ALL) | Request via Cancel/Dispute | View Earnings Ledger (OWN) | DENY |
| **8. Notifications** | | | | |
| Broadcast Platform Announcements | ALLOW (ALL) | DENY | DENY | DENY |
| View & Mark Notifications Read | ALLOW (OWN) | ALLOW (OWN) | ALLOW (OWN) | ALLOW (OWN) |
| **9. Ratings, Reviews & Complaints** | | | | |
| Submit Rating & Review (Completed Booking) | DENY | ALLOW (OWN Completed) | DENY | DENY |
| Reply to Customer Review | ALLOW (ALL) | DENY | ALLOW (OWN Reviews) | DENY |
| Moderate / Hide Abusive Reviews | ALLOW (ALL) | DENY | DENY | DENY |
| Raise Complaint / Support Dispute | DENY | ALLOW (OWN Booking) | DENY | DENY |
| Review & Resolve Complaints | ALLOW (ALL) | View Status (OWN) | View Related Dispute (OWN) | DENY |
| **10. Analytics & CSV Export** | | | | |
| Platform Revenue, Commission & Growth Analytics | ALLOW (ALL) | DENY | DENY | DENY |
| Provider Earnings, Bookings & Rating Analytics | ALLOW (ALL) | DENY | ALLOW (OWN Scope) | DENY |
| Customer Appointment & Spend Summary | ALLOW (ALL) | ALLOW (OWN Scope) | DENY | DENY |

---

## 2. Core User Stories & Acceptance Criteria

### 2.1 Super Admin User Stories
- **US-ADMIN-01 (Provider KYC Verification):** As a Super Admin, I want to inspect a registered Service Provider's identity documents and approve or reject their profile so only vetted professionals can accept customer bookings.
  - *Acceptance Criteria:* Given a provider with status `Pending`, when Super Admin clicks Approve, status updates to `Approved`, an in-app notification is sent to the provider, and the provider becomes visible in customer service discovery. When rejected, a mandatory reason is recorded and the provider remains restricted.
- **US-ADMIN-02 (Category, Coupon & Plan Governance):** As a Super Admin, I want to manage service categories, promotional coupons, and platform subscription plans so business operations and commissions remain configurable.
  - *Acceptance Criteria:* Super Admin can create/edit categories, services, coupons (`WELCOME20`, `FLAT150`), and subscription plans; changes immediately reflect in backend pricing and commission calculations.
- **US-ADMIN-03 (Dispute Resolution & Analytics):** As a Super Admin, I want to resolve customer complaints and export platform revenue/booking analytics to CSV.
  - *Acceptance Criteria:* Super Admin can transition complaint status (`Open` -> `In Review` -> `Resolved`) with resolution notes and export accurate database metrics to CSV.

### 2.2 Customer User Stories
- **US-CUST-01 (Service Discovery & Slot Check):** As a Customer, I want to browse home services by category, filter providers by rating/price, and check available date/time slots.
  - *Acceptance Criteria:* Only active services and `Approved` providers serving the selected area are shown; already-booked slots are disabled.
- **US-CUST-02 (Appointment Booking & Problem Image Upload):** As a Customer, I want to book an appointment by selecting a date/time slot, choosing a saved address, describing the issue, and uploading problem images.
  - *Acceptance Criteria:* System validates slot availability via database transaction, prevents double-booking, generates a unique booking ID, saves uploaded images, and sets status to `Pending`.
- **US-CUST-03 (Razorpay Payment, Invoice & Review):** As a Customer, I want to pay via Razorpay Test Mode, download my invoice/receipt, and rate the provider once the job is completed.
  - *Acceptance Criteria:* Backend calculates final amount (including coupon/tax), verifies Razorpay signature, generates invoice/receipt, and unlocks the review form strictly after booking status reaches `Completed`.

### 2.3 Service Provider User Stories
- **US-PROV-01 (Onboarding & Service Setup):** As a Service Provider, I want to upload verification documents and configure my offered services, pricing, service areas, and availability slots.
  - *Acceptance Criteria:* Profile and KYC uploads succeed with MIME/size validation; once approved by Admin, custom prices and slots are bookable by customers.
- **US-PROV-02 (Booking Acceptance & Technician Dispatch):** As a Service Provider, I want to accept incoming booking requests and assign an available technician from my roster.
  - *Acceptance Criteria:* Accepting transitions booking from `Pending` to `Confirmed`; assigning a technician verifies no overlapping job conflict for that technician, transitions booking to `Provider Assigned`, and notifies both customer and technician.
- **US-PROV-03 (Earnings & Review Management):** As a Service Provider, I want to track my gross revenue, platform commissions, net earnings, and reply to customer reviews.
  - *Acceptance Criteria:* Provider dashboard displays real SQL-aggregated earnings, monthly charts, CSV export, and allows posting a reply to each customer review.

### 2.4 Technician User Stories
- **US-TECH-01 (Field Job Execution & Completion Proof):** As a Technician, I want to view my assigned jobs, accept them, mark my arrival time, upload completion images, and add completion remarks.
  - *Acceptance Criteria:* Technician sees only jobs assigned to them; marking arrival records `arrived_at` and transitions status to `In Progress`; uploading completion proof and remarks transitions status to `Completed` and triggers customer notification.

