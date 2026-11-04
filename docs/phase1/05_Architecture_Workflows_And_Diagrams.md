# 05 — System Architecture, Module Dependencies & Workflow Diagrams
## HomeServe Technologies — Home Services Booking SaaS Platform

---

## 1. High-Level System Architecture Diagram

```mermaid
flowchart TB
    subgraph Frontend["Frontend Application (React.js + Tailwind CSS + Vite)"]
        Landing["Public Landing & Service Discovery"]
        AdminDash["Super Admin Dashboard"]
        CustDash["Customer Portal & Checkout"]
        ProvDash["Service Provider Console"]
        TechDash["Technician Field Console"]
        ApiService["Centralized Axios Client + JWT Interceptor"]
    end

    subgraph Backend["FastAPI Modular Monolith (/api/v1)"]
        MW["Middleware: CORS, Rate Limiter, Security Headers, Logger"]
        Routes["REST API v1 Routers (Auth, Users, Services, Bookings, Payments...)"]
        Guards["Security Layer: JWT Validator, RBAC Guard, Ownership Checker"]
        Services["Service Layer: Booking Lock, Pricing/Coupon, Notifications, Analytics"]
        Repos["Repository Layer: SQLAlchemy 2.0 ORM & ACID Transactions"]
    end

    subgraph Infrastructure["Persistence & External Services"]
        MySQL[("MySQL 8.0 Relational DB\n20+ Normalized Tables")]
        Razorpay["Razorpay Test Mode\nOrders, Signatures & Webhooks"]
        Cloudinary["Cloudinary / Secure Local Storage\nKYC Docs & Service Photos"]
    end

    Landing & AdminDash & CustDash & ProvDash & TechDash --> ApiService
    ApiService --> MW
    MW --> Routes
    Routes --> Guards
    Guards --> Services
    Services --> Repos
    Repos --> MySQL
    Services --> Razorpay
    Services --> Cloudinary
```

---

## 2. Module Dependency Diagram (10 Functional Modules)

```mermaid
flowchart TD
    M1["Module 1: Authentication & Authorization"]
    M2["Module 2: Customer Management"]
    M3["Module 3: Service Category & Management"]
    M4["Module 4: Service Provider Management"]
    M5["Module 5: Booking & Appointment Management"]
    M6["Module 6: Technician Management"]
    M7["Module 7: Payment & Invoice Management"]
    M8["Module 8: Notification & Communication System"]
    M9["Module 9: Rating, Review & Complaint Management"]
    M10["Module 10: Analytics & Reporting Dashboard"]

    M1 --> M2
    M1 --> M3
    M1 --> M4
    M3 --> M4
    M2 --> M5
    M3 --> M5
    M4 --> M5
    M4 --> M6
    M5 --> M6
    M5 --> M7
    M5 --> M8
    M6 --> M8
    M7 --> M8
    M5 --> M9
    M6 --> M9
    M2 & M4 & M5 & M7 & M9 --> M10
```

---

## 3. Overall Project Flow Diagram

```mermaid
flowchart LR
    A["1. Provider Onboarding & KYC Upload"] --> B["2. Super Admin Approves Provider & Catalog"]
    B --> C["3. Provider Configures Services, Areas & Slots"]
    C --> D["4. Customer Discovers Service & Checks Slot"]
    D --> E["5. Customer Submits Booking + Problem Images"]
    E --> F["6. Provider Accepts Booking & Assigns Technician"]
    F --> G["7. Technician Accepts, Arrives & Completes Job"]
    G --> H["8. Customer Pays via Razorpay -> Invoice Issued"]
    H --> I["9. Customer Submits Review -> Analytics Updated"]
```

---

## 4. Business Workflow & State-Machine Diagrams

### 4.1 Service Provider Verification Workflow
```mermaid
sequenceDiagram
    autonumber
    actor Prov as Service Provider
    participant API as FastAPI Backend
    participant Store as Secure Document Storage
    participant DB as MySQL Database
    actor Admin as Super Admin

    Prov->>API: Register Account (role=service_provider)
    API->>DB: Create User & Provider (status=Pending)
    Prov->>API: Upload KYC / Identity Document
    API->>Store: Validate MIME/Size & Save Private File
    API->>DB: Store Document Metadata & Notify Admin
    Admin->>API: Review KYC Document & Approve/Reject
    API->>DB: Update verification_status = Approved (or Rejected)
    API->>DB: Create Notification for Provider
```

### 4.2 End-to-End Booking & Double-Booking Prevention Workflow
```mermaid
sequenceDiagram
    autonumber
    actor Cust as Customer
    participant API as FastAPI Booking Service
    participant DB as MySQL (ACID Transaction)
    actor Prov as Service Provider
    actor Tech as Technician

    Cust->>API: POST /api/v1/bookings (service, provider, date, slot, address)
    API->>DB: BEGIN TRANSACTION + SELECT ... FOR UPDATE (Provider & Slot)
    alt Slot Already Booked (Conflict)
        DB-->>API: Existing Active Booking Found
        API-->>Cust: HTTP 409 Conflict (Slot Unavailable)
    else Slot Available
        API->>DB: Insert Booking (status=Pending) & Images
        DB-->>API: COMMIT
        API-->>Cust: HTTP 201 Created (Booking Confirmed ID)
    end
    Prov->>API: PATCH /bookings/{id}/status (status=Confirmed)
    Prov->>API: POST /bookings/{id}/assign-technician (technician_id)
    API->>DB: Verify Technician Slot Lock -> status=Provider Assigned
    Tech->>API: PATCH /assignments/{id}/accept & /arrive (status=In Progress)
    Tech->>API: POST /assignments/{id}/complete (Completion Images + Remarks)
    API->>DB: Update Booking status=Completed & Notify Customer
```

### 4.3 Payment, Commission & Invoice Workflow (Razorpay Test Mode)
```mermaid
sequenceDiagram
    autonumber
    actor Cust as Customer
    participant UI as React Checkout
    participant API as FastAPI Payment Service
    participant RZP as Razorpay Test Gateway
    participant DB as MySQL Database

    Cust->>UI: Apply Coupon & Click "Pay Now" (Advance or Full)
    UI->>API: POST /api/v1/payments/create-order (booking_id, payment_type, coupon)
    API->>DB: Recompute Subtotal - Discount + Tax on Server
    API->>RZP: Create Razorpay Order (amount in paise)
    RZP-->>API: razorpay_order_id
    API->>DB: Save Payment Record (status=Pending)
    API-->>UI: Order Details
    UI->>RZP: Complete Sandbox Checkout
    RZP-->>UI: razorpay_payment_id + razorpay_signature
    UI->>API: POST /api/v1/payments/verify
    API->>API: Verify HMAC-SHA256 Signature & Idempotency
    API->>DB: Update Payment status=Paid, Generate Invoice & Provider Earnings
    API-->>UI: Payment Receipt & Invoice Ready
```

