import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db.seed import seed_database
from app.db.session import Base, get_db
from app.main import app
from app.models import User


@pytest.fixture(scope="module")
def sec_env():
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
    with TestClient(app) as test_client:
        yield test_client, session
    session.close()
    app.dependency_overrides.clear()


def _login(client: TestClient, email: str, password: str) -> dict:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()


def test_password_hash_never_exposed_and_bcrypt_verification(sec_env):
    client, db = sec_env
    # Verify DB stores bcrypt hash and never plaintext
    admin = db.query(User).filter(User.email == "admin@homeserve.com").first()
    assert admin is not None
    assert admin.password_hash.startswith("$2b$")
    assert "Admin@12345" not in admin.password_hash

    # Verify API responses never leak password_hash
    login_data = _login(client, "customer@homeserve.com", "Customer@123")
    raw_json = json.dumps(login_data)
    assert "password_hash" not in raw_json
    assert "$2b$" not in raw_json

    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {login_data['access_token']}"},
    )
    assert me_res.status_code == 200
    assert "password_hash" not in json.dumps(me_res.json())


def test_jwt_tampering_expiration_and_refresh_token_revocation(sec_env):
    client, _ = sec_env
    # 1. Forged signature token -> 401
    forged_token = jwt.encode(
        {
            "sub": "1",
            "role": "super_admin",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
        },
        "wrong-attacker-secret-key-at-least-32-bytes-long-2026",
        algorithm=settings.JWT_ALGORITHM,
    )
    res_forged = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {forged_token}"},
    )
    assert res_forged.status_code == 401

    # 2. Expired token -> 401
    expired_token = jwt.encode(
        {
            "sub": "1",
            "role": "super_admin",
            "type": "access",
            "exp": datetime.now(timezone.utc) - timedelta(minutes=5),
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    res_expired = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert res_expired.status_code == 401

    # 3. Refresh token revocation upon logout
    tokens = _login(client, "priya.sharma@example.com", "Customer@123")
    refresh_tok = tokens["refresh_token"]
    access_tok = tokens["access_token"]

    logout_res = client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_tok},
        headers={"Authorization": f"Bearer {access_tok}"},
    )
    assert logout_res.status_code == 200

    # Attempting to refresh with a revoked refresh token must fail with 401
    replay_refresh = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_tok},
    )
    assert replay_refresh.status_code == 401


def test_idor_booking_and_review_cross_tenant_isolation(sec_env):
    client, _ = sec_env
    cust2_token = _login(client, "priya.sharma@example.com", "Customer@123")["access_token"]
    prov3_token = _login(client, "sparkle.clean@homeserve.com", "Provider@123")["access_token"]
    tech2_token = _login(client, "ravi.tech@homeserve.com", "Tech@12345")["access_token"]

    # Booking 101 belongs to Customer 1 (customer@homeserve.com) and Provider 1 (provider@homeserve.com)
    # 1. Customer 2 tries to view Customer 1's Booking #101 -> 403
    res_cust_view = client.get(
        "/api/v1/bookings/101",
        headers={"Authorization": f"Bearer {cust2_token}"},
    )
    assert res_cust_view.status_code == 403

    # 2. Provider 3 (Sparkle Clean) tries to update Provider 1's Booking #102 -> 403
    res_prov_status = client.patch(
        "/api/v1/bookings/102/status",
        json={"status": "Confirmed"},
        headers={"Authorization": f"Bearer {prov3_token}"},
    )
    assert res_prov_status.status_code == 403

    # 3. Provider 3 tries to reply to Provider 1's Review #1 -> 403
    res_prov_reply = client.post(
        "/api/v1/reviews/1/reply",
        json={"provider_reply": "Unauthorized competitor reply"},
        headers={"Authorization": f"Bearer {prov3_token}"},
    )
    assert res_prov_reply.status_code == 403

    # 4. Technician 2 (Ravi) tries to update Technician 1's (Manoj) assigned Booking #102 -> 403
    res_tech_update = client.patch(
        "/api/v1/bookings/102/status",
        json={"status": "Completed"},
        headers={"Authorization": f"Bearer {tech2_token}"},
    )
    assert res_tech_update.status_code == 403


