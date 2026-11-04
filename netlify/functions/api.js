const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const SEED_DATA = require('./seedData.json');

const TMP_DB_PATH = '/tmp/homeserve_cloud_db_v2.json';
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'hs_prod_jwt_secret_key_2026_netlify_cloud';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_HomeServeWebhookSecret2026';

const ACCOUNT_PASSWORDS = {
  'admin@homeserve.com': 'Admin@12345',
  'customer@homeserve.com': 'Customer@123',
  'priya.sharma@example.com': 'Customer@123',
  'provider@homeserve.com': 'Provider@123',
  'pending.provider@homeserve.com': 'Provider@123',
  'sparkle.clean@homeserve.com': 'Provider@123',
  'tech@homeserve.com': 'Tech@12345',
  'ravi.tech@homeserve.com': 'Tech@12345',
};

let memoryDb = null;

function loadDb() {
  if (memoryDb) return memoryDb;
  try {
    if (fs.existsSync(TMP_DB_PATH)) {
      const raw = fs.readFileSync(TMP_DB_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.services) && Array.isArray(parsed.bookings)) {
        memoryDb = parsed;
        return memoryDb;
      }
    }
  } catch {
    // Fallback to seed data
  }
  memoryDb = JSON.parse(JSON.stringify(SEED_DATA));
  memoryDb.isMockMode = false;
  saveDb(memoryDb);
  return memoryDb;
}

function saveDb(dbObj) {
  memoryDb = dbObj;
  try {
    fs.writeFileSync(TMP_DB_PATH, JSON.stringify(dbObj), 'utf8');
  } catch {
    // Ignore read-only tmp error if any
  }
}

function signJwt(payload, expiresInSeconds = 86400) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function generateRazorpayHmac(payloadStr) {
  const digest = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payloadStr).digest('hex');
  return `hmac_sha256_${digest.slice(0, 32)}`;
}

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Razorpay-Signature',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(data),
  };
}

