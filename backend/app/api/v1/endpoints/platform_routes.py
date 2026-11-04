import csv
import hashlib
import hmac
import io
import json
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import jwt
from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_razorpay_signature,
    get_current_user,
    hash_password,
    require_roles,
    verify_password,
    verify_razorpay_signature,
)
from app.db.session import get_db
from app.models import (
    Address,
    AvailabilitySlot,
    Booking,
    BookingAssignment,
    BookingImage,
    Complaint,
    Coupon,
    Customer,
    CustomerFavorite,
    Invoice,
    Notification,
    Payment,
    ProviderEarning,
    ProviderService,
    RefreshToken,
    Review,
    Service,
    ServiceArea,
    ServiceCategory,
    ServiceProvider,
    SubscriptionPlan,
    Technician,
    User,
)
from app.schemas.api_schemas import (
    AddressCreateRequest,
    AssignTechnicianRequest,
    BookingCreateRequest,
    BookingRescheduleRequest,
    BookingStatusUpdateRequest,
    CategoryCreateRequest,
    ComplaintCreateRequest,
    ComplaintResolveRequest,
    CouponCreateRequest,
    CouponValidateRequest,
    CreatePaymentOrderRequest,
    CustomerRegisterRequest,
    LoginRequest,
    PasswordResetRequest,
    ProviderRegisterRequest,
    ProviderVerifyRequest,
    ReviewCreateRequest,
    ReviewReplyRequest,
    ServiceCreateRequest,
    TechnicianCreateRequest,
    TechnicianJobActionRequest,
    VerifyPaymentRequest,
)
from app.services.business_logic import (
    calculate_and_record_provider_earning,
    calculate_booking_pricing,
    check_provider_slot_conflict,
    check_technician_slot_conflict,
    quantize_money,
    validate_status_transition,
)
from app.services.serializers import serialize_booking, serialize_provider

router = APIRouter()


# ============================================================================
# MODULE 1: AUTHENTICATION & AUTHORIZATION
# ============================================================================
@router.post("/auth/login", tags=["1. Authentication"])
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended by Super Admin.",
        )

    access_token = create_access_token(user)
    refresh_token = create_refresh_token(db, user)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "fullName": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "isActive": user.is_active,
            "isVerified": user.is_verified,
        },
    }


@router.post("/auth/register/customer", status_code=status.HTTP_201_CREATED, tags=["1. Authentication"])
def register_customer(payload: CustomerRegisterRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    if db.query(User).filter((User.email == email_clean) | (User.phone == payload.phone)).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email or mobile number already exists.",
        )
    user = User(
        full_name=payload.full_name.strip(),
        email=email_clean,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role="customer",
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    customer = Customer(user_id=user.id, account_status="Active", preferred_city="Bengaluru")
    db.add(customer)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user)
    refresh_token = create_refresh_token(db, user)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "fullName": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "isActive": user.is_active,
            "isVerified": user.is_verified,
        },
    }


@router.post("/auth/register/provider", status_code=status.HTTP_201_CREATED, tags=["1. Authentication"])
def register_provider(payload: ProviderRegisterRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    if db.query(User).filter((User.email == email_clean) | (User.phone == payload.phone)).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email or mobile number already exists.",
        )
    user = User(
        full_name=payload.owner_name.strip(),
        email=email_clean,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role="service_provider",
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    db.flush()

    provider = ServiceProvider(
        user_id=user.id,
        business_name=payload.business_name.strip(),
        owner_name=payload.owner_name.strip(),
        bio=payload.bio or "Professional residential service provider.",
        experience_years=payload.experience_years,
        verification_status="Pending",
        kyc_document_name=payload.kyc_document_name,
        kyc_document_path=f"/uploads/private/kyc/{payload.kyc_document_name}",
        subscription_plan_id=1,
    )
    db.add(provider)
    db.flush()

    db.add(
        ServiceArea(
            provider_id=provider.id,
            city=payload.city,
            area_name=payload.city,
            postal_code=payload.postal_code,
        )
    )
    for start, end in [("09:00", "10:30"), ("11:00", "12:30"), ("14:00", "15:30"), ("16:00", "17:30")]:
        db.add(
            AvailabilitySlot(
                provider_id=provider.id,
                day_of_week="ALL",
                start_time=start,
                end_time=end,
                is_available=True,
            )
        )

    matching_services = (
        db.query(Service)
        .filter(Service.category_id.in_(payload.selected_category_ids))
        .all()
    )
    for svc in matching_services:
        db.add(
            ProviderService(
                provider_id=provider.id,
                service_id=svc.id,
                custom_price=svc.base_price,
                custom_description=f"Certified {svc.name} by {provider.business_name}",
            )
        )

    db.add(
        Notification(
            user_id=1,
            role="super_admin",
            title="New Provider KYC Verification Required",
            message=f"{provider.business_name} ({provider.owner_name}) submitted KYC documents.",
            notification_type="ADMIN_ALERT",
            reference_id=provider.id,
        )
    )
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user)
    refresh_token = create_refresh_token(db, user)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "fullName": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "isActive": user.is_active,
            "isVerified": user.is_verified,
        },
    }


@router.get("/auth/me", tags=["1. Authentication"])
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "fullName": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "isActive": current_user.is_active,
        "isVerified": current_user.is_verified,
    }


@router.post("/auth/logout", tags=["1. Authentication"])
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id, RefreshToken.is_revoked == False
    ).update({"is_revoked": True})
    db.commit()
    return {"message": "Logged out and active refresh tokens revoked."}


@router.post("/auth/refresh", tags=["1. Authentication"])
async def refresh_access_token(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    refresh_token = body.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token.",
        )
    try:
        payload = jwt.decode(
            refresh_token,
            settings.JWT_REFRESH_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type.",
        )

    jti = payload.get("jti")
    db_token = db.query(RefreshToken).filter(RefreshToken.token_jti == jti).first()
    if not db_token or db_token.is_revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked.",
        )

    user = db.query(User).filter(User.id == int(payload.get("sub", 0))).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive.",
        )

    return {
        "access_token": create_access_token(user),
        "token_type": "bearer",
    }


