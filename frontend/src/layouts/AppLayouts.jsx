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
  Search,
  Wrench,
  CalendarCheck,
  Users,
  CheckCheck,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { ROLE_HOME_ROUTES, ROLE_LABELS } from '../constants';
import { ToastBanner } from '../components/common/UIComponents';

export function TopRoleSwitcherBar() {
  const { currentUser, quickSwitchRole, isBackendConnected } = usePlatform();
  const navigate = useNavigate();

  const handleRoleSwitch = async (roleKey) => {
    const targetRoute = await quickSwitchRole(roleKey);
    navigate(targetRoute);
  };

  return (
    <div className="bg-slate-900 px-4 py-2 text-xs text-slate-300 border-b border-slate-800">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${isBackendConnected
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
              }`}
          >
            {isBackendConnected
              ? 'LIVE FASTAPI + DATABASE CONNECTED'
              : 'OFFLINE FALLBACK MODE'}
          </span>
          <span className="hidden md:inline text-slate-400">
            Instant Multi-Role JWT Session Switcher:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { role: 'customer', label: 'Customer Portal' },
            { role: 'service_provider', label: 'Service Provider Console' },
            { role: 'technician', label: 'Technician Field Console' },
            { role: 'super_admin', label: 'Super Admin Governance' },
          ].map((item) => {
            const active = currentUser?.role === item.role;
            return (
              <button
                key={item.role}
                type="button"
                onClick={() => handleRoleSwitch(item.role)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${active
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MainHeader() {
  const { currentUser, data, markAllNotificationsRead, logout } = usePlatform();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  const roleNotifications = data.notifications.filter(
    (n) => !currentUser || n.role === currentUser.role || n.userId === currentUser.id
  );
  const unreadCount = roleNotifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
      <TopRoleSwitcherBar />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                HomeServe<span className="text-brand-600">Pro</span>
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                HomeServe Technologies
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? 'text-brand-600 font-semibold' : 'hover:text-slate-900 transition'
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/services"
              className={({ isActive }) =>
                isActive ? 'text-brand-600 font-semibold' : 'hover:text-slate-900 transition'
              }
            >
              Explore Services
            </NavLink>
            <NavLink
              to="/register/provider"
              className={({ isActive }) =>
                isActive ? 'text-brand-600 font-semibold' : 'hover:text-slate-900 transition'
              }
            >
              Become a Partner
            </NavLink>
            {currentUser && (
              <NavLink
                to={ROLE_HOME_ROUTES[currentUser.role]}
                className={({ isActive }) =>
                  isActive ? 'text-brand-600 font-semibold' : 'hover:text-slate-900 transition'
                }
              >
                {ROLE_LABELS[currentUser.role]} Dashboard
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Notification Center</h4>
                    <p className="text-xs text-slate-500">Real-time booking & system alerts</p>
                  </div>
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
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
            <div className="hidden sm:flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate(ROLE_HOME_ROUTES[currentUser.role])}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
              >
                <LayoutDashboard className="h-4 w-4 text-brand-600" />
                <span>{currentUser.fullName.split(' ')[0]}</span>
                <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="btn-secondary py-2 text-xs">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary py-2 text-xs">
                Register
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-slate-600 md:hidden"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden space-y-3">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block py-1.5 text-sm font-semibold text-slate-800">
            Home
          </Link>
          <Link to="/services" onClick={() => setMobileOpen(false)} className="block py-1.5 text-sm font-semibold text-slate-800">
            Explore Services
          </Link>
          <Link to="/register/provider" onClick={() => setMobileOpen(false)} className="block py-1.5 text-sm font-semibold text-slate-800">
            Become a Service Provider
          </Link>
          {currentUser ? (
            <>
              <Link
                to={ROLE_HOME_ROUTES[currentUser.role]}
                onClick={() => setMobileOpen(false)}
                className="block py-1.5 text-sm font-bold text-brand-600"
              >
                Go to {ROLE_LABELS[currentUser.role]} Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                  navigate('/login');
                }}
                className="btn-secondary w-full text-xs"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary flex-1 text-xs">
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 text-xs">
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