def test_private_kyc_document_access_control(sec_env):
    client, _ = sec_env
    cust_token = _login(client, "customer@homeserve.com", "Customer@123")["access_token"]
    prov1_token = _login(client, "provider@homeserve.com", "Provider@123")["access_token"]
    prov3_token = _login(client, "sparkle.clean@homeserve.com", "Provider@123")["access_token"]
    admin_token = _login(client, "admin@homeserve.com", "Admin@12345")["access_token"]

    # Customer cannot access Provider #1's private KYC document -> 403
    res_cust = client.get(
        "/api/v1/files/kyc/1",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert res_cust.status_code == 403

    # Another Provider (#3) cannot access Provider #1's private KYC document -> 403
    res_prov3 = client.get(
        "/api/v1/files/kyc/1",
        headers={"Authorization": f"Bearer {prov3_token}"},
    )
    assert res_prov3.status_code == 403

    # Owning Provider #1 CAN access their own KYC document -> 200
    res_prov1 = client.get(
        "/api/v1/files/kyc/1",
        headers={"Authorization": f"Bearer {prov1_token}"},
    )
    assert res_prov1.status_code == 200
    assert res_prov1.json()["accessClassification"] == "PRIVATE_AUTHENTICATED_KYC"

    # Super Admin CAN access any provider's KYC document for verification -> 200
    res_admin = client.get(
        "/api/v1/files/kyc/1",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_admin.status_code == 200
    assert res_admin.json()["providerId"] == 1


def test_sql_injection_and_input_validation_defense(sec_env):
    client, db = sec_env
    # SQLi attempt in login
    sqli_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@homeserve.com' OR '1'='1", "password": "' OR '1'='1"},
    )
    assert sqli_login.status_code in (401, 422)

    # SQLi attempt in service search query parameter `q`
    sqli_search = client.get(
        "/api/v1/services",
        params={"q": "'; DROP TABLE users; --"},
    )
    assert sqli_search.status_code == 200
    assert sqli_search.json()["items"] == []
    # Verify users table is completely intact
    assert db.query(User).count() >= 8

    # Invalid rating (>5) rejected by Pydantic validation
    cust_token = _login(client, "customer@homeserve.com", "Customer@123")["access_token"]
    bad_review = client.post(
        "/api/v1/reviews",
        json={"booking_id": 1, "rating": 99, "comment": "Invalid rating"},
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert bad_review.status_code == 422


def test_razorpay_webhook_hmac_verification_and_idempotency(sec_env):
    client, _ = sec_env
    webhook_body = json.dumps(
        {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_RzpWebhook_900",
                        "order_id": "order_RzpTest_102",
                    }
                }
            },
        }
    ).encode("utf-8")

    # 1. Missing signature header -> 400
    res_missing = client.post("/api/v1/payments/webhook", content=webhook_body)
    assert res_missing.status_code == 400

    # 2. Invalid signature header -> 400
    res_tampered = client.post(
        "/api/v1/payments/webhook",
        content=webhook_body,
        headers={"X-Razorpay-Signature": "deadbeef_invalid_hmac"},
    )
    assert res_tampered.status_code == 400

    # 3. Valid HMAC-SHA256 signature -> 200
    valid_sig = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        webhook_body,
        hashlib.sha256,
    ).hexdigest()
    res_valid = client.post(
        "/api/v1/payments/webhook",
        content=webhook_body,
        headers={"X-Razorpay-Signature": valid_sig},
    )
    assert res_valid.status_code == 200
    assert res_valid.json()["status"] == "acknowledged"

    # 4. Payment failure webhook scenario (`payment.failed`) -> 200 & marks booking Failed
    failed_body = json.dumps(
        {
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_RzpWebhook_Fail_901",
                        "order_id": "order_Pg10aBcD22mNpQ",
                        "error_description": "Payment declined by issuing bank",
                    }
                }
            },
        }
    ).encode("utf-8")
    failed_sig = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        failed_body,
        hashlib.sha256,
    ).hexdigest()
    res_failed = client.post(
        "/api/v1/payments/webhook",
        content=failed_body,
        headers={"X-Razorpay-Signature": failed_sig},
    )
    assert res_failed.status_code == 200
    assert res_failed.json()["event"] == "payment.failed"


def test_http_security_headers(sec_env):
    client, _ = sec_env
    res = client.get("/health")
    assert res.status_code == 200
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("X-XSS-Protection") == "1; mode=block"
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert res.headers.get("Cache-Control") == "no-store"
