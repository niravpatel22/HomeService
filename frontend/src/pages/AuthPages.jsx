import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  User,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
  Wrench,
  LayoutDashboard,
} from 'lucide-react';
import { usePlatform, DEMO_ROLE_CREDENTIALS } from '../context/PlatformContext';
import { ROLE_LABELS } from '../constants';

const EXTRA_TEST_ACCOUNTS = [
  {
    role: 'service_provider',
    roleTitle: 'Pending KYC Provider (Test Gate)',
    fullName: 'Suresh Nair (QuickFix Plumbing)',
    email: 'pending.provider@homeserve.com',
    password: 'Provider@123',
    badge: 'Pending Admin KYC',
  },
  {
    role: 'customer',
    roleTitle: 'Secondary Customer Account',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    password: 'Customer@123',
    badge: 'Customer #2',
  },
  {
    role: 'technician',
    roleTitle: 'Secondary Field Technician',
    fullName: 'Ravi Verma (Cleaning Specialist)',
    email: 'ravi.tech@homeserve.com',
    password: 'Tech@12345',
    badge: 'Technician #2',
  },
];

export function LoginPage() {
  const { loginWithCredentials, currentUser, logout } = usePlatform();
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role');

  const initialCred =
    DEMO_ROLE_CREDENTIALS.find((c) => c.role === requestedRole) || DEMO_ROLE_CREDENTIALS[0];

  const [selectedRole, setSelectedRole] = useState(initialCred.role);
  const [email, setEmail] = useState(initialCred.email);
  const [password, setPassword] = useState(initialCred.password);
  const [showPassword, setShowPassword] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (requestedRole) {
      const target = DEMO_ROLE_CREDENTIALS.find((c) => c.role === requestedRole);
      if (target) {
        setSelectedRole(target.role);
        setEmail(target.email);
        setPassword(target.password);
      }
    }
  }, [requestedRole]);

  const handleRoleTabSelect = (cred) => {
    setSelectedRole(cred.role);
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Both email and password are required.');
      return;
    }
    const res = await loginWithCredentials(email, password);
    if (!res.success) {
      setError(res.error);
      return;
    }
    navigate(res.redirectPath);
  };

  const handleDirectRoleSignIn = async (demoEmail, demoPass, roleKey) => {
    setSelectedRole(roleKey);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    const res = await loginWithCredentials(demoEmail, demoPass);
    if (!res.success) {
      setError(res.error);
      return;
    }
    navigate(res.redirectPath);
  };

  const handleFillOnly = (demoEmail, demoPass, roleKey) => {
    setSelectedRole(roleKey);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      {requestedRole && (!currentUser || currentUser.role !== requestedRole) && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-xs font-medium text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Role Authentication Required:</strong> Please sign in with{' '}
              <span className="font-bold underline">{ROLE_LABELS[requestedRole] || requestedRole}</span>{' '}
              credentials below to access the {ROLE_LABELS[requestedRole] || requestedRole} Dashboard.
            </span>
          </div>
          {currentUser && (
            <span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-amber-200">
              Currently signed in as: {currentUser.fullName} ({ROLE_LABELS[currentUser.role]})
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Role-Based Sign In Form */}
        <div className="lg:col-span-5">
          <div className="card-surface p-7 sm:p-8 sticky top-24">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">Role-Based Sign In</h1>
                <p className="text-xs text-slate-500">
                  Authenticate to access your role-specific dashboard
                </p>
              </div>
            </div>

            {/* 4 Role Tabs */}
            <div className="mt-6">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Select Target Portal Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ROLE_CREDENTIALS.map((cred) => {
                  const isActive = selectedRole === cred.role;
                  return (
                    <button
                      key={cred.role}
                      type="button"
                      onClick={() => handleRoleTabSelect(cred)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${isActive
                          ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <span>{ROLE_LABELS[cred.role]}</span>
                      {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-brand-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role Account Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field font-mono text-xs"
                  placeholder="you@homeserve.com"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="h-3 w-3" /> Hide Password
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" /> Show Password
                      </>
                    )}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field font-mono text-xs"
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                <span>Sign In to {ROLE_LABELS[selectedRole]} Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {currentUser && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-emerald-950">Active Session: {currentUser.fullName}</p>
                    <p className="text-emerald-700 font-mono text-[11px]">{currentUser.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            <p className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
              Need a new account?{' '}
              <Link to="/register" className="font-semibold text-brand-600 hover:underline">
                Register as Customer
              </Link>{' '}
              or{' '}
              <Link to="/register/provider" className="font-semibold text-brand-600 hover:underline">
                Become a Provider
              </Link>
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Visible Role Credentials Cards for All 4 Dashboards */}
        <div className="lg:col-span-7 space-y-5">
          <div className="card-surface p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-bold text-brand-700">
                  <KeyRound className="h-3.5 w-3.5" /> 4-Role RBAC Verification Credentials
                </span>
                <h2 className="mt-2 text-lg font-extrabold text-slate-900">
                  All Role Dashboards — Visible Login Credentials
                </h2>
                <p className="text-xs text-slate-500">
                  Click <strong>Fill Credentials</strong> to populate the login form, or click{' '}
                  <strong>Login & Open Dashboard</strong> to sign in directly to that role's dashboard.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {DEMO_ROLE_CREDENTIALS.map((cred) => {
                const isSelected = email.toLowerCase() === cred.email.toLowerCase();
                return (
                  <div
                    key={cred.role}
                    className={`rounded-2xl border p-4 transition flex flex-col justify-between ${isSelected
                        ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/15'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                          {cred.roleTitle}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          {cred.badge}
                        </span>
                      </div>

                      <p className="mt-2.5 text-sm font-bold text-slate-900">{cred.fullName}</p>
                      <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                        {cred.description}
                      </p>

                      {/* Visible Email & Password Box */}
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-1.5 text-xs font-mono">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-sans font-bold uppercase text-slate-400">
                            Email:
                          </span>
                          <span className="font-semibold text-slate-800 select-all">{cred.email}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 border-t border-slate-200/70 pt-1.5">
                          <span className="text-[10px] font-sans font-bold uppercase text-slate-400">
                            Password:
                          </span>
                          <span className="font-bold text-brand-700 select-all">{cred.password}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleFillOnly(cred.email, cred.password, cred.role)}
                        className="btn-secondary flex-1 py-2 text-xs"
                      >
                        Fill Credentials
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDirectRoleSignIn(cred.email, cred.password, cred.role)}
                        className="btn-primary flex-1 py-2 text-xs inline-flex items-center justify-center gap-1"
                      >
                        <span>Login & Open</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Secondary Test Accounts (Pending KYC Provider, Customer #2, Technician #2) */}
            <div className="mt-6 border-t border-slate-200 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Additional Seeded Accounts (KYC Gate & Multi-Tenant Testing)
              </h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {EXTRA_TEST_ACCOUNTS.map((item) => (
                  <div
                    key={item.email}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs flex flex-col justify-between"
                  >
                    <div>
                      <span className="inline-block rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {item.badge}
                      </span>
                      <p className="mt-1.5 font-bold text-slate-900">{item.fullName}</p>
                      <p className="mt-1 font-mono text-[11px] text-slate-700 break-all select-all">
                        {item.email}
                      </p>
                      <p className="font-mono text-[11px] font-bold text-brand-700 select-all">
                        Pass: {item.password}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDirectRoleSignIn(item.email, item.password, item.role)}
                      className="mt-2.5 w-full rounded-lg border border-slate-300 bg-white py-1.5 text-[11px] font-bold text-slate-800 hover:bg-slate-100 transition"
                    >
                      Sign In as {item.fullName.split(' ')[0]}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomerRegisterPage() {
  const { registerCustomer } = usePlatform();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const res = await registerCustomer(form);
    if (!res.success) {
      setError(res.error);
      return;
    }
    navigate(res.redirectPath);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card-surface p-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Create Customer Account</h1>
        <p className="mt-1 text-xs text-slate-500">
          Book verified electricians, plumbers, cleaners & AC engineers in minutes.
        </p>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="input-field"
              placeholder="e.g. Rohan Deshmukh"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
              placeholder="rohan@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">10-Digit Mobile Number *</label>
            <input
              type="tel"
              required
              maxLength={10}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field"
              placeholder="9876543210"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
                placeholder="Min 8 chars"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password *</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="input-field"
                placeholder="Repeat password"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full py-2.5">
            Register Customer Account
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Are you a service business?{' '}
          <Link to="/register/provider" className="font-semibold text-brand-600 hover:underline">
            Register as a Service Provider
          </Link>
        </p>
      </div>
    </div>
  );
}

export function ProviderRegisterPage() {
  const { data, registerProvider } = usePlatform();
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    experienceYears: 5,
    city: 'Bengaluru',
    postalCode: '560038',
    kycDocumentName: '',
    selectedCategoryIds: [1, 3],
    bio: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleCategory = (catId) => {
    setForm((prev) => {
      const exists = prev.selectedCategoryIds.includes(catId);
      return {
        ...prev,
        selectedCategoryIds: exists
          ? prev.selectedCategoryIds.filter((id) => id !== catId)
          : [...prev.selectedCategoryIds, catId],
      };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Invalid KYC file format. Only PDF, JPG, PNG, or WEBP files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds maximum 5 MB security limit.');
      return;
    }
    setError('');
    setForm({ ...form, kycDocumentName: file.name });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (form.selectedCategoryIds.length === 0) {
      setError('Please select at least one service category.');
      return;
    }
    const res = await registerProvider(form);
    if (!res.success) {
      setError(res.error);
      return;
    }
    navigate(res.redirectPath);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="card-surface p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Service Provider Onboarding & KYC</h1>
            <p className="text-xs text-slate-500">
              Submit your business profile and identity verification documents for Super Admin approval.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business / Agency Name *</label>
              <input
                type="text"
                required
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="input-field"
                placeholder="e.g. PrimeVolt Electricals"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Authorized Person *</label>
              <input
                type="text"
                required
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                className="input-field"
                placeholder="e.g. Naveen Kumar"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
                placeholder="partner@business.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field"
                placeholder="9845012345"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Service City *</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Postal / PIN Code *</label>
              <input
                type="text"
                required
                maxLength={6}
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Offered Service Categories *
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {data.categories.map((cat) => {
                const selected = form.selectedCategoryIds.includes(cat.id);
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition ${selected
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload Identity & Trade Verification Document (PDF/JPG/PNG, Max 5MB) *
            </label>
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="text-xs text-slate-600"
              />
              {form.kycDocumentName && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Attached: {form.kycDocumentName}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Business Description & Certifications</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="input-field"
              placeholder="Describe your team strength, trade licenses, and equipment..."
            />
          </div>

          <button type="submit" className="btn-primary w-full py-3">
            Submit Provider Application for Admin Verification
          </button>
        </form>
      </div>
    </div>
  );
}

