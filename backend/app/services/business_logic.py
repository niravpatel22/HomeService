from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import (
    Booking,
    BookingAssignment,
    Coupon,
    ProviderService,
    Service,
    ServiceProvider,
    Technician,
    ProviderEarning,
    Invoice,
    Payment,
    Notification,
)

# Valid Booking Status State Machine (Section 6.2)
ALLOWED_STATUS_TRANSITIONS: dict[str, set[str]] = {
    "Pending": {"Confirmed", "Rejected", "Cancelled"},
    "Confirmed": {"Provider Assigned", "Cancelled"},
    "Provider Assigned": {"In Progress", "Cancelled"},
    "In Progress": {"Completed"},
    "Completed": set(),
    "Cancelled": set(),
    "Rejected": set(),
}

ACTIVE_SLOT_STATUSES = ("Confirmed", "Provider Assigned", "In Progress")


def quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_booking_pricing(
    db: Session,
    service_id: int,
    provider_id: int,
    coupon_code: str | None = None,
    payment_type: str = "FULL",
) -> dict:
    service = db.query(Service).filter(Service.id == service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requested service does not exist or is inactive.",
        )

    provider = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requested service provider does not exist.",
        )

    if provider.verification_status != "Approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unverified or rejected service providers cannot accept bookings.",
        )

    prov_service = (
        db.query(ProviderService)
        .filter(
            ProviderService.provider_id == provider_id,
            ProviderService.service_id == service_id,
            ProviderService.is_active == True,
        )
        .first()
    )
    subtotal = quantize_money(
        prov_service.custom_price if prov_service else service.base_price
    )

    discount_amount = Decimal("0.00")
    coupon_obj = None
    if coupon_code and coupon_code.strip():
        code_clean = coupon_code.strip().upper()
        coupon_obj = (
            db.query(Coupon)
            .filter(Coupon.code == code_clean, Coupon.is_active == True)
            .first()
        )
        if not coupon_obj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon code '{code_clean}' is invalid or inactive.",
            )
        today = date.today()
        if coupon_obj.valid_until < today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon code '{code_clean}' has expired.",
            )
        if coupon_obj.used_count >= coupon_obj.usage_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon code '{code_clean}' usage limit reached.",
            )
        if subtotal < coupon_obj.min_order_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon '{code_clean}' requires a minimum order of ₹{coupon_obj.min_order_amount}.",
            )
        if coupon_obj.discount_type == "PERCENTAGE":
            raw_disc = (subtotal * coupon_obj.discount_value) / Decimal("100")
            discount_amount = quantize_money(min(raw_disc, coupon_obj.max_discount))
        else:
            discount_amount = quantize_money(
                min(coupon_obj.discount_value, coupon_obj.max_discount)
            )

    taxable_amount = max(subtotal - discount_amount, Decimal("0.00"))
    tax_rate = Decimal(str(settings.DEFAULT_TAX_PERCENT)) / Decimal("100")
    tax_amount = quantize_money(taxable_amount * tax_rate)
    total_amount = quantize_money(taxable_amount + tax_amount)

    if payment_type == "ADVANCE":
        payable_now = quantize_money(total_amount * Decimal("0.25"))
    else:
        payable_now = total_amount

    pending_amount = quantize_money(total_amount - payable_now)

    return {
        "service": service,
        "provider": provider,
        "coupon": coupon_obj,
        "subtotal": subtotal,
        "discount_amount": discount_amount,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
        "payable_now": payable_now,
        "pending_amount": pending_amount,
    }


def check_provider_slot_conflict(
    db: Session,
    provider_id: int,
    scheduled_date: str,
    start_time: str,
    exclude_booking_id: int | None = None,
) -> bool:
    """
    Transactional Double-Booking Prevention (Section 6.3).
    Acquires row-level lock where supported by RDBMS and checks for overlapping active slots.
    """
    query = (
        db.query(Booking)
        .with_for_update()
        .filter(
            Booking.provider_id == provider_id,
            Booking.scheduled_date == scheduled_date,
            Booking.start_time == start_time,
            Booking.status.in_(ACTIVE_SLOT_STATUSES),
        )
    )
    if exclude_booking_id is not None:
        query = query.filter(Booking.id != exclude_booking_id)

    return query.first() is not None


def check_technician_slot_conflict(
    db: Session,
    technician_id: int,
    scheduled_date: str,
    start_time: str,
    exclude_booking_id: int | None = None,
) -> bool:
    query = (
        db.query(Booking)
        .join(BookingAssignment, BookingAssignment.booking_id == Booking.id)
        .with_for_update()
        .filter(
            BookingAssignment.technician_id == technician_id,
            Booking.scheduled_date == scheduled_date,
            Booking.start_time == start_time,
            Booking.status.in_(("Provider Assigned", "In Progress")),
        )
    )
    if exclude_booking_id is not None:
        query = query.filter(Booking.id != exclude_booking_id)

    return query.first() is not None


def validate_status_transition(current_status: str, next_status: str) -> None:
    if current_status == next_status:
        return
    allowed = ALLOWED_STATUS_TRANSITIONS.get(current_status, set())
    if next_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid booking status transition from '{current_status}' to '{next_status}'. Allowed: {sorted(allowed)}",
        )


def calculate_and_record_provider_earning(
    db: Session, booking: Booking, payment_id: int | None = None
) -> ProviderEarning:
    existing = (
        db.query(ProviderEarning)
        .filter(ProviderEarning.booking_id == booking.id)
        .first()
    )
    if existing:
        return existing

    provider = (
        db.query(ServiceProvider)
        .filter(ServiceProvider.id == booking.provider_id)
        .first()
    )
    comm_pct = Decimal(str(settings.DEFAULT_PLATFORM_COMMISSION_PERCENT))
    if provider and provider.subscription_plan:
        comm_pct = provider.subscription_plan.commission_percentage

    gross = booking.total_amount
    comm_amt = quantize_money((gross * comm_pct) / Decimal("100"))
    net_earning = quantize_money(gross - comm_amt)

    earning = ProviderEarning(
        provider_id=booking.provider_id,
        booking_id=booking.id,
        payment_id=payment_id,
        gross_amount=gross,
        commission_percentage=comm_pct,
        commission_amount=comm_amt,
        net_earning=net_earning,
        settlement_status="Settled",
    )
    db.add(earning)
    return earning

