import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.db.seed import seed_database


@pytest.fixture(scope="module")
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    seed_database(session)
    session.close()

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def get_auth_headers(client: TestClient, email: str, password: str) -> dict:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health_and_openapi_swagger(client: TestClient):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
    assert res.headers["X-Content-Type-Options"] == "nosniff"

    openapi = client.get("/openapi.json")
    assert openapi.status_code == 200
    assert "/api/v1/bookings" in openapi.json()["paths"]


def test_login_all_four_roles_and_rbac_enforcement(client: TestClient):
    admin_hdr = get_auth_headers(client, "admin@homeserve.com", "Admin@12345")
    cust_hdr = get_auth_headers(client, "customer@homeserve.com", "Customer@123")
    prov_hdr = get_auth_headers(client, "provider@homeserve.com", "Provider@123")
    tech_hdr = get_auth_headers(client, "tech@homeserve.com", "Tech@12345")

    # Customer cannot access Super Admin analytics (HTTP 403 Forbidden)
    forbidden = client.get("/api/v1/analytics/admin", headers=cust_hdr)
    assert forbidden.status_code == 403

    # Super Admin can access admin analytics
    allowed = client.get("/api/v1/analytics/admin", headers=admin_hdr)
    assert allowed.status_code == 200
    assert allowed.json()["totalCustomers"] >= 2


def test_idor_resource_ownership_protection(client: TestClient):
    # Customer 2 (priya.sharma@example.com) must NOT access Customer 1's booking #101
    priya_hdr = get_auth_headers(client, "priya.sharma@example.com", "Customer@123")
    res = client.get("/api/v1/bookings/101", headers=priya_hdr)
    assert res.status_code == 403
    assert "Ownership violation" in res.json()["detail"]


def test_double_booking_prevention_and_full_booking_lifecycle(client: TestClient):
    cust_hdr = get_auth_headers(client, "customer@homeserve.com", "Customer@123")
    prov_hdr = get_auth_headers(client, "provider@homeserve.com", "Provider@123")
    tech_hdr = get_auth_headers(client, "tech@homeserve.com", "Tech@12345")

    # 1. Customer books an appointment with WELCOME20 coupon
    create_res = client.post(
        "/api/v1/bookings",
        headers=cust_hdr,
        json={
            "service_id": 1,
            "provider_id": 1,
            "address_id": 1,
            "scheduled_date": "2026-11-12",
            "start_time": "11:00",
            "end_time": "12:30",
            "problem_description": "Main bedroom MCB tripping repeatedly when AC starts.",
            "coupon_code": "WELCOME20",
            "payment_type": "FULL",
            "problem_image_urls": [],
        },
    )
    assert create_res.status_code == 201, create_res.text
    booking = create_res.json()
    booking_id = booking["id"]
    assert booking["status"] == "Pending"
    assert booking["discountAmount"] == 119.8  # 20% of 599

    # 2. Provider accepts the booking (Pending -> Confirmed)
    confirm_res = client.patch(
        f"/api/v1/bookings/{booking_id}/status",
        headers=prov_hdr,
        json={"status": "Confirmed"},
    )
    assert confirm_res.status_code == 200
    assert confirm_res.json()["status"] == "Confirmed"

    # 3. Concurrent/Second booking for the SAME provider, date & start_time MUST FAIL with 409 Conflict
    conflict_res = client.post(
        "/api/v1/bookings",
        headers=cust_hdr,
        json={
            "service_id": 2,
            "provider_id": 1,
            "address_id": 1,
            "scheduled_date": "2026-11-12",
            "start_time": "11:00",
            "end_time": "12:30",
            "problem_description": "Attempting overlapping double booking on locked slot.",
            "payment_type": "FULL",
        },
    )
    assert conflict_res.status_code == 409
    assert "Double-booking prevented" in conflict_res.json()["detail"]

    # 4. Provider assigns Technician #1 (Confirmed -> Provider Assigned)
    assign_res = client.post(
        f"/api/v1/bookings/{booking_id}/assign-technician",
        headers=prov_hdr,
        json={"technician_id": 1},
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == "Provider Assigned"

    # 5. Technician marks arrival & starts service (Provider Assigned -> In Progress)
    start_res = client.patch(
        f"/api/v1/technicians/me/jobs/{booking_id}",
        headers=tech_hdr,
        json={"action": "ARRIVE_START"},
    )
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "In Progress"
    assert start_res.json()["arrivedAt"] is not None

    # 6. Technician completes service with remarks & photo (In Progress -> Completed)
    comp_res = client.patch(
        f"/api/v1/technicians/me/jobs/{booking_id}",
        headers=tech_hdr,
        json={
            "action": "COMPLETE",
            "completion_remarks": "Replaced faulty 32A C-curve MCB and tested load.",
            "completion_image_url": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4",
        },
    )
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "Completed"

    # 7. Customer submits verified review on Completed booking
    rev_res = client.post(
        "/api/v1/reviews",
        headers=cust_hdr,
        json={
            "booking_id": booking_id,
            "rating": 5,
            "comment": "Fast diagnosis and genuine Schneider MCB replacement!",
        },
    )
    assert rev_res.status_code == 201


def test_razorpay_signature_verification_and_tamper_rejection(client: TestClient):
    cust_hdr = get_auth_headers(client, "customer@homeserve.com", "Customer@123")

    # Create order for booking #102 (which has pending balance)
    order_res = client.post(
        "/api/v1/payments/create-order",
        headers=cust_hdr,
        json={"booking_id": 102, "payment_type": "BALANCE"},
    )
    assert order_res.status_code == 200
    order_data = order_res.json()

    # Tampered signature must be rejected (HTTP 400)
    bad_verify = client.post(
        "/api/v1/payments/verify",
        headers=cust_hdr,
        json={
            "booking_id": 102,
            "razorpay_order_id": order_data["razorpayOrderId"],
            "razorpay_payment_id": order_data["testPaymentId"],
            "razorpay_signature": "tampered_invalid_signature_0000",
        },
    )
    assert bad_verify.status_code == 400

    # Valid HMAC-SHA256 signature must succeed and settle payment
    good_verify = client.post(
        "/api/v1/payments/verify",
        headers=cust_hdr,
        json={
            "booking_id": 102,
            "razorpay_order_id": order_data["razorpayOrderId"],
            "razorpay_payment_id": order_data["testPaymentId"],
            "razorpay_signature": order_data["testSignature"],
        },
    )
    assert good_verify.status_code == 200
    assert good_verify.json()["status"] == "Paid"

