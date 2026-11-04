import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Star,
  Users,
  Plus,
  Download,
  UserCheck,
  AlertTriangle,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { StatCard, StatusBadge, Modal } from '../components/common/UIComponents';
import { formatCurrency, formatDate, exportToCsv } from '../utils/formatters';

export default function ProviderDashboard() {
  const {
    data,
    currentProvider,
    updateBookingStatus,
    assignTechnicianToBooking,
    addTechnician,
    replyToReview,
  } = usePlatform();

  const [activeTab, setActiveTab] = useState('bookings');
  const [techModalOpen, setTechModalOpen] = useState(false);
  const [newTech, setNewTech] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialization: 'HVAC & Electrical Diagnostics',
    experienceYears: 4,
  });
  const [replyTextMap, setReplyTextMap] = useState({});

  const providerBookings = data.bookings.filter((b) => b.providerId === currentProvider.id);
  const todaysBookings = providerBookings.filter((b) => b.scheduledDate === '2026-11-05');
  const pendingRequests = providerBookings.filter((b) => b.status === 'Pending');
  const completedServices = providerBookings.filter((b) => b.status === 'Completed');

  const myEarnings = data.providerEarnings.filter((e) => e.providerId === currentProvider.id);
  const totalNetEarnings = myEarnings.reduce((sum, e) => sum + Number(e.netEarning || 0), 0);
  const myTechnicians = data.technicians.filter((t) => t.providerId === currentProvider.id);
  const myReviews = data.reviews.filter((r) => r.providerId === currentProvider.id);

  const isApproved = currentProvider.verificationStatus === 'Approved';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-700">
              SERVICE PROVIDER CONSOLE
            </span>
            <StatusBadge status={currentProvider.verificationStatus} />
            <span className="rounded-md bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              Plan: {currentProvider.subscriptionPlanName} ({currentProvider.commissionPercentage}% Commission)
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {currentProvider.businessName}
          </h1>
          <p className="text-xs text-slate-500">
            Partner: {currentProvider.ownerName} • Working Hours: {currentProvider.workingHours}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              exportToCsv(
                'provider_earnings_report.csv',
                myEarnings.map((e) => ({
                  BookingNumber: e.bookingNumber,
                  GrossAmount: e.grossAmount,
                  CommissionPct: e.commissionPercentage,
                  CommissionDeducted: e.commissionAmount,
                  NetEarning: e.netEarning,
                  Status: e.settlementStatus,
                }))
              )
            }
            className="btn-secondary text-xs"
          >
            <Download className="h-4 w-4" /> Export Earnings CSV
          </button>
          <button
            type="button"
            onClick={() => setTechModalOpen(true)}
            className="btn-primary text-xs"
          >
            <Plus className="h-4 w-4" /> Add Technician
          </button>
        </div>
      </div>

      {/* KYC Gate Warning if Pending/Rejected */}
      {!isApproved && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold text-sm">
              KYC Verification Status: {currentProvider.verificationStatus}
            </p>
            <p>
              Per Section 6.1 security rules, unverified or rejected providers cannot receive public booking allocations until Super Admin approves your uploaded KYC document ({currentProvider.kycDocumentName}).
            </p>
          </div>
        </div>
      )}

      {/* Required Module 10 Provider KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard
          title="Total Bookings"
          value={providerBookings.length}
          subtitle="All-time assigned"
          icon={Calendar}
          accent="brand"
        />
        <StatCard
          title="Today's Bookings"
          value={todaysBookings.length}
          subtitle="Active schedule"
          icon={Clock}
          accent="purple"
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests.length}
          subtitle="Awaiting acceptance"
          icon={AlertTriangle}
          accent="amber"
        />
        <StatCard
          title="Completed Jobs"
          value={completedServices.length}
          subtitle="Verified handovers"
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          title="Total Net Earnings"
          value={formatCurrency(totalNetEarnings)}
          subtitle="After commission"
          icon={DollarSign}
          accent="emerald"
        />
        <StatCard
          title="Average Rating"
          value={`${currentProvider.averageRating} ★`}
          subtitle={`${currentProvider.totalReviews} verified reviews`}
          icon={Star}
          accent="amber"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'bookings', label: `Booking Requests & Dispatch (${providerBookings.length})` },
          { id: 'technicians', label: `Technician Roster (${myTechnicians.length})` },
          { id: 'catalog', label: 'Offered Services, Areas & Availability' },
          { id: 'earnings', label: 'Earnings, Commissions & Monthly Chart' },
          { id: 'reviews', label: `Customer Reviews (${myReviews.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Bookings & Technician Dispatch */}
      {activeTab === 'bookings' && (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Booking ID</th>
                  <th className="px-5 py-3.5">Customer & Location</th>
                  <th className="px-5 py-3.5">Service & Schedule</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Assigned Technician</th>
                  <th className="px-5 py-3.5 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providerBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-bold text-slate-900">{b.bookingNumber}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{b.customerName}</p>
                      <p className="text-slate-500">{b.customerPhone}</p>
                      <p className="text-[11px] text-slate-500 max-w-xs truncate">{b.addressText}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{b.serviceName}</p>
                      <p className="text-brand-600 font-semibold">
                        {formatDate(b.scheduledDate)} • {b.startTime}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-4">
                      {b.technicianName ? (
                        <span className="font-semibold text-slate-900">{b.technicianName}</span>
                      ) : (
                        <select
                          disabled={!['Confirmed', 'Provider Assigned'].includes(b.status)}
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              assignTechnicianToBooking(b.id, Number(e.target.value));
                            }
                          }}
                          className="input-field py-1.5 text-xs w-44"
                        >
                          <option value="" disabled>
                            Assign Technician...
                          </option>
                          {myTechnicians.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.fullName}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      {b.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateBookingStatus(b.id, 'Confirmed')}
                            className="btn-primary px-3 py-1.5 text-xs"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBookingStatus(b.id, 'Rejected', 'Slot unavailable')}
                            className="btn-danger px-3 py-1.5 text-xs"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {b.status === 'Confirmed' && !b.technicianId && (
                        <span className="text-[11px] font-semibold text-amber-600">
                          Select technician in dropdown
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Technicians Roster */}
      {activeTab === 'technicians' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {myTechnicians.map((tech) => (
            <div key={tech.id} className="card-surface p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900">{tech.fullName}</h4>
                  <StatusBadge status={tech.isAvailable ? 'Active' : 'Suspended'} />
                </div>
                <p className="text-xs text-brand-600 font-semibold mt-0.5">{tech.specialization}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Email: {tech.email} • Phone: {tech.phone}
                </p>
                <p className="text-xs text-slate-500">
                  {tech.experienceYears} yrs experience • {tech.completedJobsCount} Completed Jobs • ★ {tech.rating}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Offered Services, Areas & Availability */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Configured Service Pricing
            </h3>
            <div className="divide-y divide-slate-100">
              {currentProvider.offeredServices.map((os) => {
                const svc = data.services.find((s) => s.id === os.serviceId);
                return (
                  <div key={os.serviceId} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{svc?.name}</p>
                      <p className="text-slate-500">{os.customDescription}</p>
                    </div>
                    <span className="text-sm font-extrabold text-brand-600">
                      {formatCurrency(os.customPrice)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-surface p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Covered Service Areas & Availability Slots
            </h3>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400 mb-2">Active PIN Codes</p>
              <div className="flex flex-wrap gap-2">
                {currentProvider.serviceAreas.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <MapPin className="h-3.5 w-3.5 text-brand-600" />
                    {a.areaName} — {a.postalCode}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400 mb-2">
                Bookable Daily Time Slots
              </p>
              <div className="flex flex-wrap gap-2">
                {currentProvider.availableSlots.map((slot) => (
                  <span
                    key={slot}
                    className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700"
                  >
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Earnings & Monthly Revenue Chart */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="card-surface p-6">
            <h3 className="text-base font-bold text-slate-900">
              Monthly Provider Revenue Trend (6-Month Graphical Report)
            </h3>
            <div className="mt-6 grid grid-cols-6 gap-4 items-end h-44 pt-4">
              {data.monthlyAnalytics.map((m) => {
                const heightPct = Math.min(100, Math.round((m.revenue / 200000) * 100));
                return (
                  <div key={m.month} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[11px] font-bold text-slate-700">
                      {formatCurrency(m.revenue * 0.45)}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[48px] rounded-t-xl bg-brand-600 transition-all hover:bg-brand-700"
                    />
                    <span className="text-xs font-semibold text-slate-500">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-surface overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Booking Ref</th>
                  <th className="px-5 py-3.5">Gross Amount</th>
                  <th className="px-5 py-3.5">Platform Commission</th>
                  <th className="px-5 py-3.5">Net Provider Earning</th>
                  <th className="px-5 py-3.5">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myEarnings.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-4 font-bold text-slate-900">{e.bookingNumber}</td>
                    <td className="px-5 py-4">{formatCurrency(e.grossAmount)}</td>
                    <td className="px-5 py-4 text-rose-600">
                      -{formatCurrency(e.commissionAmount)} ({e.commissionPercentage}%)
                    </td>
                    <td className="px-5 py-4 font-extrabold text-emerald-700">
                      {formatCurrency(e.netEarning)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={e.settlementStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Customer Reviews & Provider Replies */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {myReviews.map((rev) => (
            <div key={rev.id} className="card-surface p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900">{rev.customerName}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    • {rev.serviceName} (#{rev.bookingNumber})
                  </span>
                </div>
                <span className="rounded bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                  {'★'.repeat(rev.rating)} ({rev.rating}.0)
                </span>
              </div>
              <p className="text-xs text-slate-600">"{rev.comment}"</p>

              {rev.providerReply ? (
                <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 border-l-2 border-brand-600">
                  <strong>Your Official Response:</strong> {rev.providerReply}
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={replyTextMap[rev.id] || ''}
                    onChange={(e) =>
                      setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })
                    }
                    placeholder="Write a professional reply to this customer review..."
                    className="input-field text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!replyTextMap[rev.id]?.trim()) return;
                      replyToReview(rev.id, replyTextMap[rev.id]);
                    }}
                    className="btn-primary text-xs shrink-0"
                  >
                    Post Reply
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Technician Modal */}
      <Modal
        isOpen={techModalOpen}
        onClose={() => setTechModalOpen(false)}
        title="Add Field Technician to Roster"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Technician Full Name *</label>
            <input
              type="text"
              value={newTech.fullName}
              onChange={(e) => setNewTech({ ...newTech, fullName: e.target.value })}
              className="input-field"
              placeholder="e.g. Deepak Sharma"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Login Email *</label>
            <input
              type="email"
              value={newTech.email}
              onChange={(e) => setNewTech({ ...newTech, email: e.target.value })}
              className="input-field"
              placeholder="deepak.tech@homeserve.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">10-Digit Mobile *</label>
            <input
              type="tel"
              maxLength={10}
              value={newTech.phone}
              onChange={(e) => setNewTech({ ...newTech, phone: e.target.value })}
              className="input-field"
              placeholder="9845099887"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization *</label>
            <input
              type="text"
              value={newTech.specialization}
              onChange={(e) => setNewTech({ ...newTech, specialization: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setTechModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!newTech.fullName.trim() || !newTech.email.trim()) return;
                addTechnician(newTech);
                setTechModalOpen(false);
              }}
              className="btn-primary"
            >
              Create Technician Account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

