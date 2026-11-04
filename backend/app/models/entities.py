from datetime import datetime, date, timezone
from decimal import Decimal
from sqlalchemy import (
    String,
    Integer,
    Boolean,
    DateTime,
    Date,
    Text,
    Numeric,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ============================================================================
# 1. users
# ============================================================================
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    customer_profile: Mapped["Customer"] = relationship(
        "Customer", back_populates="user", uselist=False
    )
    provider_profile: Mapped["ServiceProvider"] = relationship(
        "ServiceProvider", back_populates="user", uselist=False
    )
    technician_profile: Mapped["Technician"] = relationship(
        "Technician", back_populates="user", uselist=False
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )


# ============================================================================
# 21 (Support). subscription_plans
# ============================================================================
class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    monthly_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    commission_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("15.00"), nullable=False
    )
    max_services: Mapped[int] = mapped_column(Integer, default=20, nullable=False)
    max_technicians: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    features_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)


# ============================================================================
# 2. customers
# ============================================================================
class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="RESTRICT"), unique=True, nullable=False
    )
    account_status: Mapped[str] = mapped_column(String(30), default="Active", nullable=False)
    preferred_city: Mapped[str] = mapped_column(String(80), default="Bengaluru", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="customer_profile")
    addresses: Mapped[list["Address"]] = relationship(
        "Address", back_populates="customer", cascade="all, delete-orphan"
    )
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="customer")
    favorites: Mapped[list["CustomerFavorite"]] = relationship(
        "CustomerFavorite", back_populates="customer", cascade="all, delete-orphan"
    )


# ============================================================================
# 3. service_providers
# ============================================================================
class ServiceProvider(Base):
    __tablename__ = "service_providers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="RESTRICT"), unique=True, nullable=False
    )
    business_name: Mapped[str] = mapped_column(String(150), nullable=False)
    owner_name: Mapped[str] = mapped_column(String(120), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    experience_years: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    verification_status: Mapped[str] = mapped_column(
        String(30), default="Pending", nullable=False, index=True
    )
    kyc_document_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    kyc_document_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    rejection_remarks: Mapped[str | None] = mapped_column(String(500), nullable=True)
    subscription_plan_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("subscription_plans.id", ondelete="SET NULL"), nullable=True
    )
    average_rating: Mapped[Decimal] = mapped_column(
        Numeric(3, 2), default=Decimal("0.00"), nullable=False
    )
    total_reviews: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_jobs_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    working_hours: Mapped[str] = mapped_column(
        String(120), default="Mon - Sun: 08:00 AM - 08:00 PM", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="provider_profile")
    subscription_plan: Mapped["SubscriptionPlan"] = relationship("SubscriptionPlan")
    provider_services: Mapped[list["ProviderService"]] = relationship(
        "ProviderService", back_populates="provider", cascade="all, delete-orphan"
    )
    service_areas: Mapped[list["ServiceArea"]] = relationship(
        "ServiceArea", back_populates="provider", cascade="all, delete-orphan"
    )
    availability_slots: Mapped[list["AvailabilitySlot"]] = relationship(
        "AvailabilitySlot", back_populates="provider", cascade="all, delete-orphan"
    )
    technicians: Mapped[list["Technician"]] = relationship(
        "Technician", back_populates="provider"
    )
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="provider")


