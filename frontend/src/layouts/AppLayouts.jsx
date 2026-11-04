import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  Home,
  Compass,
  Sparkles,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-react';
import { usePlatform, DEMO_ROLE_CREDENTIALS } from '../context/PlatformContext';
import { ROLE_HOME_ROUTES, ROLE_LABELS } from '../constants';
import { ToastBanner } from '../components/common/UIComponents';

export function MainHeader() {
  const { currentUser, data, markAllNotificationsRead, logout, quickSwitchRole } = usePlatform();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
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

  const handleInstantRoleSwitch = (role, dashboardPath) => {
    quickSwitchRole(role);
    setRoleMenuOpen(false);
    setMobileOpen(false);
    navigate(dashboardPath);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
      {/* Subtle Top Enterprise Gradient Accent Line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-brand-600 via-indigo-500 to-emerald-500" />

      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-2 px-3 sm:px-5 lg:px-6">
        {/* Left: Brand Identity + Segmented Pill Navigation */}
        <div className="flex items-center gap-3 xl:gap-6 min-w-0">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-sm ring-2 ring-brand-100 transition duration-200 group-hover:scale-105">
              <ShieldCheck className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div className="leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-base xl:text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                  HomeServe<span className="text-brand-600">Pro</span>
                </span>
                <span className="hidden xl:inline-flex items-center rounded-md bg-brand-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-brand-700 border border-brand-200/60">
                  SaaS
                </span>
              </div>
              <span className="hidden sm:block text-[8px] xl:text-[9px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap mt-0.5">
                HomeServe Technologies
              </span>
            </div>
          </Link>

          {/* Desktop Segmented Navigation Pill */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl px-2.5 xl:px-3 py-1.5 text-xs font-bold transition ${isActive
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                }`
              }
            >
              <Home className="h-3.5 w-3.5 shrink-0" />
              <span>Home</span>
            </NavLink>

            <NavLink
              to="/services"
              className={({ isActive }) =>
                `whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl px-2.5 xl:px-3 py-1.5 text-xs font-bold transition ${isActive
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                }`
              }
            >
              <Compass className="h-3.5 w-3.5 shrink-0" />
              <span>Explore Services</span>
            </NavLink>

            <NavLink
              to="/register/provider"
              className={({ isActive }) =>
                `whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl px-2.5 xl:px-3 py-1.5 text-xs font-bold transition ${isActive
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                }`
              }
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Become a Partner</span>
            </NavLink>

            {currentUser && (
              <NavLink
                to={ROLE_HOME_ROUTES[currentUser.role]}
                className={({ isActive }) =>
                  `whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl px-2.5 xl:px-3.5 py-1.5 text-xs font-extrabold transition ${isActive
                    ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xs'
                    : 'bg-white/90 text-slate-900 hover:bg-white shadow-2xs'
                  }`
                }
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                <span>{ROLE_LABELS[currentUser.role]}</span>
                <span className="hidden xl:inline">Console</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Right: Notification Center, Interactive Role Switcher & User Controls */}
        <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen(!notifOpen);
                setRoleMenuOpen(false);
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-slate-50/80 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl z-50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">Notification Center</h4>
                    <p className="text-[11px] text-slate-500">
                      Real-time booking, dispatch & Razorpay webhook alerts
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 whitespace-nowrap"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                  </button>
                </div>
                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
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
                        <p className="font-bold text-slate-900">{item.title}</p>
                        <p className="mt-0.5 text-slate-600 leading-relaxed">{item.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Role Switcher Dropdown (Visible on Desktop & Tablet) */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => {
                setRoleMenuOpen(!roleMenuOpen);
                setNotifOpen(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50/90 px-3 py-1.5 text-xs font-extrabold text-brand-700 hover:bg-brand-100 transition whitespace-nowrap shrink-0"
              title="Instant 4-Role Switcher & Credentials"
            >
              <UserCheck className="h-3.5 w-3.5 shrink-0" />
              <span>Switch Role</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-75" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl z-50 space-y-2">
                <div className="px-2 py-1 border-b border-slate-100">
                  <p className="text-xs font-extrabold text-slate-900">
                    Instant RBAC Role Switcher
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click any role to switch JWT session & open console
                  </p>
                </div>
                <div className="space-y-1">
                  {DEMO_ROLE_CREDENTIALS.map((cred) => {
                    const isActiveRole = currentUser?.role === cred.role;
                    return (
                      <button
                        key={cred.role}
                        type="button"
                        onClick={() => handleInstantRoleSwitch(cred.role, cred.dashboardPath)}
                        className={`w-full rounded-xl p-2.5 text-left text-xs transition flex items-center justify-between gap-2 ${isActiveRole
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'hover:bg-slate-50 text-slate-800 border border-transparent hover:border-slate-200'
                          }`}
                      >
                        <div className="min-w-0">
                          <p className="font-extrabold truncate">{cred.roleTitle}</p>
                          <p
                            className={`text-[10px] font-mono truncate ${isActiveRole ? 'text-brand-100' : 'text-slate-500'
                              }`}
                          >
                            {cred.email} • {cred.password}
                          </p>
                        </div>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold shrink-0 ${isActiveRole
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-700'
                            }`}
                        >
                          {isActiveRole ? 'Active' : 'Switch →'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="pt-1 border-t border-slate-100">
                  <Link
                    to="/login"
                    onClick={() => setRoleMenuOpen(false)}
                    className="flex items-center justify-center gap-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-brand-600" />
                    <span>Open Full Login & Credentials Page</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {currentUser ? (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {/* Active User Identity Chip */}
              <button
                type="button"
                onClick={() => navigate(ROLE_HOME_ROUTES[currentUser.role])}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/90 pl-1.5 pr-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition whitespace-nowrap"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-indigo-600 text-[10px] font-extrabold text-white shrink-0 shadow-2xs">
                  {userInitials}
                </span>
                <span className="font-extrabold text-slate-900 whitespace-nowrap">
                  {currentUser.fullName.split(' ')[0]}
                </span>
                <span className="rounded-md bg-brand-100/80 px-2 py-0.5 text-[10px] font-extrabold text-brand-700 whitespace-nowrap">
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </button>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition whitespace-nowrap shrink-0"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden xl:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs hover:from-brand-700 hover:to-indigo-700 transition whitespace-nowrap"
              >
                <KeyRound className="h-3.5 w-3.5 shrink-0" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile / Tablet Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile & Tablet Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden space-y-4 shadow-2xl">
          {/* Primary Navigation Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
            >
              <Home className="h-4 w-4 text-brand-600" />
              <span>Home</span>
            </Link>
            <Link
              to="/services"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
            >
              <Compass className="h-4 w-4 text-brand-600" />
              <span>Explore Services</span>
            </Link>
            <Link
              to="/register/provider"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Become a Partner</span>
            </Link>
          </div>

          {/* Instant 4-Role Switcher Grid on Mobile/Tablet */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              1-Tap Role Console Switcher
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ROLE_CREDENTIALS.map((cred) => {
                const isActiveRole = currentUser?.role === cred.role;
                return (
                  <button
                    key={cred.role}
                    type="button"
                    onClick={() => handleInstantRoleSwitch(cred.role, cred.dashboardPath)}
                    className={`rounded-xl p-2.5 text-left text-xs font-bold transition border ${isActiveRole
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                      }`}
                  >
                    <span className="block truncate">{cred.roleTitle}</span>
                    <span
                      className={`block text-[10px] font-mono truncate mt-0.5 ${isActiveRole ? 'text-brand-100' : 'text-slate-500'
                        }`}
                    >
                      {cred.email}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {currentUser ? (
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-200/60">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 truncate">
                    {currentUser.fullName}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 truncate">
                    {currentUser.email}
                  </p>
                </div>
                <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[10px] font-extrabold text-brand-700 shrink-0">
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={ROLE_HOME_ROUTES[currentUser.role]}
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary py-2 text-xs text-center"
                >
                  Open {ROLE_LABELS[currentUser.role]} Console
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                    navigate('/login');
                  }}
                  className="rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-700"
                >
                  Sign Out
                </button>
              </div>
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
  const location = useLocation();
  const isDashboardRoute = location.pathname.endsWith('/dashboard');

  return (
    <div
      className={
        isDashboardRoute
          ? 'flex h-screen flex-col overflow-hidden bg-slate-50'
          : 'flex min-h-screen flex-col bg-slate-50'
      }
    >
      <MainHeader />
      <main className={isDashboardRoute ? 'flex-1 min-h-0 overflow-hidden' : 'flex-1'}>
        {children}
      </main>
      {!isDashboardRoute && <Footer />}
      <ToastBanner toast={toast} />
    </div>
  );
}
