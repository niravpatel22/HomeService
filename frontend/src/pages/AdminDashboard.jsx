import React, { useState } from 'react';
import {
  Users,
  Building2,
  Wrench,
  Calendar,
  DollarSign,
  ShieldCheck,
  Tag,
  AlertTriangle,
  Download,
  Plus,
  CheckCircle2,
  XCircle,
  Layers,
  Award,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { StatCard, StatusBadge, Modal } from '../components/common/UIComponents';
import { formatCurrency, formatDate, exportToCsv } from '../utils/formatters';

export default function AdminDashboard() {
  const {
    data,
    verifyProviderKyc,
    resolveComplaint,
    createCategory,
    createServiceListing,
    createCoupon,
    toggleCustomerStatus,
    assignTechnicianToBooking,
  } = usePlatform();

  const [activeTab, setActiveTab] = useState('analytics');
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [svcModalOpen, setSvcModalOpen] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);

  const [newCat, setNewCat] = useState({ name: '', subcategories: '', description: '' });
  const [newSvc, setNewSvc] = useState({
    categoryId: 1,
    subcategory: '',
    name: '',
    description: '',
    basePrice: 699,
    durationMinutes: 60,
  });
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minOrderAmount: 499,
    maxDiscount: 300,
    validUntil: '2026-12-31',
  });

  // Required Module 10 Super Admin KPIs
  const totalCustomers = data.customers.length;
  const totalProviders = data.providers.length;
  const totalTechnicians = data.technicians.length;
  const totalBookings = data.bookings.length;
  const pendingBookings = data.bookings.filter((b) => b.status === 'Pending').length;
  const completedBookings = data.bookings.filter((b) => b.status === 'Completed').length;
  const cancelledBookings = data.bookings.filter((b) =>
    ['Cancelled', 'Rejected'].includes(b.status)
  ).length;

  const totalRevenue = data.bookings
    .filter((b) => b.paymentStatus === 'Paid')
    .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const totalPlatformCommission = data.providerEarnings.reduce(
    (sum, e) => sum + Number(e.commissionAmount || 0),
    0
  );
  const totalProviderEarnings = data.providerEarnings.reduce(
    (sum, e) => sum + Number(e.netEarning || 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-bold text-amber-300">
            SUPER ADMIN GOVERNANCE CONSOLE
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            HomeServe Technologies — Platform Command Center
          </h1>
          <p className="text-xs text-slate-500">
            Centralized oversight across KYC approvals, categories, bookings, commissions, coupons, disputes, subscription plans & analytics.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              exportToCsv(
                'admin_platform_bookings_report.csv',
                data.bookings.map((b) => ({
                  BookingNumber: b.bookingNumber,
                  Customer: b.customerName,
                  Provider: b.providerName,
                  Category: b.categoryName,
                  Service: b.serviceName,
                  Date: b.scheduledDate,
                  Status: b.status,
                  TotalAmount: b.totalAmount,
                  PaymentStatus: b.paymentStatus,
                }))
              )
            }
            className="btn-secondary text-xs"
          >
            <Download className="h-4 w-4" /> Export Master CSV
          </button>
          <button
            type="button"
            onClick={() => setSvcModalOpen(true)}
            className="btn-primary text-xs"
          >
            <Plus className="h-4 w-4" /> Add Service Listing
          </button>
        </div>
      </div>

      {/* All 10 Required Super Admin KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard title="Total Customers" value={totalCustomers} icon={Users} accent="brand" />
        <StatCard title="Service Providers" value={totalProviders} icon={Building2} accent="purple" />
        <StatCard title="Field Technicians" value={totalTechnicians} icon={Wrench} accent="brand" />
        <StatCard title="Total Bookings" value={totalBookings} icon={Calendar} accent="emerald" />
        <StatCard title="Pending Bookings" value={pendingBookings} icon={AlertTriangle} accent="amber" />
        <StatCard title="Completed Bookings" value={completedBookings} icon={CheckCircle2} accent="emerald" />
        <StatCard title="Cancelled / Rejected" value={cancelledBookings} icon={XCircle} accent="rose" />
        <StatCard title="Gross Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} accent="emerald" />
        <StatCard
          title="Platform Commission"
          value={formatCurrency(totalPlatformCommission)}
          icon={Award}
          accent="brand"
        />
        <StatCard
          title="Provider Net Earnings"
          value={formatCurrency(totalProviderEarnings)}
          icon={DollarSign}
          accent="purple"
        />
      </div>

      {/* Admin Governance Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'analytics', label: 'Analytics & Growth Charts' },
          { id: 'providers', label: `Providers & KYC Verification (${totalProviders})` },
          { id: 'customers', label: `Customers (${totalCustomers})` },
          { id: 'catalog', label: `Categories & Services (${data.services.length})` },
          { id: 'bookings', label: `All Bookings (${totalBookings})` },
          { id: 'payments', label: 'Payments, Commissions & Coupons' },
          { id: 'complaints', label: `Complaints & Disputes (${data.complaints.length})` },
          { id: 'plans', label: 'Platform Subscription Plans' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Graphical Analytics & Category Distribution */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 card-surface p-6">
            <h3 className="text-base font-bold text-slate-900">
              Monthly Booking & Revenue Analytics
            </h3>
            <p className="text-xs text-slate-500">
              6-month platform GMV and commission trajectory
            </p>
            <div className="mt-6 grid grid-cols-6 gap-4 items-end h-48 pt-4">
              {data.monthlyAnalytics.map((m) => {
                const heightPct = Math.min(100, Math.round((m.revenue / 200000) * 100));
                return (
                  <div key={m.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-bold text-slate-700">
                      {formatCurrency(m.revenue)}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[44px] rounded-t-xl bg-brand-600"
                    />
                    <span className="text-xs font-bold text-slate-700">{m.month}</span>
                    <span className="text-[10px] text-slate-400">{m.bookings} jobs</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 card-surface p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Most Popular Service Categories & Customer Growth
            </h3>
            <div className="space-y-3">
              {[
                { name: 'AC Repair & Maintenance', pct: 34, count: 214 },
                { name: 'Home Deep Cleaning', pct: 26, count: 182 },
                { name: 'Electrical Services', pct: 18, count: 128 },
                { name: 'Appliance Repair', pct: 12, count: 110 },
                { name: 'Plumbing & Pest Control', pct: 10, count: 96 },
              ].map((cat) => (
                <div key={cat.name} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>{cat.name}</span>
                    <span>{cat.pct}% ({cat.count} bookings)</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${cat.pct}%` }}
                      className="h-full rounded-full bg-brand-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Providers & KYC Verification */}
      {activeTab === 'providers' && (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Business & Owner</th>
                  <th className="px-5 py-3.5">KYC Document</th>
                  <th className="px-5 py-3.5">Subscription Plan</th>
                  <th className="px-5 py-3.5">KYC Status</th>
                  <th className="px-5 py-3.5 text-right">Verification Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.providers.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{p.businessName}</p>
                      <p className="text-slate-500">
                        {p.ownerName} • {p.email} • {p.phone}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 font-mono text-[11px] text-slate-700">
                        {p.kycDocumentName}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800">{p.subscriptionPlanName}</span>
                      <span className="block text-[11px] text-slate-500">
                        {p.commissionPercentage}% Commission
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={p.verificationStatus} />
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      {p.verificationStatus !== 'Approved' && (
                        <button
                          type="button"
                          onClick={() => verifyProviderKyc(p.id, 'Approved')}
                          className="btn-primary px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                        >
                          Approve KYC
                        </button>
                      )}
                      {p.verificationStatus !== 'Rejected' && (
                        <button
                          type="button"
                          onClick={() =>
                            verifyProviderKyc(p.id, 'Rejected', 'Incomplete trade certificate')
                          }
                          className="btn-danger px-3 py-1.5 text-xs"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Customers Management */}
      {activeTab === 'customers' && (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Email & Phone</th>
                <th className="px-5 py-3.5">Total Bookings</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Account Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.customers.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-4 font-bold text-slate-900">{c.fullName}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {c.email} • {c.phone}
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{c.totalBookings}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={c.accountStatus} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => toggleCustomerStatus(c.id)}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      {c.accountStatus === 'Active' ? 'Suspend Account' : 'Activate Account'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Categories & Service Listings */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">
              Service Categories ({data.categories.length}) & Listings ({data.services.length})
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCatModalOpen(true)}
                className="btn-secondary text-xs"
              >
                + Add Category
              </button>
              <button
                type="button"
                onClick={() => setSvcModalOpen(true)}
                className="btn-primary text-xs"
              >
                + Add Service Listing
              </button>
            </div>
          </div>

          <div className="card-surface overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Service Name</th>
                  <th className="px-5 py-3.5">Category & Subcategory</th>
                  <th className="px-5 py-3.5">Base Price</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.services.map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-4 font-bold text-slate-900">{s.name}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {s.categoryName} → {s.subcategory}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {formatCurrency(s.basePrice)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{s.durationMinutes} mins</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={s.isActive ? 'Active' : 'Suspended'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Global Bookings Monitoring */}
      {activeTab === 'bookings' && (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3.5">Booking ID</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Provider & Service</th>
                <th className="px-5 py-3.5">Schedule</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Admin Technician Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-5 py-4 font-bold text-slate-900">{b.bookingNumber}</td>
                  <td className="px-5 py-4">{b.customerName}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900">{b.serviceName}</p>
                    <p className="text-slate-500">{b.providerName}</p>
                  </td>
                  <td className="px-5 py-4">
                    {formatDate(b.scheduledDate)} ({b.startTime})
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-5 py-4">
                    {b.technicianName || (
                      <select
                        defaultValue=""
                        onChange={(e) =>
                          assignTechnicianToBooking(b.id, Number(e.target.value))
                        }
                        className="input-field py-1 text-xs w-40"
                      >
                        <option value="" disabled>
                          Assign Tech...
                        </option>
                        {data.technicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 6: Payments, Commissions & Coupons */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Active Promotional Coupons ({data.coupons.length})
            </h3>
            <button
              type="button"
              onClick={() => setCouponModalOpen(true)}
              className="btn-primary text-xs"
            >
              <Plus className="h-4 w-4" /> Create Coupon
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.coupons.map((cp) => (
              <div key={cp.id} className="card-surface p-5 flex items-center justify-between">
                <div>
                  <span className="rounded bg-brand-100 px-2.5 py-1 font-mono text-xs font-extrabold text-brand-700">
                    {cp.code}
                  </span>
                  <p className="mt-2 text-xs font-semibold text-slate-800">{cp.description}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Min Order: ₹{cp.minOrderAmount} • Max Discount: ₹{cp.maxDiscount} • Used: {cp.usedCount}/{cp.usageLimit}
                  </p>
                </div>
                <StatusBadge status={cp.isActive ? 'Active' : 'Suspended'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Complaints & Dispute Resolution */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          {data.complaints.map((c) => (
            <div key={c.id} className="card-surface p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-brand-600">
                    {c.complaintNumber} • Booking #{c.bookingNumber}
                  </span>
                  <h4 className="text-base font-bold text-slate-900">{c.subject}</h4>
                  <p className="text-xs text-slate-500">
                    Customer: {c.customerName} vs. Provider: {c.providerName}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-xs text-slate-700">{c.description}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-500">
                  Admin Notes: {c.adminResolutionNotes || 'Pending resolution'}
                </span>
                {c.status !== 'Resolved' && (
                  <button
                    type="button"
                    onClick={() =>
                      resolveComplaint(
                        c.id,
                        'Resolved',
                        'Verified corrective action with provider and confirmed customer satisfaction.'
                      )
                    }
                    className="btn-primary text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Mark Complaint Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 8: Platform Subscription Plans */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {data.subscriptionPlans.map((plan) => (
            <div key={plan.id} className="card-surface p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
                <p className="mt-2 text-2xl font-extrabold text-brand-600">
                  {formatCurrency(plan.monthlyPrice)}
                  <span className="text-xs font-normal text-slate-500"> / month</span>
                </p>
                <p className="mt-1 text-xs font-bold text-emerald-700">
                  Platform Commission Rate: {plan.commissionPercentage}%
                </p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <StatusBadge status={plan.isActive ? 'Active' : 'Suspended'} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="Create Service Category"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
            <input
              type="text"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
              className="input-field"
              placeholder="e.g. Solar & Inverter Maintenance"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subcategories (comma separated) *
            </label>
            <input
              type="text"
              value={newCat.subcategories}
              onChange={(e) => setNewCat({ ...newCat, subcategories: e.target.value })}
              className="input-field"
              placeholder="Panel Cleaning, Inverter Battery Check"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
            <textarea
              rows={2}
              value={newCat.description}
              onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCatModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!newCat.name.trim()) return;
                createCategory(newCat);
                setCatModalOpen(false);
              }}
              className="btn-primary"
            >
              Save Category
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Service Modal */}
      <Modal
        isOpen={svcModalOpen}
        onClose={() => setSvcModalOpen(false)}
        title="Create Master Service Listing"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={newSvc.categoryId}
              onChange={(e) => setNewSvc({ ...newSvc, categoryId: Number(e.target.value) })}
              className="input-field"
            >
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Service Title *</label>
            <input
              type="text"
              value={newSvc.name}
              onChange={(e) => setNewSvc({ ...newSvc, name: e.target.value })}
              className="input-field"
              placeholder="e.g. Chandelier & Decorative Light Installation"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Price (₹)</label>
              <input
                type="number"
                value={newSvc.basePrice}
                onChange={(e) => setNewSvc({ ...newSvc, basePrice: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Mins)</label>
              <input
                type="number"
                value={newSvc.durationMinutes}
                onChange={(e) => setNewSvc({ ...newSvc, durationMinutes: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Scope Description *</label>
            <textarea
              rows={2}
              value={newSvc.description}
              onChange={(e) => setNewSvc({ ...newSvc, description: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setSvcModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!newSvc.name.trim()) return;
                createServiceListing(newSvc);
                setSvcModalOpen(false);
              }}
              className="btn-primary"
            >
              Publish Service
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Coupon Modal */}
      <Modal
        isOpen={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        title="Create Promotional Discount Coupon"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Coupon Code *</label>
            <input
              type="text"
              value={newCoupon.code}
              onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
              className="input-field uppercase"
              placeholder="FESTIVE25"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
            <input
              type="text"
              value={newCoupon.description}
              onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
              className="input-field"
              placeholder="25% off on all festive home services"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Value</label>
              <input
                type="number"
                value={newCoupon.discountValue}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min Order (₹)</label>
              <input
                type="number"
                value={newCoupon.minOrderAmount}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, minOrderAmount: Number(e.target.value) })
                }
                className="input-field"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCouponModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!newCoupon.code.trim()) return;
                createCoupon(newCoupon);
                setCouponModalOpen(false);
              }}
              className="btn-primary"
            >
              Create Coupon
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