# ============================================================================
# 4. technicians
# ============================================================================
class Technician(Base):
    __tablename__ = "technicians"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="RESTRICT"), unique=True, nullable=False
    )
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("service_providers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    specialization: Mapped[str] = mapped_column(String(150), nullable=False)
    experience_years: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    completed_jobs_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=Decimal("5.00"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="technician_profile")
    provider: Mapped["ServiceProvider"] = relationship(
        "ServiceProvider", back_populates="technicians"
    )
    assignments: Mapped[list["BookingAssignment"]] = relationship(
        "BookingAssignment", back_populates="technician"
    )


# ============================================================================
# 5. addresses
# ============================================================================
class Address(Base):
    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    label: Mapped[str] = mapped_column(String(50), default="Home", nullable=False)
    address_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    landmark: Mapped[str | None] = mapped_column(String(150), nullable=True)
    city: Mapped[str] = mapped_column(String(80), nullable=False)
    state: Mapped[str] = mapped_column(String(80), default="Karnataka", nullable=False)
    postal_code: Mapped[str] = mapped_column(String(15), nullable=False, index=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="addresses")


# ============================================================================
# 6. service_categories
# ============================================================================
class ServiceCategory(Base):
    __tablename__ = "service_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    parent_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("service_categories.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    subcategories_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon_name: Mapped[str] = mapped_column(String(50), default="Wrench", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    services: Mapped[list["Service"]] = relationship("Service", back_populates="category")


# ============================================================================
# 7. services
# ============================================================================
class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("service_categories.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    subcategory: Mapped[str] = mapped_column(String(100), default="General", nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    base_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    inclusions_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=Decimal("4.90"), nullable=False)
    reviews_count: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    category: Mapped["ServiceCategory"] = relationship(
        "ServiceCategory", back_populates="services"
    )


# ============================================================================
# 8. provider_services
# ============================================================================
class ProviderService(Base):
    __tablename__ = "provider_services"
    __table_args__ = (
        UniqueConstraint("provider_id", "service_id", name="uq_provider_service"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False
    )
    service_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False
    )
    custom_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    custom_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    provider: Mapped["ServiceProvider"] = relationship(
        "ServiceProvider", back_populates="provider_services"
    )
    service: Mapped["Service"] = relationship("Service")


# ============================================================================
# 9. service_areas
# ============================================================================
class ServiceArea(Base):
    __tablename__ = "service_areas"
    __table_args__ = (
        UniqueConstraint("provider_id", "postal_code", name="uq_provider_postal"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False
    )
    city: Mapped[str] = mapped_column(String(80), nullable=False)
    area_name: Mapped[str] = mapped_column(String(120), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(15), nullable=False, index=True)
    radius_km: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("10.00"), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    provider: Mapped["ServiceProvider"] = relationship(
        "ServiceProvider", back_populates="service_areas"
    )


# ============================================================================
# 10. availability_slots
# ============================================================================
class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"
    __table_args__ = (
        UniqueConstraint(
            "provider_id", "day_of_week", "start_time", "end_time", name="uq_provider_slot"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False
    )
    day_of_week: Mapped[str] = mapped_column(String(20), default="ALL", nullable=False)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    provider: Mapped["ServiceProvider"] = relationship(
        "ServiceProvider", back_populates="availability_slots"
    )


# ============================================================================
# 16. coupons
# ============================================================================
class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(40), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    discount_type: Mapped[str] = mapped_column(String(20), default="PERCENTAGE", nullable=False)
    discount_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    min_order_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0.00"), nullable=False
    )
    max_discount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("500.00"), nullable=False
    )
    valid_from: Mapped[date] = mapped_column(Date, nullable=False)
    valid_until: Mapped[date] = mapped_column(Date, nullable=False)
    usage_limit: Mapped[int] = mapped_column(Integer, default=500, nullable=False)
    used_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)


# ============================================================================
# 11. bookings
# ============================================================================
class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        Index(
            "idx_booking_slot_lock",
            "provider_id",
            "scheduled_date",
            "start_time",
            "status",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    booking_number: Mapped[str] = mapped_column(
        String(40), unique=True, nullable=False, index=True
    )
    customer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("service_providers.id", ondelete="RESTRICT"), nullable=False
    )
    service_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("services.id", ondelete="RESTRICT"), nullable=False
    )
    address_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("addresses.id", ondelete="RESTRICT"), nullable=False
    )
    coupon_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("coupons.id", ondelete="SET NULL"), nullable=True
    )
    scheduled_date: Mapped[str] = mapped_column(String(20), nullable=False)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="Pending", nullable=False)
    problem_description: Mapped[str] = mapped_column(Text, nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0.00"), nullable=False
    )
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0.00"), nullable=False
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    payment_type: Mapped[str] = mapped_column(String(20), default="FULL", nullable=False)
    payment_status: Mapped[str] = mapped_column(String(20), default="Pending", nullable=False)
    paid_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0.00"), nullable=False
    )
    pending_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0.00"), nullable=False
    )
    cancellation_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    customer: Mapped["Customer"] = relationship("Customer", back_populates="bookings")
    provider: Mapped["ServiceProvider"] = relationship(
        "ServiceProvider", back_populates="bookings"
    )
    service: Mapped["Service"] = relationship("Service")
    address: Mapped["Address"] = relationship("Address")
    coupon: Mapped["Coupon"] = relationship("Coupon")
    assignment: Mapped["BookingAssignment"] = relationship(
        "BookingAssignment", back_populates="booking", uselist=False, cascade="all, delete-orphan"
    )
    images: Mapped[list["BookingImage"]] = relationship(
        "BookingImage", back_populates="booking", cascade="all, delete-orphan"
    )
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="booking")
    invoice: Mapped["Invoice"] = relationship(
        "Invoice", back_populates="booking", uselist=False
    )
    review: Mapped["Review"] = relationship(
        "Review", back_populates="booking", uselist=False
    )


