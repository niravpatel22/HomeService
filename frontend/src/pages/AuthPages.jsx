import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Phone, User, Building2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

export function LoginPage() {
  const { loginWithCredentials, quickSwitchRole } = usePlatform();
  const [email, setEmail] = useState('customer@homeserve.com');
  const [password, setPassword] = useState('Customer@123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  const handleDemoFill = async (demoEmail, demoPass, roleKey) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    const route = await quickSwitchRole(roleKey);
    navigate(route);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="card-surface p-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Sign In to HomeServe</h1>
          <p className="mt-1 text-xs text-slate-500">
            Role-based JWT Authenticated Portal
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@homeserve.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn-primary w-full py-2.5">
            Sign In Securely
          </button>
        </form>

        {/* One-Click Seed Credentials Panel */}
        <div className="mt-6 border-t border-slate-200 pt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            One-Click Seed Role Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('customer@homeserve.com', 'Customer@123', 'customer')}
              className="btn-secondary py-2 text-xs"
            >
              Customer Login
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('provider@homeserve.com', 'Provider@123', 'service_provider')}
              className="btn-secondary py-2 text-xs"
            >
              Provider Login
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('tech@homeserve.com', 'Tech@12345', 'technician')}
              className="btn-secondary py-2 text-xs"
            >
              Technician Login
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('admin@homeserve.com', 'Admin@12345', 'super_admin')}
              className="btn-secondary py-2 text-xs"
            >
              Super Admin Login
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Don't have an account?{' '}
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
                    className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                      selected
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