@router.post("/auth/reset-password", tags=["1. Authentication"])
def reset_password(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email was not found.")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password reset successfully."}


# ============================================================================
# UNIFIED BOOTSTRAP STATE ENDPOINT (FOR FRONTEND SYNC)
# ============================================================================
@router.get("/bootstrap", tags=["System Bootstrap"])
def get_platform_bootstrap(db: Session = Depends(get_db)):
    users = db.query(User).all()
    customers = db.query(Customer).all()
    providers = db.query(ServiceProvider).all()
    technicians = db.query(Technician).all()
    addresses = db.query(Address).all()
    categories = db.query(ServiceCategory).all()
    services = db.query(Service).all()
    bookings = db.query(Booking).order_by(Booking.id.desc()).all()
    payments = db.query(Payment).order_by(Payment.id.desc()).all()
    invoices = db.query(Invoice).order_by(Invoice.id.desc()).all()
    earnings = db.query(ProviderEarning).order_by(ProviderEarning.id.desc()).all()
    coupons = db.query(Coupon).all()
    reviews = db.query(Review).order_by(Review.id.desc()).all()
    complaints = db.query(Complaint).order_by(Complaint.id.desc()).all()
    notifications = db.query(Notification).order_by(Notification.id.desc()).all()
    plans = db.query(SubscriptionPlan).all()

    return {
        "isMockMode": False,
        "subscriptionPlans": [
            {
                "id": pl.id,
                "name": pl.name,
                "monthlyPrice": float(pl.monthly_price),
                "commissionPercentage": float(pl.commission_percentage),
                "maxServices": pl.max_services,
                "maxTechnicians": pl.max_technicians,
                "features": json.loads(pl.features_json or "[]"),
                "isActive": pl.is_active,
            }
            for pl in plans
        ],
        "users": [
            {
                "id": u.id,
                "fullName": u.full_name,
                "email": u.email,
                "phone": u.phone,
                "role": u.role,
                "isActive": u.is_active,
                "isVerified": u.is_verified,
            }
            for u in users
        ],
        "customers": [
            {
                "id": c.id,
                "userId": c.user_id,
                "fullName": c.user.full_name if c.user else "",
                "email": c.user.email if c.user else "",
                "phone": c.user.phone if c.user else "",
                "favoriteProviderIds": [f.provider_id for f in (c.favorites or [])],
                "accountStatus": c.account_status,
                "totalBookings": len(c.bookings or []),
                "totalSpent": float(
                    sum(b.paid_amount for b in (c.bookings or []))
                ),
            }
            for c in customers
        ],
        "addresses": [
            {
                "id": a.id,
                "customerId": a.customer_id,
                "label": a.label,
                "addressLine1": a.address_line1,
                "landmark": a.landmark or "",
                "city": a.city,
                "state": a.state,
                "postalCode": a.postal_code,
                "isDefault": a.is_default,
            }
            for a in addresses
        ],
        "categories": [
            {
                "id": cat.id,
                "name": cat.name,
                "slug": cat.slug,
                "subcategories": json.loads(cat.subcategories_json or "[]"),
                "description": cat.description or "",
                "iconName": cat.icon_name,
                "isActive": cat.is_active,
                "serviceCount": len(cat.services or []),
            }
            for cat in categories
        ],
        "services": [
            {
                "id": s.id,
                "categoryId": s.category_id,
                "categoryName": s.category.name if s.category else "",
                "subcategory": s.subcategory,
                "name": s.name,
                "description": s.description,
                "basePrice": float(s.base_price),
                "durationMinutes": s.duration_minutes,
                "imageUrl": s.image_url,
                "isActive": s.is_active,
                "rating": float(s.rating),
                "reviewsCount": s.reviews_count,
                "inclusions": json.loads(s.inclusions_json or "[]"),
            }
            for s in services
        ],
        "providers": [serialize_provider(p) for p in providers],
        "technicians": [
            {
                "id": t.id,
                "userId": t.user_id,
                "providerId": t.provider_id,
                "providerName": t.provider.business_name if t.provider else "",
                "fullName": t.user.full_name if t.user else "",
                "email": t.user.email if t.user else "",
                "phone": t.user.phone if t.user else "",
                "specialization": t.specialization,
                "experienceYears": t.experience_years,
                "isAvailable": t.is_available,
                "completedJobsCount": t.completed_jobs_count,
                "rating": float(t.rating),
            }
            for t in technicians
        ],
        "bookings": [serialize_booking(b) for b in bookings],
        "payments": [
            {
                "id": pay.id,
                "bookingId": pay.booking_id,
                "bookingNumber": pay.booking.booking_number if pay.booking else "",
                "customerId": pay.customer_id,
                "amount": float(pay.amount),
                "paymentType": pay.payment_type,
                "status": pay.status,
                "razorpayOrderId": pay.razorpay_order_id,
                "razorpayPaymentId": pay.razorpay_payment_id,
                "createdAt": pay.created_at.isoformat() if pay.created_at else None,
            }
            for pay in payments
        ],
        "invoices": [
            {
                "id": inv.id,
                "invoiceNumber": inv.invoice_number,
                "bookingId": inv.booking_id,
                "bookingNumber": inv.booking.booking_number if inv.booking else "",
                "customerId": inv.customer_id,
                "subtotal": float(inv.subtotal),
                "discount": float(inv.discount_amount),
                "tax": float(inv.tax_amount),
                "totalAmount": float(inv.total_amount),
                "status": inv.status,
                "issuedAt": inv.issued_at.isoformat() if inv.issued_at else None,
            }
            for inv in invoices
        ],
        "providerEarnings": [
            {
                "id": e.id,
                "providerId": e.provider_id,
                "bookingId": e.booking_id,
                "bookingNumber": f"HS-BOOKING-{e.booking_id}",
                "grossAmount": float(e.gross_amount),
                "commissionPercentage": float(e.commission_percentage),
                "commissionAmount": float(e.commission_amount),
                "netEarning": float(e.net_earning),
                "settlementStatus": e.settlement_status,
            }
            for e in earnings
        ],
        "coupons": [
            {
                "id": cp.id,
                "code": cp.code,
                "description": cp.description,
                "discountType": cp.discount_type,
                "discountValue": float(cp.discount_value),
                "minOrderAmount": float(cp.min_order_amount),
                "maxDiscount": float(cp.max_discount),
                "validUntil": cp.valid_until.isoformat(),
                "usageLimit": cp.usage_limit,
                "usedCount": cp.used_count,
                "isActive": cp.is_active,
            }
            for cp in coupons
        ],
        "reviews": [
            {
                "id": r.id,
                "bookingId": r.booking_id,
                "bookingNumber": r.booking.booking_number if r.booking else "",
                "customerId": r.customer_id,
                "customerName": r.booking.customer.user.full_name
                if r.booking and r.booking.customer and r.booking.customer.user
                else "Verified Customer",
                "providerId": r.provider_id,
                "providerName": r.booking.provider.business_name
                if r.booking and r.booking.provider
                else "",
                "serviceName": r.booking.service.name
                if r.booking and r.booking.service
                else "",
                "rating": r.rating,
                "comment": r.comment,
                "providerReply": r.provider_reply or "",
                "isVisible": r.is_visible,
            }
            for r in reviews
        ],
        "complaints": [
            {
                "id": cmp.id,
                "complaintNumber": cmp.complaint_number,
                "bookingId": cmp.booking_id,
                "bookingNumber": f"HS-{cmp.booking_id}",
                "customerId": cmp.customer_id,
                "customerName": "Customer",
                "providerId": cmp.provider_id,
                "providerName": "Service Provider",
                "subject": cmp.subject,
                "description": cmp.description,
                "status": cmp.status,
                "adminResolutionNotes": cmp.admin_resolution_notes or "",
            }
            for cmp in complaints
        ],
        "notifications": [
            {
                "id": n.id,
                "userId": n.user_id,
                "role": n.role,
                "title": n.title,
                "message": n.message,
                "type": n.notification_type,
                "isRead": n.is_read,
            }
            for n in notifications
        ],
        "monthlyAnalytics": [
            {"month": "Jun", "bookings": 48, "revenue": 64200, "commission": 7704, "customers": 32},
            {"month": "Jul", "bookings": 62, "revenue": 84500, "commission": 10140, "customers": 45},
            {"month": "Aug", "bookings": 79, "revenue": 109800, "commission": 13176, "customers": 61},
            {"month": "Sep", "bookings": 94, "revenue": 134600, "commission": 16152, "customers": 78},
            {"month": "Oct", "bookings": 118, "revenue": 168400, "commission": 20208, "customers": 96},
            {"month": "Nov", "bookings": 136, "revenue": 194200, "commission": 23304, "customers": 114},
        ],
    }


