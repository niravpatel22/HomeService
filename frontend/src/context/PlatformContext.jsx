import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_MOCK_DATA } from '../services/mockData';
import { ROLE_HOME_ROUTES } from '../constants';
import apiClient from '../services/apiClient';

const PlatformContext = createContext(null);

export const DEMO_ROLE_CREDENTIALS = [
  {
    role: 'customer',
    roleTitle: 'Customer Dashboard',
    fullName: 'Aarav Mehta',
    email: 'customer@homeserve.com',
    password: 'Customer@123',
    badge: 'Verified Customer',
    dashboardPath: '/customer/dashboard',
    description: 'Book services, apply coupons, track technician status, download GST invoices & submit reviews.',
  },
  {
    role: 'service_provider',
    roleTitle: 'Service Provider Console',
    fullName: 'Rajesh Kulkarni (Apex Home Solutions)',
    email: 'provider@homeserve.com',
    password: 'Provider@123',
    badge: 'KYC Approved Partner',
    dashboardPath: '/provider/dashboard',
    description: 'Manage custom service pricing, accept bookings, dispatch field technicians & track net earnings.',
  },
  {
    role: 'technician',
    roleTitle: 'Technician Field Console',
    fullName: 'Manoj Kumar (Field Engineer)',
    email: 'tech@homeserve.com',
    password: 'Tech@12345',
    badge: 'Active Field Tech',
    dashboardPath: '/technician/dashboard',
    description: 'View assigned service jobs, customer addresses, update status to In Progress / Completed & upload proof.',
  },
  {
    role: 'super_admin',
    roleTitle: 'Super Admin Governance',
    fullName: 'Vikramaditya Rao (Platform Admin)',
    email: 'admin@homeserve.com',
    password: 'Admin@12345',
    badge: 'Super Admin',
    dashboardPath: '/admin/dashboard',
    description: 'Approve/reject provider KYC, manage 8 categories, coupons, complaints, commissions & CSV exports.',
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

export function PlatformProvider({ children }) {
  const [data, setData] = useState(INITIAL_MOCK_DATA);
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

  const showToast = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  const syncWithBackend = useCallback(async () => {
    try {
      const res = await apiClient.get('/bootstrap');
      if (res.data && Array.isArray(res.data.services)) {
        setData(res.data);
        setIsBackendConnected(true);
        return res.data;
      }
    } catch {
      // Backend server not reachable yet; gracefully retain synchronized initial dataset
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    const initSession = async () => {
      await syncWithBackend();
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
      showToast(`Signed in as ${res.data.user.fullName} (${res.data.user.role.replace('_', ' ').toUpperCase()})`, 'success');
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
      // Role-based credential verification against seeded users
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
      showToast(`Signed in as ${user.fullName} (${user.role.replace('_', ' ').toUpperCase()})`, 'success');
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
    try {
      const res = await apiClient.post('/auth/register/customer', {
        full_name: fullName,
        email,
        phone,
        password,
      });
      sessionStorage.setItem('hs_access_token', res.data.access_token);
      sessionStorage.setItem('hs_refresh_token', res.data.refresh_token);
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
      return { success: false, error: 'Unable to reach registration API.' };
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
    try {
      const res = await apiClient.post('/auth/register/provider', {
        business_name: businessName,
        owner_name: ownerName,
        email,
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
      return { success: false, error: 'Unable to reach provider registration API.' };
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

  // --- BOOKING CREATION ---
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
  }) => {
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
      });
      await syncWithBackend();
      showToast(
        `Booking ${res.data.bookingNumber} persisted & Razorpay payment verified!`,
        'success'
      );
      return { success: true, booking: res.data };
    } catch (err) {
      const msg =
        err.response?.data?.detail || 'Booking failed due to validation or slot conflict.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  // --- BOOKING STATUS & WORKFLOW TRANSITIONS ---
  const updateBookingStatus = async (bookingId, nextStatus, reason = '') => {
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
  };

  const rescheduleBooking = async (bookingId, newDate, newStartTime, newEndTime) => {
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
  };

  const assignTechnicianToBooking = async (bookingId, technicianId) => {
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
  };

  const technicianUpdateJob = async (
    bookingId,
    { action, completionRemarks, completionImageUrl }
  ) => {
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
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update job.', 'error');
    }
  };

  const settleBalancePayment = async (bookingId) => {
    try {
      const orderRes = await apiClient.post('/payments/create-order', {
        booking_id: Number(bookingId),
        payment_type: 'BALANCE',
      });
      await apiClient.post('/payments/verify', {
        booking_id: Number(bookingId),
        razorpay_order_id: orderRes.data.razorpayOrderId,
        razorpay_payment_id: orderRes.data.testPaymentId,
        razorpay_signature: orderRes.data.testSignature,
      });
      await syncWithBackend();
      showToast('Balance payment verified via Razorpay HMAC-SHA256!', 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Payment verification failed.', 'error');
    }
  };

  // --- CUSTOMER ADDRESSES & FAVORITES ---
  const addAddress = async (addr) => {
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
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not save address.', 'error');
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      await apiClient.delete(`/customers/me/addresses/${addressId}`);
      await syncWithBackend();
      showToast('Address deleted.', 'info');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not delete address.', 'error');
    }
  };

  const toggleFavoriteProvider = async (providerId) => {
    try {
      await apiClient.post(`/customers/me/favorites/${providerId}`);
      await syncWithBackend();
      showToast('Updated favorite service providers.', 'info');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not update favorites.', 'error');
    }
  };

  // --- REVIEWS & COMPLAINTS ---
  const submitReview = async ({ bookingId, rating, comment }) => {
    try {
      await apiClient.post('/reviews', {
        booking_id: Number(bookingId),
        rating: Number(rating),
        comment,
      });
      await syncWithBackend();
      showToast('Verified service review published!', 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not submit review.', 'error');
    }
  };

  const replyToReview = async (reviewId, replyText) => {
    try {
      await apiClient.post(`/reviews/${reviewId}/reply`, {
        provider_reply: replyText,
      });
      await syncWithBackend();
      showToast('Provider response saved.', 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not post reply.', 'error');
    }
  };

  const submitComplaint = async ({ bookingId, subject, description }) => {
    try {
      const res = await apiClient.post('/complaints', {
        booking_id: Number(bookingId),
        subject,
        description,
      });
      await syncWithBackend();
      showToast(`Complaint ${res.data.complaintNumber} submitted to Super Admin.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not submit complaint.', 'error');
    }
  };

  // --- ADMIN GOVERNANCE ACTIONS ---
  const verifyProviderKyc = async (providerId, decision, remarks = '') => {
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
    } catch (err) {
      showToast(err.response?.data?.detail || 'KYC update failed.', 'error');
    }
  };

  const resolveComplaint = async (complaintId, statusVal, adminResolutionNotes) => {
    try {
      await apiClient.patch(`/admin/complaints/${complaintId}`, {
        status: statusVal,
        admin_resolution_notes: adminResolutionNotes,
      });
      await syncWithBackend();
      showToast(`Complaint status updated to ${statusVal}.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Complaint update failed.', 'error');
    }
  };

  const createCategory = async (catData) => {
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
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create category.', 'error');
    }
  };

  const createServiceListing = async (svcData) => {
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
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create service.', 'error');
    }
  };

  const createCoupon = async (couponData) => {
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
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create coupon.', 'error');
    }
  };

  const addTechnician = async (techData) => {
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
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to add technician.', 'error');
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      await syncWithBackend();
      showToast('All notifications marked as read.', 'info');
    } catch {
      // Fallback
    }
  };

  const toggleCustomerStatus = async (customerId) => {
    try {
      await apiClient.patch(`/admin/customers/${customerId}/status`);
      await syncWithBackend();
      showToast('Customer account status updated.', 'info');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update status.', 'error');
    }
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
