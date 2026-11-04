import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  BarChart3,
  Search,
  Filter,
  FileText,
  CreditCard,
  MessageSquareWarning,
  RefreshCw,
  ChevronRight,
  PanelLeft,
  X,
  TrendingUp,
  Clock,
  Eye,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { StatCard, StatusBadge, Modal, CategoryIcon } from '../components/common/UIComponents';
import { formatCurrency, formatDate, exportToCsv } from '../utils/formatters';

export default function AdminDashboard() {
  const {
    data,
    currentUser,
    verifyProviderKyc,
    resolveComplaint,
    createCategory,
    createServiceListing,
    createCoupon,
    toggleCustomerStatus,
    assignTechnicianToBooking,
    resetDemoDatabase,
  } = usePlatform();

  const [activeTab, setActiveTab] = useState('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [bookingFilter, setBookingFilter] = useState('ALL');
  const [resolutionInputs, setResolutionInputs] = useState({});

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
  const pendingKycCount = data.providers.filter((p) => p.verificationStatus === 'Pending').length;
  const totalTechnicians = data.technicians.length;
  const totalBookings = data.bookings.length;
  const pendingBookings = data.bookings.filter((b) => b.status === 'Pending').length;
  const completedBookings = data.bookings.filter((b) => b.status === 'Completed').length;
  const cancelledBookings = data.bookings.filter((b) =>
    ['Cancelled', 'Rejected'].includes(b.status)
  ).length;
  const openComplaintsCount = data.complaints.filter((c) => c.status !== 'Resolved').length;

  const totalRevenue = data.bookings
    .filter((b) => b.paymentStatus === 'Paid')
    .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const totalPlatformCommission = (data.providerEarnings || []).reduce(
    (sum, e) => sum + Number(e.commissionAmount || 0),
    0
  );
  const totalProviderEarnings = (data.providerEarnings || []).reduce(
    (sum, e) => sum + Number(e.netEarning || 0),
    0
  );

  const navGroups = [
    {
      group: 'Overview & Intelligence',
      items: [
        {
          id: 'analytics',
          label: 'Executive Overview & KPIs',
          icon: BarChart3,
          badge: 'Live',
          badgeColor: 'bg-emerald-500/20 text-emerald-300',
        },
      ],
    },
    {
      group: 'Marketplace Operations',
      items: [
        {
          id: 'providers',
          label: 'Providers & KYC Gate',
          icon: Building2,
          badge: pendingKycCount > 0 ? `${pendingKycCount} Pending` : totalProviders,
          badgeColor:
            pendingKycCount > 0
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
              : 'bg-slate-800 text-slate-300',
        },
        {
          id: 'customers',
          label: 'Customers Directory',
          icon: Users,
          badge: totalCustomers,
          badgeColor: 'bg-slate-800 text-slate-300',
        },
        {
          id: 'technicians',
          label: 'Field Technicians Fleet',
          icon: Wrench,
          badge: totalTechnicians,
          badgeColor: 'bg-slate-800 text-slate-300',
        },
        {
          id: 'catalog',
          label: 'Categories & Services',
          icon: Layers,
          badge: `${data.categories.length} / ${data.services.length}`,
          badgeColor: 'bg-slate-800 text-slate-300',
        },
        {
          id: 'bookings',
          label: 'Global Bookings & Dispatch',
          icon: Calendar,
          badge: pendingBookings > 0 ? `${pendingBookings} New` : totalBookings,
          badgeColor:
            pendingBookings > 0
              ? 'bg-brand-500/30 text-brand-200 border border-brand-400/30'
              : 'bg-slate-800 text-slate-300',
        },
      ],
    },
    {
      group: 'Financials & Governance',
      items: [
        {
          id: 'payments',
          label: 'Payments, Ledger & Coupons',
          icon: CreditCard,
          badge: data.coupons.length,
          badgeColor: 'bg-slate-800 text-slate-300',
        },
        {
          id: 'complaints',
          label: 'Complaints & Disputes',
          icon: MessageSquareWarning,
          badge: openComplaintsCount > 0 ? `${openComplaintsCount} Open` : data.complaints.length,
          badgeColor:
            openComplaintsCount > 0
              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
              : 'bg-slate-800 text-slate-300',
        },
        {
          id: 'plans',
          label: 'Subscription Plans',
          icon: Award,
          badge: data.subscriptionPlans.length,
          badgeColor: 'bg-slate-800 text-slate-300',
        },
      ],
    },
  ];

  const handleExportMasterCsv = () => {
    exportToCsv(
      'homeserve_admin_master_bookings_report.csv',
      data.bookings.map((b) => ({
        BookingNumber: b.bookingNumber,
        Customer: b.customerName,
        Provider: b.providerName,
        Category: b.categoryName,
        Service: b.serviceName,
        Date: b.scheduledDate,
        Slot: `${b.startTime}-${b.endTime}`,
        Status: b.status,
        TotalAmount: b.totalAmount,
        PaidAmount: b.paidAmount,
        PendingAmount: b.pendingAmount,
        PaymentStatus: b.paymentStatus,
      }))
    );
  };

  const filteredProviders = data.providers.filter((p) => {
    const matchesStatus = providerFilter === 'ALL' || p.verificationStatus === providerFilter;
    const matchesQuery =
      !searchQuery.trim() ||
      p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const filteredCustomers = data.customers.filter(
    (c) =>
      !searchQuery.trim() ||
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const filteredBookings = data.bookings.filter((b) => {
    const matchesStatus = bookingFilter === 'ALL' || b.status === bookingFilter;
    const matchesQuery =
      !searchQuery.trim() ||
      b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="h-full flex overflow-hidden bg-slate-100/70">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 top-16 z-30 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ====================================================================
          ENTERPRISE SAAS DARK LEFT SIDEBAR (FIXED & THEME SCROLLBAR)
      ==================================================================== */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 xl:w-[272px] bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:static lg:h-full lg:z-20 lg:translate-x-0 shrink-0 overflow-y-auto sidebar-theme-scroll ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Sidebar Top Header */}
        <div className="px-4 py-3.5 border-b border-slate-800/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-md shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold tracking-tight text-white">
                  Super Admin Console
                </span>
                <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-amber-300 border border-amber-400/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Platform Governance v2.4</p>
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

        {/* Unified Compact Sidebar Body (No Stretched Blank Space) */}
        <div className="p-3 space-y-3.5">
          {/* Live System Status Pill */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-200">20 Core Tables Synced</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400">RBAC Active</span>
          </div>

          {/* Sidebar Navigation Groups */}
          <nav className="space-y-3">
            {navGroups.map((group) => (
              <div key={group.group} className="space-y-1">
                <p className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  {group.group}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
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
                          <Icon
                            className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'
                              }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${active ? 'bg-white/20 text-white' : item.badgeColor
                            }`}
                        >
                          {item.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Quick Governance Creation Shortcuts */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
            <p className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Quick Catalog & Promo Actions
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setCatModalOpen(true)}
                className="rounded-lg border border-slate-800 bg-slate-900/90 px-2 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition text-center whitespace-nowrap"
              >
                + Category
              </button>
              <button
                type="button"
                onClick={() => setSvcModalOpen(true)}
                className="rounded-lg border border-slate-800 bg-slate-900/90 px-2 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition text-center whitespace-nowrap"
              >
                + Service
              </button>
              <button
                type="button"
                onClick={() => setCouponModalOpen(true)}
                className="rounded-lg border border-slate-800 bg-slate-900/90 px-2 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition text-center whitespace-nowrap"
              >
                + Coupon
              </button>
            </div>
          </div>

          {/* Admin Profile & Quick Data Utilities */}
          <div className="pt-2 border-t border-slate-800/90 space-y-2">
            <div className="rounded-xl bg-slate-900 px-3 py-2.5 border border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {currentUser?.fullName || 'Vikramaditya Rao'}
                </p>
                <p className="text-[10px] font-mono text-slate-400 truncate">
                  {currentUser?.email || 'admin@homeserve.com'}
                </p>
              </div>
              <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-bold text-brand-300 shrink-0">
                Root
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleExportMasterCsv}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-800 transition whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5 text-brand-400" /> Export CSV
              </button>
              <button
                type="button"
                onClick={resetDemoDatabase}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-slate-800 transition whitespace-nowrap"
                title="Reset Demo Database to Initial Seed Data"
              >
                <RefreshCw className="h-3.5 w-3.5 text-amber-400" /> Reset DB
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ====================================================================
          MAIN SAAS COMMAND WORKSPACE
      ==================================================================== */}
      <div className="flex-1 h-full overflow-y-auto workspace-theme-scroll flex flex-col min-w-0">
        {/* Top Command Bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
                    Super Admin Governance
                  </span>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {activeTab.toUpperCase()}
                  </span>
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  HomeServe Enterprise Command Center
                </h1>
              </div>
            </div>

            {/* Search & Quick Creation Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[210px] flex-1 sm:flex-initial">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bookings, providers, users..."
                  className="input-field pl-9 py-1.5 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => setCatModalOpen(true)}
                className="btn-secondary py-1.5 px-3 text-xs whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" /> New Category
              </button>
              <button
                type="button"
                onClick={() => setSvcModalOpen(true)}
                className="btn-primary py-1.5 px-3 text-xs whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" /> Add Service
              </button>
              <button
                type="button"
                onClick={() => setCouponModalOpen(true)}
                className="btn-secondary py-1.5 px-3 text-xs whitespace-nowrap"
              >
                <Tag className="h-3.5 w-3.5 text-brand-600" /> New Coupon
              </button>
            </div>
          </div>
        </div>

        {/* Main Scrollable Content Area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* ================================================================
              ALL 10 REQUIRED SUPER ADMIN KPI CARDS (ALWAYS ACCESSIBLE)
          ================================================================ */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-5">
            <StatCard title="Total Customers" value={totalCustomers} icon={Users} accent="brand" />
            <StatCard
              title="Service Providers"
              value={totalProviders}
              subtitle={`${pendingKycCount} Pending KYC`}
              icon={Building2}
              accent="purple"
            />
            <StatCard
              title="Field Technicians"
              value={totalTechnicians}
              subtitle="Active Fleet"
              icon={Wrench}
              accent="brand"
            />
            <StatCard
              title="Total Bookings"
              value={totalBookings}
              subtitle="+18.4% MoM"
              icon={Calendar}
              accent="emerald"
            />
            <StatCard
              title="Pending Bookings"
              value={pendingBookings}
              subtitle="Awaiting Dispatch"
              icon={AlertTriangle}
              accent="amber"
            />
            <StatCard
              title="Completed Jobs"
              value={completedBookings}
              subtitle="Verified On-Site"
              icon={CheckCircle2}
              accent="emerald"
            />
            <StatCard
              title="Cancelled / Rejected"
              value={cancelledBookings}
              subtitle="Policy Protected"
              icon={XCircle}
              accent="rose"
            />
            <StatCard
              title="Gross GMV Revenue"
              value={formatCurrency(totalRevenue)}
              subtitle="Settled Invoices"
              icon={DollarSign}
              accent="emerald"
            />
            <StatCard
              title="Platform Commission"
              value={formatCurrency(totalPlatformCommission)}
              subtitle="7%–15% Tier Split"
              icon={Award}
              accent="brand"
            />
            <StatCard
              title="Provider Net Payouts"
              value={formatCurrency(totalProviderEarnings)}
              subtitle="Partner Earnings"
              icon={TrendingUp}
              accent="purple"
            />
          </div>

          {/* ================================================================
              TAB 1: EXECUTIVE ANALYTICS & ACTIONABLE GOVERNANCE QUEUES
          ================================================================ */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* 6-Month Revenue & Booking Trajectory */}
                <div className="lg:col-span-7 card-surface p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                        Financial Performance
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">
                        6-Month GMV Revenue & Booking Volume Trajectory
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportMasterCsv}
                      className="btn-secondary py-1.5 px-3 text-xs whitespace-nowrap"
                    >
                      <Download className="h-3.5 w-3.5" /> Export CSV
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-6 gap-3 sm:gap-4 items-end h-52 pt-6 px-2">
                    {data.monthlyAnalytics.map((m) => {
                      const heightPct = Math.max(
                        18,
                        Math.min(100, Math.round((m.revenue / 200000) * 100))
                      );
                      return (
                        <div
                          key={m.month}
                          className="flex flex-col items-center gap-1.5 h-full justify-end group"
                        >
                          <span className="text-[10px] font-extrabold text-slate-700 group-hover:text-brand-600 transition">
                            {formatCurrency(m.revenue)}
                          </span>
                          <div className="w-full max-w-[46px] bg-slate-100 rounded-t-xl h-full flex items-end overflow-hidden">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className="w-full rounded-t-xl bg-gradient-to-t from-brand-700 to-brand-500 transition-all duration-300 group-hover:from-indigo-600 group-hover:to-brand-400"
                            />
                          </div>
                          <span className="text-xs font-extrabold text-slate-800">{m.month}</span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {m.bookings} jobs
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Popular Categories Share */}
                <div className="lg:col-span-5 card-surface p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                      Demand Distribution
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Most Popular Service Categories
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Share of completed residential bookings across 8 verticals
                    </p>

                    <div className="mt-5 space-y-3.5">
                      {[
                        {
                          name: 'AC Repair & Maintenance',
                          pct: 34,
                          count: 214,
                          color: 'bg-brand-600',
                        },
                        {
                          name: 'Home Deep Cleaning',
                          pct: 26,
                          count: 182,
                          color: 'bg-indigo-600',
                        },
                        {
                          name: 'Electrical Services',
                          pct: 18,
                          count: 128,
                          color: 'bg-emerald-600',
                        },
                        {
                          name: 'Appliance Repair',
                          pct: 12,
                          count: 110,
                          color: 'bg-amber-500',
                        },
                        {
                          name: 'Plumbing, Painting, Carpentry & Pest',
                          pct: 10,
                          count: 96,
                          color: 'bg-purple-600',
                        },
                      ].map((cat) => (
                        <div key={cat.name} className="space-y-1.5 text-xs">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{cat.name}</span>
                            <span className="text-slate-500">
                              {cat.pct}% ({cat.count} jobs)
                            </span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              style={{ width: `${cat.pct}%` }}
                              className={`h-full rounded-full ${cat.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl bg-slate-900 p-4 text-xs text-white flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-400 block">
                        Commission Engine Active
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Standard (15%) • Pro (10%) • Enterprise (7%)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('plans')}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20 transition"
                    >
                      View Plans →
                    </button>
                  </div>
                </div>
              </div>

              {/* Actionable Governance Queues: Pending KYC Approvals & Recent Bookings */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Pending Provider KYC Action Queue */}
                <div className="lg:col-span-5 card-surface p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                        Compliance Gate
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Provider KYC Verification Queue
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('providers')}
                      className="text-xs font-bold text-brand-600 hover:underline"
                    >
                      View All ({totalProviders})
                    </button>
                  </div>

                  <div className="space-y-3">
                    {data.providers.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 truncate">{p.businessName}</p>
                            <StatusBadge status={p.verificationStatus} />
                          </div>
                          <p className="text-slate-500 truncate mt-0.5">
                            {p.ownerName} • Doc: {p.kycDocumentName}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {p.verificationStatus !== 'Approved' && (
                            <button
                              type="button"
                              onClick={() => verifyProviderKyc(p.id, 'Approved')}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition whitespace-nowrap"
                            >
                              Approve
                            </button>
                          )}
                          {p.verificationStatus !== 'Rejected' && (
                            <button
                              type="button"
                              onClick={() =>
                                verifyProviderKyc(
                                  p.id,
                                  'Rejected',
                                  'KYC trade certificate requires renewal'
                                )
                              }
                              className="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition whitespace-nowrap"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Global Bookings & Dispatch Table */}
                <div className="lg:col-span-7 card-surface p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                        Live Operations
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Recent Bookings & Payment Status
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('bookings')}
                      className="text-xs font-bold text-brand-600 hover:underline"
                    >
                      Manage All Bookings →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5">Booking</th>
                          <th className="px-3 py-2.5">Service & Provider</th>
                          <th className="px-3 py-2.5">Amount</th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-3 py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.bookings.slice(0, 5).map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/80">
                            <td className="px-3 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                              {b.bookingNumber}
                              <span className="block font-sans font-normal text-[11px] text-slate-500">
                                {b.customerName}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <p className="font-bold text-slate-900">{b.serviceName}</p>
                              <p className="text-[11px] text-slate-500">{b.providerName}</p>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className="font-extrabold text-slate-900 block">
                                {formatCurrency(b.totalAmount)}
                              </span>
                              <StatusBadge status={b.paymentStatus} />
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <StatusBadge status={b.status} />
                            </td>
                            <td className="px-3 py-3 text-right whitespace-nowrap">
                              <Link
                                to={`/bookings/${b.id}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                              >
                                <Eye className="h-3 w-3" /> Inspect
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 2: PROVIDERS & KYC VERIFICATION GATE
          ================================================================ */}
          {activeTab === 'providers' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'Approved', 'Pending', 'Rejected'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setProviderFilter(st)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${providerFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {st === 'ALL' ? `All Providers (${totalProviders})` : st}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-500">
                  Unapproved providers are blocked from receiving customer bookings.
                </span>
              </div>

              <div className="card-surface overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                      <tr>
                        <th className="px-5 py-3.5">Business & Owner</th>
                        <th className="px-5 py-3.5">Private KYC Document</th>
                        <th className="px-5 py-3.5">Subscription & Commission</th>
                        <th className="px-5 py-3.5">Performance</th>
                        <th className="px-5 py-3.5">KYC Status</th>
                        <th className="px-5 py-3.5 text-right">Governance Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProviders.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900 text-sm">{p.businessName}</p>
                            <p className="text-slate-500 mt-0.5">
                              {p.ownerName} • {p.email} • {p.phone}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] text-slate-700">
                              <FileText className="h-3.5 w-3.5 text-brand-600" />
                              {p.kycDocumentName}
                            </span>
                            <span className="block text-[10px] text-emerald-700 font-semibold mt-1">
                              🔒 Protected (Admin & Owner Only)
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-800">
                              {p.subscriptionPlanName || 'Standard Partner'}
                            </span>
                            <span className="block text-[11px] text-brand-600 font-semibold">
                              {p.commissionPercentage || 15}% Platform Commission
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-amber-600">
                              ★ {p.averageRating || 'New'}
                            </span>
                            <span className="block text-[11px] text-slate-500">
                              {p.completedJobs || 0} completed jobs
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={p.verificationStatus} />
                            {p.rejectionRemarks && p.verificationStatus === 'Rejected' && (
                              <span className="block text-[10px] text-rose-600 mt-1">
                                Note: {p.rejectionRemarks}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                            {p.verificationStatus !== 'Approved' && (
                              <button
                                type="button"
                                onClick={() => verifyProviderKyc(p.id, 'Approved')}
                                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                              >
                                Approve KYC
                              </button>
                            )}
                            {p.verificationStatus !== 'Rejected' && (
                              <button
                                type="button"
                                onClick={() =>
                                  verifyProviderKyc(
                                    p.id,
                                    'Rejected',
                                    'Incomplete trade license certificate'
                                  )
                                }
                                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                              >
                                Reject KYC
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 3: CUSTOMERS DIRECTORY
          ================================================================ */}
          {activeTab === 'customers' && (
            <div className="card-surface overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Registered Customers Directory ({filteredCustomers.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage customer access, inspect booking activity, or suspend policy-violating accounts.
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                    <tr>
                      <th className="px-5 py-3.5">Customer Name</th>
                      <th className="px-5 py-3.5">Email & Mobile</th>
                      <th className="px-5 py-3.5">Preferred City</th>
                      <th className="px-5 py-3.5">Total Bookings</th>
                      <th className="px-5 py-3.5">Account Status</th>
                      <th className="px-5 py-3.5 text-right">Access Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4 font-bold text-slate-900">{c.fullName}</td>
                        <td className="px-5 py-4 text-slate-600 font-mono text-[11px]">
                          {c.email} • {c.phone}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {c.preferredCity || 'Bengaluru'}
                        </td>
                        <td className="px-5 py-4 font-extrabold text-slate-900">
                          {c.totalBookings}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={c.accountStatus} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => toggleCustomerStatus(c.id)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${c.accountStatus === 'Active'
                              ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                          >
                            {c.accountStatus === 'Active' ? 'Suspend Account' : 'Activate Account'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 4: FIELD TECHNICIANS FLEET ROSTER
          ================================================================ */}
          {activeTab === 'technicians' && (
            <div className="card-surface overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Verified Field Technicians Fleet ({data.technicians.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Field engineers linked to approved service providers for on-site job execution.
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                    <tr>
                      <th className="px-5 py-3.5">Technician Name</th>
                      <th className="px-5 py-3.5">Contact</th>
                      <th className="px-5 py-3.5">Specialization</th>
                      <th className="px-5 py-3.5">Experience</th>
                      <th className="px-5 py-3.5">Completed Jobs</th>
                      <th className="px-5 py-3.5">Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.technicians.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4 font-bold text-slate-900">{t.fullName}</td>
                        <td className="px-5 py-4 font-mono text-[11px] text-slate-600">
                          {t.email} • {t.phone}
                        </td>
                        <td className="px-5 py-4 font-semibold text-brand-700">
                          {t.specialization}
                        </td>
                        <td className="px-5 py-4 text-slate-600">{t.experienceYears} Years</td>
                        <td className="px-5 py-4 font-extrabold text-slate-900">
                          {t.completedJobsCount || 0}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={t.availabilityStatus || 'Available'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 5: CATEGORIES & SERVICE CATALOG
          ================================================================ */}
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              {/* 8 Canonical Categories Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Canonical Service Categories ({data.categories.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCatModalOpen(true)}
                    className="btn-secondary text-xs py-1.5"
                  >
                    + Add Category
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {data.categories.map((cat) => (
                    <div key={cat.id} className="card-surface p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                          <CategoryIcon name={cat.iconName} className="h-5 w-5" />
                        </div>
                        <StatusBadge status={cat.isActive ? 'Active' : 'Suspended'} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{cat.description}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(cat.subcategories || []).map((sub) => (
                          <span
                            key={sub}
                            className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Catalog Listings Table */}
              <div className="card-surface overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Master Service Listings ({data.services.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Standardized service definitions, base pricing, and estimated duration.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSvcModalOpen(true)}
                    className="btn-primary text-xs py-1.5"
                  >
                    + Add Service Listing
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                      <tr>
                        <th className="px-5 py-3.5">Service Name</th>
                        <th className="px-5 py-3.5">Category & Subcategory</th>
                        <th className="px-5 py-3.5">Base Price</th>
                        <th className="px-5 py-3.5">Est. Duration</th>
                        <th className="px-5 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.services.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-4 font-bold text-slate-900">{s.name}</td>
                          <td className="px-5 py-4 text-slate-600">
                            {s.categoryName} →{' '}
                            <span className="font-semibold">{s.subcategory}</span>
                          </td>
                          <td className="px-5 py-4 font-extrabold text-brand-600">
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
            </div>
          )}

          {/* ================================================================
              TAB 6: GLOBAL BOOKINGS & DISPATCH OVERRIDE
          ================================================================ */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'ALL',
                    'Pending',
                    'Confirmed',
                    'Provider Assigned',
                    'In Progress',
                    'Completed',
                    'Cancelled',
                  ].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setBookingFilter(st)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${bookingFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleExportMasterCsv}
                  className="btn-secondary text-xs py-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Export Filtered CSV
                </button>
              </div>

              <div className="card-surface overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                      <tr>
                        <th className="px-5 py-3.5">Booking #</th>
                        <th className="px-5 py-3.5">Customer</th>
                        <th className="px-5 py-3.5">Provider & Service</th>
                        <th className="px-5 py-3.5">Schedule</th>
                        <th className="px-5 py-3.5">Total & Payment</th>
                        <th className="px-5 py-3.5">Booking Status</th>
                        <th className="px-5 py-3.5">Technician Dispatch Override</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <Link
                              to={`/bookings/${b.id}`}
                              className="text-brand-600 hover:underline"
                            >
                              {b.bookingNumber}
                            </Link>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-800">
                            {b.customerName}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900">{b.serviceName}</p>
                            <p className="text-slate-500">{b.providerName}</p>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {formatDate(b.scheduledDate)} ({b.startTime})
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-extrabold text-slate-900 block">
                              {formatCurrency(b.totalAmount)}
                            </span>
                            <StatusBadge status={b.paymentStatus} />
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <StatusBadge status={b.status} />
                          </td>
                          <td className="px-5 py-4">
                            {b.technicianName ? (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                                <Wrench className="h-3.5 w-3.5 text-brand-600" />
                                {b.technicianName}
                              </span>
                            ) : (
                              <select
                                defaultValue=""
                                onChange={(e) =>
                                  assignTechnicianToBooking(b.id, Number(e.target.value))
                                }
                                className="input-field py-1 text-xs w-44"
                              >
                                <option value="" disabled>
                                  Dispatch Technician...
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
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 7: PAYMENTS, COMMISSION LEDGER & PROMOTIONAL COUPONS
          ================================================================ */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Platform Commission & Provider Earnings Settlement Ledger */}
              <div className="card-surface overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Platform Commission & Provider Settlement Ledger
                    </h3>
                    <p className="text-xs text-slate-500">
                      Automated commission deduction based on provider subscription tier.
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                      <tr>
                        <th className="px-5 py-3.5">Booking #</th>
                        <th className="px-5 py-3.5">Provider</th>
                        <th className="px-5 py-3.5">Gross Invoice</th>
                        <th className="px-5 py-3.5">Commission Rate</th>
                        <th className="px-5 py-3.5">Platform Fee</th>
                        <th className="px-5 py-3.5">Provider Net Payout</th>
                        <th className="px-5 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data.providerEarnings || []).map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                            {e.bookingNumber}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-800">
                            {e.providerName}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            {formatCurrency(e.grossAmount)}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-600">
                            {e.commissionPercentage}%
                          </td>
                          <td className="px-5 py-3.5 font-extrabold text-brand-600">
                            {formatCurrency(e.commissionAmount)}
                          </td>
                          <td className="px-5 py-3.5 font-extrabold text-emerald-700">
                            {formatCurrency(e.netEarning)}
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={e.settlementStatus || 'Settled'} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Active Promotional Coupons */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Active Promotional Discount Coupons ({data.coupons.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCouponModalOpen(true)}
                    className="btn-primary text-xs py-1.5"
                  >
                    <Plus className="h-4 w-4" /> Create Coupon
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {data.coupons.map((cp) => (
                    <div
                      key={cp.id}
                      className="card-surface p-5 flex items-center justify-between border-l-4 border-l-brand-600"
                    >
                      <div>
                        <span className="rounded-lg bg-brand-100 px-2.5 py-1 font-mono text-xs font-extrabold text-brand-700">
                          {cp.code}
                        </span>
                        <p className="mt-2 text-xs font-bold text-slate-900">{cp.description}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Min Order: ₹{cp.minOrderAmount} • Max Cap: ₹{cp.maxDiscount} • Used:{' '}
                          {cp.usedCount || 0}/{cp.usageLimit || 500}
                        </p>
                      </div>
                      <StatusBadge status={cp.isActive ? 'Active' : 'Suspended'} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 8: COMPLAINTS & DISPUTE RESOLUTION
          ================================================================ */}
          {activeTab === 'complaints' && (
            <div className="space-y-4">
              {data.complaints.map((c) => (
                <div key={c.id} className="card-surface p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-brand-600">
                        {c.complaintNumber} • Booking #{c.bookingNumber}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                        {c.subject}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Customer: <strong>{c.customerName}</strong> vs. Provider:{' '}
                        <strong>{c.providerName}</strong>
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 border border-slate-200/80">
                    {c.description}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <input
                      type="text"
                      value={
                        resolutionInputs[c.id] !== undefined
                          ? resolutionInputs[c.id]
                          : c.adminResolutionNotes || ''
                      }
                      onChange={(e) =>
                        setResolutionInputs({ ...resolutionInputs, [c.id]: e.target.value })
                      }
                      placeholder="Enter official Super Admin resolution notes..."
                      className="input-field text-xs flex-1"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      {c.status !== 'Resolved' && (
                        <button
                          type="button"
                          onClick={() =>
                            resolveComplaint(
                              c.id,
                              'Resolved',
                              resolutionInputs[c.id] ||
                              'Verified corrective action with provider and confirmed customer satisfaction.'
                            )
                          }
                          className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition whitespace-nowrap"
                        >
                          Mark Complaint Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================================================================
              TAB 9: PLATFORM SUBSCRIPTION PLANS
          ================================================================ */}
          {activeTab === 'plans' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {data.subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="card-surface p-6 flex flex-col justify-between border-t-4 border-t-brand-600"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
                      <StatusBadge status={plan.isActive ? 'Active' : 'Suspended'} />
                    </div>
                    <p className="mt-3 text-3xl font-extrabold text-brand-600">
                      {formatCurrency(plan.monthlyPrice)}
                      <span className="text-xs font-normal text-slate-500"> / month</span>
                    </p>
                    <p className="mt-1.5 inline-block rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                      Platform Commission Rate: {plan.commissionPercentage}%
                    </p>
                    <ul className="mt-5 space-y-2.5 text-xs text-slate-600">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                    <span>Max Services: {plan.maxServices}</span>
                    <span>Max Technicians: {plan.maxTechnicians}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="Create Service Category"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Name *
            </label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={newCat.description}
              onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCatModalOpen(false)}
              className="btn-secondary"
            >
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
              Create Category
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Service Modal */}
      <Modal
        isOpen={svcModalOpen}
        onClose={() => setSvcModalOpen(false)}
        title="Add New Service Listing"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Service Name *
              </label>
              <input
                type="text"
                value={newSvc.name}
                onChange={(e) => setNewSvc({ ...newSvc, name: e.target.value })}
                className="input-field"
                placeholder="e.g. Split AC Gas Refill"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subcategory *
              </label>
              <input
                type="text"
                value={newSvc.subcategory}
                onChange={(e) => setNewSvc({ ...newSvc, subcategory: e.target.value })}
                className="input-field"
                placeholder="e.g. Gas Charging"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Price (₹) *
              </label>
              <input
                type="number"
                value={newSvc.basePrice}
                onChange={(e) => setNewSvc({ ...newSvc, basePrice: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (Minutes) *
              </label>
              <input
                type="number"
                value={newSvc.durationMinutes}
                onChange={(e) =>
                  setNewSvc({ ...newSvc, durationMinutes: Number(e.target.value) })
                }
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
            <textarea
              rows={2}
              value={newSvc.description}
              onChange={(e) => setNewSvc({ ...newSvc, description: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSvcModalOpen(false)}
              className="btn-secondary"
            >
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

      {/* Create Coupon Modal */}
      <Modal
        isOpen={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        title="Create Promotional Coupon"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                value={newCoupon.code}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
                }
                className="input-field uppercase font-mono"
                placeholder="MONSOON25"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount Value (%)
              </label>
              <input
                type="number"
                value={newCoupon.discountValue}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })
                }
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
            <input
              type="text"
              value={newCoupon.description}
              onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
              className="input-field"
              placeholder="25% off on all electrical & plumbing bookings"
            />
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
              Publish Coupon
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
