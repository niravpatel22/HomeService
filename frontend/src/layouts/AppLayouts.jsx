import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Bell,
  Menu,
  X,
  LogOut,
  UserCheck,
  LayoutDashboard,
  CheckCheck,
  KeyRound,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { ROLE_HOME_ROUTES, ROLE_LABELS } from '../constants';
import { ToastBanner } from '../components/common/UIComponents';

export function MainHeader() {
  const { currentUser, data, markAllNotificationsRead, logout } = usePlatform();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  const roleNotifications = data.notifications.filter(
    (n) => !currentUser || n.role === currentUser.role || n.userId === currentUser.id
  );
  const unreadCount = roleNotifications.filter((n) => !n.isRead).length;

  const userInitials = currentUser?.fullName
    ? currentUser.fullName
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo + Primary Navigation */}
        <div className="flex items-center gap-6 xl:gap-8 min-w-0">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition group-hover:bg-brand-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="leading-none">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                HomeServe<span className="text-brand-600">Pro</span>
              </span>
              <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap mt-0.5">
                HomeServe Technologies
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/services"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              Explore Services
            </NavLink>
            <NavLink
              to="/register/provider"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              Become a Partner
            </NavLink>
            {currentUser && (
              <NavLink
                to={ROLE_HOME_ROUTES[currentUser.role]}
                className={({ isActive }) =>
                  `whitespace-nowrap inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`
                }
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                <span>{ROLE_LABELS[currentUser.role]} Console</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Right: Notification Bell & Single-Line Auth Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Notification Center</h4>
                    <p className="text-xs text-slate-500">Real-time booking & webhook alerts</p>
                  </div>
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 whitespace-nowrap"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                  </button>
                </div>
                <div className="mt-3 max-h-72 space-y-2.5 overflow-y-auto">
                  {roleNotifications.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">No notifications yet.</p>
                  ) : (
                    roleNotifications.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3 text-xs transition ${item.isRead
                            ? 'border-slate-100 bg-slate-50/60 text-slate-600'
                            : 'border-brand-100 bg-brand-50/50 text-slate-900'
                          }`}
                      >
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-slate-600 leading-relaxed">{item.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {currentUser ? (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {/* Active User Identity Pill */}
              <button
                type="button"
                onClick={() => navigate(ROLE_HOME_ROUTES[currentUser.role])}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/90 pl-1.5 pr-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition whitespace-nowrap"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-600 text-[10px] font-extrabold text-white shrink-0">
                  {userInitials}
                </span>
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  {currentUser.fullName.split(' ')[0]}
                </span>
                <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 whitespace-nowrap">
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </button>

              {/* Switch Role Button */}
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 transition whitespace-nowrap shrink-0"
                title="Switch Role or View Demo Credentials"
              >
                <UserCheck className="h-3.5 w-3.5 shrink-0" />
                <span>Switch Role</span>
              </Link>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition whitespace-nowrap shrink-0"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-brand-700 transition whitespace-nowrap"
              >
                <KeyRound className="h-3.5 w-3.5 shrink-0" />
                <span>Role Login & Credentials</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile / Tablet Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile & Tablet Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden space-y-3 shadow-lg">
          <div className="grid grid-cols-1 gap-1">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Home
            </Link>
            <Link
              to="/services"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Explore Services
            </Link>
            <Link
              to="/register/provider"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Become a Service Provider
            </Link>
          </div>

          {currentUser ? (
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-xs font-bold text-slate-900">{currentUser.fullName}</p>
                  <p className="text-[11px] font-mono text-slate-500">{currentUser.email}</p>
                </div>
                <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={ROLE_HOME_ROUTES[currentUser.role]}
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary py-2 text-xs text-center"
                >
                  Open Dashboard
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-secondary py-2 text-xs text-center"
                >
                  Switch Role
                </Link>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                  navigate('/login');
                }}
                className="w-full rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-700"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="btn-primary flex-1 text-xs text-center py-2.5"
              >
                Role Login & Credentials
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="btn-secondary flex-1 text-xs text-center py-2.5"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-white">HomeServe Technologies</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              India's trusted SaaS platform connecting homeowners with KYC-verified electricians, plumbers, HVAC engineers, cleaners, carpenters, and pest control specialists.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Core Service Categories</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li><Link to="/services?category=1" className="hover:text-white">Electrical Services</Link></li>
              <li><Link to="/services?category=2" className="hover:text-white">Plumbing Services</Link></li>
              <li><Link to="/services?category=3" className="hover:text-white">AC Repair & Maintenance</Link></li>
              <li><Link to="/services?category=4" className="hover:text-white">Home Deep Cleaning</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">More Specialties</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li><Link to="/services?category=5" className="hover:text-white">Painting & Waterproofing</Link></li>
              <li><Link to="/services?category=6" className="hover:text-white">Carpentry Services</Link></li>
              <li><Link to="/services?category=7" className="hover:text-white">Appliance Repair</Link></li>
              <li><Link to="/services?category=8" className="hover:text-white">Odorless Pest Control</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Role Portals</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li><Link to="/customer/dashboard" className="hover:text-white">Customer Dashboard</Link></li>
              <li><Link to="/provider/dashboard" className="hover:text-white">Service Provider Console</Link></li>
              <li><Link to="/technician/dashboard" className="hover:text-white">Technician Field App</Link></li>
              <li><Link to="/admin/dashboard" className="hover:text-white">Super Admin Governance</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 HomeServe Technologies Pvt. Ltd. All rights reserved.</p>
          <p>Secured with JWT RBAC • Razorpay Test Sandbox • Double-Booking Concurrency Lock</p>
        </div>
      </div>
    </footer>
  );
}

export function AppShell({ children }) {
  const { toast } = usePlatform();
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <MainHeader />
      <main className="flex-1">{children}</main>
      <Footer />
      <ToastBanner toast={toast} />
    </div>
  );
}
