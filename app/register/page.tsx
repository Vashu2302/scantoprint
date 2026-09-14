'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function RegisterMerchantForm() {
  const searchParams = useSearchParams();
  const planParam = (searchParams.get('plan') || 'trial').toLowerCase();
  const cycleParam = (searchParams.get('cycle') || 'monthly').toLowerCase();

  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [registeredShop, setRegisteredShop] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [adminUpi, setAdminUpi] = useState<string>('9826000000@ybl');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [submittingUtr, setSubmittingUtr] = useState<boolean>(false);

  const [form, setForm] = useState({
    ownerName: '',
    businessName: '',
    mobile: '',
    upiId: '',
    email: '',
    password: ''
  });

  // Dynamic Browser Tab Title
  useEffect(() => {
    document.title = 'Create Merchant Account • ScanToPrint';
  }, []);

  useEffect(() => {
    async function loadAdminUpi() {
      try {
        const { data } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'admin_upi_id')
          .single();

        if (data?.value) {
          setAdminUpi(data.value);
        }
      } catch (e) {
        // Fallback default
      }
    }
    loadAdminUpi();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isPremium = planParam === 'premium';
  const isStandard = planParam === 'standard';
  const isTrial = !isPremium && !isStandard;

  const planName = isPremium
    ? 'Premium Plan'
    : isStandard
    ? 'Standard Plan'
    : '7-Day Free Trial';

  const planNumericAmount = isPremium
    ? cycleParam === 'yearly' ? 2199 : 249
    : isStandard
    ? cycleParam === 'yearly' ? 1499 : 149
    : 0;

  const planCost = isPremium
    ? cycleParam === 'yearly' ? '₹2,199 / yr' : '₹249 / mo'
    : isStandard
    ? cycleParam === 'yearly' ? '₹1,499 / yr' : '₹149 / mo'
    : '₹0 (100% Free)';

  const planQuota = isPremium
    ? 'Unlimited Pages & Priority Spool'
    : isStandard
    ? '500 Pages Quota + Top-Up Support'
    : 'Full Unrestricted Access for 7 Days';

  const upiDeepLink = `upi://pay?pa=${adminUpi}&pn=ScanToPrint%20Platform&am=${planNumericAmount}&cu=INR&tn=STP%20${planParam.toUpperCase()}%20Plan`;
  const upiQrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiDeepLink)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/shops/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          planType: planParam,
          billingCycle: cycleParam
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed. Please check details.');
      }

      const shop = data.shop;
      setRegisteredShop(shop);

      if (typeof window !== 'undefined') {
        localStorage.setItem('stp_merchant_token', shop.api_key);
        localStorage.setItem('stp_merchant_shop', JSON.stringify(shop));
      }

      if (isTrial || planNumericAmount === 0) {
        window.location.replace(`/dashboard/${shop.slug}`);
      } else {
        setStep('payment');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  // 2. Submit UTR via Secure Server API and Land on Dashboard
  const handleUtrSubmitAndRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeredShop || !utrNumber.trim()) return;

    setSubmittingUtr(true);
    try {
      await fetch('/api/shops/submit-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: registeredShop.id,
          utrNumber: utrNumber.trim(),
        }),
      });

      // Redirect immediately to dashboard
      window.location.replace(`/dashboard/${registeredShop.slug}`);
    } catch (err) {
      // Fallback redirect so user is never blocked
      window.location.replace(`/dashboard/${registeredShop.slug}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#060813] text-slate-100 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0b1021] to-[#070b18] border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl"></div>

          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors">
              <span>←</span>
              <span>Back to Plans</span>
            </Link>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                <span>Checkout Tier</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">{planName}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your physical counter to cloud spooling. Start zero-touch printing in less than 2 minutes.
              </p>
            </div>

            <div className="bg-[#0e1628]/90 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-slate-400">Total Billed:</span>
                <span className="text-lg font-black text-emerald-400 font-mono">{planCost}</span>
              </div>
              <div className="text-[11px] text-indigo-300 font-mono bg-indigo-950/40 p-2 rounded-xl border border-indigo-500/20 flex items-center gap-2">
                <span>⚡</span>
                <span>{planQuota}</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                What you get immediately:
              </span>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 text-sm">✓</span>
                  <span>Instant Dashboard & Counter Spooler Access</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 text-sm">✓</span>
                  <span>Direct QR Code Standee generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 text-sm">✓</span>
                  <span>Instant UPI routing directly to your bank</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 text-sm">✓</span>
                  <span>Windows Desktop Spooler with auto-duplex</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-2">
            <span>🔒</span>
            <span>256-Bit Encrypted merchant setup. Direct Platform UPI.</span>
          </div>
        </div>

        <div className="lg:col-span-7 bg-[#0b1021]/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {step === 'payment' && registeredShop ? (
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Step 2 of 2 • Activate Subscription
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight pt-1">
                  Pay to ScanToPrint Admin
                </h2>
                <p className="text-xs text-slate-400">
                  Scan and pay <b className="text-emerald-400">₹{planNumericAmount}</b> via any UPI app. Enter UTR to unlock your dashboard instantly.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-4 shadow-xl text-slate-900 space-y-2 inline-block mx-auto">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  Scan to Pay Admin (₹{planNumericAmount})
                </span>
                <img
                  src={upiQrImageSrc}
                  alt="Admin Platform UPI QR"
                  className="w-48 h-48 mx-auto object-contain"
                />
                <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[200px] mx-auto">
                  UPI: {adminUpi}
                </span>
              </div>

              <div>
                <a
                  href={upiDeepLink}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🚀</span>
                  <span>Pay via PhonePe / GPay / Paytm (₹{planNumericAmount})</span>
                </a>
              </div>

              <form onSubmit={handleUtrSubmitAndRedirect} className="space-y-3 pt-2 text-left">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    12-Digit UPI Ref / UTR Number <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={16}
                    placeholder="Enter 12-digit UPI Ref / UTR No."
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full bg-[#070b18] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-3 text-xs text-emerald-400 font-mono placeholder-slate-600 focus:outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-500">
                    Check your payment app receipt for the 12-digit UPI Transaction ID.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submittingUtr || utrNumber.trim().length < 6}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  {submittingUtr ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Opening Your Dashboard...</span>
                    </>
                  ) : (
                    <span>Submit UTR & Open Dashboard ➔</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Create Merchant Account</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Fill in your business details to setup your counter spooler.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Owner Name <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      required
                      name="ownerName"
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={form.ownerName}
                      onChange={handleChange}
                      className="w-full bg-[#070b18] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Shop / Business Name <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      required
                      name="businessName"
                      type="text"
                      placeholder="e.g. Balaji Xerox & Prints"
                      value={form.businessName}
                      onChange={handleChange}
                      className="w-full bg-[#070b18] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Mobile Number (Login ID) <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      required
                      name="mobile"
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={form.mobile}
                      onChange={handleChange}
                      className="w-full bg-[#070b18] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      UPI ID (Customer Payments) <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      required
                      name="upiId"
                      type="text"
                      placeholder="e.g. 9826xxxxxx@ybl"
                      value={form.upiId}
                      onChange={handleChange}
                      className="w-full bg-[#070b18] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 placeholder-slate-500 focus:outline-none font-mono transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Email Address
                    </label>
                    <input
                      required
                      name="email"
                      type="email"
                      placeholder="you@yourshop.com"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full bg-[#070b18] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Create Password <span className="text-indigo-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        required
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        minLength={6}
                        placeholder="Min 6 characters"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full bg-[#070b18] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none font-mono transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer select-none"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-indigo-900 disabled:to-indigo-900 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing Registration...</span>
                      </>
                    ) : (
                      <span>Proceed to Activate {planName} ➔</span>
                    )}
                  </button>
                </div>

                <p className="text-center text-[11px] text-slate-500 pt-2">
                  Already registered?{' '}
                  <Link href="/login" className="text-indigo-400 hover:underline font-semibold">
                    Sign in to dashboard
                  </Link>
                </p>
              </form>
            </>
          )}

        </div>

      </div>
    </main>
  );
}

export default function RegisterMerchantPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <RegisterMerchantForm />
    </Suspense>
  );
}