# ============================================================================
# MODULE 2: CUSTOMER MANAGEMENT (ADDRESSES, FAVORITES, ACCOUNT STATUS)
# ============================================================================
@router.get("/customers/me/addresses", tags=["2. Customer Management"])
def list_my_addresses(
    current_user: User = Depends(require_roles("customer")),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found.")
    return [
        {
            "id": a.id,
            "customerId": a.customer_id,
            "label": a.label,
            "addressLine1": a.address_line1,
            "landmark": a.landmark,
            "city": a.city,
            "state": a.state,
            "postalCode": a.postal_code,
            "isDefault": a.is_default,
        }
        for a in customer.addresses
    ]


@router.post("/customers/me/addresses", status_code=status.HTTP_201_CREATED, tags=["2. Customer Management"])
def create_my_address(
    payload: AddressCreateRequest,
    current_user: User = Depends(require_roles("customer")),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found.")
    if payload.is_default:
        db.query(Address).filter(Address.customer_id == customer.id).update({"is_default": False})
    addr = Address(
        customer_id=customer.id,
        label=payload.label,
        address_line1=payload.address_line1,
        address_line2=payload.address_line2,
        landmark=payload.landmark,
        city=payload.city,
        state=payload.state,
        postal_code=payload.postal_code,
        is_default=payload.is_default,
    )
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return {
        "id": addr.id,
        "customerId": addr.customer_id,
        "label": addr.label,
        "addressLine1": addr.address_line1,
        "city": addr.city,
        "state": addr.state,
        "postalCode": addr.postal_code,
        "isDefault": addr.is_default,
    }


@router.delete("/customers/me/addresses/{address_id}", tags=["2. Customer Management"])
def delete_my_address(
    address_id: int,
    current_user: User = Depends(require_roles("customer")),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    addr = db.query(Address).filter(Address.id == address_id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found.")
    if addr.customer_id != customer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ownership violation: You cannot delete another customer's address.",
        )
    db.delete(addr)
    db.commit()
    return {"message": "Address deleted."}


@router.post("/customers/me/favorites/{provider_id}", tags=["2. Customer Management"])
def toggle_favorite_provider(
    provider_id: int,
    current_user: User = Depends(require_roles("customer")),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    existing = (
        db.query(CustomerFavorite)
        .filter(
            CustomerFavorite.customer_id == customer.id,
            CustomerFavorite.provider_id == provider_id,
        )
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        return {"favorited": False}
    db.add(CustomerFavorite(customer_id=customer.id, provider_id=provider_id))
    db.commit()
    return {"favorited": True}


@router.patch("/admin/customers/{customer_id}/status", tags=["2. Customer Management"])
def toggle_customer_account_status(
    customer_id: int,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
    customer.account_status = "Suspended" if customer.account_status == "Active" else "Active"
    if customer.user:
        customer.user.is_active = customer.account_status == "Active"
    db.commit()
    return {"id": customer.id, "accountStatus": customer.account_status}


# ============================================================================
# MODULE 3: SERVICE CATEGORY & CATALOG MANAGEMENT
# ============================================================================
@router.get("/categories", tags=["3. Categories & Services"])
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(ServiceCategory).filter(ServiceCategory.is_active == True).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "subcategories": json.loads(c.subcategories_json or "[]"),
            "description": c.description,
            "iconName": c.icon_name,
            "isActive": c.is_active,
        }
        for c in cats
    ]


@router.post("/categories", status_code=status.HTTP_201_CREATED, tags=["3. Categories & Services"])
def create_category(
    payload: CategoryCreateRequest,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db),
):
    slug = payload.name.strip().lower().replace(" ", "-")
    cat = ServiceCategory(
        name=payload.name.strip(),
        slug=slug,
        subcategories_json=json.dumps(payload.subcategories),
        description=payload.description,
        icon_name=payload.icon_name,
        is_active=True,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return {"id": cat.id, "name": cat.name, "slug": cat.slug}


@router.get("/services", tags=["3. Categories & Services"])
def list_services(
    category_id: int | None = None,
    q: str | None = None,
    max_price: Decimal | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Service).filter(Service.is_active == True)
    if category_id is not None:
        query = query.filter(Service.category_id == category_id)
    if max_price is not None:
        query = query.filter(Service.base_price <= max_price)
    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.filter(
            (Service.name.ilike(pattern)) | (Service.description.ilike(pattern))
        )
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": s.id,
                "categoryId": s.category_id,
                "categoryName": s.category.name if s.category else "",
                "subcategory": s.subcategory,
                "name": s.name,
                "description": s.description,
                "basePrice": float(s.base_price),
                "durationMinutes": s.duration_minutes,
                "imageUrl": s.image_url,
                "rating": float(s.rating),
                "reviewsCount": s.reviews_count,
                "inclusions": json.loads(s.inclusions_json or "[]"),
            }
            for s in items
        ],
    }


@router.post("/services", status_code=status.HTTP_201_CREATED, tags=["3. Categories & Services"])
def create_service(
    payload: ServiceCreateRequest,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db),
):
    svc = Service(
        category_id=payload.category_id,
        subcategory=payload.subcategory,
        name=payload.name.strip(),
        description=payload.description,
        base_price=payload.base_price,
        duration_minutes=payload.duration_minutes,
        image_url=payload.image_url
        or "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
        inclusions_json=json.dumps(
            payload.inclusions or ["Verified technician visit", "30-day service warranty"]
        ),
        is_active=True,
    )
    db.add(svc)
    db.commit()
    db.refresh(svc)
    return {"id": svc.id, "name": svc.name, "basePrice": float(svc.base_price)}


