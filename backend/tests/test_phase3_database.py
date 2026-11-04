import pytest
from decimal import Decimal
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

from app.db.session import Base
from app.db.seed import seed_database
from app.models import (
    User,
    Customer,
    ServiceProvider,
    Technician,
    Address,
    ServiceCategory,
    Service,
    ProviderService,
    ServiceArea,
    AvailabilitySlot,
    Booking,
    BookingAssignment,
    BookingImage,
    Payment,
    Invoice,
    Coupon,
    Review,
    Complaint,
    Notification,
    ProviderEarning,
)


@pytest.fixture(scope="module")
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    seed_database(session)
    yield session
    session.close()


def test_all_20_required_tables_exist(db_session):
    inspector = inspect(db_session.get_bind())
    tables = set(inspector.get_table_names())
    required_20 = {
        "users",
        "customers",
        "service_providers",
        "technicians",
        "addresses",
        "service_categories",
        "services",
        "provider_services",
        "service_areas",
        "availability_slots",
        "bookings",
        "booking_assignments",
        "booking_images",
        "payments",
        "invoices",
        "coupons",
        "reviews",
        "complaints",
        "notifications",
        "provider_earnings",
    }
    assert required_20.issubset(tables)


def test_seeded_four_roles_and_8_categories(db_session):
    roles = {u.role for u in db_session.query(User).all()}
    assert roles == {"super_admin", "customer", "service_provider", "technician"}
    assert db_session.query(ServiceCategory).count() == 8
    assert db_session.query(Service).count() == 8


def test_unique_constraints_enforced(db_session):
    # Duplicate user email must fail
    dup_user = User(
        full_name="Duplicate",
        email="admin@homeserve.com",
        phone="9999999999",
        password_hash="hash",
        role="customer",
    )
    db_session.add(dup_user)
    with pytest.raises(IntegrityError):
        db_session.flush()
    db_session.rollback()

    # Duplicate review on the same booking (booking_id=101) must fail
    dup_review = Review(
        booking_id=101,
        customer_id=1,
        provider_id=1,
        rating=4,
        comment="Second review attempt",
    )
    db_session.add(dup_review)
    with pytest.raises(IntegrityError):
        db_session.flush()
    db_session.rollback()


def test_booking_payment_invoice_relationships_and_decimal_precision(db_session):
    booking = db_session.query(Booking).filter(Booking.booking_number == "HS-20261028-0101").first()
    assert booking is not None
    assert booking.subtotal == Decimal("799.00")
    assert booking.total_amount == Decimal("754.26")
    assert booking.assignment is not None
    assert booking.assignment.technician.user.full_name == "Manoj Kumar"
    assert booking.invoice is not None
    assert booking.invoice.invoice_number == "INV-2026-0901"
    assert len(booking.images) == 2