# ============================================================================
# 12. booking_assignments
# ============================================================================
class BookingAssignment(Base):
    __tablename__ = "booking_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    booking_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    technician_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("technicians.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    assigned_by_user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(40), default="Assigned", nullable=False)
    arrived_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completion_remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="assignment")
    technician: Mapped["Technician"] = relationship("Technician", back_populates="assignments")


# ============================================================================
# 13. booking_images
# ============================================================================
class BookingImage(Base):
    __tablename__ = "booking_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    booking_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    uploaded_by_user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    image_type: Mapped[str] = mapped_column(String(30), default="PROBLEM", nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    caption: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="images")


# ============================================================================
# 14. payments
# ============================================================================
class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    booking_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("bookings.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    customer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False
    )
    payment_type: Mapped[str] = mapped_column(String(20), default="FULL", nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Pending", nullable=False)
    razorpay_order_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    razorpay_signature: Mapped[str | None] = mapped_column(String(255), nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(120), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="payments")


# ============================================================================
# 15. invoices
# ============================================================================
class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    booking_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("bookings.id", ondelete="RESTRICT"), unique=True, nullable=False
    )
    customer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False
    )
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("service_providers.id", ondelete="RESTRICT"), nullable=False
    )
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0.00"), nullable=False
    )
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0.00"), nullable=False
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="Paid", nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="invoice")


# ============================================================================
# 17. reviews
# ============================================================================
class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    booking_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("bookings.id", ondelete="RESTRICT"), unique=True, nullable=False
    )
    customer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False
    )
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("service_providers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    provider_reply: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="review")


# ============================================================================
# 18. complaints
# ============================================================================
class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    complaint_number: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    booking_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("bookings.id", ondelete="RESTRICT"), nullable=False
    )
    customer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False
    )
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("service_providers.id", ondelete="RESTRICT"), nullable=False
    )
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="Open", nullable=False, index=True)
    admin_resolution_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_by_user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )


# ============================================================================
# 19. notifications
# ============================================================================
class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str | None] = mapped_column(String(40), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(String(50), default="SYSTEM", nullable=False)
    reference_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="notifications")


# ============================================================================
# 20. provider_earnings
# ============================================================================
class ProviderEarning(Base):
    __tablename__ = "provider_earnings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("service_providers.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    booking_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("bookings.id", ondelete="RESTRICT"), unique=True, nullable=False
    )
    payment_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("payments.id", ondelete="SET NULL"), nullable=True
    )
    gross_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    commission_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    commission_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    net_earning: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    settlement_status: Mapped[str] = mapped_column(String(30), default="Settled", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)


# ============================================================================
# 22 (Support). customer_favorites
# ============================================================================
class CustomerFavorite(Base):
    __tablename__ = "customer_favorites"
    __table_args__ = (
        UniqueConstraint("customer_id", "provider_id", name="uq_customer_fav_provider"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False
    )
    provider_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="favorites")


# ============================================================================
# 23 (Support). refresh_tokens
# ============================================================================
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_jti: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