# ============================================================================
# MODULE 4: SERVICE PROVIDER MANAGEMENT & KYC VERIFICATION
# ============================================================================
@router.get("/providers", tags=["4. Service Provider Management"])
def list_providers(only_approved: bool = True, db: Session = Depends(get_db)):
    query = db.query(ServiceProvider)
    if only_approved:
        query = query.filter(ServiceProvider.verification_status == "Approved")
    return [serialize_provider(p) for p in query.all()]


@router.patch("/admin/providers/{provider_id}/verify", tags=["4. Service Provider Management"])
def verify_provider_kyc(
    provider_id: int,
    payload: ProviderVerifyRequest,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db),
):
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Service provider not found.")
    provider.verification_status = payload.verification_status
    provider.rejection_remarks = payload.rejection_remarks
    if provider.user:
        provider.user.is_verified = payload.verification_status == "Approved"

    db.add(
        Notification(
            user_id=provider.user_id,
            role="service_provider",
            title=f"KYC Verification {payload.verification_status}",
            message=f"Your provider profile ({provider.business_name}) has been {payload.verification_status.lower()} by Super Admin.",
            notification_type="KYC_UPDATE",
            reference_id=provider.id,
        )
    )
    db.commit()
    db.refresh(provider)
    return serialize_provider(provider)


@router.get("/providers/{provider_id}/available-slots", tags=["4. Service Provider Management"])
def get_provider_available_slots(
    provider_id: int,
    scheduled_date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    db: Session = Depends(get_db),
):
    slots = (
        db.query(AvailabilitySlot)
        .filter(
            AvailabilitySlot.provider_id == provider_id,
            AvailabilitySlot.is_available == True,
        )
        .all()
    )
    result = []
    for s in slots:
        conflict = check_provider_slot_conflict(
            db, provider_id, scheduled_date, s.start_time
        )
        result.append(
            {
                "startTime": s.start_time,
                "endTime": s.end_time,
                "isAvailable": not conflict,
            }
        )
    return result


