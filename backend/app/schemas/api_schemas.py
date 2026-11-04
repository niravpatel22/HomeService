from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


# --- Auth & User Schemas ---
class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=6, max_length=128)


class CustomerRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=150)
    phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    password: str = Field(..., min_length=8, max_length=128)


class ProviderRegisterRequest(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=150)
    owner_name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=150)
    phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    password: str = Field(..., min_length=8, max_length=128)
    experience_years: int = Field(default=3, ge=0, le=60)
    city: str = Field(default="Bengaluru", max_length=80)
    postal_code: str = Field(default="560038", max_length=15)
    kyc_document_name: str = Field(default="KYC_Identity_Document.pdf", max_length=255)
    selected_category_ids: list[int] = Field(default_factory=lambda: [1])
    bio: str | None = Field(default=None, max_length=1000)


class PasswordResetRequest(BaseModel):
    email: str
    new_password: str = Field(..., min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    role: str
    is_active: bool
    is_verified: bool

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Customer & Address Schemas ---
class AddressCreateRequest(BaseModel):
    label: str = Field(default="Home", max_length=50)
    address_line1: str = Field(..., min_length=5, max_length=255)
    address_line2: str | None = None
    landmark: str | None = None
    city: str = Field(default="Bengaluru", max_length=80)
    state: str = Field(default="Karnataka", max_length=80)
    postal_code: str = Field(..., min_length=5, max_length=15)
    is_default: bool = False


class CategoryCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    subcategories: list[str] = Field(default_factory=list)
    description: str = Field(..., min_length=5, max_length=500)
    icon_name: str = Field(default="Wrench", max_length=50)


class ServiceCreateRequest(BaseModel):
    category_id: int
    subcategory: str = Field(default="General", max_length=100)
    name: str = Field(..., min_length=3, max_length=160)
    description: str = Field(..., min_length=10)
    base_price: Decimal = Field(..., gt=Decimal("0"))
    duration_minutes: int = Field(default=60, ge=15, le=720)
    image_url: str | None = None
    inclusions: list[str] = Field(default_factory=list)


# --- Provider & Technician Schemas ---
class ProviderVerifyRequest(BaseModel):
    verification_status: str = Field(..., pattern=r"^(Approved|Rejected)$")
    rejection_remarks: str | None = None


class TechnicianCreateRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=150)
    phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    password: str = Field(default="Tech@12345", min_length=8)
    specialization: str = Field(..., min_length=3, max_length=150)
    experience_years: int = Field(default=3, ge=0, le=50)


# --- Booking & Workflow Schemas ---
class BookingCreateRequest(BaseModel):
    service_id: int
    provider_id: int
    address_id: int
    scheduled_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(default="10:30", pattern=r"^\d{2}:\d{2}$")
    problem_description: str = Field(..., min_length=10, max_length=2000)
    coupon_code: str | None = None
    payment_type: str = Field(default="FULL", pattern=r"^(FULL|ADVANCE)$")
    problem_image_urls: list[str] = Field(default_factory=list)


class BookingStatusUpdateRequest(BaseModel):
    status: str = Field(
        ...,
        pattern=r"^(Pending|Confirmed|Provider Assigned|In Progress|Completed|Cancelled|Rejected)$",
    )
    reason: str | None = None


class BookingRescheduleRequest(BaseModel):
    scheduled_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(default="12:30", pattern=r"^\d{2}:\d{2}$")


class AssignTechnicianRequest(BaseModel):
    technician_id: int


class TechnicianJobActionRequest(BaseModel):
    action: str = Field(..., pattern=r"^(ACCEPT|ARRIVE_START|COMPLETE)$")
    completion_remarks: str | None = None
    completion_image_url: str | None = None


# --- Payment & Coupon Schemas ---
class CouponValidateRequest(BaseModel):
    code: str
    subtotal: Decimal


class CouponCreateRequest(BaseModel):
    code: str = Field(..., min_length=3, max_length=40)
    description: str = Field(..., min_length=5, max_length=255)
    discount_type: str = Field(default="PERCENTAGE", pattern=r"^(PERCENTAGE|FLAT)$")
    discount_value: Decimal = Field(..., gt=Decimal("0"))
    min_order_amount: Decimal = Field(default=Decimal("499.00"), ge=Decimal("0"))
    max_discount: Decimal = Field(default=Decimal("500.00"), gt=Decimal("0"))
    valid_until: date = Field(default=date(2026, 12, 31))


class CreatePaymentOrderRequest(BaseModel):
    booking_id: int
    payment_type: str = Field(default="FULL", pattern=r"^(FULL|ADVANCE|BALANCE)$")


class VerifyPaymentRequest(BaseModel):
    booking_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# --- Reviews & Complaints Schemas ---
class ReviewCreateRequest(BaseModel):
    booking_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=5, max_length=1500)


class ReviewReplyRequest(BaseModel):
    provider_reply: str = Field(..., min_length=3, max_length=1000)


class ComplaintCreateRequest(BaseModel):
    booking_id: int
    subject: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)


class ComplaintResolveRequest(BaseModel):
    status: str = Field(..., pattern=r"^(Open|In Review|Resolved|Closed)$")
    admin_resolution_notes: str = Field(..., min_length=5, max_length=1500)

