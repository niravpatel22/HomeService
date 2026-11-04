import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  Star,
  Clock,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Sparkles,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Zap,
  Award,
} from 'lucide-react';
import { usePlatform, DEMO_ROLE_CREDENTIALS } from '../context/PlatformContext';
import { CategoryIcon } from '../components/common/UIComponents';
import { formatCurrency } from '../utils/formatters';

const HERO_SLIDES = [
  {
    id: 1,
    serviceId: 5,
    category: 'AC Repair & Maintenance',
    badge: 'MOST BOOKED THIS WEEK',
    title: 'Split & Window AC High-Pressure Foam-Jet Service',
    subtitle:
      'Deep chemical coil wash, gas pressure diagnostics, drain tray sanitization, and 98.6% cooling efficiency restoration by certified HVAC engineers.',
    price: 599,
    duration: '60 Mins',
    rating: '4.9 ★ (1,420+ Verified Jobs)',
    warranty: '30-Day Cooling Warranty',
    technicianTag: 'Manoj Kumar • Senior HVAC Specialist',
    imageUrl:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=85',
    accentColor: 'from-brand-500 to-indigo-600',
  },
  {
    id: 2,
    serviceId: 7,
    category: 'Home Deep Cleaning',
    badge: 'HOSPITAL-GRADE SANITIZATION',
    title: '2BHK / 3BHK Intensive Full-Home Steam Sanitization',
    subtitle:
      'Single-disc floor scrubbing, kitchen chimney & tile degreasing, bathroom descaling, and eco-safe sofa dry vacuuming by a 4-member verified crew.',
    price: 2499,
    duration: '240 Mins',
    rating: '4.9 ★ (980+ Homes Cleaned)',
    warranty: '100% Stain-Free Guarantee',
    technicianTag: 'SparklePro Hygiene Crew • Background Verified',
    imageUrl:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=85',
    accentColor: 'from-emerald-500 to-teal-600',
  },
  {
    id: 3,
    serviceId: 1,
    category: 'Electrical Services',
    badge: '30-MIN RAPID DISPATCH',
    title: 'Complete Switchboard, MCB & Smart Wiring Diagnostics',
    subtitle:
      'Thermal load inspection, 3-phase DB box balancing, inverter battery backup wiring, and surge-protected modular switchboard upgrades.',
    price: 299,
    duration: '45 Mins',
    rating: '4.8 ★ (2,150+ Safe Installations)',
    warranty: 'Govt. Licensed Electricians',
    technicianTag: 'Rajesh Kulkarni • Certified Master Electrician',
    imageUrl:
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1400&q=85',
    accentColor: 'from-amber-500 to-orange-600',
  },
  {
    id: 4,
    serviceId: 3,
    category: 'Plumbing Services',
    badge: 'ZERO-LEAK ASSURANCE',
    title: 'Bathroom Leakage, Mixer Tap & Hydro-Jet Pipeline Overhaul',
    subtitle:
      'Non-invasive acoustic leak detection, concealed diverter cartridge replacement, overhead tank sanitization, and high-pressure drain unclogging.',
    price: 349,
    duration: '50 Mins',
    rating: '4.8 ★ (1,190+ Leak-Free Repairs)',
    warranty: 'Genuine OEM Brass Fittings',
    technicianTag: 'Suresh Nair • Master Plumbing Specialist',
    imageUrl:
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1400&q=85',
    accentColor: 'from-sky-500 to-blue-600',
  },
  {
    id: 5,
    serviceId: 9,
    category: 'Painting & Waterproofing',
    badge: 'DUST-FREE MECHANIZED FINISH',
    title: 'Laser-Measured Interior Painting & Terrace Waterproofing',
    subtitle:
      'Crack-bridging elastomeric damp proofing, automated vacuum sanding, low-VOC luxury emulsion coats, and on-time room handover.',
    price: 3999,
    duration: 'Same-Day Inspection',
    rating: '4.9 ★ (640+ Renovated Homes)',
    warranty: '1-Year Damp-Proof Warranty',
    technicianTag: 'Apex Interior Finishing Division',
    imageUrl:
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1400&q=85',
    accentColor: 'from-purple-500 to-indigo-600',
  },
];

