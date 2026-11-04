import json
from datetime import date, datetime, timezone
from decimal import Decimal
from sqlalchemy.orm import Session
from app.db.session import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models import (
    User,
    SubscriptionPlan,
    Customer,
    ServiceProvider,
    Technician,
    Address,
    ServiceCategory,
    Service,
    ProviderService,
    ServiceArea,
    AvailabilitySlot,
    Coupon,
    Booking,
    BookingAssignment,
    BookingImage,
    Payment,
    Invoice,
    Review,
    Complaint,
    Notification,
    ProviderEarning,
    CustomerFavorite,
)


def seed_database(db: Session | None = None) -> dict:
    owns_session = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        owns_session = True

    try:
        existing_admin = db.query(User).filter(User.email == "admin@homeserve.com").first()
        if existing_admin:
            return {"status": "already_seeded", "users_count": db.query(User).count()}

        # 1. Subscription Plans
        plans = [
            SubscriptionPlan(
                id=1,
                name="Standard Partner",
                monthly_price=Decimal("0.00"),
                commission_percentage=Decimal("15.00"),
                max_services=10,
                max_technicians=5,
                features_json=json.dumps(
                    [
                        "Verified Partner Badge",
                        "Standard Search Listing",
                        "Up to 5 Field Technicians",
                        "15% Platform Commission",
                    ]
                ),
                is_active=True,
            ),
            SubscriptionPlan(
                id=2,
                name="Pro Growth Partner",
                monthly_price=Decimal("999.00"),
                commission_percentage=Decimal("10.00"),
                max_services=50,
                max_technicians=25,
                features_json=json.dumps(
                    [
                        "Priority Discovery Placement",
                        "Lower 10% Commission",
                        "Up to 25 Field Technicians",
                        "Advanced Revenue Analytics",
                    ]
                ),
                is_active=True,
            ),
            SubscriptionPlan(
                id=3,
                name="Enterprise Fleet",
                monthly_price=Decimal("2499.00"),
                commission_percentage=Decimal("7.00"),
                max_services=200,
                max_technicians=100,
                features_json=json.dumps(
                    [
                        "Lowest 7% Commission",
                        "Unlimited Service Areas",
                        "Up to 100 Technicians",
                        "Dedicated Dispute Support",
                    ]
                ),
                is_active=True,
            ),
        ]
        db.add_all(plans)
        db.flush()

        # 2. Users (All 4 Roles with Bcrypt Hashes)
        users = [
            User(
                id=1,
                full_name="Vikramaditya Rao (Super Admin)",
                email="admin@homeserve.com",
                phone="9876543210",
                password_hash=hash_password("Admin@12345"),
                role="super_admin",
                is_active=True,
                is_verified=True,
            ),
            User(
                id=2,
                full_name="Aarav Mehta",
                email="customer@homeserve.com",
                phone="9820112233",
                password_hash=hash_password("Customer@123"),
                role="customer",
                is_active=True,
                is_verified=True,
            ),
            User(
                id=3,
                full_name="Priya Sharma",
                email="priya.sharma@example.com",
                phone="9811223344",
                password_hash=hash_password("Customer@123"),
                role="customer",
                is_active=True,
                is_verified=True,
            ),
            User(
                id=4,
                full_name="Rajesh Kulkarni",
                email="provider@homeserve.com",
                phone="9845098450",
                password_hash=hash_password("Provider@123"),
                role="service_provider",
                is_active=True,
                is_verified=True,
            ),
            User(
                id=5,
                full_name="Suresh Nair",
                email="pending.provider@homeserve.com",
                phone="9845111222",
                password_hash=hash_password("Provider@123"),
                role="service_provider",
                is_active=True,
                is_verified=False,
            ),
            User(
                id=6,
                full_name="Kiran Deshmukh",
                email="sparkle.clean@homeserve.com",
                phone="9822334455",
                password_hash=hash_password("Provider@123"),
                role="service_provider",
                is_active=True,
                is_verified=True,
            ),
            User(
                id=7,
                full_name="Manoj Kumar",
                email="tech@homeserve.com",
                phone="9765432109",
                password_hash=hash_password("Tech@12345"),
                role="technician",
                is_active=True,
                is_verified=True,
            ),
            User(
                id=8,
                full_name="Ravi Verma",
                email="ravi.tech@homeserve.com",
                phone="9765432199",
                password_hash=hash_password("Tech@12345"),
                role="technician",
                is_active=True,
                is_verified=True,
            ),
        ]
        db.add_all(users)
        db.flush()

        # 3. Customers
        customers = [
            Customer(id=1, user_id=2, account_status="Active", preferred_city="Bengaluru"),
            Customer(id=2, user_id=3, account_status="Active", preferred_city="Bengaluru"),
        ]
        db.add_all(customers)
        db.flush()

        # 4. Addresses
        addresses = [
            Address(
                id=1,
                customer_id=1,
                label="Home",
                address_line1="Flat 402, Emerald Heights, Indiranagar 100 Ft Road",
                landmark="Near Metro Station",
                city="Bengaluru",
                state="Karnataka",
                postal_code="560038",
                is_default=True,
            ),
            Address(
                id=2,
                customer_id=1,
                label="Office Studio",
                address_line1="Suite 210, Prestige Tech Park, Outer Ring Road",
                landmark="Opposite Bellandur Gate",
                city="Bengaluru",
                state="Karnataka",
                postal_code="560103",
                is_default=False,
            ),
            Address(
                id=3,
                customer_id=2,
                label="Home",
                address_line1="B-14, Green Park Extension, Koramangala 4th Block",
                landmark="Behind Sony World Signal",
                city="Bengaluru",
                state="Karnataka",
                postal_code="560034",
                is_default=True,
            ),
        ]
        db.add_all(addresses)
        db.flush()

        # 5. Service Categories (All 8 Canonical Categories)
        categories = [
            ServiceCategory(
                id=1,
                name="Electrical Services",
                slug="electrical-services",
                subcategories_json=json.dumps(
                    [
                        "Wiring & Rewiring",
                        "Switchboard & Socket Repair",
                        "Fan & Chandelier Installation",
                        "MCB & Inverter Diagnostics",
                    ]
                ),
                description="Certified residential electricians for safe wiring, switchboards, lighting, and breaker repairs.",
                icon_name="Zap",
                is_active=True,
            ),
            ServiceCategory(
                id=2,
                name="Plumbing Services",
                slug="plumbing-services",
                subcategories_json=json.dumps(
                    [
                        "Leakage & Pipe Repair",
                        "Tap & Sanitary Fitting",
                        "Drainage Unblocking",
                        "Water Tank Cleaning",
                    ]
                ),
                description="Rapid leak detection, bathroom fittings, pipeline replacement, and hydro-jet drain clearing.",
                icon_name="Droplets",
                is_active=True,
            ),
            ServiceCategory(
                id=3,
                name="AC Repair & Maintenance",
                slug="ac-repair-maintenance",
                subcategories_json=json.dumps(
                    [
                        "Foam-Jet Deep Servicing",
                        "Refrigerant Gas Refill",
                        "AC Installation & Uninstallation",
                        "Compressor & PCB Repair",
                    ]
                ),
                description="Expert split and window AC servicing, gas charging, cooling diagnostics, and installations.",
                icon_name="Wind",
                is_active=True,
            ),
            ServiceCategory(
                id=4,
                name="Home Cleaning",
                slug="home-cleaning",
                subcategories_json=json.dumps(
                    [
                        "Full Home Deep Cleaning",
                        "Kitchen Degreasing",
                        "Bathroom Acid-Free Sanitization",
                        "Sofa & Mattress Shampooing",
                    ]
                ),
                description="Hospital-grade deep sanitization for apartments, villas, kitchens, bathrooms, and upholstery.",
                icon_name="Sparkles",
                is_active=True,
            ),
            ServiceCategory(
                id=5,
                name="Painting Services",
                slug="painting-services",
                subcategories_json=json.dumps(
                    [
                        "Interior Emulsion Painting",
                        "Exterior Weatherproof Coating",
                        "Damp & Seepage Waterproofing",
                        "Wood Polish & Texture",
                    ]
                ),
                description="Laser-measured dust-free home painting, waterproofing, and designer wall textures.",
                icon_name="Paintbrush",
                is_active=True,
            ),
            ServiceCategory(
                id=6,
                name="Carpentry Services",
                slug="carpentry-services",
                subcategories_json=json.dumps(
                    [
                        "Door & Smart Lock Installation",
                        "Modular Furniture Assembly",
                        "Cupboard Hinge & Channel Repair",
                        "Custom Woodwork",
                    ]
                ),
                description="Precision carpentry for doors, smart locks, wardrobes, beds, and custom residential woodwork.",
                icon_name="Hammer",
                is_active=True,
            ),
            ServiceCategory(
                id=7,
                name="Appliance Repair",
                slug="appliance-repair",
                subcategories_json=json.dumps(
                    [
                        "Washing Machine Repair",
                        "Refrigerator Diagnostics",
                        "RO Water Purifier Service",
                        "Microwave & Geyser Repair",
                    ]
                ),
                description="OEM-grade troubleshooting and spare replacement for kitchen and laundry home appliances.",
                icon_name="Wrench",
                is_active=True,
            ),
            ServiceCategory(
                id=8,
                name="Pest Control",
                slug="pest-control",
                subcategories_json=json.dumps(
                    [
                        "Odorless Cockroach & Ant Gel",
                        "Anti-Termite Drill Treatment",
                        "Bed Bug Eradication",
                        "Mosquito Fogging",
                    ]
                ),
                description="WHO-approved herbal and odorless pest eradication safe for children, seniors, and pets.",
                icon_name="ShieldCheck",
                is_active=True,
            ),
        ]
        db.add_all(categories)
        db.flush()

        # 6. Services
        services = [
            Service(
                id=1,
                category_id=1,
                subcategory="Switchboard & Socket Repair",
                name="Complete Switchboard, MCB & Wiring Safety Inspection",
                description="Comprehensive thermal and load inspection of distribution boards, replacement of faulty modular switches/sockets, earthing verification, and short-circuit remediation.",
                base_price=Decimal("599.00"),
                duration_minutes=60,
                image_url="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80",
                inclusions_json=json.dumps(
                    [
                        "Complete MCB load test",
                        "Up to 3 switch/socket replacements",
                        "Earthing voltage check",
                        "30-day workmanship warranty",
                    ]
                ),
                rating=Decimal("4.90"),
                reviews_count=128,
                is_active=True,
            ),
            Service(
                id=2,
                category_id=3,
                subcategory="Foam-Jet Deep Servicing",
                name="Split AC High-Pressure Foam-Jet Deep Service",
                description="2x deeper coil cleaning using high-pressure jet pump and biodegradable foam, drain tray flushing, blower sanitization, and gas pressure check.",
                base_price=Decimal("799.00"),
                duration_minutes=90,
                image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80",
                inclusions_json=json.dumps(
                    [
                        "Indoor evaporator coil foam wash",
                        "Outdoor condenser high-pressure jet wash",
                        "Drain pipe unclogging",
                        "Coolant pressure test",
                    ]
                ),
                rating=Decimal("4.80"),
                reviews_count=214,
                is_active=True,
            ),
            Service(
                id=3,
                category_id=2,
                subcategory="Leakage & Pipe Repair",
                name="Bathroom Leakage, Mixer Tap & Pipeline Overhaul",
                description="Precision fixing of concealed/exposed pipe leaks, quarter-turn cartridge replacement, flush tank servicing, and pressure balancing.",
                base_price=Decimal("499.00"),
                duration_minutes=60,
                image_url="https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=900&q=80",
                inclusions_json=json.dumps(
                    [
                        "Tap/mixer leak resolution",
                        "Syphon & flush valve adjustment",
                        "Drain trap cleaning",
                        "Clean post-work handover",
                    ]
                ),
                rating=Decimal("4.70"),
                reviews_count=96,
                is_active=True,
            ),
            Service(
                id=4,
                category_id=4,
                subcategory="Full Home Deep Cleaning",
                name="2BHK / 3BHK Intensive Deep Home Sanitization",
                description="5-star residential deep cleaning using industrial single-disc scrubbers, steam sanitizers, kitchen chimney degreasing, and bathroom descaling.",
                base_price=Decimal("2499.00"),
                duration_minutes=180,
                image_url="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
                inclusions_json=json.dumps(
                    [
                        "Machine floor scrubbing",
                        "Kitchen cabinet & exhaust degreasing",
                        "Bathroom tile descaling",
                        "Sofa dry vacuuming",
                    ]
                ),
                rating=Decimal("4.90"),
                reviews_count=182,
                is_active=True,
            ),
            Service(
                id=5,
                category_id=5,
                subcategory="Interior Emulsion Painting",
                name="Express Room Wall Repainting & Dampness Treatment",
                description="Low-VOC luxury interior emulsion painting with 2-coat acrylic putty leveling, crack filling, mechanized sanding, and full furniture masking.",
                base_price=Decimal("3499.00"),
                duration_minutes=240,
                image_url="https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=80",
                inclusions_json=json.dumps(
                    [
                        "Laser area measurement",
                        "Crack filling & damp primer coat",
                        "2 coats premium emulsion",
                        "Post-paint cleanup",
                    ]
                ),
                rating=Decimal("4.80"),
                reviews_count=64,
                is_active=True,
            ),
            Service(
                id=6,
                category_id=6,
                subcategory="Door & Smart Lock Installation",
                name="Smart Digital Door Lock & Wardrobe Hardware Service",
                description="Expert mortise cutting and installation of biometric smart locks, hydraulic door closers, soft-close wardrobe hinges, and telescopic drawer channels.",
                base_price=Decimal("699.00"),
                duration_minutes=75,
                image_url="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80",
                inclusions_json=json.dumps(
                    [
                        "Precision jig template routing",
                        "Smart lock calibration",
                        "Up to 4 hinge alignments",
                        "Sawdust vacuum cleanup",
                    ]
                ),
                rating=Decimal("4.80"),
                reviews_count=73,
                is_active=True,
            ),
            Service(
                id=7,
                category_id=7,
                subcategory="Washing Machine Repair",
                name="Front-Load / Top-Load Washing Machine & Refrigerator Diagnostics",
                description="Complete digital error-code diagnostics, drum bearing/suspension check, drain pump cleaning, and refrigerator thermostat/inverter PCB repair.",
                base_price=Decimal("549.00"),
                duration_minutes=60,
                image_url="https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=80",
                inclusions_json=json.dumps(
                    [
                        "Multi-point digital PCB check",
                        "Filter & drain hose flushing",
                        "Spin balance calibration",
                        "90-day service warranty",
                    ]
                ),
                rating=Decimal("4.70"),
                reviews_count=110,
                is_active=True,
            ),
            Service(
                id=8,
                category_id=8,
                subcategory="Odorless Cockroach & Ant Gel",
                name="Odorless Herbal Gel & Spray General Pest Control",
                description="Bayer/WHO-certified odorless gel baiting and residual spray treatment targeting cockroaches, red/black ants, silverfish, and spiders.",
                base_price=Decimal("999.00"),
                duration_minutes=60,
                image_url="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80",
                inclusions_json=json.dumps(
                    [
                        "No need to empty kitchen cabinets",
                        "Child & pet safe herbal gel",
                        "Drain & crevice barrier spray",
                        "60-day free re-treatment assurance",
                    ]
                ),
                rating=Decimal("4.90"),
                reviews_count=89,
                is_active=True,
            ),
        ]
        db.add_all(services)
        db.flush()

        # 7. Service Providers
        providers = [
            ServiceProvider(
                id=1,
                user_id=4,
                business_name="Apex Electrical & AC Solutions",
                owner_name="Rajesh Kulkarni",
                bio="ISO-certified electrical, HVAC, and appliance engineering team with 9+ years serving residential communities across Bengaluru.",
                experience_years=9,
                verification_status="Approved",
                kyc_document_name="Apex_GST_And_Trade_License_Verified.pdf",
                kyc_document_path="/uploads/private/kyc/Apex_GST_And_Trade_License_Verified.pdf",
                subscription_plan_id=2,
                average_rating=Decimal("4.90"),
                total_reviews=84,
                completed_jobs_count=312,
                working_hours="Mon – Sun: 08:00 AM – 08:00 PM",
            ),
            ServiceProvider(
                id=2,
                user_id=5,
                business_name="Metro Rapid Plumbing & Carpentry Works",
                owner_name="Suresh Nair",
                bio="Specialized residential plumbing, waterproofing, and custom modular carpentry works.",
                experience_years=5,
                verification_status="Pending",
                kyc_document_name="Suresh_Aadhaar_And_Shop_Establishment.pdf",
                kyc_document_path="/uploads/private/kyc/Suresh_Aadhaar_And_Shop_Establishment.pdf",
                subscription_plan_id=1,
                average_rating=Decimal("0.00"),
                total_reviews=0,
                completed_jobs_count=0,
                working_hours="Mon – Sat: 09:00 AM – 07:00 PM",
            ),
            ServiceProvider(
                id=3,
                user_id=6,
                business_name="SparklePro Hygiene & Pest Control Services",
                owner_name="Kiran Deshmukh",
                bio="Eco-friendly home deep sanitization, mechanized floor scrubbing, interior painting, and odorless pest control.",
                experience_years=7,
                verification_status="Approved",
                kyc_document_name="SparklePro_Incorporation_And_Pest_License.pdf",
                kyc_document_path="/uploads/private/kyc/SparklePro_Incorporation_And_Pest_License.pdf",
                subscription_plan_id=2,
                average_rating=Decimal("4.80"),
                total_reviews=62,
                completed_jobs_count=198,
                working_hours="Mon – Sun: 08:30 AM – 07:30 PM",
            ),
        ]
        db.add_all(providers)
        db.flush()

        # 8. Provider Services
        provider_services = [
            ProviderService(
                provider_id=1,
                service_id=1,
                custom_price=Decimal("599.00"),
                custom_description="Includes Fluke thermal check & earthing certification.",
            ),
            ProviderService(
                provider_id=1,
                service_id=2,
                custom_price=Decimal("799.00"),
                custom_description="High-pressure Bosch foam-jet wash + refrigerant check.",
            ),
            ProviderService(
                provider_id=1,
                service_id=3,
                custom_price=Decimal("499.00"),
                custom_description="Complete Grohe/Jaquar mixer & pipeline leak remediation.",
            ),
            ProviderService(
                provider_id=1,
                service_id=7,
                custom_price=Decimal("549.00"),
                custom_description="Bosch, LG, Samsung, Whirlpool front/top-load specialist.",
            ),
            ProviderService(
                provider_id=2,
                service_id=3,
                custom_price=Decimal("479.00"),
                custom_description="Emergency leak and pipe fitting.",
            ),
            ProviderService(
                provider_id=2,
                service_id=6,
                custom_price=Decimal("649.00"),
                custom_description="Door locks and wardrobe hardware.",
            ),
            ProviderService(
                provider_id=3,
                service_id=4,
                custom_price=Decimal("2499.00"),
                custom_description="4-member crew with Kärcher steam & scrubbing machines.",
            ),
            ProviderService(
                provider_id=3,
                service_id=5,
                custom_price=Decimal("3499.00"),
                custom_description="Asian Paints Royale mechanized dust-free painting.",
            ),
            ProviderService(
                provider_id=3,
                service_id=8,
                custom_price=Decimal("999.00"),
                custom_description="Bayer odorless gel + herbal perimeter spray.",
            ),
        ]
        db.add_all(provider_services)
        db.flush()

        # 9. Service Areas
        areas = [
            ServiceArea(provider_id=1, city="Bengaluru", area_name="Indiranagar", postal_code="560038"),
            ServiceArea(provider_id=1, city="Bengaluru", area_name="Bellandur & ORR", postal_code="560103"),
            ServiceArea(provider_id=1, city="Bengaluru", area_name="Koramangala", postal_code="560034"),
            ServiceArea(provider_id=2, city="Bengaluru", area_name="Indiranagar", postal_code="560038"),
            ServiceArea(provider_id=3, city="Bengaluru", area_name="Indiranagar", postal_code="560038"),
            ServiceArea(provider_id=3, city="Bengaluru", area_name="Koramangala", postal_code="560034"),
        ]
        db.add_all(areas)
        db.flush()

        # 10. Availability Slots
        for prov_id in (1, 2, 3):
            for start, end in [("09:00", "10:30"), ("11:00", "12:30"), ("14:00", "15:30"), ("16:00", "17:30"), ("18:00", "19:30")]:
                db.add(
                    AvailabilitySlot(
                        provider_id=prov_id,
                        day_of_week="ALL",
                        start_time=start,
                        end_time=end,
                        is_available=True,
                    )
                )
        db.flush()

        # 11. Technicians
        technicians = [
            Technician(
                id=1,
                user_id=7,
                provider_id=1,
                specialization="Senior HVAC & Electrical Diagnostic Technician",
                experience_years=6,
                is_available=True,
                completed_jobs_count=148,
                rating=Decimal("4.90"),
            ),
            Technician(
                id=2,
                user_id=8,
                provider_id=1,
                specialization="Master Electrician & Appliance Specialist",
                experience_years=4,
                is_available=True,
                completed_jobs_count=92,
                rating=Decimal("4.80"),
            ),
        ]
        db.add_all(technicians)
        db.flush()

        # 12. Coupons
        coupons = [
            Coupon(
                id=1,
                code="WELCOME20",
                description="20% off on your first home service booking (up to ₹500)",
                discount_type="PERCENTAGE",
                discount_value=Decimal("20.00"),
                min_order_amount=Decimal("499.00"),
                max_discount=Decimal("500.00"),
                valid_from=date(2026, 1, 1),
                valid_until=date(2026, 12, 31),
                usage_limit=500,
                used_count=142,
                is_active=True,
            ),
            Coupon(
                id=2,
                code="FLAT150",
                description="Flat ₹150 instant discount on deep cleaning & painting bookings above ₹999",
                discount_type="FLAT",
                discount_value=Decimal("150.00"),
                min_order_amount=Decimal("999.00"),
                max_discount=Decimal("150.00"),
                valid_from=date(2026, 1, 1),
                valid_until=date(2026, 12, 31),
                usage_limit=300,
                used_count=68,
                is_active=True,
            ),
        ]
        db.add_all(coupons)
        db.flush()

        # 13. Bookings
        bookings = [
            Booking(
                id=101,
                booking_number="HS-20261028-0101",
                customer_id=1,
                provider_id=1,
                service_id=2,
                address_id=1,
                coupon_id=1,
                scheduled_date="2026-10-28",
                start_time="11:00",
                end_time="12:30",
                status="Completed",
                problem_description="Master bedroom 1.5 Ton Daikin Split AC has low airflow and mild water dripping from indoor unit.",
                subtotal=Decimal("799.00"),
                discount_amount=Decimal("159.80"),
                tax_amount=Decimal("115.06"),
                total_amount=Decimal("754.26"),
                payment_type="FULL",
                payment_status="Paid",
                paid_amount=Decimal("754.26"),
                pending_amount=Decimal("0.00"),
            ),
            Booking(
                id=102,
                booking_number="HS-20261105-0102",
                customer_id=1,
                provider_id=1,
                service_id=1,
                address_id=1,
                coupon_id=None,
                scheduled_date="2026-11-05",
                start_time="14:00",
                end_time="15:30",
                status="Provider Assigned",
                problem_description="Kitchen 16A geyser/microwave socket sparking intermittently and main distribution MCB tripping under peak load.",
                subtotal=Decimal("599.00"),
                discount_amount=Decimal("0.00"),
                tax_amount=Decimal("107.82"),
                total_amount=Decimal("706.82"),
                payment_type="ADVANCE",
                payment_status="Pending",
                paid_amount=Decimal("176.71"),
                pending_amount=Decimal("530.11"),
            ),
            Booking(
                id=103,
                booking_number="HS-20261106-0103",
                customer_id=2,
                provider_id=1,
                service_id=3,
                address_id=3,
                coupon_id=None,
                scheduled_date="2026-11-06",
                start_time="09:00",
                end_time="10:30",
                status="Pending",
                problem_description="Hot/cold wall diverter leaking continuously and low pressure in overhead shower line.",
                subtotal=Decimal("499.00"),
                discount_amount=Decimal("0.00"),
                tax_amount=Decimal("89.82"),
                total_amount=Decimal("588.82"),
                payment_type="FULL",
                payment_status="Paid",
                paid_amount=Decimal("588.82"),
                pending_amount=Decimal("0.00"),
            ),
            Booking(
                id=104,
                booking_number="HS-20261101-0104",
                customer_id=1,
                provider_id=3,
                service_id=4,
                address_id=2,
                coupon_id=2,
                scheduled_date="2026-11-01",
                start_time="09:00",
                end_time="12:00",
                status="Completed",
                problem_description="Pre-festive full deep sanitization of 2BHK apartment including balcony and kitchen chimney.",
                subtotal=Decimal("2499.00"),
                discount_amount=Decimal("150.00"),
                tax_amount=Decimal("422.82"),
                total_amount=Decimal("2771.82"),
                payment_type="FULL",
                payment_status="Paid",
                paid_amount=Decimal("2771.82"),
                pending_amount=Decimal("0.00"),
            ),
        ]
        db.add_all(bookings)
        db.flush()

        # 14. Booking Assignments
        assignments = [
            BookingAssignment(
                booking_id=101,
                technician_id=1,
                assigned_by_user_id=4,
                status="Completed",
                arrived_at=datetime(2026, 10, 28, 10, 55, tzinfo=timezone.utc),
                completed_at=datetime(2026, 10, 28, 12, 18, tzinfo=timezone.utc),
                completion_remarks="Completed high-pressure foam-jet cleaning of evaporator and condenser coils. Cleared choked drain pipe.",
            ),
            BookingAssignment(
                booking_id=102,
                technician_id=1,
                assigned_by_user_id=4,
                status="Assigned",
                arrived_at=None,
                completed_at=None,
                completion_remarks=None,
            ),
            BookingAssignment(
                booking_id=104,
                technician_id=2,
                assigned_by_user_id=6,
                status="Completed",
                arrived_at=datetime(2026, 11, 1, 8, 50, tzinfo=timezone.utc),
                completed_at=datetime(2026, 11, 1, 12, 10, tzinfo=timezone.utc),
                completion_remarks="Completed machine scrubbing, bathroom descaling, and kitchen degreasing.",
            ),
        ]
        db.add_all(assignments)
        db.flush()

        # 15. Booking Images
        images = [
            BookingImage(
                booking_id=101,
                uploaded_by_user_id=2,
                image_type="PROBLEM",
                file_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
                caption="Clogged indoor filter before service",
            ),
            BookingImage(
                booking_id=101,
                uploaded_by_user_id=7,
                image_type="COMPLETION",
                file_url="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80",
                caption="Clean sanitized evaporator coil post foam-jet wash",
            ),
            BookingImage(
                booking_id=102,
                uploaded_by_user_id=2,
                image_type="PROBLEM",
                file_url="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
                caption="16A kitchen modular socket panel",
            ),
        ]
        db.add_all(images)
        db.flush()

        # 16. Payments
        payments = [
            Payment(
                id=501,
                booking_id=101,
                customer_id=1,
                payment_type="FULL",
                amount=Decimal("754.26"),
                status="Paid",
                razorpay_order_id="order_Pf92kLmN81xQaZ",
                razorpay_payment_id="pay_Pf93xYzW19pLmK",
                idempotency_key="idem_booking_101",
            ),
            Payment(
                id=502,
                booking_id=102,
                customer_id=1,
                payment_type="ADVANCE",
                amount=Decimal("176.71"),
                status="Paid",
                razorpay_order_id="order_Pg10aBcD22mNpQ",
                razorpay_payment_id="pay_Pg11eFgH33rStU",
                idempotency_key="idem_booking_102",
            ),
            Payment(
                id=503,
                booking_id=103,
                customer_id=2,
                payment_type="FULL",
                amount=Decimal("588.82"),
                status="Paid",
                razorpay_order_id="order_Pg88kLmN44vWxY",
                razorpay_payment_id="pay_Pg89zAbC55dEfG",
                idempotency_key="idem_booking_103",
            ),
            Payment(
                id=504,
                booking_id=104,
                customer_id=1,
                payment_type="FULL",
                amount=Decimal("2771.82"),
                status="Paid",
                razorpay_order_id="order_Pf55qRsT66uVwX",
                razorpay_payment_id="pay_Pf56yZaB77cDeF",
                idempotency_key="idem_booking_104",
            ),
        ]
        db.add_all(payments)
        db.flush()

        # 17. Invoices
        invoices = [
            Invoice(
                id=901,
                invoice_number="INV-2026-0901",
                booking_id=101,
                customer_id=1,
                provider_id=1,
                subtotal=Decimal("799.00"),
                discount_amount=Decimal("159.80"),
                tax_amount=Decimal("115.06"),
                total_amount=Decimal("754.26"),
                status="Paid",
            ),
            Invoice(
                id=902,
                invoice_number="INV-2026-0902",
                booking_id=104,
                customer_id=1,
                provider_id=3,
                subtotal=Decimal("2499.00"),
                discount_amount=Decimal("150.00"),
                tax_amount=Decimal("422.82"),
                total_amount=Decimal("2771.82"),
                status="Paid",
            ),
        ]
        db.add_all(invoices)
        db.flush()

        # 18. Provider Earnings
        earnings = [
            ProviderEarning(
                provider_id=1,
                booking_id=101,
                payment_id=501,
                gross_amount=Decimal("754.26"),
                commission_percentage=Decimal("10.00"),
                commission_amount=Decimal("75.43"),
                net_earning=Decimal("678.83"),
                settlement_status="Settled",
            ),
            ProviderEarning(
                provider_id=3,
                booking_id=104,
                payment_id=504,
                gross_amount=Decimal("2771.82"),
                commission_percentage=Decimal("10.00"),
                commission_amount=Decimal("277.18"),
                net_earning=Decimal("2494.64"),
                settlement_status="Settled",
            ),
        ]
        db.add_all(earnings)
        db.flush()

        # 19. Reviews
        reviews = [
            Review(
                booking_id=101,
                customer_id=1,
                provider_id=1,
                rating=5,
                comment="Technician Manoj arrived 5 minutes early with a waterproof jacket for the indoor AC unit, cleaned the coil thoroughly with foam jet, and left zero mess behind. Cooling is back to brand new!",
                provider_reply="Thank you so much, Aarav! We are glad Manoj delivered a 5-star experience. Look forward to serving you again.",
                is_visible=True,
            )
        ]
        db.add_all(reviews)
        db.flush()

        # 20. Complaints
        complaints = [
            Complaint(
                complaint_number="CMP-2026-001",
                booking_id=104,
                customer_id=1,
                provider_id=3,
                subject="Balcony glass railing exterior wipe missed",
                description="The indoor deep cleaning was very good, but the outer side of the utility balcony glass railing was missed by the crew.",
                status="In Review",
                admin_resolution_notes="Contacted SparklePro supervisor; complimentary touch-up visit scheduled with customer.",
            )
        ]
        db.add_all(complaints)
        db.flush()

        # 21. Notifications
        notifications = [
            Notification(
                user_id=2,
                role="customer",
                title="Technician Assigned — HS-20261105-0102",
                message="Manoj Kumar has been assigned to your Electrical Safety Inspection on 05 Nov at 02:00 PM.",
                notification_type="TECHNICIAN_ASSIGNED",
                reference_id=102,
            ),
            Notification(
                user_id=2,
                role="customer",
                title="Rate Your Completed Service",
                message="Your 2BHK Intensive Deep Home Sanitization (HS-20261101-0104) is complete. Share your review!",
                notification_type="REVIEW_REQUEST",
                reference_id=104,
            ),
            Notification(
                user_id=4,
                role="service_provider",
                title="New Booking Request — HS-20261106-0103",
                message="Priya Sharma requested Bathroom Leakage & Mixer Tap Overhaul for 06 Nov, 09:00 AM.",
                notification_type="BOOKING_CONFIRMATION",
                reference_id=103,
            ),
            Notification(
                user_id=7,
                role="technician",
                title="New Field Job Assigned — HS-20261105-0102",
                message="You have been assigned to Complete Switchboard & MCB Inspection at Indiranagar on 05 Nov, 02:00 PM.",
                notification_type="TECHNICIAN_ASSIGNED",
                reference_id=102,
            ),
            Notification(
                user_id=1,
                role="super_admin",
                title="Provider KYC Verification Pending",
                message="Metro Rapid Plumbing & Carpentry Works (Suresh Nair) uploaded KYC documents for verification.",
                notification_type="ADMIN_ALERT",
                reference_id=2,
            ),
        ]
        db.add_all(notifications)

        # 22. Customer Favorites
        db.add_all(
            [
                CustomerFavorite(customer_id=1, provider_id=1),
                CustomerFavorite(customer_id=1, provider_id=3),
                CustomerFavorite(customer_id=2, provider_id=1),
            ]
        )

        db.commit()
        return {
            "status": "seeded",
            "users_count": db.query(User).count(),
            "categories_count": db.query(ServiceCategory).count(),
            "services_count": db.query(Service).count(),
            "bookings_count": db.query(Booking).count(),
        }
    finally:
        if owns_session:
            db.close()


if __name__ == "__main__":
    result = seed_database()
    print(f"Database Seed Result: {result}")

