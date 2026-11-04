import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_MOCK_DATA } from '../services/mockData';
import { ROLE_HOME_ROUTES } from '../constants';
import apiClient from '../services/apiClient';

const PlatformContext = createContext(null);
const PERSISTENT_DB_KEY = 'hs_persistent_database_v3';

export const DEMO_ROLE_CREDENTIALS = [
  {
    role: 'customer',
    roleTitle: 'Customer Dashboard',
    fullName: 'Aarav Mehta',
    email: 'customer@homeserve.com',
    password: 'Customer@123',
    badge: 'Verified Customer',
    dashboardPath: '/customer/dashboard',
    description:
      'Book services, test Razorpay success/failure webhooks, track technician status, download GST invoices & submit reviews.',
  },
  {
    role: 'service_provider',
    roleTitle: 'Service Provider Console',
    fullName: 'Rajesh Kulkarni (Apex Home Solutions)',
    email: 'provider@homeserve.com',
    password: 'Provider@123',
    badge: 'KYC Approved Partner',
    dashboardPath: '/provider/dashboard',
    description:
      'Manage custom service pricing, accept bookings, dispatch field technicians & track net earnings.',
  },
  {
    role: 'technician',
    roleTitle: 'Technician Field Console',
    fullName: 'Manoj Kumar (Field Engineer)',
    email: 'tech@homeserve.com',
    password: 'Tech@12345',
    badge: 'Active Field Tech',
    dashboardPath: '/technician/dashboard',
    description:
      'View assigned service jobs, customer addresses, update status to In Progress / Completed & upload proof.',
  },
  {
    role: 'super_admin',
    roleTitle: 'Super Admin Governance',
    fullName: 'Vikramaditya Rao (Platform Admin)',
    email: 'admin@homeserve.com',
    password: 'Admin@12345',
    badge: 'Super Admin',
    dashboardPath: '/admin/dashboard',
    description:
      'Approve/reject provider KYC, manage 8 categories, coupons, complaints, commissions & CSV exports.',
  },
];

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

const ROLE_DEFAULT_CREDENTIALS = {
  super_admin: { email: 'admin@homeserve.com', password: 'Admin@12345' },
  customer: { email: 'customer@homeserve.com', password: 'Customer@123' },
  service_provider: { email: 'provider@homeserve.com', password: 'Provider@123' },
  technician: { email: 'tech@homeserve.com', password: 'Tech@12345' },
};

function generateMockHmacHex(str) {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `hmac_sha256_${p1}${p2}${p1}${p2}`;
}