const TRANSFORMATION_SLIDES = [
  {
    id: 'spot-1',
    tag: 'MONSOON & SUMMER Bestseller',
    title: 'Split AC Foam-Jet + Anti-Rust Coil Coating',
    beforeAfterText: 'Restores air throw by 40% & cuts monthly electricity bills by up to 22%.',
    couponCode: 'WELCOME20',
    discountLabel: 'Flat 20% OFF (Up to ₹500)',
    price: 599,
    originalPrice: 899,
    serviceId: 5,
    imageUrl:
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=85',
    metrics: ['100% Mess-Free Jacket Wash', 'Digital Manifold Pressure Check', '30-Day Service Warranty'],
  },
  {
    id: 'spot-2',
    tag: 'FESTIVE HOME MAKEOVER',
    title: 'Full Kitchen Chimneys, Hob & Tile Steam Degreasing',
    beforeAfterText: 'Removes 99.4% carbonized oil deposits & food-grade steam sanitizes all cabinets.',
    couponCode: 'WELCOME20',
    discountLabel: 'Save ₹400 Instantly',
    price: 1199,
    originalPrice: 1599,
    serviceId: 8,
    imageUrl:
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=85',
    metrics: ['Eco-Safe Non-Caustic Degreaser', 'Chimney Suction Test Included', '2-Hour Express Turnaround'],
  },
  {
    id: 'spot-3',
    tag: 'SMART HOME SAFETY PACKAGE',
    title: 'Whole-House Electrical Safety Audit & MCB Upgrade',
    beforeAfterText: 'Prevents short-circuits, appliance burnouts, and earthing voltage leakage.',
    couponCode: 'WELCOME20',
    discountLabel: '20% OFF First Audit',
    price: 399,
    originalPrice: 599,
    serviceId: 2,
    imageUrl:
      'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=85',
    metrics: ['Digital Multimeter Load Report', 'ISI-Marked Breaker Check', 'Instant GST Tax Invoice'],
  },
];

