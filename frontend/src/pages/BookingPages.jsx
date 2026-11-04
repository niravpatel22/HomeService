import React, { useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Tag,
  CheckCircle2,
  AlertCircle,
  Upload,
  CreditCard,
  Printer,
  ArrowLeft,
  Star,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { TIME_SLOTS, BOOKING_STATUSES } from '../constants';
import { StatusBadge, ConfirmDialog, Modal } from '../components/common/UIComponents';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

export function BookingCheckoutPage() {
  const { serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data, currentCustomer, checkSlotConflict, createBooking, addAddress } = usePlatform();

  const service = data.services.find((s) => Number(s.id) === Number(serviceId)) || data.services[0];
  const approvedProviders = data.providers.filter((p) => p.verificationStatus === 'Approved');
  const preselectedProvId = searchParams.get('provider') || approvedProviders[0]?.id;

  const customerAddresses = data.addresses.filter((a) => a.customerId === currentCustomer.id);

  const [selectedProviderId, setSelectedProviderId] = useState(Number(preselectedProvId));
  const [scheduledDate, setScheduledDate] = useState('2026-11-05');
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  const [selectedAddressId, setSelectedAddressId] = useState(customerAddresses[0]?.id || 1);
  const [problemDescription, setProblemDescription] = useState('');
  const [couponInput, setCouponInput] = useState('WELCOME20');
  const [appliedCoupon, setAppliedCoupon] = useState(data.coupons[0]);
  const [paymentType, setPaymentType] = useState('FULL');
  const [uploadedImageName, setUploadedImageName] = useState('');
  const [error, setError] = useState('');
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [razorpayModalOpen, setRazorpayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI (Google Pay / PhonePe)');
  const [rzpGatewayError, setRzpGatewayError] = useState('');
  const [newAddr, setNewAddr] = useState({
    label: 'Home',
    addressLine1: '',
    landmark: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    isDefault: false,
  });

  const selectedProvider =
    approvedProviders.find((p) => Number(p.id) === Number(selectedProviderId)) || approvedProviders[0];
  const customOffer = selectedProvider?.offeredServices?.find(
    (os) => Number(os.serviceId) === Number(service.id)
  );
  const subtotal = Number(customOffer?.customPrice || service.basePrice || 599);

  let discountAmount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.minOrderAmount) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.min(
        (subtotal * appliedCoupon.discountValue) / 100,
        appliedCoupon.maxDiscount
      );
    } else {
      discountAmount = Math.min(appliedCoupon.discountValue, appliedCoupon.maxDiscount);
    }
  }
  const taxable = Math.max(subtotal - discountAmount, 0);
  const taxAmount = Number((taxable * 0.18).toFixed(2));
  const totalAmount = Number((taxable + taxAmount).toFixed(2));
  const payableNow = paymentType === 'ADVANCE' ? Number((totalAmount * 0.25).toFixed(2)) : totalAmount;

  const handleApplyCoupon = () => {
    const match = data.coupons.find(
      (c) => c.code.toUpperCase() === couponInput.trim().toUpperCase() && c.isActive
    );
    if (!match) {
      setError('Invalid or expired coupon code.');
      setAppliedCoupon(null);
      return;
    }
    if (subtotal < match.minOrderAmount) {
      setError(`Coupon ${match.code} requires a minimum service charge of ₹${match.minOrderAmount}.`);
      setAppliedCoupon(null);
      return;
    }
    setError('');
    setAppliedCoupon(match);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, or WEBP problem images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image exceeds maximum 5 MB limit.');
      return;
    }
    setError('');
    setUploadedImageName(file.name);
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    setError('');
    setRzpGatewayError('');
    if (!problemDescription.trim() || problemDescription.trim().length < 10) {
      setError('Please describe the service requirement or problem (minimum 10 characters).');
      return;
    }
    if (checkSlotConflict(selectedProvider.id, scheduledDate, selectedSlot.start)) {
      setError('Selected time slot is already occupied for this provider. Please select another slot.');
      return;
    }
    setRazorpayModalOpen(true);
  };

  const handleExecuteRazorpayScenario = async (scenario) => {
    setRzpGatewayError('');
    const res = await createBooking({
      serviceId: service.id,
      providerId: selectedProvider.id,
      addressId: selectedAddressId,
      scheduledDate,
      startTime: selectedSlot.start,
      endTime: selectedSlot.end,
      problemDescription,
      couponCode: appliedCoupon?.code || null,
      paymentType,
      problemImageUrls: uploadedImageName
        ? ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80']
        : [],
      paymentScenario: scenario,
      paymentMethod,
    });

    if (!res.success) {
      setRzpGatewayError(res.error);
      return;
    }
    setRazorpayModalOpen(false);
    navigate(`/bookings/${res.booking.id}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to={`/services/${service.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {service.name}
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Book Appointment & Razorpay Sandbox Checkout
        </h1>
        <p className="text-xs text-slate-500">
          Real-time slot conflict check • Server-side price calculation • Instant booking confirmation
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleConfirmBooking} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Select Approved Provider */}
          <div className="card-surface p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              1. Select Verified Service Provider
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {approvedProviders.map((prov) => {
                const isSelected = Number(selectedProvider.id) === Number(prov.id);
                const rate =
                  prov.offeredServices.find((os) => Number(os.serviceId) === Number(service.id))
                    ?.customPrice || service.basePrice;
                return (
                  <button
                    type="button"
                    key={prov.id}
                    onClick={() => setSelectedProviderId(prov.id)}
                    className={`rounded-xl border p-4 text-left transition ${isSelected
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{prov.businessName}</span>
                      <span className="text-xs font-bold text-amber-600">★ {prov.averageRating}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {prov.experienceYears} yrs exp • {prov.completedJobs} completed jobs
                    </p>
                    <p className="mt-2 text-sm font-extrabold text-brand-600">
                      {formatCurrency(rate)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Date & Non-Conflicting Time Slot */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900">
                2. Select Date & Available Time Slot
              </h2>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                Double-Booking Lock Active
              </span>
            </div>

            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Service Date *
              </label>
              <input
                type="date"
                required
                min="2026-11-04"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select Time Window *
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {TIME_SLOTS.map((slot) => {
                  const hasConflict = checkSlotConflict(
                    selectedProvider.id,
                    scheduledDate,
                    slot.start
                  );
                  const active = selectedSlot.start === slot.start;
                  return (
                    <button
                      type="button"
                      key={slot.start}
                      disabled={hasConflict}
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-xl border p-3 text-left text-xs font-semibold transition ${hasConflict
                        ? 'cursor-not-allowed border-rose-200 bg-rose-50/60 text-rose-400'
                        : active
                          ? 'border-brand-600 bg-brand-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{slot.label}</span>
                      </div>
                      <span
                        className={`mt-1 block text-[10px] ${hasConflict
                          ? 'text-rose-600 font-bold'
                          : active
                            ? 'text-brand-100'
                            : 'text-emerald-600'
                          }`}
                      >
                        {hasConflict ? 'Slot Occupied (Locked)' : 'Available'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 3: Select Service Location & Address */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                3. Service Location & Address
              </h2>
              <button
                type="button"
                onClick={() => setAddrModalOpen(true)}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                + Add New Address
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {customerAddresses.map((addr) => {
                const active = Number(selectedAddressId) === Number(addr.id);
                return (
                  <button
                    type="button"
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`rounded-xl border p-4 text-left transition ${active
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[11px] font-semibold text-brand-600">Default</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-800">{addr.addressLine1}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {addr.city}, {addr.state} — {addr.postalCode}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Problem Description & Reference Image Upload */}
          <div className="card-surface p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              4. Issue Description & Reference Images
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Describe the Issue or Service Instructions *
              </label>
              <textarea
                rows={3}
                required
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                className="input-field"
                placeholder="Explain the problem symptoms, brand/model of appliance, or specific instructions for the technician..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload Problem Reference Photo (Optional — JPG/PNG/WEBP, Max 5MB)
              </label>
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleImageUpload}
                  className="text-xs text-slate-600"
                />
                {uploadedImageName && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    ✓ Validated & attached: {uploadedImageName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Checkout & Razorpay Payment Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card-surface p-6 space-y-5 sticky top-24">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Booking & Payment Summary
            </h3>

            <div className="space-y-1 text-xs">
              <p className="font-bold text-slate-900 text-sm">{service.name}</p>
              <p className="text-slate-500">Provider: {selectedProvider.businessName}</p>
              <p className="text-slate-500">
                Schedule: {scheduledDate} • {selectedSlot.label}
              </p>
            </div>

            {/* Coupon Application */}
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Apply Discount Coupon
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="WELCOME20 or FLAT150"
                  className="input-field py-1.5 text-xs uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-[11px] font-semibold text-emerald-700">
                  ✓ Coupon {appliedCoupon.code} applied (-{formatCurrency(discountAmount)})
                </p>
              )}
            </div>

            {/* Payment Option: Full vs 25% Advance */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Select Payment Option (Razorpay Test Mode)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType('FULL')}
                  className={`rounded-xl border p-2.5 text-left text-xs font-semibold ${paymentType === 'FULL'
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600'
                    }`}
                >
                  100% Full Payment
                  <span className="block text-[11px] font-bold mt-0.5">
                    {formatCurrency(totalAmount)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('ADVANCE')}
                  className={`rounded-xl border p-2.5 text-left text-xs font-semibold ${paymentType === 'ADVANCE'
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600'
                    }`}
                >
                  25% Advance Now
                  <span className="block text-[11px] font-bold mt-0.5">
                    {formatCurrency(totalAmount * 0.25)}
                  </span>
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 border-t border-slate-200 pt-4 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Service Charge</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Coupon Discount</span>
                <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST & Taxes (18%)</span>
                <span className="font-semibold text-slate-900">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2.5 text-sm font-extrabold text-slate-900">
                <span>Total Booking Value</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-brand-600">
                <span>Payable Now ({paymentType})</span>
                <span>{formatCurrency(payableNow)}</span>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3 text-sm">
              <CreditCard className="h-4 w-4" /> Pay {formatCurrency(payableNow)} & Confirm Booking
            </button>
          </div>
        </div>
      </form>

      {/* Add Address Modal */}
      <Modal
        isOpen={addrModalOpen}
        onClose={() => setAddrModalOpen(false)}
        title="Add New Service Address"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address Label</label>
            <input
              type="text"
              value={newAddr.label}
              onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
              className="input-field"
              placeholder="Home / Office / Parents Home"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Address Line *</label>
            <input
              type="text"
              value={newAddr.addressLine1}
              onChange={(e) => setNewAddr({ ...newAddr, addressLine1: e.target.value })}
              className="input-field"
              placeholder="Flat / House No., Building, Street"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
              <input
                type="text"
                maxLength={6}
                value={newAddr.postalCode}
                onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setAddrModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!newAddr.addressLine1.trim()) return;
                addAddress(newAddr);
                setAddrModalOpen(false);
              }}
              className="btn-primary"
            >
              Save Address
            </button>
          </div>
        </div>
      </Modal>

      {/* Interactive Razorpay Checkout & Webhook Simulator Modal */}
      <Modal
        isOpen={razorpayModalOpen}
        onClose={() => setRazorpayModalOpen(false)}
        title="Razorpay Sandbox Checkout & Webhook Simulator"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-900 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-300">
                  Razorpay Test Gateway (HMAC-SHA256)
                </span>
                <h4 className="text-sm font-bold mt-0.5">HomeServe Technologies Pvt. Ltd.</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Payable Now</span>
                <span className="text-lg font-extrabold text-emerald-400">
                  {formatCurrency(payableNow)}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-300">
              <span>Order: order_RzpTest_{Date.now().toString().slice(-5)}</span>
              <span>Mode: {paymentType}</span>
            </div>
          </div>

          {rzpGatewayError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {rzpGatewayError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Payment Instrument
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                'UPI (GPay / PhonePe)',
                'Credit / Debit Card',
                'Netbanking (HDFC/ICICI)',
              ].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`rounded-lg border p-2 text-[11px] font-semibold transition ${paymentMethod === m
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Choose Webhook & Payment Outcome to Simulate:
            </p>

            {/* 1. Payment Success Webhook */}
            <button
              type="button"
              onClick={() => handleExecuteRazorpayScenario('SUCCESS')}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-left text-white shadow-xs hover:bg-emerald-700 transition flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-extrabold block">
                  ✓ Simulate Payment Success (payment.captured Webhook)
                </span>
                <span className="text-[11px] text-emerald-100 block mt-0.5">
                  Verifies HMAC-SHA256 X-Razorpay-Signature, marks Paid & generates GST Invoice
                </span>
              </div>
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            </button>

            {/* 2. Payment Failed Webhook */}
            <button
              type="button"
              onClick={() => handleExecuteRazorpayScenario('FAILED')}
              className="w-full rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-left text-rose-900 hover:bg-rose-100 transition flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-extrabold block text-rose-700">
                  ✕ Simulate Payment Failure (payment.failed Webhook)
                </span>
                <span className="text-[11px] text-rose-600 block mt-0.5">
                  Simulates bank decline callback, marks booking Payment Failed & enables Retry Payment
                </span>
              </div>
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            </button>

            {/* 3. Tampered Webhook Signature */}
            <button
              type="button"
              onClick={() => handleExecuteRazorpayScenario('TAMPERED_SIGNATURE')}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-left text-slate-700 hover:bg-slate-100 transition flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold block">
                  🛡️ Test Forged Signature Attack (Invalid X-Razorpay-Signature)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Verifies backend rejects tampered HMAC-SHA256 signature with HTTP 400
                </span>
              </div>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function BookingTrackingPage() {
  const { id } = useParams();
  const {
    data,
    updateBookingStatus,
    rescheduleBooking,
    settleBalancePayment,
    simulateRazorpayWebhook,
    submitReview,
    submitComplaint,
  } = usePlatform();

  const booking = data.bookings.find((b) => Number(b.id) === Number(id)) || data.bookings[0];

  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState(booking.scheduledDate);
  const [newSlot, setNewSlot] = useState(TIME_SLOTS[1]);

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');

  const lifecycleSteps = [
    'Pending',
    'Confirmed',
    'Provider Assigned',
    'In Progress',
    'Completed',
  ];
  const currentStepIndex = lifecycleSteps.indexOf(booking.status);

  const canCancelOrReschedule = ['Pending', 'Confirmed', 'Provider Assigned'].includes(
    booking.status
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/customer/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back to My Bookings
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900">
              Booking #{booking.bookingNumber}
            </h1>
            <StatusBadge status={booking.status} />
            <StatusBadge status={booking.paymentStatus} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={`/invoices/${booking.id}`} className="btn-secondary text-xs">
            <Printer className="h-4 w-4" /> View Invoice & Receipt
          </Link>
          {canCancelOrReschedule && (
            <>
              <button
                type="button"
                onClick={() => setRescheduleOpen(true)}
                className="btn-secondary text-xs"
              >
                Reschedule Slot
              </button>
              <button
                type="button"
                onClick={() => setCancelConfirmOpen(true)}
                className="btn-danger text-xs"
              >
                Cancel Booking
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setComplaintOpen(true)}
            className="btn-secondary text-xs"
          >
            Raise Support / Dispute
          </button>
        </div>
      </div>

      {/* Live Visual Progress Stepper */}
      <div className="card-surface p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Real-Time Appointment Lifecycle Tracker
        </h3>
        {['Cancelled', 'Rejected'].includes(booking.status) ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
            This booking was marked as <strong>{booking.status}</strong>.{' '}
            {booking.cancellationReason && `Reason: ${booking.cancellationReason}`}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-5">
            {lifecycleSteps.map((step, index) => {
              const completed = index <= currentStepIndex;
              return (
                <div
                  key={step}
                  className={`rounded-xl border p-3.5 transition ${completed
                    ? 'border-brand-600 bg-brand-50/60 text-brand-900'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase">Step {index + 1}</span>
                    {completed && <CheckCircle2 className="h-4 w-4 text-brand-600" />}
                  </div>
                  <p className="mt-1.5 text-xs font-bold">{step}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Service & Field Dispatch Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-xl bg-slate-50 p-4">
                <span className="text-slate-400 block">Booked Service</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {booking.serviceName}
                </span>
                <span className="text-brand-600 font-semibold">{booking.categoryName}</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <span className="text-slate-400 block">Assigned Service Provider</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {booking.providerName}
                </span>
                <span className="text-emerald-600 font-semibold">KYC Approved Partner</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <span className="text-slate-400 block">Scheduled Date & Slot</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {formatDate(booking.scheduledDate)} ({booking.startTime} – {booking.endTime})
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <span className="text-slate-400 block">Assigned Field Technician</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {booking.technicianName || 'Awaiting Provider Dispatch'}
                </span>
                {booking.arrivedAt && (
                  <span className="text-emerald-600 font-medium block">
                    Arrived: {formatDateTime(booking.arrivedAt)}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Service Location:</span>
              <p className="text-slate-600">{booking.addressText}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Customer Problem Description:</span>
              <p className="text-slate-600">{booking.problemDescription}</p>
            </div>

            {booking.completionRemarks && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs space-y-1">
                <span className="font-bold text-emerald-900 block">
                  Technician Completion Report:
                </span>
                <p className="text-emerald-800">{booking.completionRemarks}</p>
              </div>
            )}
          </div>

          {/* Attached Problem / Before-After / Completion Images */}
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Uploaded Service & Completion Proof Images ({booking.images?.length || 0})
            </h3>
            {(!booking.images || booking.images.length === 0) ? (
              <p className="text-xs text-slate-500">No images uploaded for this booking yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {booking.images.map((img) => (
                  <div key={img.id} className="overflow-hidden rounded-xl border border-slate-200">
                    <img src={img.url} alt={img.caption} className="h-44 w-full object-cover" />
                    <div className="p-3 bg-slate-50 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{img.caption}</span>
                      <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                        {img.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Post-Completion Customer Rating & Review Form */}
          {booking.status === 'Completed' && !booking.hasReview && (
            <div className="card-surface p-6 space-y-4 border-brand-200">
              <h3 className="text-base font-bold text-slate-900">
                Rate & Review Your Completed Service
              </h3>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${rating >= star
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-slate-100 text-slate-500'
                      }`}
                  >
                    {star} ★
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="input-field"
                placeholder="Share your feedback on technician punctuality, work quality, and hygiene..."
              />
              <button
                type="button"
                onClick={() => {
                  if (!reviewText.trim()) return;
                  submitReview({
                    bookingId: booking.id,
                    rating,
                    comment: reviewText,
                  });
                }}
                className="btn-primary text-xs"
              >
                Submit Verified Review
              </button>
            </div>
          )}
        </div>

        {/* Right Payment Breakdown */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Financial & Payment Ledger</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Service Charge</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(booking.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Coupon Discount</span>
                <span>-{formatCurrency(booking.discountAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18%)</span>
                <span>{formatCurrency(booking.taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-slate-900">
                <span>Total Invoice Amount</span>
                <span>{formatCurrency(booking.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Amount Paid</span>
                <span>{formatCurrency(booking.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-amber-700 font-semibold">
                <span>Balance Pending</span>
                <span>{formatCurrency(booking.pendingAmount)}</span>
              </div>
            </div>

            {booking.pendingAmount > 0 && (
              <button
                type="button"
                onClick={() => settleBalancePayment(booking.id)}
                className="btn-primary w-full text-xs py-2.5"
              >
                {booking.paymentStatus === 'Failed'
                  ? `Retry Failed Payment (${formatCurrency(booking.pendingAmount)}) via Razorpay`
                  : `Pay Pending Balance (${formatCurrency(booking.pendingAmount)}) via Razorpay`}
              </button>
            )}
          </div>

          {/* Razorpay Webhook & Signature Verification Console */}
          <div className="card-surface p-6 space-y-4 border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block">
                  POST /api/v1/payments/webhook
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Razorpay Webhook & Signature Simulator
                </h3>
              </div>
              <StatusBadge status={booking.paymentStatus} />
            </div>

            <div className="rounded-xl bg-slate-900 p-3.5 text-[11px] font-mono text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="text-white">{booking.razorpayOrderId || `order_RzpTest_${booking.id}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment ID:</span>
                <span className="text-emerald-400">{booking.razorpayPaymentId || `pay_RzpTest_${booking.id}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">HMAC Header:</span>
                <span className="text-amber-300">X-Razorpay-Signature (SHA256)</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Trigger Live Webhook Events:
              </p>
              <button
                type="button"
                onClick={() => simulateRazorpayWebhook(booking.id, 'SUCCESS')}
                className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
              >
                ✓ Trigger payment.captured Webhook (Mark Paid)
              </button>
              <button
                type="button"
                onClick={() => simulateRazorpayWebhook(booking.id, 'FAILED')}
                className="w-full rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
              >
                ✕ Trigger payment.failed Webhook (Simulate Failure)
              </button>
              <button
                type="button"
                onClick={() => simulateRazorpayWebhook(booking.id, 'TAMPERED_SIGNATURE')}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                🛡️ Send Forged Signature (Expect HTTP 400)
              </button>
            </div>

            {booking.webhookLogs && booking.webhookLogs.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Recent Webhook Callback Log:
                </p>
                <div className="max-h-48 overflow-y-auto pr-1.5 space-y-2">
                  {booking.webhookLogs.map((wh) => (
                    <div
                      key={wh.id}
                      className={`rounded-xl border p-2.5 text-[11px] ${wh.httpStatus === 400 || wh.event === 'payment.failed'
                          ? 'border-rose-200 bg-rose-50/70 text-rose-900'
                          : 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                        }`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span>{wh.event}</span>
                        <span>HTTP {wh.httpStatus}</span>
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed">{wh.reason}</p>
                      <p className="mt-1 font-mono text-[9px] opacity-75 truncate">
                        Sig: {wh.signature}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={() => updateBookingStatus(booking.id, 'Cancelled', 'Customer cancelled within allowed policy window')}
        title="Cancel Appointment?"
        message="Are you sure you want to cancel this booking? Since you are cancelling more than 2 hours before the scheduled slot, 100% of any paid amount will be automatically marked for refund."
        confirmLabel="Yes, Cancel Booking"
      />

      {/* Reschedule Modal */}
      <Modal
        isOpen={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        title="Reschedule Appointment Slot"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Time Slot</label>
            <select
              value={newSlot.start}
              onChange={(e) =>
                setNewSlot(TIME_SLOTS.find((s) => s.start === e.target.value) || TIME_SLOTS[0])
              }
              className="input-field"
            >
              {TIME_SLOTS.map((s) => (
                <option key={s.start} value={s.start}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRescheduleOpen(false)} className="btn-secondary">
              Close
            </button>
            <button
              type="button"
              onClick={async () => {
                const res = await rescheduleBooking(booking.id, newDate, newSlot.start, newSlot.end);
                if (res.success) setRescheduleOpen(false);
              }}
              className="btn-primary"
            >
              Confirm Reschedule
            </button>
          </div>
        </div>
      </Modal>

      {/* Complaint Modal */}
      <Modal
        isOpen={complaintOpen}
        onClose={() => setComplaintOpen(false)}
        title="Raise Service Complaint / Dispute"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
            <input
              type="text"
              value={complaintSubject}
              onChange={(e) => setComplaintSubject(e.target.value)}
              className="input-field"
              placeholder="e.g. Delayed arrival or incomplete cleanup"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Issue *</label>
            <textarea
              rows={3}
              value={complaintDesc}
              onChange={(e) => setComplaintDesc(e.target.value)}
              className="input-field"
              placeholder="Provide details for Super Admin dispute resolution..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setComplaintOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!complaintSubject.trim()) return;
                submitComplaint({
                  bookingId: booking.id,
                  subject: complaintSubject,
                  description: complaintDesc,
                });
                setComplaintOpen(false);
              }}
              className="btn-primary"
            >
              Submit Complaint
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function InvoiceReceiptPage() {
  const { bookingId } = useParams();
  const { data } = usePlatform();

  const booking =
    data.bookings.find((b) => Number(b.id) === Number(bookingId)) || data.bookings[0];
  const payment =
    data.payments.find((p) => Number(p.bookingId) === Number(booking.id)) || data.payments[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to={`/bookings/${booking.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Booking #{booking.bookingNumber}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-primary text-xs"
        >
          <Printer className="h-4 w-4" /> Print / Download PDF Receipt
        </button>
      </div>

      <div className="card-surface p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 gap-4">
          <div>
            <span className="text-xl font-extrabold text-slate-900">
              HomeServe Technologies Pvt. Ltd.
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              GSTIN: 29AABCH9988R1Z5 • Tax Invoice & Payment Receipt
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-bold text-slate-900">
              Invoice #INV-2026-0{booking.id}
            </p>
            <p className="text-xs text-slate-500">Booking Ref: {booking.bookingNumber}</p>
            <div className="mt-1">
              <StatusBadge status={booking.paymentStatus} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-xs">
          <div>
            <p className="font-bold uppercase tracking-wider text-slate-400">Billed To Customer</p>
            <p className="mt-1 font-bold text-slate-900 text-sm">{booking.customerName}</p>
            <p className="text-slate-600">Phone: {booking.customerPhone}</p>
            <p className="text-slate-600 mt-1">{booking.addressText}</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wider text-slate-400">Service Fulfilled By</p>
            <p className="mt-1 font-bold text-slate-900 text-sm">{booking.providerName}</p>
            <p className="text-slate-600">
              Technician: {booking.technicianName || 'Assigned Partner Technician'}
            </p>
            <p className="text-slate-600 mt-1">
              Razorpay Order ID: <code className="font-mono">{payment?.razorpayOrderId}</code>
            </p>
            <p className="text-slate-600">
              Razorpay Payment ID: <code className="font-mono">{payment?.razorpayPaymentId}</code>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-t border-b border-slate-200">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase">
                <th className="py-3">Service Description</th>
                <th className="py-3">Scheduled Slot</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-4 font-semibold text-slate-900">
                  {booking.serviceName}
                  <span className="block text-[11px] font-normal text-slate-500">
                    Category: {booking.categoryName}
                  </span>
                </td>
                <td className="py-4 text-slate-600">
                  {formatDate(booking.scheduledDate)} ({booking.startTime})
                </td>
                <td className="py-4 text-right font-bold text-slate-900">
                  {formatCurrency(booking.subtotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Service Subtotal</span>
              <span>{formatCurrency(booking.subtotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Discount ({booking.couponCode || 'None'})</span>
              <span>-{formatCurrency(booking.discountAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (18%)</span>
              <span>{formatCurrency(booking.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-slate-900">
              <span>Grand Total</span>
              <span>{formatCurrency(booking.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Paid via Razorpay</span>
              <span>{formatCurrency(booking.paidAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