# ============================================================================
# MODULE 5: BOOKING & APPOINTMENT MANAGEMENT (WITH DOUBLE-BOOKING LOCK)
# ============================================================================
@router.post("/bookings", status_code=status.HTTP_201_CREATED, tags=["5. Booking Management"])
def create_booking(
    payload: BookingCreateRequest,
    current_user: User = Depends(require_roles("customer")),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found.")

    address = db.query(Address).filter(Address.id == payload.address_id).first()
    if not address or address.customer_id != customer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Address does not belong to the authenticated customer.",
        )

    # 1. Server-side price, coupon & provider verification
    pricing = calculate_booking_pricing(
        db=db,
        service_id=payload.service_id,
        provider_id=payload.provider_id,
        coupon_code=payload.coupon_code,
        payment_type=payload.payment_type,
    )

    # 2. Transactional Double-Booking Prevention (Section 6.3)
    if check_provider_slot_conflict(
        db,
        provider_id=payload.provider_id,
        scheduled_date=payload.scheduled_date,
        start_time=payload.start_time,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Double-booking prevented: Provider already has an active appointment on {payload.scheduled_date} at {payload.start_time}.",
        )

    next_seq = db.query(Booking).count() + 105
    booking_number = f"HS-{payload.scheduled_date.replace('-', '')}-0{next_seq}"

    booking = Booking(
        booking_number=booking_number,
        customer_id=customer.id,
        provider_id=payload.provider_id,
        service_id=payload.service_id,
        address_id=payload.address_id,
        coupon_id=pricing["coupon"].id if pricing["coupon"] else None,
        scheduled_date=payload.scheduled_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        status="Pending",
        problem_description=payload.problem_description,
        subtotal=pricing["subtotal"],
        discount_amount=pricing["discount_amount"],
        tax_amount=pricing["tax_amount"],
        total_amount=pricing["total_amount"],
        payment_type=payload.payment_type,
        payment_status="Paid" if pricing["pending_amount"] == Decimal("0.00") else "Pending",
        paid_amount=pricing["payable_now"],
        pending_amount=pricing["pending_amount"],
    )
    db.add(booking)
    db.flush()

    if pricing["coupon"]:
        pricing["coupon"].used_count += 1

    for url in payload.problem_image_urls:
        db.add(
            BookingImage(
                booking_id=booking.id,
                uploaded_by_user_id=current_user.id,
                image_type="PROBLEM",
                file_url=url,
                caption="Customer uploaded problem image",
            )
        )

    # Record initial Razorpay sandbox payment & invoice
    payment = Payment(
        booking_id=booking.id,
        customer_id=customer.id,
        payment_type=payload.payment_type,
        amount=pricing["payable_now"],
        status="Paid",
        razorpay_order_id=f"order_RzpTest_{booking.id}",
        razorpay_payment_id=f"pay_RzpTest_{booking.id}",
        idempotency_key=f"idem_create_{booking.booking_number}",
    )
    db.add(payment)

    invoice = Invoice(
        invoice_number=f"INV-2026-0{booking.id}",
        booking_id=booking.id,
        customer_id=customer.id,
        provider_id=payload.provider_id,
        subtotal=pricing["subtotal"],
        discount_amount=pricing["discount_amount"],
        tax_amount=pricing["tax_amount"],
        total_amount=pricing["total_amount"],
        status="Paid" if pricing["pending_amount"] == Decimal("0.00") else "Partially Paid",
    )
    db.add(invoice)

    db.add(
        Notification(
            user_id=current_user.id,
            role="customer",
            title=f"Booking Confirmed — {booking_number}",
            message=f"Your appointment for {pricing['service'].name} on {payload.scheduled_date} ({payload.start_time}) is registered.",
            notification_type="BOOKING_CONFIRMATION",
            reference_id=booking.id,
        )
    )
    db.add(
        Notification(
            user_id=pricing["provider"].user_id,
            role="service_provider",
            title=f"New Booking Request — {booking_number}",
            message=f"{current_user.full_name} booked {pricing['service'].name} for {payload.scheduled_date} at {payload.start_time}.",
            notification_type="BOOKING_CONFIRMATION",
            reference_id=booking.id,
        )
    )

    db.commit()
    db.refresh(booking)
    return serialize_booking(booking)


@router.get("/bookings", tags=["5. Booking Management"])
def list_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Booking)
    if current_user.role == "customer":
        customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
        query = query.filter(Booking.customer_id == customer.id)
    elif current_user.role == "service_provider":
        provider = (
            db.query(ServiceProvider)
            .filter(ServiceProvider.user_id == current_user.id)
            .first()
        )
        query = query.filter(Booking.provider_id == provider.id)
    elif current_user.role == "technician":
        tech = db.query(Technician).filter(Technician.user_id == current_user.id).first()
        query = query.join(
            BookingAssignment, BookingAssignment.booking_id == Booking.id
        ).filter(BookingAssignment.technician_id == tech.id)

    return [serialize_booking(b) for b in query.order_by(Booking.id.desc()).all()]


@router.get("/bookings/{booking_id}", tags=["5. Booking Management"])
def get_booking_detail(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    # Resource-Level Ownership Enforcement (Anti-IDOR, Section 8.2)
    if current_user.role == "customer":
        customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
        if booking.customer_id != customer.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ownership violation: You cannot view another customer's booking.",
            )
    elif current_user.role == "service_provider":
        provider = (
            db.query(ServiceProvider)
            .filter(ServiceProvider.user_id == current_user.id)
            .first()
        )
        if booking.provider_id != provider.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ownership violation: Booking is not assigned to your provider account.",
            )
    elif current_user.role == "technician":
        tech = db.query(Technician).filter(Technician.user_id == current_user.id).first()
        if not booking.assignment or booking.assignment.technician_id != tech.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ownership violation: Job is not assigned to your technician account.",
            )

    return serialize_booking(booking)


@router.patch("/bookings/{booking_id}/status", tags=["5. Booking Management"])
def update_booking_status(
    booking_id: int,
    payload: BookingStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    # Ownership & Role Validation
    if current_user.role == "customer":
        customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
        if booking.customer_id != customer.id or payload.status != "Cancelled":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customers may only cancel their own eligible bookings.",
            )
    elif current_user.role == "service_provider":
        provider = (
            db.query(ServiceProvider)
            .filter(ServiceProvider.user_id == current_user.id)
            .first()
        )
        if booking.provider_id != provider.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ownership violation: Booking belongs to another provider.",
            )
    elif current_user.role == "technician":
        tech = db.query(Technician).filter(Technician.user_id == current_user.id).first()
        if not tech or not booking.assignment or booking.assignment.technician_id != tech.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ownership violation: Job is not assigned to your technician account.",
            )

    validate_status_transition(booking.status, payload.status)

    if payload.status == "Confirmed":
        if check_provider_slot_conflict(
            db,
            provider_id=booking.provider_id,
            scheduled_date=booking.scheduled_date,
            start_time=booking.start_time,
            exclude_booking_id=booking.id,
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Double-booking prevented: Another booking is already confirmed for this slot.",
            )

    booking.status = payload.status
    if payload.status in ("Cancelled", "Rejected"):
        booking.cancellation_reason = payload.reason or f"Marked {payload.status}"
        if booking.paid_amount > Decimal("0.00"):
            booking.payment_status = "Refunded"

    db.commit()
    db.refresh(booking)
    return serialize_booking(booking)


