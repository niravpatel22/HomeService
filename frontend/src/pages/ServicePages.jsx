import React, { useState, useMemo } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Star,
  Clock,
  CheckCircle2,
  UserCheck,
  MapPin,
  Heart,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { EmptyState, Pagination } from '../components/common/UIComponents';
import { formatCurrency } from '../utils/formatters';

export function ServiceListingPage() {
  const { data } = usePlatform();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredServices = useMemo(() => {
    return data.services
      .filter((svc) => {
        if (!svc.isActive) return false;
        if (selectedCategory !== 'all' && Number(svc.categoryId) !== Number(selectedCategory)) {
          return false;
        }
        if (svc.basePrice > maxPrice) return false;
        if (svc.rating < minRating) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          return (
            svc.name.toLowerCase().includes(q) ||
            svc.description.toLowerCase().includes(q) ||
            svc.categoryName.toLowerCase().includes(q) ||
            svc.subcategory.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.basePrice - b.basePrice;
        if (sortBy === 'price_desc') return b.basePrice - a.basePrice;
        if (sortBy === 'rating') return b.rating - a.rating;
        return b.reviewsCount - a.reviewsCount;
      });
  }, [data.services, selectedCategory, maxPrice, minRating, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Explore Verified Home Services
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Filter by category, standardized pricing, and verified customer ratings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search services..."
              className="input-field pl-9"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field w-44"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Sidebar Filters (Sticky while scrolling right results & fits viewport cleanly) */}
        <aside className="lg:col-span-3 lg:sticky lg:top-20 lg:self-start">
          <div className="card-surface p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-brand-600" /> Filter Services
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setMaxPrice(5000);
                  setMinRating(0);
                  setQuery('');
                  setSearchParams({});
                }}
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                Reset
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Service Category
              </label>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setCurrentPage(1);
                  }}
                  className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition flex items-center justify-between ${selectedCategory === 'all'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <span>All Categories</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${selectedCategory === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                      }`}
                  >
                    {data.services.length}
                  </span>
                </button>
                {data.categories.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(String(cat.id));
                      setCurrentPage(1);
                    }}
                    className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition ${String(selectedCategory) === String(cat.id)
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Max Price</span>
                <span className="text-brand-600 font-extrabold">{formatCurrency(maxPrice)}</span>
              </div>
              <input
                type="range"
                min={400}
                max={5000}
                step={100}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>₹400</span>
                <span>₹5,000</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Minimum Rating
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { val: 0, label: 'All' },
                  { val: 4.5, label: '4.5 ★+' },
                  { val: 4.8, label: '4.8 ★+' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setMinRating(opt.val)}
                    className={`rounded-lg border py-1.5 text-center text-xs font-bold transition ${minRating === opt.val
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="lg:col-span-9">
          {paginatedServices.length === 0 ? (
            <EmptyState
              title="No matching home services found"
              description="Try clearing your search keyword or adjusting the category and price range filters."
              actionLabel="Reset All Filters"
              onAction={() => {
                setSelectedCategory('all');
                setMaxPrice(5000);
                setMinRating(0);
                setQuery('');
              }}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedServices.map((svc) => (
                  <div
                    key={svc.id}
                    className="card-surface flex flex-col overflow-hidden transition hover:shadow-lg"
                  >
                    <div className="relative h-44 bg-slate-200">
                      <img
                        src={svc.imageUrl}
                        alt={svc.name}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute left-3 top-3 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white">
                        {svc.categoryName}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {svc.rating} ({svc.reviewsCount})
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {svc.durationMinutes}m
                          </span>
                        </div>
                        <h3 className="mt-2 text-base font-bold text-slate-900">{svc.name}</h3>
                        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {svc.description}
                        </p>
                      </div>
                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                        <div>
                          <span className="text-[10px] uppercase text-slate-400 block">Standard Fee</span>
                          <span className="text-base font-extrabold text-slate-900">
                            {formatCurrency(svc.basePrice)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            to={`/services/${svc.id}`}
                            className="btn-secondary px-3 py-1.5 text-xs"
                          >
                            View
                          </Link>
                          <Link
                            to={`/book/${svc.id}`}
                            className="btn-primary px-3 py-1.5 text-xs"
                          >
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ServiceDetailPage() {
  const { id } = useParams();
  const { data, currentCustomer, toggleFavoriteProvider } = usePlatform();

  const service = data.services.find((s) => Number(s.id) === Number(id)) || data.services[0];
  const approvedProviders = data.providers.filter(
    (p) =>
      p.verificationStatus === 'Approved' &&
      p.offeredServices.some((os) => Number(os.serviceId) === Number(service.id))
  );
  const serviceReviews = data.reviews.filter((r) => r.serviceName === service.name || r.isVisible);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      <Link
        to="/services"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Service Catalog
      </Link>

      {/* Main Service Overview */}
      <div className="card-surface overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 bg-slate-200 min-h-[280px]">
          <img src={service.imageUrl} alt={service.name} className="h-full w-full object-cover" />
        </div>
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                {service.categoryName}
              </span>
              <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {service.subcategory}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                ★ {service.rating} ({service.reviewsCount} Verified Reviews)
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {service.name}
            </h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">{service.description}</p>

            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                What's Included in This Package
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(service.inclusions || []).map((inc) => (
                  <div key={inc} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200 pt-6">
            <div>
              <span className="text-xs text-slate-500 block">Standard Base Price (Excl. 18% GST)</span>
              <span className="text-3xl font-extrabold text-slate-900">
                {formatCurrency(service.basePrice)}
              </span>
              <span className="ml-2 text-xs text-slate-500">
                • Est. Duration: {service.durationMinutes} mins
              </span>
            </div>
            <Link to={`/book/${service.id}`} className="btn-primary px-6 py-3 text-sm">
              Check Slot Availability & Book Now
            </Link>
          </div>
        </div>
      </div>

      {/* Approved Providers Offering This Service */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900">
          Verified Service Providers Offering This Service ({approvedProviders.length})
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {approvedProviders.map((prov) => {
            const customOffer = prov.offeredServices.find(
              (os) => Number(os.serviceId) === Number(service.id)
            );
            const isFav = currentCustomer?.favoriteProviderIds?.includes(prov.id);
            return (
              <div key={prov.id} className="card-surface p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{prov.businessName}</h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          <UserCheck className="h-3 w-3" /> Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {prov.experienceYears} yrs experience • {prov.completedJobs} completed jobs • ★ {prov.averageRating}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFavoriteProvider(prov.id)}
                      className={`rounded-lg border p-2 transition ${isFav
                          ? 'border-rose-200 bg-rose-50 text-rose-600'
                          : 'border-slate-200 text-slate-400 hover:text-rose-600'
                        }`}
                      title="Save to Favorite Providers"
                    >
                      <Heart className={`h-4 w-4 ${isFav ? 'fill-rose-600' : ''}`} />
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-slate-600">{customOffer?.customDescription || prov.bio}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {prov.serviceAreas.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                      >
                        <MapPin className="h-3 w-3 text-brand-600" /> {a.areaName} ({a.postalCode})
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Provider Rate</span>
                    <span className="text-lg font-extrabold text-slate-900">
                      {formatCurrency(customOffer?.customPrice || service.basePrice)}
                    </span>
                  </div>
                  <Link
                    to={`/book/${service.id}?provider=${prov.id}`}
                    className="btn-primary px-4 py-2 text-xs"
                  >
                    Select Provider & Book
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verified Customer Reviews */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900">
          Verified Customer Reviews ({serviceReviews.length})
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {serviceReviews.map((rev) => (
            <div key={rev.id} className="card-surface p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{rev.customerName}</span>
                <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                  {'★'.repeat(rev.rating)} ({rev.rating}.0)
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">"{rev.comment}"</p>
              {rev.providerReply && (
                <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border-l-2 border-brand-600">
                  <strong className="text-slate-900">Provider Reply:</strong> {rev.providerReply}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