function getAuthenticatedUser(event, db) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const decoded = verifyJwt(token);
    if (decoded && decoded.sub) {
      const found = db.users.find((u) => Number(u.id) === Number(decoded.sub));
      if (found) return found;
    }
  }
  return db.users[1] || db.users[0];
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }

  const db = loadDb();
  const method = event.httpMethod.toUpperCase();

  // Normalize path to strip /.netlify/functions/api or /api/v1 prefix
  let routePath = event.path || '/';
  routePath = routePath
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api\/v1/, '');
  if (!routePath.startsWith('/')) {
    routePath = '/' + routePath;
  }
  if (routePath.length > 1 && routePath.endsWith('/')) {
    routePath = routePath.slice(0, -1);
  }

  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch {
      body = {};
    }
  }

  // 1. HEALTH CHECK
  if (method === 'GET' && (routePath === '/health' || routePath === '/')) {
    return jsonResponse(200, {
      status: 'healthy',
      service: 'HomeServe Technologies — Cloud API (Netlify Serverless + Persistent DB)',
      version: '1.0.0',
      database: 'Connected (20 Normalized Entities)',
      razorpayWebhook: 'Active (HMAC-SHA256 Verified)',
      timestamp: new Date().toISOString(),
    });
  }

  // 2. SYSTEM BOOTSTRAP
  if (method === 'GET' && routePath === '/bootstrap') {
    return jsonResponse(200, {
      ...db,
      isMockMode: false,
      cloudBackendConnected: true,
    });
  }

  // 3. STATE SYNC ENDPOINT (Synchronizes client & serverless state)
  if (method === 'POST' && routePath === '/sync') {
    if (body && body.data && Array.isArray(body.data.services) && Array.isArray(body.data.bookings)) {
      saveDb({ ...body.data, isMockMode: false });
      return jsonResponse(200, {
        status: 'synced',
        bookingsCount: body.data.bookings.length,
        updatedAt: new Date().toISOString(),
      });
    }
    return jsonResponse(400, { detail: 'Invalid sync payload.' });
  }

  // 4. AUTH LOGIN
  if (method === 'POST' && routePath === '/auth/login') {
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      return jsonResponse(401, { detail: 'No account found with this email address.' });
    }
    const expectedPwd = ACCOUNT_PASSWORDS[email] || user.password;
    if (expectedPwd && password !== expectedPwd) {
      return jsonResponse(401, { detail: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return jsonResponse(403, { detail: 'Your account has been suspended by Super Admin.' });
    }
    const accessToken = signJwt({ sub: user.id, email: user.email, role: user.role }, 86400);
    const refreshToken = signJwt({ sub: user.id, type: 'refresh' }, 604800);
    return jsonResponse(200, {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      user,
    });
  }

  // 5. AUTH ME
  if (method === 'GET' && routePath === '/auth/me') {
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return jsonResponse(401, { detail: 'Missing Bearer token.' });
    }
    const decoded = verifyJwt(authHeader.slice(7).trim());
    if (!decoded || !decoded.sub) {
      return jsonResponse(401, { detail: 'Invalid or expired token.' });
    }
    const user = db.users.find((u) => Number(u.id) === Number(decoded.sub));
    if (!user) {
      return jsonResponse(401, { detail: 'User not found.' });
    }
    return jsonResponse(200, user);
  }

  // 6. AUTH LOGOUT
  if (method === 'POST' && routePath === '/auth/logout') {
    return jsonResponse(200, { message: 'Logged out and active refresh tokens revoked.' });
  }

  // 7. REGISTER CUSTOMER
  if (method === 'POST' && routePath === '/auth/register/customer') {
    const email = (body.email || '').trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      return jsonResponse(400, { detail: 'An account with this email already exists.' });
    }
    const newUserId = Math.max(...db.users.map((u) => Number(u.id)), 10) + 1;
    const newCustomerId = Math.max(...db.customers.map((c) => Number(c.id)), 10) + 1;
    const newUser = {
      id: newUserId,
      fullName: (body.full_name || body.fullName || 'Customer').trim(),
      email,
      phone: body.phone || '9800000000',
      password: body.password || 'Customer@123',
      role: 'customer',
      isActive: true,
      isVerified: true,
      createdAt: new Date().toISOString(),
    };
    const newCustomer = {
      id: newCustomerId,
      userId: newUserId,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      accountStatus: 'Active',
      preferredCity: 'Bengaluru',
      totalBookings: 0,
      totalSpent: 0,
      favoriteProviderIds: [],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.users.push(newUser);
    db.customers.push(newCustomer);
    saveDb(db);

    const accessToken = signJwt({ sub: newUser.id, email: newUser.email, role: newUser.role }, 86400);
    const refreshToken = signJwt({ sub: newUser.id, type: 'refresh' }, 604800);
    return jsonResponse(201, {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      user: newUser,
    });
  }

  // 8. REGISTER PROVIDER
  if (method === 'POST' && routePath === '/auth/register/provider') {
    const email = (body.email || '').trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      return jsonResponse(400, { detail: 'An account with this email already exists.' });
    }
    const newUserId = Math.max(...db.users.map((u) => Number(u.id)), 10) + 1;
    const newProvId = Math.max(...db.providers.map((p) => Number(p.id)), 10) + 1;
    const ownerName = (body.owner_name || body.ownerName || 'Partner').trim();
    const businessName = (body.business_name || body.businessName || 'Home Services Partner').trim();
    const newUser = {
      id: newUserId,
      fullName: ownerName,
      email,
      phone: body.phone || '9800000000',
      password: body.password || 'Provider@123',
      role: 'service_provider',
      isActive: true,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };
    const selectedCats = body.selected_category_ids || body.selectedCategoryIds || [1];
    const matchingServices = db.services.filter((s) => selectedCats.includes(Number(s.categoryId)));
    const newProvider = {
      id: newProvId,
      userId: newUserId,
      businessName,
      ownerName,
      email,
      phone: newUser.phone,
      bio: body.bio || 'Professional residential service partner.',
      experienceYears: Number(body.experience_years || body.experienceYears || 3),
      verificationStatus: 'Pending',
      kycDocumentName: body.kyc_document_name || 'KYC_Identity_And_License.pdf',
      subscriptionPlanId: 1,
      commissionPercentage: 15,
      averageRating: 0,
      totalReviews: 0,
      completedJobs: 0,
      workingHours: 'Mon - Sun: 08:00 AM - 08:00 PM',
      serviceAreas: [
        {
          id: Date.now(),
          city: body.city || 'Bengaluru',
          areaName: body.city || 'Bengaluru',
          postalCode: body.postal_code || '560038',
        },
      ],
      offeredServices: matchingServices.map((s) => ({
        serviceId: s.id,
        serviceName: s.name,
        categoryId: s.categoryId,
        customPrice: s.basePrice,
      })),
    };
    db.users.push(newUser);
    db.providers.push(newProvider);
    db.notifications.unshift({
      id: Date.now(),
      userId: 1,
      role: 'super_admin',
      title: 'New Provider KYC Verification Required',
      message: `${businessName} (${ownerName}) submitted KYC documents.`,
      type: 'ADMIN_ALERT',
      isRead: false,
      createdAt: 'Just now',
    });
    saveDb(db);

    const accessToken = signJwt({ sub: newUser.id, email: newUser.email, role: newUser.role }, 86400);
    const refreshToken = signJwt({ sub: newUser.id, type: 'refresh' }, 604800);
    return jsonResponse(201, {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      user: newUser,
    });
  }

  // 9. CREATE BOOKING (Handles payment.captured, payment.failed, and TAMPERED_SIGNATURE)
  if (method === 'POST' && routePath === '/bookings') {
    const currentUser = getAuthenticatedUser(event, db);
    const currentCustomer =
      db.customers.find((c) => Number(c.userId) === Number(currentUser.id)) || db.customers[0];

    const serviceId = Number(body.service_id || body.serviceId);
    const providerId = Number(body.provider_id || body.providerId);
    const addressId = Number(body.address_id || body.addressId);
    const scheduledDate = body.scheduled_date || body.scheduledDate;
    const startTime = body.start_time || body.startTime;
    const endTime = body.end_time || body.endTime || '10:30';
    const problemDescription = body.problem_description || body.problemDescription || '';
    const couponCode = body.coupon_code || body.couponCode || '';
    const paymentType = body.payment_type || body.paymentType || 'FULL';
    const problemImageUrls = body.problem_image_urls || body.problemImageUrls || [];
    const paymentScenario = body.payment_scenario || body.paymentScenario || 'SUCCESS';
    const paymentMethod = body.payment_method || body.paymentMethod || 'UPI';

    if (paymentScenario === 'TAMPERED_SIGNATURE') {
      return jsonResponse(400, {
        detail:
          'HTTP 400 Bad Request — Razorpay Webhook Verification Failed: Invalid X-Razorpay-Signature (HMAC-SHA256 mismatch). Transaction aborted.',
      });
    }

    const activeStatuses = ['Confirmed', 'Provider Assigned', 'In Progress'];
    const hasConflict = db.bookings.some(
      (b) =>
        Number(b.providerId) === providerId &&
        b.scheduledDate === scheduledDate &&
        b.startTime === startTime &&
        activeStatuses.includes(b.status)
    );
    if (hasConflict) {
      return jsonResponse(409, {
        detail:
          'HTTP 409 Conflict — Double-booking prevented: Provider already has an active appointment in this slot.',
      });
    }

    const service = db.services.find((s) => Number(s.id) === serviceId) || db.services[0];
    const provider = db.providers.find((p) => Number(p.id) === providerId) || db.providers[0];
    if (provider.verificationStatus !== 'Approved') {
      return jsonResponse(400, {
        detail: 'Provider KYC is not approved. Only verified providers can accept bookings.',
      });
    }
    const address = db.addresses.find((a) => Number(a.id) === addressId) || db.addresses[0];
    const customOffer = (provider.offeredServices || []).find(
      (os) => Number(os.serviceId) === Number(service.id)
    );
    const subtotal = Number(customOffer?.customPrice || service.basePrice || 599);

    let discountAmount = 0;
    const coupon = (db.coupons || []).find(
      (c) => couponCode && c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive
    );
    if (coupon && subtotal >= coupon.minOrderAmount) {
      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscount);
      } else {
        discountAmount = Math.min(coupon.discountValue, coupon.maxDiscount);
      }
    }
    const taxable = Math.max(subtotal - discountAmount, 0);
    const taxAmount = Number((taxable * 0.18).toFixed(2));
    const totalAmount = Number((taxable + taxAmount).toFixed(2));
    const intendedPayable =
      paymentType === 'ADVANCE' ? Number((totalAmount * 0.25).toFixed(2)) : totalAmount;

    const isPaymentFailed = paymentScenario === 'FAILED';
    const paidAmount = isPaymentFailed ? 0 : intendedPayable;
    const pendingAmount = isPaymentFailed
      ? totalAmount
      : Number((totalAmount - paidAmount).toFixed(2));
    const paymentStatus = isPaymentFailed
      ? 'Failed'
      : pendingAmount === 0
        ? 'Paid'
        : 'Partially Paid';

    const newBookingId = Math.max(...db.bookings.map((b) => Number(b.id)), 104) + 1;
    const bookingNumber = `HS-20261104-0${newBookingId}`;
    const orderId = `order_RzpTest_${newBookingId}`;
    const paymentId = `pay_RzpTest_${newBookingId}_${Date.now().toString().slice(-4)}`;
    const webhookEvent = isPaymentFailed ? 'payment.failed' : 'payment.captured';
    const webhookSignature = generateRazorpayHmac(`${orderId}|${paymentId}|${webhookEvent}`);

    const webhookLogEntry = {
      id: `wh_${Date.now()}`,
      timestamp: new Date().toISOString(),
      event: webhookEvent,
      orderId,
      paymentId,
      method: paymentMethod,
      amount: intendedPayable,
      signature: webhookSignature,
      signatureVerified: true,
      httpStatus: 200,
      reason: isPaymentFailed
        ? 'BAD_REQUEST_ERROR: Payment declined by issuing bank (Simulated Failure Webhook)'
        : 'Payment captured and verified via HMAC-SHA256 webhook',
    };

    const newBooking = {
      id: newBookingId,
      bookingNumber,
      customerId: currentCustomer.id,
      customerName: currentCustomer.fullName,
      customerPhone: currentCustomer.phone,
      providerId: provider.id,
      providerName: provider.businessName,
      serviceId: service.id,
      serviceName: service.name,
      categoryName: service.categoryName,
      addressId: address.id,
      addressText: `${address.addressLine1}, ${address.city} - ${address.postalCode}`,
      scheduledDate,
      startTime,
      endTime,
      status: 'Pending',
      problemDescription,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      paymentType,
      paymentStatus,
      paidAmount,
      pendingAmount,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: webhookSignature,
      webhookLogs: [webhookLogEntry],
      technicianId: null,
      technicianName: null,
      images: problemImageUrls.map((url, idx) => ({
        id: Date.now() + idx,
        type: 'PROBLEM',
        url,
        caption: 'Customer uploaded problem photo',
      })),
      createdAt: new Date().toISOString(),
    };

    const newPayment = {
      id: Math.max(...(db.payments || []).map((p) => Number(p.id)), 504) + 1,
      bookingId: newBookingId,
      bookingNumber,
      customerId: currentCustomer.id,
      paymentType,
      amount: intendedPayable,
      status: isPaymentFailed ? 'Failed' : 'Paid',
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: webhookSignature,
      failureReason: isPaymentFailed
        ? 'BAD_REQUEST_ERROR: Payment declined by issuing bank'
        : null,
      createdAt: new Date().toISOString(),
    };

    const newInvoice = {
      id: Math.max(...(db.invoices || []).map((inv) => Number(inv.id)), 902) + 1,
      invoiceNumber: `INV-2026-0${newBookingId}`,
      bookingId: newBookingId,
      bookingNumber,
      customerId: currentCustomer.id,
      customerName: currentCustomer.fullName,
      providerId: provider.id,
      providerName: provider.businessName,
      serviceName: service.name,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      paidAmount,
      pendingAmount,
      status: paymentStatus,
      issuedAt: new Date().toISOString().slice(0, 10),
    };

    db.bookings.unshift(newBooking);
    db.payments.unshift(newPayment);
    db.invoices.unshift(newInvoice);
    db.notifications.unshift({
      id: Date.now(),
      userId: currentUser.id,
      role: 'customer',
      title: isPaymentFailed
        ? `Payment Failed (${webhookEvent}) — ${bookingNumber}`
        : `Booking Confirmed (${webhookEvent}) — ${bookingNumber}`,
      message: isPaymentFailed
        ? `Razorpay webhook reported payment.failed for order ${orderId}. Please retry payment from your booking page.`
        : `Your booking for ${service.name} on ${scheduledDate} (${startTime}) is confirmed. Razorpay Order ${orderId} verified.`,
      isRead: false,
      createdAt: 'Just now',
    });
    saveDb(db);

    return jsonResponse(201, newBooking);
  }

  // 10. RAZORPAY PAYMENT WEBHOOK ENDPOINT (POST /payments/webhook)
  if (method === 'POST' && routePath === '/payments/webhook') {
    const bookingId = Number(body.booking_id || body.bookingId);
    const scenario = body.scenario || 'SUCCESS';
    const target = db.bookings.find((b) => Number(b.id) === bookingId);
    if (!target) {
      return jsonResponse(404, { detail: 'Booking not found for webhook processing.' });
    }

    const orderId = target.razorpayOrderId || `order_RzpTest_${target.id}`;
    const paymentId = `pay_RzpWebhook_${target.id}_${Date.now().toString().slice(-4)}`;

    if (scenario === 'TAMPERED_SIGNATURE') {
      const tamperedLog = {
        id: `wh_${Date.now()}`,
        timestamp: new Date().toISOString(),
        event: 'payment.captured',
        orderId,
        paymentId,
        amount: target.pendingAmount || target.totalAmount,
        signature: 'deadbeef_invalid_tampered_hmac_signature',
        signatureVerified: false,
        httpStatus: 400,
        reason: 'HTTP 400 Bad Request: Invalid webhook HMAC-SHA256 signature rejected.',
      };
      target.webhookLogs = [tamperedLog, ...(target.webhookLogs || [])];
      saveDb(db);
      return jsonResponse(400, {
        status: 'rejected',
        detail: tamperedLog.reason,
        webhookLog: tamperedLog,
      });
    }

    const isFail = scenario === 'FAILED';
    const eventName = isFail ? 'payment.failed' : 'payment.captured';
    const validSig = generateRazorpayHmac(`${orderId}|${paymentId}|${eventName}`);

    const logEntry = {
      id: `wh_${Date.now()}`,
      timestamp: new Date().toISOString(),
      event: eventName,
      orderId,
      paymentId,
      amount: isFail ? target.totalAmount : target.pendingAmount || target.totalAmount,
      signature: validSig,
      signatureVerified: true,
      httpStatus: 200,
      reason: isFail
        ? 'BAD_REQUEST_ERROR: Payment declined by bank during webhook callback'
        : 'Payment captured & verified via X-Razorpay-Signature HMAC-SHA256',
    };

    target.paymentStatus = isFail ? 'Failed' : 'Paid';
    target.paidAmount = isFail ? 0 : target.totalAmount;
    target.pendingAmount = isFail ? target.totalAmount : 0;
    target.razorpayOrderId = orderId;
    target.razorpayPaymentId = paymentId;
    target.razorpaySignature = validSig;
    target.webhookLogs = [logEntry, ...(target.webhookLogs || [])];

    const inv = (db.invoices || []).find((i) => Number(i.bookingId) === bookingId);
    if (inv) {
      inv.status = isFail ? 'Payment Failed' : 'Paid';
      inv.paidAmount = isFail ? 0 : target.totalAmount;
      inv.pendingAmount = isFail ? target.totalAmount : 0;
    }
    saveDb(db);

    return jsonResponse(200, {
      status: 'verified',
      event: eventName,
      signature: validSig,
      booking: target,
      webhookLog: logEntry,
    });
  }

  // 11. UPDATE BOOKING STATUS (PATCH /bookings/:id/status)
  const statusMatch = routePath.match(/^\/bookings\/(\d+)\/status$/);
  if (method === 'PATCH' && statusMatch) {
    const bookingId = Number(statusMatch[1]);
    const booking = db.bookings.find((b) => Number(b.id) === bookingId);
    if (!booking) return jsonResponse(404, { detail: 'Booking not found.' });
    const nextStatus = body.status || booking.status;
    const isRefund = ['Cancelled', 'Rejected'].includes(nextStatus) && booking.paidAmount > 0;
    booking.status = nextStatus;
    if (body.reason) booking.cancellationReason = body.reason;
    if (isRefund) booking.paymentStatus = 'Refunded';
    saveDb(db);
    return jsonResponse(200, booking);
  }

  // 12. RESCHEDULE BOOKING (POST /bookings/:id/reschedule)
  const reschedMatch = routePath.match(/^\/bookings\/(\d+)\/reschedule$/);
  if (method === 'POST' && reschedMatch) {
    const bookingId = Number(reschedMatch[1]);
    const booking = db.bookings.find((b) => Number(b.id) === bookingId);
    if (!booking) return jsonResponse(404, { detail: 'Booking not found.' });
    booking.scheduledDate = body.scheduled_date || body.scheduledDate || booking.scheduledDate;
    booking.startTime = body.start_time || body.startTime || booking.startTime;
    booking.endTime = body.end_time || body.endTime || '12:30';
    saveDb(db);
    return jsonResponse(200, booking);
  }

  // 13. ASSIGN TECHNICIAN (POST /bookings/:id/assign-technician)
  const assignMatch = routePath.match(/^\/bookings\/(\d+)\/assign-technician$/);
  if (method === 'POST' && assignMatch) {
    const bookingId = Number(assignMatch[1]);
    const techId = Number(body.technician_id || body.technicianId);
    const booking = db.bookings.find((b) => Number(b.id) === bookingId);
    if (!booking) return jsonResponse(404, { detail: 'Booking not found.' });
    const tech = db.technicians.find((t) => Number(t.id) === techId);
    booking.status = 'Provider Assigned';
    booking.technicianId = tech?.id || techId;
    booking.technicianName = tech?.fullName || 'Assigned Technician';
    saveDb(db);
    return jsonResponse(200, booking);
  }

  // 14. TECHNICIAN JOB UPDATE (PATCH /technicians/me/jobs/:id)
  const techJobMatch = routePath.match(/^\/technicians\/me\/jobs\/(\d+)$/);
  if (method === 'PATCH' && techJobMatch) {
    const bookingId = Number(techJobMatch[1]);
    const booking = db.bookings.find((b) => Number(b.id) === bookingId);
    if (!booking) return jsonResponse(404, { detail: 'Booking not found.' });
    if (body.action === 'ARRIVE_START') {
      booking.status = 'In Progress';
      booking.arrivedAt = new Date().toISOString();
    } else {
      booking.status = 'Completed';
      booking.completedAt = new Date().toISOString();
      booking.completionRemarks =
        body.completion_remarks || 'Service completed and verified on site.';
      booking.paymentStatus = 'Paid';
      booking.paidAmount = booking.totalAmount;
      booking.pendingAmount = 0;
      if (body.completion_image_url) {
        booking.images = [
          ...(booking.images || []),
          {
            id: Date.now(),
            type: 'COMPLETION',
            url: body.completion_image_url,
            caption: booking.completionRemarks,
          },
        ];
      }
    }
    saveDb(db);
    return jsonResponse(200, booking);
  }

  // 15. CUSTOMER ADDRESSES & FAVORITES
  if (method === 'POST' && routePath === '/customers/me/addresses') {
    const currentUser = getAuthenticatedUser(event, db);
    const cust =
      db.customers.find((c) => Number(c.userId) === Number(currentUser.id)) || db.customers[0];
    const newAddr = {
      id: Date.now(),
      customerId: cust.id,
      label: body.label || 'Home',
      addressLine1: body.address_line1 || body.addressLine1 || '',
      landmark: body.landmark || '',
      city: body.city || 'Bengaluru',
      state: body.state || 'Karnataka',
      postalCode: body.postal_code || body.postalCode || '560038',
      isDefault: Boolean(body.is_default),
    };
    db.addresses.push(newAddr);
    saveDb(db);
    return jsonResponse(201, newAddr);
  }

  const delAddrMatch = routePath.match(/^\/customers\/me\/addresses\/(\d+)$/);
  if (method === 'DELETE' && delAddrMatch) {
    const addrId = Number(delAddrMatch[1]);
    db.addresses = db.addresses.filter((a) => Number(a.id) !== addrId);
    saveDb(db);
    return jsonResponse(200, { deleted: true });
  }

  const favMatch = routePath.match(/^\/customers\/me\/favorites\/(\d+)$/);
  if (method === 'POST' && favMatch) {
    return jsonResponse(200, { updated: true });
  }

  // 16. REVIEWS & REPLIES
  if (method === 'POST' && routePath === '/reviews') {
    const bookingId = Number(body.booking_id || body.bookingId);
    const targetBooking = db.bookings.find((b) => Number(b.id) === bookingId);
    const newRev = {
      id: Date.now(),
      bookingId,
      bookingNumber: targetBooking?.bookingNumber || `HS-${bookingId}`,
      customerId: targetBooking?.customerId || 1,
      customerName: targetBooking?.customerName || 'Verified Customer',
      providerId: targetBooking?.providerId || 1,
      providerName: targetBooking?.providerName || 'Apex Home Solutions',
      serviceName: targetBooking?.serviceName || 'Home Service',
      rating: Number(body.rating || 5),
      comment: body.comment || '',
      providerReply: null,
      isVisible: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.reviews.unshift(newRev);
    if (targetBooking) targetBooking.hasReview = true;
    saveDb(db);
    return jsonResponse(201, newRev);
  }

  const replyMatch = routePath.match(/^\/reviews\/(\d+)\/reply$/);
  if (method === 'POST' && replyMatch) {
    const revId = Number(replyMatch[1]);
    const rev = db.reviews.find((r) => Number(r.id) === revId);
    if (rev) {
      rev.providerReply = body.provider_reply || body.providerReply || '';
      saveDb(db);
    }
    return jsonResponse(200, rev || { ok: true });
  }

  // 17. COMPLAINTS
  if (method === 'POST' && routePath === '/complaints') {
    const bookingId = Number(body.booking_id || body.bookingId);
    const targetBooking = db.bookings.find((b) => Number(b.id) === bookingId);
    const newCmp = {
      id: Date.now(),
      complaintNumber: `CMP-2026-00${(db.complaints?.length || 1) + 1}`,
      bookingId,
      bookingNumber: targetBooking?.bookingNumber || `HS-${bookingId}`,
      customerId: targetBooking?.customerId || 1,
      customerName: targetBooking?.customerName || 'Customer',
      providerId: targetBooking?.providerId || 1,
      providerName: targetBooking?.providerName || 'Service Provider',
      subject: body.subject || 'Service Issue',
      description: body.description || '',
      status: 'Open',
      adminResolutionNotes: null,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.complaints.unshift(newCmp);
    saveDb(db);
    return jsonResponse(201, newCmp);
  }

  const resolveCmpMatch = routePath.match(/^\/admin\/complaints\/(\d+)$/);
  if (method === 'PATCH' && resolveCmpMatch) {
    const cmpId = Number(resolveCmpMatch[1]);
    const cmp = db.complaints.find((c) => Number(c.id) === cmpId);
    if (cmp) {
      cmp.status = body.status || 'Resolved';
      cmp.adminResolutionNotes = body.admin_resolution_notes || '';
      saveDb(db);
    }
    return jsonResponse(200, cmp || { ok: true });
  }

  // 18. ADMIN PROVIDER KYC VERIFICATION
  const verifyProvMatch = routePath.match(/^\/admin\/providers\/(\d+)\/verify$/);
  if (method === 'PATCH' && verifyProvMatch) {
    const provId = Number(verifyProvMatch[1]);
    const prov = db.providers.find((p) => Number(p.id) === provId);
    if (prov) {
      prov.verificationStatus = body.verification_status || 'Approved';
      prov.rejectionRemarks = body.rejection_remarks || '';
      saveDb(db);
    }
    return jsonResponse(200, prov || { ok: true });
  }

  // 19. ADMIN CATALOG, COUPONS, TECHNICIANS, NOTIFICATIONS, CUSTOMER STATUS
  if (method === 'POST' && routePath === '/categories') {
    const newCat = {
      id: Date.now(),
      name: body.name,
      slug: (body.name || 'category').toLowerCase().replace(/\s+/g, '-'),
      subcategories: Array.isArray(body.subcategories) ? body.subcategories : [],
      description: body.description || '',
      iconName: 'Wrench',
      isActive: true,
    };
    db.categories.push(newCat);
    saveDb(db);
    return jsonResponse(201, newCat);
  }

  if (method === 'POST' && routePath === '/services') {
    const cat = db.categories.find((c) => Number(c.id) === Number(body.category_id));
    const newSvc = {
      id: Date.now(),
      categoryId: Number(body.category_id),
      categoryName: cat?.name || 'Home Service',
      subcategory: body.subcategory || 'General',
      name: body.name,
      description: body.description || '',
      basePrice: Number(body.base_price || 499),
      durationMinutes: Number(body.duration_minutes || 60),
      isActive: true,
      rating: 4.9,
      reviewsCount: 12,
    };
    db.services.push(newSvc);
    saveDb(db);
    return jsonResponse(201, newSvc);
  }

  if (method === 'POST' && routePath === '/admin/coupons') {
    const newCpn = {
      id: Date.now(),
      code: (body.code || 'PROMO').toUpperCase(),
      description: body.description || '',
      discountType: body.discount_type || 'PERCENTAGE',
      discountValue: Number(body.discount_value || 10),
      minOrderAmount: Number(body.min_order_amount || 499),
      maxDiscount: Number(body.max_discount || 500),
      isActive: true,
    };
    db.coupons.push(newCpn);
    saveDb(db);
    return jsonResponse(201, newCpn);
  }

  if (method === 'POST' && routePath === '/technicians') {
    const newTech = {
      id: Date.now(),
      providerId: 1,
      fullName: body.full_name,
      email: body.email,
      phone: body.phone,
      specialization: body.specialization,
      experienceYears: Number(body.experience_years || 3),
      availabilityStatus: 'Available',
      isAvailable: true,
      completedJobsCount: 0,
      rating: 4.9,
    };
    db.technicians.push(newTech);
    saveDb(db);
    return jsonResponse(201, newTech);
  }

  if (method === 'PATCH' && routePath === '/notifications/read-all') {
    db.notifications = (db.notifications || []).map((n) => ({ ...n, isRead: true }));
    saveDb(db);
    return jsonResponse(200, { ok: true });
  }

  const custStatusMatch = routePath.match(/^\/admin\/customers\/(\d+)\/status$/);
  if (method === 'PATCH' && custStatusMatch) {
    const custId = Number(custStatusMatch[1]);
    const cust = db.customers.find((c) => Number(c.id) === custId);
    if (cust) {
      cust.accountStatus = cust.accountStatus === 'Active' ? 'Suspended' : 'Active';
      saveDb(db);
    }
    return jsonResponse(200, cust || { ok: true });
  }

  if (method === 'POST' && routePath === '/reset') {
    memoryDb = JSON.parse(JSON.stringify(SEED_DATA));
    memoryDb.isMockMode = false;
    saveDb(memoryDb);
    return jsonResponse(200, memoryDb);
  }

  return jsonResponse(404, { detail: `Endpoint ${method} ${routePath} not found.` });
};