@router.post("/bookings/{booking_id}/reschedule", tags=["5. Booking Management"])
def reschedule_booking(
    booking_id: int,
    payload: BookingRescheduleRequest,
    current_user: User = Depends(require_roles("customer", "super_admin")),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if current_user.role == "customer":
        customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
        if booking.customer_id != customer.id:
            raise HTTPException(status_code=403, detail="Not your booking.")

    if booking.status not in ("Pending", "Confirmed", "Provider Assigned"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reschedule booking in '{booking.status}' status.",
        )

    if check_provider_slot_conflict(
        db,
        provider_id=booking.provider_id,
        scheduled_date=payload.scheduled_date,
        start_time=payload.start_time,
        exclude_booking_id=booking.id,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Selected slot is already occupied. Double-booking prevented.",
        )

    booking.scheduled_date = payload.scheduled_date
    booking.start_time = payload.start_time
    booking.end_time = payload.end_time
    db.commit()
    db.refresh(booking)
    return serialize_booking(booking)


# ============================================================================
# MODULE 6: TECHNICIAN MANAGEMENT & FIELD EXECUTION
# ============================================================================
@router.post("/technicians", status_code=status.HTTP_201_CREATED, tags=["6. Technician Management"])
def create_technician(
    payload: TechnicianCreateRequest,
    current_user: User = Depends(require_roles("service_provider", "super_admin")),
    db: Session = Depends(get_db),
):
    email_clean = payload.email.strip().lower()
    if db.query(User).filter((User.email == email_clean) | (User.phone == payload.phone)).first():
        raise HTTPException(status_code=400, detail="Email or phone already in use.")

    provider = (
        db.query(ServiceProvider).filter(ServiceProvider.user_id == current_user.id).first()
        if current_user.role == "service_provider"
        else db.query(ServiceProvider).first()
    )

    user = User(
        full_name=payload.full_name.strip(),
        email=email_clean,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role="technician",
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    tech = Technician(
        user_id=user.id,
        provider_id=provider.id,
        specialization=payload.specialization,
        experience_years=payload.experience_years,
        is_available=True,
    )
    db.add(tech)
    db.commit()
    db.refresh(tech)
    return {
        "id": tech.id,
        "fullName": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "specialization": tech.specialization,
        "providerId": tech.provider_id,
    }


@router.post("/bookings/{booking_id}/assign-technician", tags=["6. Technician Management"])
def assign_technician(
    booking_id: int,
    payload: AssignTechnicianRequest,
    current_user: User = Depends(require_roles("service_provider", "super_admin")),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if current_user.role == "service_provider":
        provider = (
            db.query(ServiceProvider)
            .filter(ServiceProvider.user_id == current_user.id)
            .first()
        )
        if booking.provider_id != provider.id:
            raise HTTPException(status_code=403, detail="Booking belongs to another provider.")

    tech = db.query(Technician).filter(Technician.id == payload.technician_id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found.")

    if check_technician_slot_conflict(
        db,
        technician_id=tech.id,
        scheduled_date=booking.scheduled_date,
        start_time=booking.start_time,
        exclude_booking_id=booking.id,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Technician {tech.user.full_name} already has an overlapping job at {booking.start_time}.",
        )

    if booking.assignment:
        booking.assignment.technician_id = tech.id
        booking.assignment.assigned_by_user_id = current_user.id
    else:
        db.add(
            BookingAssignment(
                booking_id=booking.id,
                technician_id=tech.id,
                assigned_by_user_id=current_user.id,
                status="Assigned",
            )
        )

    booking.status = "Provider Assigned"
    db.add(
        Notification(
            user_id=tech.user_id,
            role="technician",
            title=f"New Job Assigned — {booking.booking_number}",
            message=f"You have been assigned to booking {booking.booking_number} on {booking.scheduled_date} ({booking.start_time}).",
            notification_type="TECHNICIAN_ASSIGNED",
            reference_id=booking.id,
        )
    )
    db.commit()
    db.refresh(booking)
    return serialize_booking(booking)


@router.patch("/technicians/me/jobs/{booking_id}", tags=["6. Technician Management"])
def technician_update_job(
    booking_id: int,
    payload: TechnicianJobActionRequest,
    current_user: User = Depends(require_roles("technician", "service_provider", "super_admin")),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking or not booking.assignment:
        raise HTTPException(status_code=404, detail="Assigned job not found.")

    if current_user.role == "technician":
        tech = db.query(Technician).filter(Technician.user_id == current_user.id).first()
        if booking.assignment.technician_id != tech.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ownership violation: This job is assigned to another technician.",
            )

    now = datetime.now(timezone.utc)
    if payload.action in ("ACCEPT", "ARRIVE_START"):
        booking.status = "In Progress"
        booking.assignment.status = "In Progress"
        booking.assignment.arrived_at = now
    elif payload.action == "COMPLETE":
        validate_status_transition(booking.status, "Completed")
        booking.status = "Completed"
        booking.assignment.status = "Completed"
        booking.assignment.completed_at = now
        booking.assignment.completion_remarks = (
            payload.completion_remarks or "Service completed and tested."
        )
        if payload.completion_image_url:
            db.add(
                BookingImage(
                    booking_id=booking.id,
                    uploaded_by_user_id=current_user.id,
                    image_type="COMPLETION",
                    file_url=payload.completion_image_url,
                    caption="Technician service completion proof",
                )
            )
        calculate_and_record_provider_earning(db, booking)

    db.commit()
    db.refresh(booking)
    return serialize_booking(booking)


# ============================================================================
# MODULE 7: PAYMENTS, INVOICES, COUPONS & RAZORPAY VERIFICATION
# ============================================================================
@router.post("/coupons/validate", tags=["7. Payments & Invoices"])
def validate_coupon(payload: CouponValidateRequest, db: Session = Depends(get_db)):
    code_clean = payload.code.strip().upper()
    coupon = (
        db.query(Coupon)
        .filter(Coupon.code == code_clean, Coupon.is_active == True)
        .first()
    )
    if not coupon:
        raise HTTPException(status_code=400, detail="Invalid or inactive coupon code.")
    if payload.subtotal < coupon.min_order_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum booking value of ₹{coupon.min_order_amount} required.",
        )
    if coupon.discount_type == "PERCENTAGE":
        disc = min((payload.subtotal * coupon.discount_value) / Decimal("100"), coupon.max_discount)
    else:
        disc = min(coupon.discount_value, coupon.max_discount)
    return {
        "code": coupon.code,
        "discountAmount": float(quantize_money(disc)),
        "description": coupon.description,
    }


@router.post("/admin/coupons", status_code=status.HTTP_201_CREATED, tags=["7. Payments & Invoices"])
def create_coupon(
    payload: CouponCreateRequest,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db),
):
    cp = Coupon(
        code=payload.code.strip().upper(),
        description=payload.description,
        discount_type=payload.discount_type,
        discount_value=payload.discount_value,
        min_order_amount=payload.min_order_amount,
        max_discount=payload.max_discount,
        valid_from=datetime.now(timezone.utc).date(),
        valid_until=payload.valid_until,
        is_active=True,
    )
    db.add(cp)
    db.commit()
    db.refresh(cp)
    return {"id": cp.id, "code": cp.code}


@router.post("/payments/create-order", tags=["7. Payments & Invoices"])
def create_razorpay_order(
    payload: CreatePaymentOrderRequest,
    current_user: User = Depends(require_roles("customer")),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    if booking.customer_id != customer.id:
        raise HTTPException(status_code=403, detail="Unauthorized booking payment request.")

    amount_due = (
        booking.pending_amount
        if payload.payment_type == "BALANCE" and booking.pending_amount > Decimal("0.00")
        else booking.total_amount
    )
    order_id = f"order_Rzp_{booking.id}_{uuid.uuid4().hex[:8]}"
    sample_payment_id = f"pay_Rzp_{booking.id}_{uuid.uuid4().hex[:8]}"
    test_signature = generate_razorpay_signature(order_id, sample_payment_id)

    payment = Payment(
        booking_id=booking.id,
        customer_id=customer.id,
        payment_type=payload.payment_type,
        amount=amount_due,
        status="Pending",
        razorpay_order_id=order_id,
        idempotency_key=f"idem_{order_id}",
    )
    db.add(payment)
    db.commit()
    return {
        "bookingId": booking.id,
        "amount": float(amount_due),
        "currency": "INR",
        "razorpayOrderId": order_id,
        "testPaymentId": sample_payment_id,
        "testSignature": test_signature,
    }


@router.post("/payments/verify", tags=["7. Payments & Invoices"])
def verify_payment(
    payload: VerifyPaymentRequest,
    current_user: User = Depends(require_roles("customer")),
    db: Session = Depends(get_db),
):
    if not verify_razorpay_signature(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
        payload.razorpay_signature,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment cryptographic signature verification failed.",
        )

    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    payment = (
        db.query(Payment)
        .filter(Payment.razorpay_order_id == payload.razorpay_order_id)
        .first()
    )
    if payment and payment.status == "Paid":
        # Idempotent response
        return {"status": "Paid", "idempotent": True, "bookingId": booking.id}

    if payment:
        payment.status = "Paid"
        payment.razorpay_payment_id = payload.razorpay_payment_id
        payment.razorpay_signature = payload.razorpay_signature

    booking.paid_amount = booking.total_amount
    booking.pending_amount = Decimal("0.00")
    booking.payment_status = "Paid"
    if booking.invoice:
        booking.invoice.status = "Paid"

    db.commit()
    return {"status": "Paid", "bookingId": booking.id}


@router.post("/payments/webhook", tags=["7. Payments & Invoices"])
async def razorpay_webhook_handler(
    request: Request,
    x_razorpay_signature: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if not x_razorpay_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing X-Razorpay-Signature webhook header.",
        )

    raw_body = await request.body()
    expected_sig = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_sig, x_razorpay_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook HMAC-SHA256 signature.",
        )

    payload = json.loads(raw_body.decode("utf-8"))
    event_type = payload.get("event")
    payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    order_id = payment_entity.get("order_id")
    payment_id = payment_entity.get("id")
    error_reason = payment_entity.get("error_description") or "Payment declined by issuing bank"

    if event_type == "payment.captured" and order_id:
        payment = db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
        if payment:
            if payment.status == "Paid":
                return {"status": "acknowledged", "idempotent": True, "event": event_type}
            payment.status = "Paid"
            payment.razorpay_payment_id = payment_id or payment.razorpay_payment_id
            if payment.booking:
                payment.booking.paid_amount = payment.booking.total_amount
                payment.booking.pending_amount = Decimal("0.00")
                payment.booking.payment_status = "Paid"
                if payment.booking.invoice:
                    payment.booking.invoice.status = "Paid"
            db.commit()
    elif event_type == "payment.failed" and order_id:
        payment = db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
        if payment:
            payment.status = "Failed"
            payment.razorpay_payment_id = payment_id or payment.razorpay_payment_id
            if payment.booking:
                payment.booking.payment_status = "Failed"
                payment.booking.paid_amount = Decimal("0.00")
                payment.booking.pending_amount = payment.booking.total_amount
                if payment.booking.invoice:
                    payment.booking.invoice.status = "Payment Failed"
                if payment.booking.customer and payment.booking.customer.user_id:
                    db.add(
                        Notification(
                            user_id=payment.booking.customer.user_id,
                            role="customer",
                            title=f"Payment Failed — {payment.booking.booking_number}",
                            message=f"Razorpay webhook reported payment failure ({error_reason}). Please retry payment from your booking page.",
                            notification_type="PAYMENT_RECEIPT",
                            reference_id=payment.booking.id,
                        )
                    )
            db.commit()

    return {"status": "acknowledged", "event": event_type, "orderId": order_id}


# ============================================================================
# SECURE FILE UPLOAD & PRIVATE KYC DOCUMENT ACCESS ENDPOINTS
# ============================================================================
@router.get("/files/kyc/{provider_id}", tags=["File Security & Uploads"])
def get_private_kyc_document(
    provider_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    provider = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Service provider not found.")

    # Strict ownership & RBAC check: Only owning service_provider or super_admin may access private KYC files
    if current_user.role == "service_provider":
        caller_provider = (
            db.query(ServiceProvider).filter(ServiceProvider.user_id == current_user.id).first()
        )
        if not caller_provider or caller_provider.id != provider.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You cannot access another provider's private KYC document.",
            )
    elif current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Private KYC documents are restricted to the owning provider and Super Admin.",
        )

    return {
        "providerId": provider.id,
        "businessName": provider.business_name,
        "kycDocumentName": provider.kyc_document_name,
        "kycDocumentPath": provider.kyc_document_path,
        "verificationStatus": provider.verification_status,
        "accessClassification": "PRIVATE_AUTHENTICATED_KYC",
    }
@router.post("/files/upload", tags=["File Security & Uploads"])
async def upload_validated_file(
    file: UploadFile = File(...),
    document_category: str = Form("SERVICE_IMAGE"),
    current_user: User = Depends(get_current_user),
):
    allowed_mimes = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "application/pdf": ".pdf",
    }
    if file.content_type not in allowed_mimes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file MIME type '{file.content_type}'. Allowed: JPG, PNG, WEBP, PDF.",
        )

    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )

    safe_name = f"{uuid.uuid4().hex}{allowed_mimes[file.content_type]}"
    subdir = "private_kyc" if document_category == "KYC" else "public_service"
    upload_dir = os.path.join("uploads", subdir)
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, safe_name)
    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "fileName": safe_name,
        "originalName": file.filename,
        "mimeType": file.content_type,
        "sizeBytes": len(content),
        "isPrivate": document_category == "KYC",
        "url": f"/uploads/{subdir}/{safe_name}",
    }


