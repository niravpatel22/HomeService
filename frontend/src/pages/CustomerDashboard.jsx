import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CreditCard,
  Heart,
  MapPin,
  FileText,
  AlertTriangle,
  Plus,
  Trash2,
  Download,
  User,
  Eye,
  PanelLeft,
  X,
  ChevronRight,
  MessageSquareWarning,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { StatCard, StatusBadge, EmptyState, Modal } from '../components/common/UIComponents';
import { formatCurrency, formatDate, exportToCsv } from '../utils/formatters';

export default function CustomerDashboard() {
  const {
    data,
    currentCustomer,
    addAddress,
    deleteAddress,
    toggleFavoriteProvider,
    settleBalancePayment,
  } = usePlatform();

  const [activeTab, setActiveTab] = useState('bookings');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: 'Home',
    addressLine1: '',
    landmark: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    isDefault: false,
  });

  const myBookings = data.bookings.filter((b) => b.customerId === currentCustomer.id);
  const upcomingBookings = myBookings.filter((b) =>
    ['Pending', 'Confirmed', 'Provider Assigned', 'In Progress'].includes(b.status)
  );
  const previousBookings = myBookings.filter((b) =>
    ['Completed', 'Cancelled', 'Rejected'].includes(b.status)
  );
  const pendingPaymentsTotal = myBookings.reduce((sum, b) => sum + Number(b.pendingAmount || 0), 0);
  const myAddresses = data.addresses.filter((a) => a.customerId === currentCustomer.id);
  const myFavoriteProviders = data.providers.filter((p) =>
    currentCustomer.favoriteProviderIds?.includes(p.id)
  );
  const myComplaints = data.complaints.filter((c) => c.customerId === currentCustomer.id);

  const navItems = [
    { id: 'bookings', label: 'My Bookings', icon: Calendar, badge: myBookings.length },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin, badge: myAddresses.length },
    { id: 'favorites', label: 'Favorite Providers', icon: Heart, badge: myFavoriteProviders.length },
    { id: 'payments', label: 'Invoices & Receipts', icon: FileText, badge: myBookings.length },
    {
      id: 'complaints',
      label: 'Complaints & Support',
      icon: MessageSquareWarning,
      badge: myComplaints.length,
    },
  ];

  const handleExportHistory = () =>
    exportToCsv(
      'customer_bookings_history.csv',
      myBookings.map((b) => ({
        BookingNumber: b.bookingNumber,
        Service: b.serviceName,
        Provider: b.providerName,
        Date: b.scheduledDate,
        Slot: b.startTime,
        Status: b.status,
        TotalAmount: b.totalAmount,
        PaymentStatus: b.paymentStatus,
      }))
    );

  return (
    <div className="h-full flex overflow-hidden bg-slate-100/70">
      {sidebarOpen && (
        <div
          className="fixed inset-0 top-16 z-30 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Customer Portal Left Sidebar */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 xl:w-[272px] bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:static lg:h-full lg:z-20 lg:translate-x-0 shrink-0 overflow-y-auto sidebar-theme-scroll ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="px-4 py-3.5 border-b border-slate-800/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-extrabold tracking-tight text-white block truncate">
                Customer Portal
              </span>
              <p className="text-[10px] text-slate-400 truncate">
                {currentCustomer.preferredCity || 'Bengaluru'} Member
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 space-y-3.5">
          <nav className="space-y-1">
            <p className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              Homeowner Workspace
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold transition ${active
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${active ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                  >
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-slate-800/90 space-y-2">
            <div className="rounded-xl bg-slate-900 px-3 py-2.5 border border-slate-800">
              <p className="text-xs font-bold text-white truncate">{currentCustomer.fullName}</p>
              <p className="text-[10px] font-mono text-slate-400 truncate">{currentCustomer.email}</p>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700 transition whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" /> Book New Service
              </Link>
              <button
                type="button"
                onClick={handleExportHistory}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-800 transition whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5 text-brand-400" /> Export Bookings CSV
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Customer Workspace */}
      <div className="flex-1 h-full overflow-y-auto workspace-theme-scroll flex flex-col min-w-0">
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
              >
                <PanelLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-600">
                    Customer Portal
                  </span>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {activeTab}
                  </span>
                </div>
                <h1 className="mt-0.5 text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Welcome back, {currentCustomer.fullName}
                </h1>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleExportHistory} className="btn-secondary text-xs">
                <Download className="h-4 w-4" /> Export CSV
              </button>
              <Link to="/services" className="btn-primary text-xs">
                + Book New Service
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Required Module 10 Customer KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Upcoming Appointments"
              value={upcomingBookings.length}
              subtitle="Active scheduled visits"
              icon={Calendar}
              accent="brand"
            />
            <StatCard
              title="Previous Bookings"
              value={previousBookings.length}
              subtitle="Completed & historical"
              icon={FileText}
              accent="emerald"
            />
            <StatCard
              title="Pending Payments"
              value={formatCurrency(pendingPaymentsTotal)}
              subtitle="Balance payable on completion"
              icon={CreditCard}
              accent="amber"
            />
            <StatCard
              title="Favorite Providers"
              value={myFavoriteProviders.length}
              subtitle="Bookmarked verified partners"
              icon={Heart}
              accent="rose"
            />
          </div>

          {/* Tab 1: Bookings */}
          {activeTab === 'bookings' && (
            <div className="card-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                    <tr>
                      <th className="px-5 py-3.5">Booking ID</th>
                      <th className="px-5 py-3.5">Service & Provider</th>
                      <th className="px-5 py-3.5">Scheduled Slot</th>
                      <th className="px-5 py-3.5">Booking Status</th>
                      <th className="px-5 py-3.5">Payment</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4 font-bold text-slate-900">{b.bookingNumber}</td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">{b.serviceName}</p>
                          <p className="text-slate-500">
                            {b.providerName} {b.technicianName ? `• Tech: ${b.technicianName}` : ''}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(b.scheduledDate)} • {b.startTime}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">{formatCurrency(b.totalAmount)}</p>
                          <StatusBadge status={b.paymentStatus} />
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          {b.pendingAmount > 0 && (
                            <button
                              type="button"
                              onClick={() => settleBalancePayment(b.id)}
                              className="btn-primary px-2.5 py-1.5 text-xs"
                            >
                              Pay Balance
                            </button>
                          )}
                          <Link
                            to={`/bookings/${b.id}`}
                            className="btn-secondary px-3 py-1.5 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" /> Track & Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Multiple Addresses */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">Saved Service Locations</h3>
                <button
                  type="button"
                  onClick={() => setAddrModalOpen(true)}
                  className="btn-primary text-xs"
                >
                  <Plus className="h-4 w-4" /> Add New Address
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {myAddresses.map((addr) => (
                  <div key={addr.id} className="card-surface p-5 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            Default Address
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-bold text-slate-900">{addr.addressLine1}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {addr.landmark ? `${addr.landmark}, ` : ''}
                        {addr.city}, {addr.state} — {addr.postalCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteAddress(addr.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Favorite Service Providers */}
          {activeTab === 'favorites' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {myFavoriteProviders.length === 0 ? (
                <div className="col-span-2">
                  <EmptyState
                    title="No favorite providers yet"
                    description="Bookmark verified service providers while browsing to re-book them with one click."
                  />
                </div>
              ) : (
                myFavoriteProviders.map((prov) => (
                  <div key={prov.id} className="card-surface p-5 flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{prov.businessName}</h4>
                      <p className="text-xs text-slate-500">
                        ★ {prov.averageRating} ({prov.totalReviews} reviews) • {prov.completedJobs} completed jobs
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link to="/services" className="btn-primary text-xs py-1.5 px-3">
                        Book Service
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleFavoriteProvider(prov.id)}
                        className="btn-secondary text-xs py-1.5 px-3 text-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 4: Invoices & Payment Receipts */}
          {activeTab === 'payments' && (
            <div className="card-surface overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                  <tr>
                    <th className="px-5 py-3.5">Booking Ref</th>
                    <th className="px-5 py-3.5">Service</th>
                    <th className="px-5 py-3.5">Total Amount</th>
                    <th className="px-5 py-3.5">Paid Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myBookings.map((b) => (
                    <tr key={b.id}>
                      <td className="px-5 py-4 font-bold text-slate-900">{b.bookingNumber}</td>
                      <td className="px-5 py-4 text-slate-700">{b.serviceName}</td>
                      <td className="px-5 py-4 font-bold text-slate-900">{formatCurrency(b.totalAmount)}</td>
                      <td className="px-5 py-4 text-emerald-700 font-semibold">{formatCurrency(b.paidAmount)}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={b.paymentStatus} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link to={`/invoices/${b.id}`} className="btn-secondary py-1.5 px-3 text-xs">
                          Download Receipt
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 5: Complaints */}
          {activeTab === 'complaints' && (
            <div className="space-y-4">
              {myComplaints.map((c) => (
                <div key={c.id} className="card-surface p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-brand-600">{c.complaintNumber}</span>
                      <h4 className="text-sm font-bold text-slate-900">{c.subject}</h4>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-slate-600">{c.description}</p>
                  {c.adminResolutionNotes && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                      <strong>Super Admin Resolution:</strong> {c.adminResolutionNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={addrModalOpen}
        onClose={() => setAddrModalOpen(false)}
        title="Add New Service Address"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Label</label>
            <input
              type="text"
              value={newAddr.label}
              onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address Line *</label>
            <input
              type="text"
              value={newAddr.addressLine1}
              onChange={(e) => setNewAddr({ ...newAddr, addressLine1: e.target.value })}
              className="input-field"
              placeholder="House/Flat No, Street, Area"
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
    </div>
  );
}