export default function LandingPage() {
  const { data } = usePlatform();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSpotlight, setActiveSpotlight] = useState(0);
  const navigate = useNavigate();

  const approvedProviders = data.providers.filter((p) => p.verificationStatus === 'Approved');

  // Auto-advance Hero HD Slider every 5.5 seconds unless paused
  useEffect(() => {
    if (isPaused) return undefined;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Auto-advance Transformation Spotlight Slider every 6.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSpotlight((prev) => (prev + 1) % TRANSFORMATION_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(
      `/services?q=${encodeURIComponent(searchQuery)}&city=${encodeURIComponent(selectedCity)}`
    );
  };

  const currentHero = HERO_SLIDES[activeSlide];
  const currentSpot = TRANSFORMATION_SLIDES[activeSpotlight];

  return (
    <div>
      {/* ====================================================================
          HERO SECTION WITH AMBIENT KEN-BURNS HD SLIDER & INTERACTIVE SHOWCASE
      ==================================================================== */}
      <section
        className="relative overflow-hidden bg-slate-950 py-12 sm:py-20 text-white"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Ambient HD Crossfade + Ken Burns Slow Zoom */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === activeSlide ? 'opacity-30' : 'opacity-0'
              }`}
            >
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className={`h-full w-full object-cover ${
                  idx === activeSlide ? 'animate-ken-burns' : ''
                }`}
              />
            </div>
          ))}
          {/* Multi-layer Dark SaaS Gradient Veil for Crisp Typography Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/92 to-slate-950/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Left Column: Value Proposition, Search Bar & Slide Quick-Pills */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/15 px-3.5 py-1.5 text-xs font-semibold text-brand-200 backdrop-blur-md">
                <ShieldCheck className="h-4 w-4 text-brand-400" />
                <span>100% Background-Verified Home Service Professionals</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:leading-[1.12]">
                Expert Home Services,{' '}
                <span className="bg-gradient-to-r from-brand-300 via-indigo-300 to-emerald-300 bg-clip-text text-transparent">
                  Booked in 60 Seconds
                </span>{' '}
                with Guaranteed Quality.
              </h1>

              <p className="max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
                Connect with KYC-approved electricians, plumbers, AC technicians, deep cleaners,
                painters, carpenters, and pest control specialists. Transparent upfront pricing,
                live technician tracking, and 30-day service warranty.
              </p>

              {/* Search Discovery Bar */}
              <form
                onSubmit={handleSearch}
                className="flex flex-col gap-2.5 rounded-2xl bg-white/95 backdrop-blur-md p-2.5 shadow-2xl ring-1 ring-white/20 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 sm:border-b-0 sm:border-r">
                  <MapPin className="h-5 w-5 text-brand-600 shrink-0" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none"
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
                    className="w-full text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary px-6 py-3 text-sm shrink-0 rounded-xl shadow-md"
                >
                  Find Professionals
                </button>
              </form>

              {/* Interactive Hero Slide Category Selector Pills */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Live Service Spotlight
                  </span>
                  <span>
                    Slide {activeSlide + 1} of {HERO_SLIDES.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {HERO_SLIDES.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                        idx === activeSlide
                          ? 'bg-brand-600 text-white shadow-md scale-[1.02]'
                          : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {s.category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Upfront Standardized Pricing
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Zero Double-Booking Lock
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Razorpay Webhook Verified
                </span>
              </div>
            </div>

            {/* Right Column: Animated HD Visual Slider Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-white/15 bg-slate-900/85 p-3.5 shadow-2xl backdrop-blur-xl">
                {/* HD Image Frame with Ken Burns & Floating Overlays */}
                <div className="relative h-72 sm:h-80 w-full overflow-hidden rounded-2xl bg-slate-950">
                  {HERO_SLIDES.map((slide, idx) => (
                    <img
                      key={slide.id}
                      src={slide.imageUrl}
                      alt={slide.title}
                      className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
                        idx === activeSlide
                          ? 'opacity-100 scale-100 animate-ken-burns'
                          : 'opacity-0 scale-105 pointer-events-none'
                      }`}
                    />
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />

                  {/* Top Floating Badges */}
                  <div className="absolute left-3.5 right-3.5 top-3.5 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${currentHero.accentColor} px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-lg`}
                    >
                      <Zap className="h-3 w-3" /> {currentHero.badge}
                    </span>
                    <span className="rounded-full bg-slate-950/85 border border-white/15 px-2.5 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-md">
                      {currentHero.rating}
                    </span>
                  </div>

                  {/* Floating Verified Technician Chip */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between rounded-xl border border-white/15 bg-slate-950/80 px-3.5 py-2.5 backdrop-blur-md">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 shrink-0">
                        <UserCheck className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-extrabold text-white truncate">
                          {currentHero.technicianTag}
                        </p>
                        <p className="text-[10px] text-emerald-300 truncate">
                          ✓ {currentHero.warranty} • {currentHero.duration}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <span className="text-[10px] text-slate-400 block">Starts at</span>
                      <span className="text-base font-extrabold text-white">
                        {formatCurrency(currentHero.price)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Animated Slide Caption & Controls */}
                <div key={currentHero.id} className="mt-4 px-2 pb-1 space-y-3 animate-fade-slide-up">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-400">
                      {currentHero.category}
                    </span>
                    <h3 className="mt-0.5 text-lg font-extrabold text-white leading-snug">
                      {currentHero.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {currentHero.subtitle}
                    </p>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      key={`${activeSlide}-${isPaused}`}
                      className={`h-full rounded-full bg-gradient-to-r from-brand-400 to-emerald-400 ${
                        isPaused ? 'w-1/2' : 'animate-slide-progress'
                      }`}
                    />
                  </div>

                  {/* Bottom Action & Slider Navigation Controls */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSlide(
                            (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700 transition"
                        aria-label="Previous Slide"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPaused(!isPaused)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700 transition"
                        aria-label={isPaused ? 'Play Slider' : 'Pause Slider'}
                      >
                        {isPaused ? (
                          <Play className="h-3.5 w-3.5" />
                        ) : (
                          <Pause className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700 transition"
                        aria-label="Next Slide"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/services/${currentHero.serviceId}`}
                        className="rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition whitespace-nowrap"
                      >
                        View Details
                      </Link>
                      <Link
                        to={`/book/${currentHero.serviceId}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:bg-brand-500 transition whitespace-nowrap"
                      >
                        <span>Book Instant Slot</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SLIDER 2: INTERACTIVE TRANSFORMATION & SEASONAL OFFERS CAROUSEL
      ==================================================================== */}
      <section className="bg-slate-900 border-b border-slate-800 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-400">
                <Award className="h-4 w-4" /> Interactive Transformation & Offer Spotlight
              </span>
              <h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">
                High-Impact Home Upgrades with Instant Coupon Savings
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {TRANSFORMATION_SLIDES.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSpotlight(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === activeSpotlight
                      ? 'w-8 bg-brand-400'
                      : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Spotlight slide ${idx + 1}`}
                />
              ))}
              <button
                type="button"
                onClick={() =>
                  setActiveSpotlight(
                    (prev) => (prev - 1 + TRANSFORMATION_SLIDES.length) % TRANSFORMATION_SLIDES.length
                  )
                }
                className="ml-2 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveSpotlight((prev) => (prev + 1) % TRANSFORMATION_SLIDES.length)
                }
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            key={currentSpot.id}
            className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-2xl animate-fade-slide-up"
          >
            <div className="lg:col-span-5 relative h-64 lg:h-auto overflow-hidden">
              <img
                src={currentSpot.imageUrl}
                alt={currentSpot.title}
                className="h-full w-full object-cover animate-ken-burns"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-950/90" />
              <span className="absolute left-4 top-4 rounded-xl bg-amber-500 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-950 shadow-md">
                {currentSpot.tag}
              </span>
            </div>

            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 text-xs font-bold text-emerald-300">
                    {currentSpot.discountLabel}
                  </span>
                  <span className="text-xs text-slate-400">
                    Use Promo Code:{' '}
                    <code className="rounded bg-slate-800 px-2 py-0.5 font-mono font-bold text-amber-300">
                      {currentSpot.couponCode}
                    </code>
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  {currentSpot.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {currentSpot.beforeAfterText}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  {currentSpot.metrics.map((m) => (
                    <div
                      key={m}
                      className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-slate-200 flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-4">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xs text-slate-400">Package Offer:</span>
                  <span className="text-2xl font-extrabold text-white">
                    {formatCurrency(currentSpot.price)}
                  </span>
                  <span className="text-sm text-slate-500 line-through">
                    {formatCurrency(currentSpot.originalPrice)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/book/${currentSpot.serviceId}`}
                    className="btn-primary px-5 py-2.5 text-xs font-extrabold rounded-xl"
                  >
                    Book This Upgrade Now →
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
                      Lead Partner: {prov.ownerName} • {prov.experienceYears}+ Years Experience •{' '}
                      {prov.completedJobs} Completed Jobs
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-center">
                    <span className="text-sm font-extrabold text-amber-700">
                      {prov.averageRating} ★
                    </span>
                    <span className="block text-[10px] text-amber-600">
                      {prov.totalReviews} Reviews
                    </span>
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
                Each dashboard requires role-specific authentication. Use the visible credentials
                below to test every workflow.
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
              Every review on HomeServe Technologies is cryptographically tied to a completed
              booking invoice.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {data.reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl border border-slate-800 bg-slate-800/80 p-6"
              >
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
                <p className="mt-4 text-sm text-slate-300 italic leading-relaxed">
                  "{rev.comment}"
                </p>
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