# ============================================================================
# MODULE 8 & 9: NOTIFICATIONS, REVIEWS & COMPLAINTS
# ============================================================================
@router.patch("/notifications/read-all", tags=["8. Notifications"])
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(Notification.user_id == current_user.id).update(
        {"is_read": True}
    )
    db.commit()
    return {"message": "All notifications marked read."}


@router.post("/reviews", status_code=status.HTTP_201_CREATED, tags=["9. Reviews & Complaints"])
def submit_review(
    payload: ReviewCreateRequest,
    current_user: User = Depends(require_roles("customer")),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking or booking.customer_id != customer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review your own bookings.",
        )
    if booking.status != "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only completed bookings are eligible for review.",
        )
    if booking.review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A review has already been submitted for this booking.",
        )

    rev = Review(
        booking_id=booking.id,
        customer_id=customer.id,
        provider_id=booking.provider_id,
        rating=payload.rating,
        comment=payload.comment,
        is_visible=True,
    )
    db.add(rev)
    db.commit()
    db.refresh(rev)
    return {"id": rev.id, "rating": rev.rating, "comment": rev.comment}


@router.post("/reviews/{review_id}/reply", tags=["9. Reviews & Complaints"])
def reply_to_review(
    review_id: int,
    payload: ReviewReplyRequest,
    current_user: User = Depends(require_roles("service_provider", "super_admin")),
    db: Session = Depends(get_db),
):
    rev = db.query(Review).filter(Review.id == review_id).first()
    if not rev:
        raise HTTPException(status_code=404, detail="Review not found.")

    if current_user.role == "service_provider":
        provider = (
            db.query(ServiceProvider).filter(ServiceProvider.user_id == current_user.id).first()
        )
        if not provider or rev.provider_id != provider.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only reply to reviews for your own provider profile.",
            )

    rev.provider_reply = payload.provider_reply
    db.commit()
    return {"id": rev.id, "providerReply": rev.provider_reply}


