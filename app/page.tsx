'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'standard' | 'premium'>('standard');

  useEffect(() => {
    document.title = 'ScanToPrint • Instant Zero-Touch Printing';
  }, []);

  const scrollToPlans = (e: React.MouseEvent) => {
    e.preventDefault();
    const plansElem = document.getElementById('plans');
    if (plansElem) {
      plansElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-indigo-500 selection:text-white scroll-smooth">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070b14]/80 border-b border-slate-800/80 px-6 sm:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/icon.svg"
            alt="ScanToPrint Logo"
            className="h-9 w-9 rounded-xl object-contain shadow-lg shadow-indigo-600/30"
          />
          <span className="font-extrabold text-base tracking-tight text-white">
            ScanToPrint<span className="text-indigo-400">.in</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
          <a href="#workflow" className="hover:text-white transition-colors">How It Works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#plans" className="hover:text-white transition-colors">Plans</a>
          <a href="#partner" className="hover:text-indigo-400 text-indigo-300 font-semibold transition-colors">Partner Program</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          <a href="#faq" className="hover:text-white transition-colors">Help & Support</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/partner/login"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-400 hover:text-white border border-indigo-500/30 transition-all flex items-center gap-1.5"
          >
            <span>🤝</span>
            <span className="hidden sm:inline">Partner</span> Login
          </Link>
          <Link
            href="/login"
            className="text-xs font-bold px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/25"
          >
            Shop Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center space-y-6">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
          <span className="text-white block">
            Automated Document Printing
          </span>
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            via Dynamic QR Codes
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Empower photocopy and print shop owners with zero-touch order processing. Instant UPI payments, and local desktop print auto-sync on scantoprint.in.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={scrollToPlans}
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-extrabold text-sm text-white shadow-xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>Automate Your Business</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <a
            href="#workflow"
            className="px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 font-bold text-sm text-slate-300 transition-all"
          >
            See Workflow ↓
          </a>
        </div>
      </section>

      {/* 1. End-to-End Workflow */}
      <section id="workflow" className="max-w-6xl mx-auto px-6 py-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">End-to-End Workflow</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            How customers seamlessly print documents without manual staff handling.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-[#0e1626]/80 border border-slate-800/90 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-950/70 border border-indigo-700/40 flex items-center justify-center text-lg">
              📱
            </div>
            <h3 className="text-sm font-bold text-white">QR Code Scan</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Customers scan the unique dynamic QR code placed outside or inside the registered photocopy shop.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e1626]/80 border border-slate-800/90 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-950/70 border border-indigo-700/40 flex items-center justify-center text-lg">
              ⚙️
            </div>
            <h3 className="text-sm font-bold text-white">Upload & Configure</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Opens shop web portal. User uploads PDF/Image, selects A4/color/copies options, and sees instant pricing.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e1626]/80 border border-slate-800/90 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-950/70 border border-indigo-700/40 flex items-center justify-center text-lg">
              💳
            </div>
            <h3 className="text-sm font-bold text-white">Instant UPI Payment</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Customer completes payment via UPI app. System instantly validates and queues the transaction.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e1626]/80 border border-slate-800/90 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-950/70 border border-indigo-700/40 flex items-center justify-center text-lg">
              🖨️
            </div>
            <h3 className="text-sm font-bold text-white">Auto-Trigger Print</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Local desktop agent pulls file from cloud storage and pushes it silently to the connected printer.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Smart Cloud Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Smart Cloud Features & Automation</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Built for super admins and individual shop management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0e1626]/80 border border-slate-800/90 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg">
              📊
            </div>
            <h3 className="text-sm font-bold text-white">Super Admin Dashboard</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track SaaS subscription metrics, monitor online fleet nodes, and manage merchant registrations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e1626]/80 border border-slate-800/90 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg">
              🏪
            </div>
            <h3 className="text-sm font-bold text-white">Individual Shop Portals</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Merchant dashboard featuring live telemetry, remaining page quota counters, pricing controls, and downloadable standees.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e1626]/80 border border-slate-800/90 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg">
              ⚡
            </div>
            <h3 className="text-sm font-bold text-white">Direct UPI Routing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every shop configures its own UPI ID so customer payments route safely and instantly to the respective business owner.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Transparent Pricing */}
      <section id="plans" className="max-w-6xl mx-auto px-6 py-20 space-y-10 scroll-mt-16">
        <div className="text-center space-y-3">
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Simple Plans for Every Print Shop
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Choose the plan that fits your counter volume. Start risk-free with our 7-day full access trial.
          </p>

          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs font-semibold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 rounded-full bg-slate-800 p-1 border border-slate-700 flex items-center transition-all cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded-full bg-indigo-500 shadow-md transform transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-400'}`}>
              <span>Yearly</span>
              <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                SAVE BIG
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Card 1 */}
          <div
            onClick={() => setSelectedPlan('trial')}
            className={`rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-xl ${
              selectedPlan === 'trial'
                ? 'bg-[#0f172a] border-2 border-indigo-500 shadow-2xl shadow-indigo-600/20 scale-[1.03]'
                : 'bg-[#0b1021] border border-slate-800 hover:border-slate-700 opacity-90'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  Risk-Free Test
                </span>
                {selectedPlan === 'trial' && (
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                    Selected
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">7-Day Free Trial</h3>
                <p className="text-xs text-slate-400 mt-1">Full access to experience automated counter printing.</p>
              </div>
              <div className="pt-2">
                <span className="text-3xl font-black text-white">₹0</span>
                <span className="text-xs text-slate-400"> / 7 days</span>
              </div>
              <ul className="space-y-2.5 pt-4 text-xs text-slate-300 border-t border-slate-800/80">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span><strong>Unlimited</strong> print access for 7 days</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Windows Desktop Spooler included</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Live Store Standee & QR Generator</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Direct UPI routing to your account</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                href={`/register?plan=trial&cycle=${billingCycle}`}
                className={`w-full py-3 block text-center rounded-xl font-bold text-xs transition-all ${
                  selectedPlan === 'trial'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                Start 7-Day Free Trial
              </Link>
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => setSelectedPlan('standard')}
            className={`rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer relative shadow-xl ${
              selectedPlan === 'standard'
                ? 'bg-[#0f172a] border-2 border-indigo-500 shadow-2xl shadow-indigo-600/25 scale-[1.03]'
                : 'bg-[#0b1021] border border-slate-800 hover:border-slate-700 opacity-90'
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-0.5 rounded-full shadow-md">
              Most Popular
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/50">
                  Small & Medium Shops
                </span>
                {selectedPlan === 'standard' && (
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                    Selected
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Standard Plan</h3>
                <p className="text-xs text-slate-400 mt-1">Perfect for steady daily photocopy & document counters.</p>
              </div>
              <div className="pt-2">
                <span className="text-3xl font-black text-indigo-400">
                  {billingCycle === 'monthly' ? '₹149' : '₹1,499'}
                </span>
                <span className="text-xs text-slate-400">
                  {billingCycle === 'monthly' ? ' / 28 days' : ' / year'}
                </span>
              </div>
              <ul className="space-y-2.5 pt-4 text-xs text-slate-300 border-t border-slate-800/80">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span><strong>500 Pages</strong> per month quota</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Instant Top-Up (₹149 for extra 500 pgs)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Full Hardware Duplex & Shredder engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Real-time Order & Sales telemetry</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                href={`/register?plan=standard&cycle=${billingCycle}`}
                className={`w-full py-3 block text-center rounded-xl font-bold text-xs transition-all ${
                  selectedPlan === 'standard'
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                Choose Standard Plan
              </Link>
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => setSelectedPlan('premium')}
            className={`rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-xl ${
              selectedPlan === 'premium'
                ? 'bg-[#0f172a] border-2 border-amber-500 shadow-2xl shadow-amber-500/20 scale-[1.03]'
                : 'bg-[#0b1021] border border-slate-800 hover:border-slate-700 opacity-90'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-800/40">
                  Heavy Volume Counters
                </span>
                {selectedPlan === 'premium' && (
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    Selected
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Premium Plan</h3>
                <p className="text-xs text-slate-400 mt-1">Unlimited printing capacity for busy universities & cafes.</p>
              </div>
              <div className="pt-2">
                <span className="text-3xl font-black text-amber-400">
                  {billingCycle === 'monthly' ? '₹249' : '₹2,199'}
                </span>
                <span className="text-xs text-slate-400">
                  {billingCycle === 'monthly' ? ' / 28 days' : ' / year'}
                </span>
              </div>
              <ul className="space-y-2.5 pt-4 text-xs text-slate-300 border-t border-slate-800/80">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span><strong className="text-amber-300">Unlimited Pages</strong> printing</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Zero quota restrictions or page caps</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Priority spooling & queue processing</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Direct WhatsApp Priority Support</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                href={`/register?plan=premium&cycle=${billingCycle}`}
                className={`w-full py-3 block text-center rounded-xl font-bold text-xs transition-all ${
                  selectedPlan === 'premium'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                Choose Premium Plan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: PARTNER & CAMPUS AMBASSADOR SECTION */}
      <section id="partner" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-16">
        <div className="bg-gradient-to-r from-indigo-950/70 via-[#0e1628] to-[#070b18] border-2 border-indigo-500/40 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-wider">
                <span>🤝</span>
                <span>Campus & Ground Partner Program</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Earn ₹100 to ₹150 for Every Print Shop You Onboard
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                Are you a college student or local field champion? Get your custom promo code, digitize photocopy shops in your university or locality, give them an instant <strong className="text-emerald-400">20% discount</strong>, and withdraw earnings directly to your UPI ID.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-[#070b18]/80 border border-slate-800 p-3.5 rounded-2xl">
                  <div className="text-emerald-400 font-bold text-sm">1. Get Promo Code</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Instant free registration and unique 6-digit code.</p>
                </div>
                <div className="bg-[#070b18]/80 border border-slate-800 p-3.5 rounded-2xl">
                  <div className="text-indigo-400 font-bold text-sm">2. Offer 20% OFF</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Shopkeepers get ₹119/₹199 rate on first month.</p>
                </div>
                <div className="bg-[#070b18]/80 border border-slate-800 p-3.5 rounded-2xl">
                  <div className="text-amber-400 font-bold text-sm">3. Direct UPI Cash</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">₹100–₹150 credited directly to your bank account.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3 justify-center text-center">
              <Link
                href="/partner/register"
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black text-xs uppercase tracking-wider text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] text-center"
              >
                Become a Partner (Free) 🚀
              </Link>
              <Link
                href="/partner/login"
                className="w-full py-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-all text-center"
              >
                Partner Dashboard Login →
              </Link>
              <span className="text-[10px] text-slate-500">Zero investment • Real-time tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Reviews */}
      <section id="testimonials" className="max-w-6xl mx-auto px-6 py-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Customer Reviews & Testimonials</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Dynamic feedback from print shop operators utilizing zero-touch printing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#0e1626]/60 border border-slate-800 space-y-4">
            <div className="text-amber-400 text-sm">★★★★★</div>
            <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
              &ldquo;ScanToPrint eliminated the chaos of handling pendrives and manual WhatsApp transfers at our counter. The desktop agent handles everything instantly.&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">
                R
              </div>
              <div>
                <p className="text-xs font-bold text-white">Rajesh Xerox Point</p>
                <p className="text-[10px] text-slate-500">Shop Owner, Delhi</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e1626]/60 border border-slate-800 space-y-4">
            <div className="text-amber-400 text-sm">★★★★★</div>
            <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
              &ldquo;The dashboard gives us full oversight of orders and revenue streams. An incredible engineering solution for cyber cafes.&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div>
                <p className="text-xs font-bold text-white">Rohit Sharma</p>
                <p className="text-[10px] text-slate-500">Cyber Franchise Manager</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Help & Support */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-16 space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Help & Support Details</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Frequently asked questions regarding setup and system requirements.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#0e1626]/70 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white">How does the Desktop Agent work?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Shopkeepers download and run the background agent on their store PC. It connects securely to cloud storage, checks for newly paid documents, and prints them automatically.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e1626]/70 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white">How do I access my Dashboard?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click the &apos;Shop Login&apos; button in the top-right corner, enter your credentials, and you will be redirected instantly to your control panel.
            </p>
          </div>
        </div>
      </section>

      {/* Footer with Legal Link */}
      <footer className="border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500 space-y-2">
        <div>
          © 2026 ScanToPrint.in. All rights reserved. Automated Cloud Printing System.
        </div>
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <Link href="/legal" className="hover:text-indigo-400 underline underline-offset-4 transition-colors">
            Privacy Policy, Terms of Service & Refunds
          </Link>
        </div>
      </footer>
    </div>
  );
}