export function PlatformProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(PERSISTENT_DB_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.services) && Array.isArray(parsed.bookings)) {
          return parsed;
        }
      }
    } catch {
      // Fallback to canonical seed dataset
    }
    return INITIAL_MOCK_DATA;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUserJson = sessionStorage.getItem('hs_active_user');
    if (savedUserJson) {
      try {
        return JSON.parse(savedUserJson);
      } catch {
        // Ignore parse error
      }
    }
    return null;
  });

  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Persist every database mutation into localStorage and sync with Cloud Backend API
  useEffect(() => {
    try {
      localStorage.setItem(PERSISTENT_DB_KEY, JSON.stringify(data));
    } catch {
      // Ignore quota errors
    }
  }, [data]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  const syncWithBackend = useCallback(async (preferLocal = false) => {
    try {
      if (preferLocal) {
        const saved = localStorage.getItem(PERSISTENT_DB_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.services) && Array.isArray(parsed.bookings)) {
            await apiClient.post('/sync', { data: parsed }).catch(() => {});
          }
        }
      }
      const res = await apiClient.get('/bootstrap');
      if (res.data && Array.isArray(res.data.services)) {
        setData(res.data);
        setIsBackendConnected(true);
        return res.data;
      }
    } catch {
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    const initSession = async () => {
      const hasLocalCustomizations = Boolean(localStorage.getItem(PERSISTENT_DB_KEY));
      await syncWithBackend(hasLocalCustomizations);
      const existingToken = sessionStorage.getItem('hs_access_token');
      if (existingToken) {
        try {
          const meRes = await apiClient.get('/auth/me');
          setCurrentUser(meRes.data);
          sessionStorage.setItem('hs_active_user', JSON.stringify(meRes.data));
        } catch {
          sessionStorage.removeItem('hs_access_token');
        }
      }
    };
    initSession();
  }, [syncWithBackend]);

  // --- AUTHENTICATION ACTIONS ---
  const loginWithCredentials = async (email, password) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const trimmedPassword = (password || '').trim();
    try {
      const res = await apiClient.post('/auth/login', {
        email: normalizedEmail,
        password: trimmedPassword,
      });
      sessionStorage.setItem('hs_access_token', res.data.access_token);
      sessionStorage.setItem('hs_refresh_token', res.data.refresh_token);
      sessionStorage.setItem('hs_active_user', JSON.stringify(res.data.user));
      setCurrentUser(res.data.user);
      await syncWithBackend();
      showToast(
        `Signed in as ${res.data.user.fullName} (${res.data.user.role.replace('_', ' ').toUpperCase()})`,
        'success'
      );
      return {
        success: true,
        user: res.data.user,
        redirectPath: ROLE_HOME_ROUTES[res.data.user.role] || '/',
      };
    } catch (err) {
      if (err.response) {
        return {
          success: false,
          error: err.response.data?.detail || 'Invalid email or password.',
        };
      }
      const user = data.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        return { success: false, error: 'No account found with this email address.' };
      }
      const expectedPassword = ACCOUNT_PASSWORDS[normalizedEmail] || user.password;
      if (expectedPassword && trimmedPassword !== expectedPassword) {
        return {
          success: false,
          error: `Invalid password for ${normalizedEmail}. Please check the visible role credentials panel.`,
        };
      }
      if (!user.isActive) {
        return {
          success: false,
          error: 'This account has been suspended by Super Admin.',
        };
      }
      sessionStorage.setItem('hs_active_user', JSON.stringify(user));
      setCurrentUser(user);
      showToast(
        `Signed in as ${user.fullName} (${user.role.replace('_', ' ').toUpperCase()})`,
        'success'
      );
      return { success: true, user, redirectPath: ROLE_HOME_ROUTES[user.role] || '/' };
    }
  };

  const quickSwitchRole = async (roleKey) => {
    const creds = ROLE_DEFAULT_CREDENTIALS[roleKey];
    if (creds) {
      const loginRes = await loginWithCredentials(creds.email, creds.password);
      if (loginRes.success) {
        return loginRes.redirectPath;
      }
    }
    return '/login';
  };

  const registerCustomer = async ({ fullName, email, phone, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const res = await apiClient.post('/auth/register/customer', {
        full_name: fullName,
        email: normalizedEmail,
        phone,
        password,
      });
      sessionStorage.setItem('hs_access_token', res.data.access_token);
      sessionStorage.setItem('hs_refresh_token', res.data.refresh_token);
      sessionStorage.setItem('hs_active_user', JSON.stringify(res.data.user));
      setCurrentUser(res.data.user);
      await syncWithBackend();
      showToast('Customer account registered & persisted to database!', 'success');
      return { success: true, user: res.data.user, redirectPath: '/customer/dashboard' };
    } catch (err) {
      if (err.response) {
        return {
          success: false,
          error: err.response.data?.detail || 'Registration failed.',
        };
      }
      if (data.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        return { success: false, error: 'An account with this email already exists.' };
      }
      const newUserId = Math.max(...data.users.map((u) => u.id), 10) + 1;
      const newCustomerId = Math.max(...data.customers.map((c) => c.id), 10) + 1;
      const newUser = {
        id: newUserId,
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone,
        password,
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
        createdAt: '2026-11-04',
      };
      setData((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
        customers: [...prev.customers, newCustomer],
      }));
      sessionStorage.setItem('hs_active_user', JSON.stringify(newUser));
      setCurrentUser(newUser);
      showToast('Customer account registered & saved to persistent storage!', 'success');
      return { success: true, user: newUser, redirectPath: '/customer/dashboard' };
    }
  };

  const registerProvider = async ({
    businessName,
    ownerName,
    email,
    phone,
    password,
    experienceYears,
    city,
    postalCode,
    kycDocumentName,
    selectedCategoryIds,
    bio,
  }) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const res = await apiClient.post('/auth/register/provider', {
        business_name: businessName,
        owner_name: ownerName,
        email: normalizedEmail,
        phone,
        password: password || 'Provider@123',
        experience_years: Number(experienceYears) || 3,
        city: city || 'Bengaluru',
        postal_code: postalCode || '560038',
        kyc_document_name: kycDocumentName || 'KYC_Identity_And_License.pdf',
        selected_category_ids: selectedCategoryIds,
        bio,
      });
      sessionStorage.setItem('hs_access_token', res.data.access_token);
      sessionStorage.setItem('hs_refresh_token', res.data.refresh_token);
      sessionStorage.setItem('hs_active_user', JSON.stringify(res.data.user));
      setCurrentUser(res.data.user);
      await syncWithBackend();
      showToast('Provider application saved to database! Pending Admin KYC approval.', 'success');
      return { success: true, user: res.data.user, redirectPath: '/provider/dashboard' };
    } catch (err) {
      if (err.response) {
        return {
          success: false,
          error: err.response.data?.detail || 'Provider registration failed.',
        };
      }
      const newUserId = Math.max(...data.users.map((u) => u.id), 10) + 1;
      const newProvId = Math.max(...data.providers.map((p) => p.id), 10) + 1;
      const newUser = {
        id: newUserId,
        fullName: ownerName.trim(),
        email: normalizedEmail,
        phone,
        password: password || 'Provider@123',
        role: 'service_provider',
        isActive: true,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };
      const newProvider = {
        id: newProvId,
        userId: newUserId,
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        email: normalizedEmail,
        phone,
        bio: bio || 'Professional residential service partner.',
        experienceYears: Number(experienceYears) || 3,
        verificationStatus: 'Pending',
        kycDocumentName: kycDocumentName || 'KYC_Identity_And_License.pdf',
        subscriptionPlanId: 1,
        averageRating: 0,
        totalReviews: 0,
        completedJobs: 0,
        workingHours: 'Mon - Sun: 08:00 AM - 08:00 PM',
        serviceAreas: [
          {
            id: Date.now(),
            city: city || 'Bengaluru',
            areaName: city || 'Bengaluru',
            postalCode: postalCode || '560038',
          },
        ],
        offeredServices: [],
      };
      setData((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
        providers: [...prev.providers, newProvider],
      }));
      sessionStorage.setItem('hs_active_user', JSON.stringify(newUser));
      setCurrentUser(newUser);
      showToast('Provider application saved! Pending Super Admin KYC approval.', 'success');
      return { success: true, user: newUser, redirectPath: '/provider/dashboard' };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout network error
    }
    sessionStorage.removeItem('hs_access_token');
    sessionStorage.removeItem('hs_refresh_token');
    sessionStorage.removeItem('hs_active_user');
    setCurrentUser(null);
    showToast('Signed out successfully. Please sign in with a role account.', 'info');
  };

  // --- HELPER GETTERS FOR CURRENT ROLE ---
  const currentCustomer =
    data.customers.find((c) => c.userId === currentUser?.id) || data.customers[0];
  const currentProvider =
    data.providers.find((p) => p.userId === currentUser?.id) || data.providers[0];
  const currentTechnician =
    data.technicians.find((t) => t.userId === currentUser?.id) || data.technicians[0];

  // --- DOUBLE BOOKING CHECKER ---
  const checkSlotConflict = (providerId, scheduledDate, startTime, excludeBookingId = null) => {
    const activeStatuses = ['Confirmed', 'Provider Assigned', 'In Progress'];
    return data.bookings.some(
      (b) =>
        b.id !== excludeBookingId &&
        Number(b.providerId) === Number(providerId) &&
        b.scheduledDate === scheduledDate &&
        b.startTime === startTime &&
        activeStatuses.includes(b.status)
    );
  };

  // --- BOOKING CREATION WITH RAZORPAY WEBHOOK SIMULATION (SUCCESS / FAILED / TAMPERED) ---
  const createBooking = async ({
    serviceId,
    providerId,
    addressId,
    scheduledDate,
    startTime,
    endTime,
    problemDescription,
    couponCode,
    paymentType,
    problemImageUrls,
    paymentScenario = 'SUCCESS', // 'SUCCESS' | 'FAILED' | 'TAMPERED_SIGNATURE'
    paymentMethod = 'UPI',
  }) => {
    if (paymentScenario === 'TAMPERED_SIGNATURE') {
      const errMsg =
        'HTTP 400 Bad Request — Razorpay Webhook Verification Failed: Invalid X-Razorpay-Signature (HMAC-SHA256 mismatch). Transaction aborted.';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }

    if (checkSlotConflict(providerId, scheduledDate, startTime)) {
      const errMsg =
        'HTTP 409 Conflict — Double-booking prevented: Provider already has an active appointment in this slot.';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }

    // Execute against live Cloud Backend API when connected
    if (isBackendConnected) {
      try {
        const res = await apiClient.post('/bookings', {
          service_id: Number(serviceId),
          provider_id: Number(providerId),
          address_id: Number(addressId),
          scheduled_date: scheduledDate,
          start_time: startTime,
          end_time: endTime || '10:30',
          problem_description: problemDescription,
          coupon_code: couponCode || null,
          payment_type: paymentType,
          problem_image_urls: problemImageUrls || [],
          payment_scenario: paymentScenario,
          payment_method: paymentMethod,
        });
        await syncWithBackend();
        if (paymentScenario === 'FAILED') {
          showToast(
            `Payment declined by bank for ${res.data.bookingNumber}. You can complete payment anytime from your booking page.`,
            'error'
          );
        } else {
          showToast(
            `Payment Successful! Booking #${res.data.bookingNumber} is confirmed & GST receipt generated.`,
            'success'
          );
        }
        return { success: true, booking: res.data };
      } catch (err) {
        const msg =
          err.response?.data?.detail || 'Booking failed due to validation or slot conflict.';
        showToast(msg, 'error');
        return { success: false, error: msg };
      }
    }

    // Persistent Database Engine Execution (Handles both payment.captured AND payment.failed webhook scenarios)
    const service =
      data.services.find((s) => Number(s.id) === Number(serviceId)) || data.services[0];
    const provider =
      data.providers.find((p) => Number(p.id) === Number(providerId)) || data.providers[0];
    if (provider.verificationStatus !== 'Approved') {
      const msg = 'Provider KYC is not approved. Only verified providers can accept bookings.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
    const address =
      data.addresses.find((a) => Number(a.id) === Number(addressId)) || data.addresses[0];
    const customOffer = provider.offeredServices?.find(
      (os) => Number(os.serviceId) === Number(service.id)
    );
    const subtotal = Number(customOffer?.customPrice || service.basePrice || 599);

    let discountAmount = 0;
    const coupon = data.coupons.find(
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

    const newBookingId = Math.max(...data.bookings.map((b) => Number(b.id)), 104) + 1;
    const bookingNumber = `HS-20261104-0${newBookingId}`;
    const orderId = `order_RzpTest_${newBookingId}`;
    const paymentId = `pay_RzpTest_${newBookingId}_${Date.now().toString().slice(-4)}`;
    const webhookEvent = isPaymentFailed ? 'payment.failed' : 'payment.captured';
    const webhookSignature = generateMockHmacHex(`${orderId}|${paymentId}|${webhookEvent}`);

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
      endTime: endTime || '10:30',
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
      images: (problemImageUrls || []).map((url, idx) => ({
        id: Date.now() + idx,
        type: 'PROBLEM',
        url,
        caption: 'Customer uploaded problem photo',
      })),
      createdAt: new Date().toISOString(),
    };

    const newPayment = {
      id: Math.max(...(data.payments || []).map((p) => Number(p.id)), 504) + 1,
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
      id: Math.max(...(data.invoices || []).map((inv) => Number(inv.id)), 902) + 1,
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

    const newNotification = {
      id: Date.now(),
      userId: currentUser?.id || 2,
      role: 'customer',
      title: isPaymentFailed
        ? `Payment Failed (${webhookEvent}) — ${bookingNumber}`
        : `Booking Confirmed (${webhookEvent}) — ${bookingNumber}`,
      message: isPaymentFailed
        ? `Razorpay webhook reported payment.failed for order ${orderId}. Please retry payment from your booking page.`
        : `Your booking for ${service.name} on ${scheduledDate} (${startTime}) is confirmed. Razorpay Order ${orderId} verified.`,
      isRead: false,
      createdAt: 'Just now',
    };

    setData((prev) => ({
      ...prev,
      bookings: [newBooking, ...prev.bookings],
      payments: [newPayment, ...(prev.payments || [])],
      invoices: [newInvoice, ...(prev.invoices || [])],
      notifications: [newNotification, ...(prev.notifications || [])],
    }));

    if (isPaymentFailed) {
      showToast(
        `Payment declined by bank for ${bookingNumber}. You can complete payment anytime from your booking page.`,
        'error'
      );
    } else {
      showToast(
        `Payment Successful! Booking #${bookingNumber} is confirmed & GST receipt generated.`,
        'success'
      );
    }

    return { success: true, booking: newBooking };
  };

  // --- SIMULATE RAZORPAY WEBHOOK ON EXISTING BOOKING (SUCCESS / FAILED / TAMPERED) ---
  const simulateRazorpayWebhook = async (bookingId, scenario = 'SUCCESS') => {
    const target = data.bookings.find((b) => Number(b.id) === Number(bookingId));
    if (!target) return { success: false, error: 'Booking not found.' };

    if (isBackendConnected) {
      apiClient
        .post('/payments/webhook', {
          booking_id: Number(bookingId),
          scenario,
        })
        .catch(() => {});
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
      setData((prev) => ({
        ...prev,
        bookings: prev.bookings.map((b) =>
          Number(b.id) === Number(bookingId)
            ? { ...b, webhookLogs: [tamperedLog, ...(b.webhookLogs || [])] }
            : b
        ),
      }));
      showToast(
        'Security Check Passed: Tampered X-Razorpay-Signature rejected with HTTP 400!',
        'error'
      );
      return { success: false, error: tamperedLog.reason };
    }

    const isFail = scenario === 'FAILED';
    const eventName = isFail ? 'payment.failed' : 'payment.captured';
    const validSig = generateMockHmacHex(`${orderId}|${paymentId}|${eventName}`);

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

    setData((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => {
        if (Number(b.id) !== Number(bookingId)) return b;
        return {
          ...b,
          paymentStatus: isFail ? 'Failed' : 'Paid',
          paidAmount: isFail ? 0 : b.totalAmount,
          pendingAmount: isFail ? b.totalAmount : 0,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: validSig,
          webhookLogs: [logEntry, ...(b.webhookLogs || [])],
        };
      }),
      invoices: (prev.invoices || []).map((inv) =>
        Number(inv.bookingId) === Number(bookingId)
          ? {
            ...inv,
            status: isFail ? 'Payment Failed' : 'Paid',
            paidAmount: isFail ? 0 : target.totalAmount,
            pendingAmount: isFail ? target.totalAmount : 0,
          }
          : inv
      ),
      notifications: [
        {
          id: Date.now(),
          userId: currentUser?.id || 2,
          role: 'customer',
          title: `Razorpay Webhook (${eventName}) — ${target.bookingNumber}`,
          message: logEntry.reason,
          isRead: false,
          createdAt: 'Just now',
        },
        ...(prev.notifications || []),
      ],
    }));

    if (isFail) {
      showToast(
        `Payment could not be completed for Booking #${target.bookingNumber}. Please retry.`,
        'error'
      );
    } else {
      showToast(
        `Payment Completed Successfully! Booking #${target.bookingNumber} is now 100% Paid.`,
        'success'
      );
    }
    return { success: true };
  };

  // --- BOOKING STATUS & WORKFLOW TRANSITIONS ---
  const updateBookingStatus = async (bookingId, nextStatus, reason = '') => {
    if (isBackendConnected) {
      try {
        await apiClient.patch(`/bookings/${bookingId}/status`, {
          status: nextStatus,
          reason,
        });
        await syncWithBackend();
        showToast(`Booking status updated to ${nextStatus}`, 'success');
        return { success: true };
      } catch (err) {
        const msg = err.response?.data?.detail || 'Failed to update booking status.';
        showToast(msg, 'error');
        return { success: false, error: msg };
      }
    }

    setData((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => {
        if (Number(b.id) !== Number(bookingId)) return b;
        const isRefund = ['Cancelled', 'Rejected'].includes(nextStatus) && b.paidAmount > 0;
        return {
          ...b,
          status: nextStatus,
          cancellationReason: reason || b.cancellationReason,
          paymentStatus: isRefund ? 'Refunded' : b.paymentStatus,
        };
      }),
    }));
    showToast(`Booking status updated to ${nextStatus}`, 'success');
    return { success: true };
  };

  const rescheduleBooking = async (bookingId, newDate, newStartTime, newEndTime) => {
    const target = data.bookings.find((b) => Number(b.id) === Number(bookingId));
    if (target && checkSlotConflict(target.providerId, newDate, newStartTime, Number(bookingId))) {
      const msg = 'Slot conflict: Provider is already booked for that date and time.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }

    if (isBackendConnected) {
      try {
        await apiClient.post(`/bookings/${bookingId}/reschedule`, {
          scheduled_date: newDate,
          start_time: newStartTime,
          end_time: newEndTime || '12:30',
        });
        await syncWithBackend();
        showToast(`Booking rescheduled to ${newDate} (${newStartTime})`, 'success');
        return { success: true };
      } catch (err) {
        const msg = err.response?.data?.detail || 'Reschedule failed due to slot conflict.';
        showToast(msg, 'error');
        return { success: false, error: msg };
      }
    }

    setData((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) =>
        Number(b.id) === Number(bookingId)
          ? {
            ...b,
            scheduledDate: newDate,
            startTime: newStartTime,
            endTime: newEndTime || '12:30',
          }
          : b
      ),
    }));
    showToast(`Booking rescheduled to ${newDate} (${newStartTime})`, 'success');
    return { success: true };
  };

  const assignTechnicianToBooking = async (bookingId, technicianId) => {
    if (isBackendConnected) {
      try {
        await apiClient.post(`/bookings/${bookingId}/assign-technician`, {
          technician_id: Number(technicianId),
        });
        await syncWithBackend();
        showToast('Technician assigned and notified!', 'success');
        return { success: true };
      } catch (err) {
        const msg = err.response?.data?.detail || 'Technician assignment failed.';
        showToast(msg, 'error');
        return { success: false };
      }
    }

    const tech = data.technicians.find((t) => Number(t.id) === Number(technicianId));
    setData((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) =>
        Number(b.id) === Number(bookingId)
          ? {
            ...b,
            status: 'Provider Assigned',
            technicianId: tech?.id || Number(technicianId),
            technicianName: tech?.fullName || 'Assigned Technician',
          }
          : b
      ),
    }));
    showToast(`Technician ${tech?.fullName || ''} assigned and notified!`, 'success');
    return { success: true };
  };

  const technicianUpdateJob = async (
    bookingId,
    { action, completionRemarks, completionImageUrl }
  ) => {
    if (isBackendConnected) {
      try {
        await apiClient.patch(`/technicians/me/jobs/${bookingId}`, {
          action,
          completion_remarks: completionRemarks,
          completion_image_url: completionImageUrl,
        });
        await syncWithBackend();
        showToast(
          action === 'ARRIVE_START'
            ? 'Arrival timestamp recorded & job is now In Progress!'
            : 'Job marked Completed with photo proof & earnings settled!',
          'success'
        );
        return;
      } catch (err) {
        showToast(err.response?.data?.detail || 'Failed to update job.', 'error');
        return;
      }
    }

    setData((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => {
        if (Number(b.id) !== Number(bookingId)) return b;
        if (action === 'ARRIVE_START') {
          return {
            ...b,
            status: 'In Progress',
            arrivedAt: new Date().toISOString(),
          };
        }
        const newImages = completionImageUrl
          ? [
            ...(b.images || []),
            {
              id: Date.now(),
              type: 'COMPLETION',
              url: completionImageUrl,
              caption: completionRemarks || 'Technician completion photo proof',
            },
          ]
          : b.images || [];
        return {
          ...b,
          status: 'Completed',
          completedAt: new Date().toISOString(),
          completionRemarks: completionRemarks || 'Service completed and verified on site.',
          paymentStatus: 'Paid',
          paidAmount: b.totalAmount,
          pendingAmount: 0,
          images: newImages,
        };
      }),
    }));
    showToast(
      action === 'ARRIVE_START'
        ? 'Arrival timestamp recorded & job is now In Progress!'
        : 'Job marked Completed with photo proof & earnings settled!',
      'success'
    );
  };

  const settleBalancePayment = async (bookingId) => {
    return simulateRazorpayWebhook(bookingId, 'SUCCESS');
  };

  // --- CUSTOMER ADDRESSES & FAVORITES ---
  const addAddress = async (addr) => {
    if (isBackendConnected) {
      try {
        await apiClient.post('/customers/me/addresses', {
          label: addr.label,
          address_line1: addr.addressLine1,
          landmark: addr.landmark,
          city: addr.city,
          state: addr.state || 'Karnataka',
          postal_code: addr.postalCode,
          is_default: Boolean(addr.isDefault),
        });
        await syncWithBackend();
        showToast('Service address saved to database.', 'success');
        return;
      } catch (err) {
        showToast(err.response?.data?.detail || 'Could not save address.', 'error');
        return;
      }
    }
    const newAddrObj = {
      id: Date.now(),
      customerId: currentCustomer.id,
      label: addr.label || 'Home',
      addressLine1: addr.addressLine1,
      landmark: addr.landmark || '',
      city: addr.city || 'Bengaluru',
      state: addr.state || 'Karnataka',
      postalCode: addr.postalCode || '560038',
      isDefault: Boolean(addr.isDefault),
    };
    setData((prev) => ({
      ...prev,
      addresses: [...prev.addresses, newAddrObj],
    }));
    showToast('Service address saved.', 'success');
  };

  const deleteAddress = async (addressId) => {
    if (isBackendConnected) {
      try {
        await apiClient.delete(`/customers/me/addresses/${addressId}`);
        await syncWithBackend();
        showToast('Address deleted.', 'info');
        return;
      } catch (err) {
        showToast(err.response?.data?.detail || 'Could not delete address.', 'error');
        return;
      }
    }
    setData((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((a) => Number(a.id) !== Number(addressId)),
    }));
    showToast('Address deleted.', 'info');
  };

  const toggleFavoriteProvider = async (providerId) => {
    if (isBackendConnected) {
      try {
        await apiClient.post(`/customers/me/favorites/${providerId}`);
        await syncWithBackend();
        showToast('Updated favorite service providers.', 'info');
        return;
      } catch (err) {
        showToast(err.response?.data?.detail || 'Could not update favorites.', 'error');
        return;
      }
    }
    showToast('Updated favorite service providers.', 'info');
  };

  // --- REVIEWS & COMPLAINTS ---
  const submitReview = async ({ bookingId, rating, comment }) => {
    if (isBackendConnected) {
      try {
        await apiClient.post('/reviews', {
          booking_id: Number(bookingId),
          rating: Number(rating),
          comment,
        });
        await syncWithBackend();
        showToast('Verified service review published!', 'success');
        return;
      } catch (err) {
        showToast(err.response?.data?.detail || 'Could not submit review.', 'error');
        return;
      }
    }
    const targetBooking = data.bookings.find((b) => Number(b.id) === Number(bookingId));
    const newRev = {
      id: Date.now(),
      bookingId: Number(bookingId),
      bookingNumber: targetBooking?.bookingNumber || `HS-${bookingId}`,
      customerId: currentCustomer.id,
      customerName: currentCustomer.fullName,
      providerId: targetBooking?.providerId || 1,
      providerName: targetBooking?.providerName || 'Apex Home Solutions',
      serviceName: targetBooking?.serviceName || 'Home Service',
      rating: Number(rating),
      comment,
      providerReply: null,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setData((prev) => ({
      ...prev,
      reviews: [newRev, ...prev.reviews],
      bookings: prev.bookings.map((b) =>
        Number(b.id) === Number(bookingId) ? { ...b, hasReview: true } : b
      ),
    }));
    showToast('Verified service review published!', 'success');
  };

  const replyToReview = async (reviewId, replyText) => {
    if (isBackendConnected) {
      try {
        await apiClient.post(`/reviews/${reviewId}/reply`, {
          provider_reply: replyText,
        });
        await syncWithBackend();
        showToast('Provider response saved.', 'success');
        return;
      } catch (err) {
        showToast(err.response?.data?.detail || 'Could not post reply.', 'error');
        return;
      }
    }
    setData((prev) => ({
      ...prev,
      reviews: prev.reviews.map((r) =>
        Number(r.id) === Number(reviewId) ? { ...r, providerReply: replyText } : r
      ),
    }));
    showToast('Provider response saved.', 'success');
  };

  const submitComplaint = async ({ bookingId, subject, description }) => {
    if (isBackendConnected) {
      try {
        const res = await apiClient.post('/complaints', {
          booking_id: Number(bookingId),
          subject,
          description,
        });
        await syncWithBackend();
        showToast(`Complaint ${res.data.complaintNumber} submitted to Super Admin.`, 'success');
        return;
      } catch (err) {
        showToast(err.response?.data?.detail || 'Could not submit complaint.', 'error');
        return;
      }
    }
    const targetBooking = data.bookings.find((b) => Number(b.id) === Number(bookingId));
    const newCmp = {
      id: Date.now(),
      complaintNumber: `CMP-2026-00${(data.complaints?.length || 1) + 1}`,
      bookingId: Number(bookingId),
      bookingNumber: targetBooking?.bookingNumber || `HS-${bookingId}`,
      customerId: currentCustomer.id,
      customerName: currentCustomer.fullName,
      providerId: targetBooking?.providerId || 1,
      providerName: targetBooking?.providerName || 'Service Provider',
      subject,
      description,
      status: 'Open',
      adminResolutionNotes: null,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setData((prev) => ({
      ...prev,
      complaints: [newCmp, ...(prev.complaints || [])],
    }));
    showToast(`Complaint ${newCmp.complaintNumber} submitted to Super Admin.`, 'success');
  };

  // --- ADMIN GOVERNANCE ACTIONS ---
  const verifyProviderKyc = async (providerId, decision, remarks = '') => {
    if (isBackendConnected) {
      try {
        await apiClient.patch(`/admin/providers/${providerId}/verify`, {
          verification_status: decision,
          rejection_remarks: remarks,
        });
        await syncWithBackend();
        showToast(
          `Provider KYC status updated to ${decision}.`,
          decision === 'Approved' ? 'success' : 'info'
        );
        return;
      } catch (err) {
        showToast(err.response?.data?.detail || 'KYC update failed.', 'error');
        return;
      }
    }
    setData((prev) => ({
      ...prev,
      providers: prev.providers.map((p) =>
        Number(p.id) === Number(providerId)
          ? { ...p, verificationStatus: decision, rejectionRemarks: remarks }
          : p
      ),
    }));
    showToast(
      `Provider KYC status updated to ${decision}.`,
      decision === 'Approved' ? 'success' : 'info'
    );
  };

  const resolveComplaint = async (complaintId, statusVal, adminResolutionNotes) => {
    if (isBackendConnected) {
      try {
        await apiClient.patch(`/admin/complaints/${complaintId}`, {
          status: statusVal,
          admin_resolution_notes: adminResolutionNotes,
        });
        await syncWithBackend();
        showToast(`Complaint status updated to ${statusVal}.`, 'success');
        return;
      } catch (err) {
        showToast(err.response?.data?.detail || 'Complaint update failed.', 'error');
        return;
      }
    }
    setData((prev) => ({
      ...prev,
      complaints: prev.complaints.map((c) =>
        Number(c.id) === Number(complaintId)
          ? { ...c, status: statusVal, adminResolutionNotes }
          : c
      ),
    }));
    showToast(`Complaint status updated to ${statusVal}.`, 'success');
  };

  const createCategory = async (catData) => {
    if (isBackendConnected) {
      try {
        await apiClient.post('/categories', {
          name: catData.name,
          subcategories: catData.subcategories
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          description: catData.description,
        });
        await syncWithBackend();
        showToast(`Category "${catData.name}" created in database.`, 'success');
        return;
      } catch (err) {
        showToast(err.response?.data?.detail || 'Failed to create category.', 'error');
        return;
      }
    }
    const newCat = {
      id: Date.now(),
      name: catData.name,
      slug: catData.name.toLowerCase().replace(/\s+/g, '-'),
      subcategories: catData.subcategories
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      description: catData.description,
      iconName: 'Wrench',
      isActive: true,
    };
    setData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));
    showToast(`Category "${catData.name}" created.`, 'success');
  };

  const createServiceListing = async (svcData) => {
    if (isBackendConnected) {
      try {
        await apiClient.post('/services', {
          category_id: Number(svcData.categoryId),
          subcategory: svcData.subcategory || 'General',
          name: svcData.name,
          description: svcData.description,
          base_price: Number(svcData.basePrice),
          duration_minutes: Number(svcData.durationMinutes) || 60,
        });
        await syncWithBackend();
        showToast(`Service "${svcData.name}" added to catalog.`, 'success');
        return;
      } catch (err) {
        showToast(err.response?.data?.detail || 'Failed to create service.', 'error');
        return;
      }
    }
    const cat = data.categories.find((c) => Number(c.id) === Number(svcData.categoryId));
    const newSvc = {
      id: Date.now(),
      categoryId: Number(svcData.categoryId),
      categoryName: cat?.name || 'Home Service',
      subcategory: svcData.subcategory || 'General',
      name: svcData.name,
      description: svcData.description,
      basePrice: Number(svcData.basePrice),
      durationMinutes: Number(svcData.durationMinutes) || 60,
      isActive: true,
    };
    setData((prev) => ({
      ...prev,
      services: [...prev.services, newSvc],
    }));
    showToast(`Service "${svcData.name}" added to catalog.`, 'success');
  };

  const createCoupon = async (couponData) => {
    if (isBackendConnected) {
      try {
        await apiClient.post('/admin/coupons', {
          code: couponData.code.toUpperCase(),
          description: couponData.description,
          discount_type: couponData.discountType || 'PERCENTAGE',
          discount_value: Number(couponData.discountValue),
          min_order_amount: Number(couponData.minOrderAmount) || 499,
          max_discount: Number(couponData.maxDiscount) || 500,
        });
        await syncWithBackend();
        showToast(`Coupon ${couponData.code.toUpperCase()} published.`, 'success');
        return;
      } catch (err) {
        showToast(err.response?.data?.detail || 'Failed to create coupon.', 'error');
        return;
      }
    }
    const newCpn = {
      id: Date.now(),
      code: couponData.code.toUpperCase(),
      description: couponData.description,
      discountType: couponData.discountType || 'PERCENTAGE',
      discountValue: Number(couponData.discountValue),
      minOrderAmount: Number(couponData.minOrderAmount) || 499,
      maxDiscount: Number(couponData.maxDiscount) || 500,
      isActive: true,
    };
    setData((prev) => ({
      ...prev,
      coupons: [...prev.coupons, newCpn],
    }));
    showToast(`Coupon ${newCpn.code} published.`, 'success');
  };

  const addTechnician = async (techData) => {
    if (isBackendConnected) {
      try {
        await apiClient.post('/technicians', {
          full_name: techData.fullName,
          email: techData.email,
          phone: techData.phone,
          specialization: techData.specialization,
          experience_years: Number(techData.experienceYears) || 3,
        });
        await syncWithBackend();
        showToast(`Technician ${techData.fullName} added to roster.`, 'success');
        return;
      } catch (err) {
        showToast(err.response?.data?.detail || 'Failed to add technician.', 'error');
        return;
      }
    }
    const newTech = {
      id: Date.now(),
      providerId: currentProvider.id,
      fullName: techData.fullName,
      email: techData.email,
      phone: techData.phone,
      specialization: techData.specialization,
      experienceYears: Number(techData.experienceYears) || 3,
      availabilityStatus: 'Available',
      completedJobsCount: 0,
    };
    setData((prev) => ({
      ...prev,
      technicians: [...prev.technicians, newTech],
    }));
    showToast(`Technician ${techData.fullName} added to roster.`, 'success');
  };

  const markAllNotificationsRead = async () => {
    if (isBackendConnected) {
      try {
        await apiClient.patch('/notifications/read-all');
        await syncWithBackend();
        showToast('All notifications marked as read.', 'info');
        return;
      } catch {
        // Fallback
      }
    }
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
    }));
    showToast('All notifications marked as read.', 'info');
  };

  const toggleCustomerStatus = async (customerId) => {
    if (isBackendConnected) {
      try {
        await apiClient.patch(`/admin/customers/${customerId}/status`);
        await syncWithBackend();
        showToast('Customer account status updated.', 'info');
        return;
      } catch (err) {
        showToast(err.response?.data?.detail || 'Failed to update status.', 'error');
        return;
      }
    }
    setData((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        Number(c.id) === Number(customerId)
          ? { ...c, accountStatus: c.accountStatus === 'Active' ? 'Suspended' : 'Active' }
          : c
      ),
    }));
    showToast('Customer account status updated.', 'info');
  };

  const resetDemoDatabase = () => {
    localStorage.removeItem(PERSISTENT_DB_KEY);
    if (isBackendConnected) {
      apiClient.post('/reset').catch(() => {});
    }
    setData({ ...INITIAL_MOCK_DATA, isMockMode: false });
    showToast('Database reset to initial canonical seed state.', 'info');
  };

  return (
    <PlatformContext.Provider
      value={{
        data,
        currentUser,
        currentCustomer,
        currentProvider,
        currentTechnician,
        isBackendConnected,
        isLoading,
        toast,
        showToast,
        syncWithBackend,
        loginWithCredentials,
        quickSwitchRole,
        registerCustomer,
        registerProvider,
        logout,
        checkSlotConflict,
        createBooking,
        simulateRazorpayWebhook,
        updateBookingStatus,
        rescheduleBooking,
        assignTechnicianToBooking,
        technicianUpdateJob,
        settleBalancePayment,
        addAddress,
        deleteAddress,
        toggleFavoriteProvider,
        submitReview,
        replyToReview,
        submitComplaint,
        verifyProviderKyc,
        resolveComplaint,
        createCategory,
        createServiceListing,
        createCoupon,
        addTechnician,
        markAllNotificationsRead,
        toggleCustomerStatus,
        resetDemoDatabase,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) {
    throw new Error('usePlatform must be used inside PlatformProvider');
  }
  return ctx;
}
