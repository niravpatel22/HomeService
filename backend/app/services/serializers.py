import json
from decimal import Decimal
from app.models import (
    User,
    Customer,
    ServiceProvider,
    Technician,
    Address,
    ServiceCategory,
    Service,
    Booking,
    Payment,
    Invoice,
    Coupon,
    Review,
    Complaint,
    Notification,
    ProviderEarning,
    SubscriptionPlan,
)


def serialize_booking(b: Booking) -> dict:
    tech_id = b.assignment.technician_id if b.assignment else None
    tech_name = (
        b.assignment.technician.user.full_name
        if b.assignment and b.assignment.technician and b.assignment.technician.user
        else None
    )
    addr_text = (
        f"{b.address.address_line1}, {b.address.city} - {b.address.postal_code}"
        if b.address
        else ""
    )
    return {
        "id": b.id,
        "bookingNumber": b.booking_number,
        "customerId": b.customer_id,
        "customerName": b.customer.user.full_name if b.customer and b.customer.user else "Customer",
        "customerPhone": b.customer.user.phone if b.customer and b.customer.user else "",
        "providerId": b.provider_id,
        "providerName": b.provider.business_name if b.provider else "",
        "serviceId": b.service_id,
        "serviceName": b.service.name if b.service else "",
        "categoryName": (
            b.service.category.name if b.service and b.service.category else "Home Service"
        ),
        "addressId": b.address_id,
        "addressText": addr_text,
        "scheduledDate": b.scheduled_date,
        "startTime": b.start_time,
        "endTime": b.end_time,
        "status": b.status,
        "problemDescription": b.problem_description,
        "subtotal": float(b.subtotal),
        "discountAmount": float(b.discount_amount),
        "taxAmount": float(b.tax_amount),
        "totalAmount": float(b.total_amount),
        "couponCode": b.coupon.code if b.coupon else None,
        "paymentStatus": b.payment_status,
        "paymentType": b.payment_type,
        "paidAmount": float(b.paid_amount),
        "pendingAmount": float(b.pending_amount),
        "technicianId": tech_id,
        "technicianName": tech_name,
        "arrivedAt": b.assignment.arrived_at.isoformat()
        if b.assignment and b.assignment.arrived_at
        else None,
        "completedAt": b.assignment.completed_at.isoformat()
        if b.assignment and b.assignment.completed_at
        else None,
        "completionRemarks": (
            b.assignment.completion_remarks if b.assignment and b.assignment.completion_remarks else ""
        ),
        "cancellationReason": b.cancellation_reason,
        "images": [
            {
                "id": img.id,
                "type": img.image_type,
                "url": img.file_url,
                "caption": img.caption or "Service attachment",
            }
            for img in (b.images or [])
        ],
        "hasReview": b.review is not None,
        "createdAt": b.created_at.isoformat() if b.created_at else None,
    }


def serialize_provider(p: ServiceProvider) -> dict:
    return {
        "id": p.id,
        "userId": p.user_id,
        "businessName": p.business_name,
        "ownerName": p.owner_name,
        "email": p.user.email if p.user else "",
        "phone": p.user.phone if p.user else "",
        "verificationStatus": p.verification_status,
        "kycDocumentName": p.kyc_document_name or "KYC_Document.pdf",
        "rejectionRemarks": p.rejection_remarks,
        "subscriptionPlanId": p.subscription_plan_id or 1,
        "subscriptionPlanName": p.subscription_plan.name if p.subscription_plan else "Standard Partner",
        "commissionPercentage": float(
            p.subscription_plan.commission_percentage if p.subscription_plan else Decimal("15.0")
        ),
        "experienceYears": p.experience_years,
        "averageRating": float(p.average_rating),
        "totalReviews": p.total_reviews,
        "completedJobs": p.completed_jobs_count,
        "bio": p.bio or "",
        "serviceAreas": [
            {
                "id": a.id,
                "city": a.city,
                "postalCode": a.postal_code,
                "areaName": a.area_name,
            }
            for a in (p.service_areas or [])
        ],
        "offeredServices": [
            {
                "serviceId": ps.service_id,
                "customPrice": float(ps.custom_price),
                "customDescription": ps.custom_description or "",
            }
            for ps in (p.provider_services or [])
        ],
        "workingHours": p.working_hours,
        "availableSlots": [s.start_time for s in (p.availability_slots or [])]
        or ["09:00", "11:00", "14:00", "16:00", "18:00"],
    }

