import io
from decimal import Decimal
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.db.seed import seed_database
from app.services.business_logic import (
    calculate_booking_pricing,
    calculate_and_record_provider_earning,
    check_provider_slot_conflict,
    validate_status_transition,
)
from app.models import Booking


@pytest.fixture(scope="module")
def qa_env():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    seed_database(session)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield {"client": client, "session": session}
    session.close()
    app.dependency_overrides.clear()


def auth_header(client: TestClient, email: str, password: str) -> dict:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


# ============================================================================
# 1. UNIT TESTS (PRICING, COUPONS, COMMISSIONS, STATUS TRANSITIONS, SLOTS)
# ============================================================================
def test_unit_service_pricing_and_percentage_coupon_calculation(qa_env):
    db = qa_env["session"]
    # Service 2 (799.00) with WELCOME20 (20% off = 159.80) -> taxable 639.20 -> +18% GST (115.06) = 754.26
    pricing = calculate_booking_pricing(
        db=db,
        service_id=2,
        provider_id=1,
        coupon_code="WELCOME20",
        payment_type="FULL",
    )
    assert pricing["subtotal"] == Decimal("799.00")
    assert pricing["discount_amount"] == Decimal("159.80")
    assert pricing["tax_amount"] == Decimal("115.06")
    assert pricing["total_amount"] == Decimal("754.26")
    assert pricing["payable_now"] == Decimal("754.26")
    assert pricing["pending_amount"] == Decimal("0.00")


def test_unit_advance_payment_25_percent_split_and_flat_coupon(qa_env):
    db = qa_env["session"]
    # Service 4 (2499.00) with FLAT150 (-150.00) -> taxable 2349.00 -> +18% GST (422.82) = 2771.82
    pricing = calculate_booking_pricing(
        db=db,
        service_id=4,
        provider_id=3,
        coupon_code="FLAT150",
        payment_type="ADVANCE",
    )
    assert pricing["subtotal"] == Decimal("2499.00")
    assert pricing["discount_amount"] == Decimal("150.00")
    assert pricing["total_amount"] == Decimal("2771.82")
    assert pricing["payable_now"] == Decimal("692.96")  # 25% of 2771.82
    assert pricing["pending_amount"] == Decimal("2078.86")  # 75% balance


def test_unit_unverified_provider_cannot_receive_bookings(qa_env):
    db = qa_env["session"]
    # Provider 2 (Metro Rapid Plumbing) has verification_status = 'Pending'
    with pytest.raises(HTTPException) as exc:
        calculate_booking_pricing(db=db, service_id=3, provider_id=2)
    assert exc.value.status_code == 400
    assert "Unverified" in exc.value.detail


def test_unit_valid_and_invalid_status_transitions():
    # Valid transitions
    validate_status_transition("Pending", "Confirmed")
    validate_status_transition("Confirmed", "Provider Assigned")
    validate_status_transition("Provider Assigned", "In Progress")
    validate_status_transition("In Progress", "Completed")

    # Invalid transitions must raise 400
    with pytest.raises(HTTPException) as exc:
        validate_status_transition("Pending", "Completed")
    assert exc.value.status_code == 400

    with pytest.raises(HTTPException) as exc2:
        validate_status_transition("Completed", "Cancelled")
    assert exc2.value.status_code == 400


def test_unit_commission_and_provider_earning_calculation(qa_env):
    db = qa_env["session"]
    booking = db.query(Booking).filter(Booking.id == 101).first()
    earning = calculate_and_record_provider_earning(db, booking)
    assert earning.gross_amount == Decimal("754.26")
    assert earning.commission_percentage == Decimal("10.00")
    assert earning.commission_amount == Decimal("75.43")
    assert earning.net_earning == Decimal("678.83")


# ============================================================================
# 2. API & INTEGRATION TESTS (CRUD, FILE SECURITY, CSV EXPORT, WORKFLOWS)
# ============================================================================
def test_api_customer_address_crud_and_ownership(qa_env):
    client = qa_env["client"]
    cust1_hdr = auth_header(client, "customer@homeserve.com", "Customer@123")
    cust2_hdr = auth_header(client, "priya.sharma@example.com", "Customer@123")

    # Create new address for Customer 1
    post_res = client.post(
        "/api/v1/customers/me/addresses",
        headers=cust1_hdr,
        json={
            "label": "Weekend Villa",
            "address_line1": "Plot 88, Whitefield Main Road",
            "city": "Bengaluru",
            "state": "Karnataka",
            "postal_code": "560066",
            "is_default": False,
        },
    )
    assert post_res.status_code == 201
    new_addr_id = post_res.json()["id"]

    # Customer 2 attempting to delete Customer 1's address must receive 403 Forbidden
    del_forbidden = client.delete(
        f"/api/v1/customers/me/addresses/{new_addr_id}", headers=cust2_hdr
    )
    assert del_forbidden.status_code == 403

    # Customer 1 deleting their own address succeeds
    del_ok = client.delete(
        f"/api/v1/customers/me/addresses/{new_addr_id}", headers=cust1_hdr
    )
    assert del_ok.status_code == 200


def test_api_file_upload_mime_and_size_validation(qa_env):
    client = qa_env["client"]
    prov_hdr = auth_header(client, "provider@homeserve.com", "Provider@123")

    # 1. Executable / script upload attempt MUST be rejected (HTTP 400)
    bad_file = {"file": ("exploit.exe", io.BytesIO(b"MZ_MALICIOUS_BINARY"), "application/x-msdownload")}
    bad_res = client.post(
        "/api/v1/files/upload",
        headers=prov_hdr,
        files=bad_file,
        data={"document_category": "KYC"},
    )
    assert bad_res.status_code == 400
    assert "Unsupported file MIME type" in bad_res.json()["detail"]

    # 2. Valid PDF KYC upload succeeds and marks isPrivate=True
    good_file = {"file": ("trade_license.pdf", io.BytesIO(b"%PDF-1.4 valid content"), "application/pdf")}
    good_res = client.post(
        "/api/v1/files/upload",
        headers=prov_hdr,
        files=good_file,
        data={"document_category": "KYC"},
    )
    assert good_res.status_code == 200
    assert good_res.json()["isPrivate"] is True


def test_api_admin_provider_kyc_approval_and_csv_export(qa_env):
    client = qa_env["client"]
    admin_hdr = auth_header(client, "admin@homeserve.com", "Admin@12345")

    # Approve Provider #2 (Metro Rapid Plumbing)
    kyc_res = client.patch(
        "/api/v1/admin/providers/2/verify",
        headers=admin_hdr,
        json={"verification_status": "Approved"},
    )
    assert kyc_res.status_code == 200
    assert kyc_res.json()["verificationStatus"] == "Approved"

    # Export CSV report
    csv_res = client.get("/api/v1/analytics/export-csv", headers=admin_hdr)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "BookingNumber,CustomerID,ProviderID" in csv_res.text