@router.post("/complaints", status_code=status.HTTP_201_CREATED, tags=["9. Reviews & Complaints"])
def create_complaint(
    payload: ComplaintCreateRequest,
    current_user: User = Depends(require_roles("customer")),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.user_id == current_user.id).first()
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking or booking.customer_id != customer.id:
        raise HTTPException(status_code=403, detail="Not your booking.")

    seq = db.query(Complaint).count() + 1
    cmp = Complaint(
        complaint_number=f"CMP-2026-00{seq}",
        booking_id=booking.id,
        customer_id=customer.id,
        provider_id=booking.provider_id,
        subject=payload.subject,
        description=payload.description,
        status="Open",
    )
    db.add(cmp)
    db.commit()
    db.refresh(cmp)
    return {"id": cmp.id, "complaintNumber": cmp.complaint_number, "status": cmp.status}


@router.patch("/admin/complaints/{complaint_id}", tags=["9. Reviews & Complaints"])
def resolve_complaint(
    complaint_id: int,
    payload: ComplaintResolveRequest,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db),
):
    cmp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not cmp:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    cmp.status = payload.status
    cmp.admin_resolution_notes = payload.admin_resolution_notes
    cmp.resolved_by_user_id = current_user.id
    db.commit()
    return {"id": cmp.id, "status": cmp.status, "adminResolutionNotes": cmp.admin_resolution_notes}


# ============================================================================
# MODULE 10: ANALYTICS & CSV EXPORT
# ============================================================================
@router.get("/analytics/admin", tags=["10. Analytics & Reporting"])
def get_admin_analytics(
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db),
):
    bookings = db.query(Booking).all()
    earnings = db.query(ProviderEarning).all()
    return {
        "totalCustomers": db.query(Customer).count(),
        "totalProviders": db.query(ServiceProvider).count(),
        "totalTechnicians": db.query(Technician).count(),
        "totalBookings": len(bookings),
        "pendingBookings": sum(1 for b in bookings if b.status == "Pending"),
        "completedBookings": sum(1 for b in bookings if b.status == "Completed"),
        "cancelledBookings": sum(1 for b in bookings if b.status in ("Cancelled", "Rejected")),
        "totalRevenue": float(
            sum(b.total_amount for b in bookings if b.payment_status == "Paid")
        ),
        "platformCommission": float(sum(e.commission_amount for e in earnings)),
        "providerEarnings": float(sum(e.net_earning for e in earnings)),
    }


@router.get("/analytics/export-csv", tags=["10. Analytics & Reporting"])
def export_bookings_csv(
    current_user: User = Depends(require_roles("super_admin", "service_provider")),
    db: Session = Depends(get_db),
):
    query = db.query(Booking)
    if current_user.role == "service_provider":
        provider = (
            db.query(ServiceProvider).filter(ServiceProvider.user_id == current_user.id).first()
        )
        query = query.filter(Booking.provider_id == (provider.id if provider else -1))
    bookings = query.all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "BookingNumber",
            "CustomerID",
            "ProviderID",
            "ScheduledDate",
            "StartTime",
            "Status",
            "TotalAmount",
            "PaymentStatus",
        ]
    )
    for b in bookings:
        writer.writerow(
            [
                b.booking_number,
                b.customer_id,
                b.provider_id,
                b.scheduled_date,
                b.start_time,
                b.status,
                float(b.total_amount),
                b.payment_status,
            ]
        )
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=homeserve_bookings_export.csv"},
    )

