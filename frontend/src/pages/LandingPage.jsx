import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  Star,
  Clock,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Award,
  Sparkles,
  UserCheck,
  Lock,
} from 'lucide-react';
import { usePlatform, DEMO_ROLE_CREDENTIALS } from '../context/PlatformContext';
import { CategoryIcon } from '../components/common/UIComponents';
import { formatCurrency } from '../utils/formatters';

export default function LandingPage() {
  const { data } = usePlatform();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const navigate = useNavigate();

  const approvedProviders = data.providers.filter((p) => p.verificationStatus === 'Approved');

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/services?q=${encodeURIComponent(searchQuery)}&city=${encodeURIComponent(selectedCity)}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 py-16 sm:py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3.5 py-1.5 text-xs font-semibold text-brand-300">
                <ShieldCheck className="h-4 w-4 text-brand-400" />
                <span>100% Background-Verified Home Service Professionals</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:leading-[1.15]">
                Expert Home Services,{' '}
                <span className="text-brand-400">Booked in 60 Seconds</span> with Guaranteed Quality.
              </h1>
              <p className="max-w-2xl text-base text-slate-300 leading-relaxed">
                Connect with KYC-approved electricians, plumbers, AC technicians, deep cleaners, painters, carpenters, and pest control specialists. Transparent upfront pricing, live technician tracking, and 30-day service warranty.
              </p>

              {/* Search Discovery Bar */}
              <form
                onSubmit={handleSearch}
                className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-2xl sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 sm:border-b-0 sm:border-r">
                  <MapPin className="h-5 w-5 text-brand-600 shrink-0" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
                    aria-label="Select City"
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Hyderabad">Hyderabad</option>
                  </select>
                </div>
                <div className="flex flex-1 items-center gap-2 px-3 py-1.5">
                  <Search className="h-5 w-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 'Split AC Foam Service', 'Switchboard Repair', 'Deep Cleaning'..."
                    className="w-full text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <button type="submit" className="btn-primary px-6 py-3 text-sm shrink-0">
                  Find Professionals
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Upfront Standardized Pricing
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Zero Double-Booking Guarantee
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Razorpay Secured Payments
                </span>
              </div>
            </div>

            {/* Right Trust & Live Metrics Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-800/70 p-6 shadow-2xl backdrop-blur-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                      Live Platform Pulse
                    </p>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      HomeServe Assurance Standard
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                    4.9 ★ Avg Rating
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-900/90 p-4 border border-slate-700/70">
                    <p className="text-2xl font-extrabold text-white">8</p>
                    <p className="text-xs text-slate-400 mt-1">Core Service Verticals</p>
                  </div>
                  <div className="rounded-xl bg-slate-900/90 p-4 border border-slate-700/70">
                    <p className="text-2xl font-extrabold text-emerald-400">100%</p>
                    <p className="text-xs text-slate-400 mt-1">KYC & Trade Verified</p>
                  </div>
                  <div className="rounded-xl bg-slate-900/90 p-4 border border-slate-700/70">
                    <p className="text-2xl font-extrabold text-brand-400">30 Days</p>
                    <p className="text-xs text-slate-400 mt-1">Post-Service Protection</p>
                  </div>
                  <div className="rounded-xl bg-slate-900/90 p-4 border border-slate-700/70">
                    <p className="text-2xl font-extrabold text-amber-400">Instant</p>
                    <p className="text-xs text-slate-400 mt-1">Digital GST Invoices</p>
                  </div>
                </div>

                <div className="rounded-xl bg-brand-600/20 border border-brand-500/30 p-4 text-xs text-brand-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">First Booking Offer!</span>
                    Use code <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-amber-300">WELCOME20</code> for 20% off (up to ₹500).
                  </div>
                  <Link to="/services" className="btn-primary py-2 px-3 text-xs shrink-0">
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8 Canonical Service Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Explore by Category
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              8 Specialized Home Service Categories
            </h2>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            View all services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data.categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/services?category=${cat.id}`}
              className="card-surface group p-5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                  <CategoryIcon name={cat.iconName} className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {cat.subcategories.length} Specialties
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-brand-600">
                {cat.name}
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {cat.subcategories.slice(0, 2).map((sub) => (
                  <span
                    key={sub}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Services Catalog */}
      <section className="bg-white py-16 border-y border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Most Booked Packages
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Standardized Home Services with Upfront Pricing
              </h2>
            </div>
            <Link to="/services" className="btn-secondary text-xs">
              Browse Complete Catalog
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.services.slice(0, 8).map((service) => (
              <div
                key={service.id}
                className="card-surface flex flex-col overflow-hidden transition-all hover:shadow-lg"
              >
                <div className="relative h-44 w-full overflow-hidden bg-slate-200">
                  <img
                    src={service.imageUrl}
                    alt={service.name}
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                    {service.categoryName}
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {service.rating} ({service.reviewsCount})
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {service.durationMinutes} mins
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-slate-900 line-clamp-2">
                      {service.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Starts at</span>
                      <span className="text-lg font-extrabold text-slate-900">
                        {formatCurrency(service.basePrice)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/services/${service.id}`}
                        className="btn-secondary px-3 py-2 text-xs"
                      >
                        Details
                      </Link>
                      <Link
                        to={`/book/${service.id}`}
                        className="btn-primary px-3.5 py-2 text-xs"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Service Providers Showcase */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
              KYC-Approved Partners
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Top-Rated Verified Service Providers
            </h2>
          </div>
          <Link to="/register/provider" className="btn-primary text-xs">
            Register as a Service Provider
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {approvedProviders.map((prov) => (
            <div key={prov.id} className="card-surface p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{prov.businessName}</h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <UserCheck className="h-3.5 w-3.5" /> KYC Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Lead Partner: {prov.ownerName} • {prov.experienceYears}+ Years Experience • {prov.completedJobs} Completed Jobs
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-center">
                    <span className="text-sm font-extrabold text-amber-700">{prov.averageRating} ★</span>
                    <span className="block text-[10px] text-amber-600">{prov.totalReviews} Reviews</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{prov.bio}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {prov.serviceAreas.map((area) => (
                    <span
                      key={area.id}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                    >
                      <MapPin className="h-3 w-3 text-brand-600" />
                      {area.areaName} ({area.postalCode})
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span>Working Hours: {prov.workingHours}</span>
                <Link to="/services" className="font-semibold text-brand-600 hover:text-brand-700">
                  View Offered Services →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Role-Based Authentication Portals & Visible Demo Credentials Section */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Role-Based Access Control (RBAC)
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                4 Role-Authenticated Dashboards & Demo Credentials
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Each dashboard requires role-specific authentication. Use the visible credentials below to test every workflow.
              </p>
            </div>
            <Link to="/login" className="btn-primary text-xs">
              Open Role Authentication Portal →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DEMO_ROLE_CREDENTIALS.map((cred) => (
              <div
                key={cred.role}
                className="card-surface p-5 flex flex-col justify-between border-slate-200 hover:border-brand-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {cred.roleTitle}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      {cred.badge}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-900">{cred.fullName}</p>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{cred.description}</p>

                  <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-sans font-bold uppercase text-slate-400">
                        Email:
                      </span>
                      <span className="font-semibold text-slate-800 select-all">{cred.email}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 border-t border-slate-200/70 pt-1">
                      <span className="text-[10px] font-sans font-bold uppercase text-slate-400">
                        Pass:
                      </span>
                      <span className="font-bold text-brand-700 select-all">{cred.password}</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/login?role=${cred.role}`}
                  className="btn-primary mt-4 w-full py-2 text-xs text-center"
                >
                  Authenticate as {cred.roleTitle.split(' ')[0]} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-400">
              Verified Customer Reviews
            </p>
            <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
              Reviewed Only by Verified Completed Bookings
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Every review on HomeServe Technologies is cryptographically tied to a completed booking invoice.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {data.reviews.map((rev) => (
              <div key={rev.id} className="rounded-2xl border border-slate-800 bg-slate-800/80 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{rev.customerName}</p>
                    <p className="text-xs text-brand-300">
                      {rev.serviceName} • Booking #{rev.bookingNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300">
                    {'★'.repeat(rev.rating)} ({rev.rating}.0)
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-300 italic leading-relaxed">"{rev.comment}"</p>
                {rev.providerReply && (
                  <div className="mt-4 rounded-xl bg-slate-900/90 p-3.5 text-xs text-slate-400 border-l-2 border-brand-500">
                    <span className="font-bold text-white block mb-1">
                      Partner Response ({rev.providerName}):
                    </span>
                    {rev.providerReply}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

