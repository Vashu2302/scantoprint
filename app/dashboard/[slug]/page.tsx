'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function VashuExactMerchantDashboard() {
  const params = useParams();
  const slug = params?.slug as string;

  const [shop, setShop] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'pricing' | 'standee'>('queue');
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('https://scantoprint.in');

  const [pricing, setPricing] = useState({
    bwSingle: 2,
    bwDouble: 3,
    colorSingle: 10,
    colorDouble: 18,
  });
  const [savingRates, setSavingRates] = useState(false);
  const [ratesSaved, setRatesSaved] = useState(false);

  // Renewal / Upgrade Modal State
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedRenewPlan, setSelectedRenewPlan] = useState<'standard' | 'premium'>('standard');
  const [adminUpi, setAdminUpi] = useState('9826000000@ybl');
  const [renewUtr, setRenewUtr] = useState('');
  const [submittingRenew, setSubmittingRenew] = useState(false);
  const [renewSuccessMsg, setRenewSuccessMsg] = useState('');
  const [renewErrorMsg, setRenewErrorMsg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (shop) {
      const name = shop.business_name || shop.name || 'Store';
      document.title = `${name} • Counter Dashboard | ScanToPrint`;
    }
  }, [shop]);

  // Load Admin Receiver UPI
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

  useEffect(() => {
    async function fetchShopData(isSilent = false) {
      if (!slug) return;
      if (!isSilent) setLoading(true);

      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .single();

      if (shopData) {
        setShop(shopData);
        setPricing({
          bwSingle: Number(shopData.bw_single ?? 2),
          bwDouble: Number(shopData.bw_double ?? 3),
          colorSingle: Number(shopData.color_single ?? 10),
          colorDouble: Number(shopData.color_double ?? 18),
        });

        if (shopData.plan_type === 'premium') {
          setSelectedRenewPlan('premium');
        } else {
          setSelectedRenewPlan('standard');
        }

        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('shop_id', shopData.id)
          .order('created_at', { ascending: false });

        if (orderData) setOrders(orderData);
      }
      if (!isSilent) setLoading(false);
    }

    fetchShopData(false);

    const shopChannel = supabase
      .channel(`merchant_shop_telemetry_${slug}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'shops' },
        (payload: any) => {
          if (payload.new && payload.new.slug === slug) {
            setShop(payload.new);
          }
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel(`merchant_orders_telemetry_${slug}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchShopData(true);
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      fetchShopData(true);
    }, 5000);

    return () => {
      supabase.removeChannel(shopChannel);
      supabase.removeChannel(ordersChannel);
      clearInterval(interval);
    };
  }, [slug]);

  const handleSaveRates = async () => {
    if (!shop) return;
    setSavingRates(true);
    setRatesSaved(false);

    const { error } = await supabase
      .from('shops')
      .update({
        bw_single: pricing.bwSingle,
        bw_double: pricing.bwDouble,
        color_single: pricing.colorSingle,
        color_double: pricing.colorDouble,
      })
      .eq('id', shop.id);

    setSavingRates(false);
    if (!error) {
      setRatesSaved(true);
      setTimeout(() => setRatesSaved(false), 3000);
    } else {
      alert('Error updating rates: ' + error.message);
    }
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stp_merchant_token');
      localStorage.removeItem('stp_merchant_shop');
    }
    window.location.href = '/login';
  };

  const handleMarkDone = async (orderId: string) => {
    await supabase.from('orders').update({ print_status: 'completed' }).eq('id', orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, print_status: 'completed' } : o))
    );
  };

  const handlePrintPoster = () => {
    window.print();
  };

  const handleDownloadSoftware = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'agent_download_url')
        .single();

      const targetUrl = data?.value || 'https://drive.google.com/uc?export=download&id=18JXGyDe3bhBaJKgnAlqSey-4kGmrtc_j';
      window.open(targetUrl, '_blank');
    } catch {
      window.open('https://drive.google.com/uc?export=download&id=18JXGyDe3bhBaJKgnAlqSey-4kGmrtc_j', '_blank');
    }
  };

  // Submit Renewal UTR
  const handleSubmitRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    const cleanUtr = renewUtr.trim();
    if (cleanUtr.length < 4) {
      setRenewErrorMsg('Please enter a valid 12-digit UPI Transaction / UTR number.');
      return;
    }

    setSubmittingRenew(true);
    setRenewErrorMsg('');
    setRenewSuccessMsg('');

    try {
      const res = await fetch('/api/shops/submit-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shop.id,
          utrNumber: cleanUtr,
        }),
      });

      if (!res.ok) {
        await supabase
          .from('shops')
          .update({
            payment_utr: cleanUtr,
            payment_verified: false,
            plan_type: selectedRenewPlan,
          })
          .eq('id', shop.id);
      } else {
        await supabase
          .from('shops')
          .update({
            plan_type: selectedRenewPlan,
          })
          .eq('id', shop.id);
      }

      setRenewSuccessMsg('✓ UTR submitted successfully! Admin will verify and extend your validity shortly.');
      setTimeout(() => {
        setIsRenewModalOpen(false);
        setRenewSuccessMsg('');
        setRenewUtr('');
      }, 2500);
    } catch (err: any) {
      setRenewErrorMsg(err.message || 'Failed to submit UTR. Try again.');
    } finally {
      setSubmittingRenew(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-slate-400">Loading Store Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4">
        <div className="bg-[#0e1626] border border-slate-800 p-8 rounded-2xl text-center">
          <h2 className="text-xl font-bold text-rose-400">Shop Not Found</h2>
          <p className="text-xs text-slate-400 mt-2">Identifier: {slug}</p>
        </div>
      </div>
    );
  }

  const isConnected = Boolean(
    shop.is_online &&
    shop.last_seen &&
    (Date.now() - new Date(shop.last_seen).getTime()) / 1000 < 25
  );

  const isAgentActive = isConnected && shop.agent_status === 'active' && !shop.is_paused;

  const subEnd = shop?.subscription_end ? new Date(shop.subscription_end) : new Date();
  const isExpired = subEnd.getTime() < Date.now();
  const daysRemaining = isExpired
    ? 0
    : Math.ceil((subEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const planType = (shop?.plan_type || 'trial').toUpperCase();

  // Traffic-Light Expiry Color Scheme
  const expiryColorClass = isExpired
    ? 'text-rose-400 bg-rose-500/15 border-rose-500/30 animate-pulse'
    : daysRemaining <= 3
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    : daysRemaining <= 7
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';

  const expiryDotClass = isExpired || daysRemaining <= 3
    ? 'bg-rose-500'
    : daysRemaining <= 7
    ? 'bg-amber-400'
    : 'bg-emerald-400';

  // Dynamic Button Title based on Plan Type
  const renewBtnLabel = planType === 'TRIAL'
    ? 'Upgrade to Pro Tier 🚀'
    : planType === 'STANDARD'
    ? 'Top-Up Quota / Renew ⚡'
    : 'Renew Subscription 🔄';

  const totalPageLimit = Number(shop?.page_limit || 500);
  const printedPagesCount = Number(shop?.monthly_pages_printed || 0);
  const pagesRemaining = Math.max(0, totalPageLimit - printedPagesCount);

  const shopTitle = shop.business_name || shop.name || 'Store';
  const shopInitial = shopTitle.trim().charAt(0).toUpperCase() || 'S';

  const uploadPageUrl = `${baseUrl}/shop/${shop.slug}`;
  const displayPrintLink = `scantoprint.in/shop/${shop.slug}`;
  const qrImageSource = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(uploadPageUrl)}`;

  const todayRevenue = orders
    .filter((o) => o.payment_status === 'paid' || o.payment_status === 'completed')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const waitingInQueue = orders.filter(
    (o) => o.print_status !== 'completed' && o.print_status !== 'printed'
  ).length;

  // Renew Modal Amount Calculation
  const renewAmount = selectedRenewPlan === 'premium' ? 249 : 149;
  const renewDeepLink = `upi://pay?pa=${adminUpi}&pn=ScanToPrint%20Platform&am=${renewAmount}&cu=INR&tn=STP%20${selectedRenewPlan.toUpperCase()}%20Renew`;
  const renewQrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(renewDeepLink)}`;

  return (
    <div className="min-h-screen bg-[#060813] text-slate-200 font-sans selection:bg-indigo-600 selection:text-white pb-12">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header,
          nav,
          .no-print,
          button {
            display: none !important;
          }
          #printable-standee-container {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            min-height: 90vh !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
          #printable-standee {
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            transform: scale(1.05);
          }
        }
      `}</style>

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#090d1c]/90 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 no-print sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-600/30">
            {shopInitial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-white leading-tight">{shopTitle}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                planType === 'PREMIUM'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : planType === 'STANDARD'
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {planType}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Counter Link: <a href={uploadPageUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 font-mono underline">{displayPrintLink}</a>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Traffic Light Day Counter Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm font-mono ${expiryColorClass}`}>
            <span className={`w-2 h-2 rounded-full ${expiryDotClass}`}></span>
            {isExpired ? 'EXPIRED' : `${daysRemaining} DAYS LEFT`}
          </span>

          {/* Direct Renewal / Top-Up Action Button in Navbar */}
          <button
            onClick={() => setIsRenewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <span>⚡</span>
            <span>{renewBtnLabel}</span>
          </button>

          <button
            onClick={handleDownloadSoftware}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/40 shadow-sm transition-all cursor-pointer"
          >
            <span>⬇</span>
            <span>Download PC Package (.zip)</span>
          </button>

          {!isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              OFFLINE
            </span>
          ) : !isAgentActive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              CONNECTED BUT INACTIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ACTIVE
            </span>
          )}

          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Live Queue
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'pricing'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Pricing Rates
          </button>
          <button
            onClick={() => setActiveTab('standee')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'standee'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Store Standee
          </button>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all ml-1 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {isExpired && (
        <div className="bg-rose-950/80 border-b border-rose-500/40 px-6 py-3 text-center text-xs text-rose-200 flex flex-wrap items-center justify-center gap-3 no-print">
          <span>⚠️</span>
          <span>
            <strong>Your counter subscription has expired.</strong> Renew now to resume instant customer printing.
          </span>
          <button
            onClick={() => setIsRenewModalOpen(true)}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-all cursor-pointer"
          >
            Renew Now ➔
          </button>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
          <div className="bg-[#0b1021] border border-slate-800/90 rounded-xl p-4">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Today&apos;s Revenue</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">₹{todayRevenue.toFixed(2)}</div>
          </div>

          <div className="bg-[#0b1021] border border-slate-800/90 rounded-xl p-4">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Total Jobs</span>
            <div className="text-xl font-bold font-mono text-white mt-1">{orders.length}</div>
          </div>

          <div className="bg-[#0b1021] border border-slate-800/90 rounded-xl p-4">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Waiting in Queue</span>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">{waitingInQueue}</div>
          </div>

          <div className="bg-[#0b1021] border border-slate-800/90 rounded-xl p-4">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">UPI Receiver</span>
            <div className="text-xs font-mono text-indigo-300 truncate mt-2 font-medium" title={shop.upi_id}>
              {shop.upi_id || 'Not Configured'}
            </div>
          </div>
        </div>

        {/* Subscription Banner with Inline Renewal Controls */}
        <div className="bg-gradient-to-r from-[#0b1021] via-[#0e1628] to-[#070b18] border border-indigo-500/30 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl text-indigo-400">
              💳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Subscription:
                </span>
                <span className={`text-xs font-mono font-black uppercase ${
                  planType === 'PREMIUM' ? 'text-amber-400' : 'text-indigo-400'
                }`}>
                  {planType} TIER
                </span>
              </div>
              
              <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>Valid until: <strong className="text-slate-200">{subEnd.toLocaleDateString()}</strong></span>
                <span>•</span>
                {planType === 'PREMIUM' ? (
                  <span className="font-bold text-amber-400 font-mono flex items-center gap-1">
                    <span>✨</span>
                    <span>Unlimited Pages Included</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>{totalPageLimit} Pages per Month</span>
                    <span className="text-slate-600 font-mono">—</span>
                    <span className="font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {pagesRemaining} Pages Left This Month
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Time Left</span>
              <span className={`text-base font-black font-mono block ${
                isExpired || daysRemaining <= 3 ? 'text-rose-400' : daysRemaining <= 7 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {isExpired ? '0 Days (Expired)' : `${daysRemaining} Days Remaining`}
              </span>
            </div>

            <button
              onClick={() => setIsRenewModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              {renewBtnLabel}
            </button>
          </div>
        </div>

        {/* Spooler Agent Key Box */}
        <div className="bg-[#0b1021] border border-slate-800/90 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">⚡ Desktop Spooler Agent Key:</span>
            <span className="font-mono text-white bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800 select-all">
              {shop.api_key}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Paste this key once in your desktop spooler software.</span>
        </div>

        {/* TAB 1: LIVE QUEUE */}
        {activeTab === 'queue' && (
          <div className="bg-[#0b1021] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl no-print">
            <div className="px-5 py-3.5 border-b border-slate-800/80">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Incoming Spooler Stream</span>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No orders in queue yet. New prints will automatically appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-[#070b18]/60">
                      <th className="p-3.5">File</th>
                      <th className="p-3.5">Settings</th>
                      <th className="p-3.5">Copies</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-3.5 font-medium text-white max-w-[220px] truncate" title={o.file_name}>
                          {o.file_name}
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono">
                          {o.print_type === 'color' ? 'Color' : 'BW'} - single
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">{o.copies || 1}</td>
                        <td className="p-3.5 font-mono text-emerald-400 font-bold">₹{o.amount}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              o.print_status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {o.print_status || 'in_queue'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {o.print_status !== 'completed' ? (
                            <button
                              onClick={() => handleMarkDone(o.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition-all cursor-pointer"
                            >
                              Mark Done
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500">Done</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRICING */}
        {activeTab === 'pricing' && (
          <div className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-6 max-w-xl mx-auto shadow-xl space-y-4 no-print">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Counter Print Charges</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">These rates apply directly to customers uploading at your counter.</p>
            </div>

            {ratesSaved && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">
                Rates updated and synced to database!
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">B&W Single-Sided (₹)</label>
                <input
                  type="number"
                  value={pricing.bwSingle}
                  onChange={(e) => setPricing({ ...pricing, bwSingle: Number(e.target.value) })}
                  className="w-full bg-[#070b18] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">B&W Double-Sided (₹)</label>
                <input
                  type="number"
                  value={pricing.bwDouble}
                  onChange={(e) => setPricing({ ...pricing, bwDouble: Number(e.target.value) })}
                  className="w-full bg-[#070b18] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Color Single-Sided (₹)</label>
                <input
                  type="number"
                  value={pricing.colorSingle}
                  onChange={(e) => setPricing({ ...pricing, colorSingle: Number(e.target.value) })}
                  className="w-full bg-[#070b18] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Color Double-Sided (₹)</label>
                <input
                  type="number"
                  value={pricing.colorDouble}
                  onChange={(e) => setPricing({ ...pricing, colorDouble: Number(e.target.value) })}
                  className="w-full bg-[#070b18] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleSaveRates}
              disabled={savingRates}
              className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
            >
              {savingRates ? 'Saving...' : 'Save New Rates'}
            </button>
          </div>
        )}

        {/* TAB 3: STORE STANDEE */}
        {activeTab === 'standee' && (
          <div className="flex flex-col items-center justify-center pt-2 space-y-4">
            <div id="printable-standee-container" className="w-full flex justify-center">
              <div
                id="printable-standee"
                style={{
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
                className="w-full max-w-[340px] rounded-[32px] overflow-hidden bg-gradient-to-b from-[#5c4efc] via-[#473beb] to-[#070b18] border border-indigo-500/30 p-1 shadow-2xl shadow-indigo-950/70 text-center"
              >
                <div className="pt-6 pb-4 px-4 space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-white text-xs tracking-wider border border-white/20">
                    {shopInitial}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-indigo-200/90 font-bold">
                    SCANTOPRINT PARTNER STORE
                  </div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">{shopTitle}</h3>
                  <p className="text-[10px] text-indigo-200/80">Direct Wireless Print Counter</p>
                </div>

                <div className="bg-white rounded-[24px] mx-3 p-5 shadow-inner space-y-3">
                  <div className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
                    📱 SCAN ME TO PRINT
                  </div>

                  <div className="flex justify-center p-1">
                    <img
                      src={qrImageSource}
                      alt="Scan To Print QR Code"
                      className="w-56 h-56 object-contain rounded-xl"
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 font-medium">
                    Scan with Camera or Any UPI App
                  </p>
                </div>

                <div className="py-4 px-3 space-y-1">
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                    POWERED & SECURED BY
                  </div>
                  <div className="flex items-center justify-center gap-1.5 pt-0.5">
                    <img
                      src="/icon.svg"
                      alt="ScanToPrint Logo"
                      className="w-4 h-4 rounded object-contain"
                    />
                    <span className="text-sm font-bold text-white tracking-wider">scantoprint.in</span>
                  </div>
                  <div className="text-[10px] font-mono text-indigo-300/80">{displayPrintLink}</div>
                </div>
              </div>
            </div>

            <button
              onClick={handlePrintPoster}
              className="no-print px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <span>🖨️</span>
              <span>PRINT STANDEE POSTER (CTRL + P)</span>
            </button>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* RENEWAL / TOP-UP / UPGRADE IN-PAGE CHECKOUT MODAL                          */}
      {/* ========================================================================= */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-[#0b1021] border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-150">
            
            <button
              onClick={() => {
                setIsRenewModalOpen(false);
                setRenewErrorMsg('');
                setRenewSuccessMsg('');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Subscription & Quota Manager
              </span>
              <h2 className="text-xl font-black text-white pt-1">
                Renew or Upgrade Counter Tier
              </h2>
              <p className="text-xs text-slate-400">
                Select your preferred tier, scan and pay via UPI, and submit the UTR.
              </p>
            </div>

            {/* Plan Switcher Pills */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div
                onClick={() => setSelectedRenewPlan('standard')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-center space-y-1 ${
                  selectedRenewPlan === 'standard'
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-[#070b18] border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  Standard Plan
                </span>
                <div className="text-lg font-black font-mono text-white">₹149 <span className="text-xs text-slate-400 font-normal">/ 28d</span></div>
                <p className="text-[10px] text-slate-400">500 Pages Quota</p>
              </div>

              <div
                onClick={() => setSelectedRenewPlan('premium')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-center space-y-1 ${
                  selectedRenewPlan === 'premium'
                    ? 'bg-amber-950/60 border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-[#070b18] border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Premium Plan
                </span>
                <div className="text-lg font-black font-mono text-white">₹249 <span className="text-xs text-slate-400 font-normal">/ 28d</span></div>
                <p className="text-[10px] text-amber-300 font-bold">Unlimited Pages</p>
              </div>
            </div>

            {/* UPI QR & Intent Payment Card */}
            <div className="bg-[#070b18] border border-slate-800 rounded-2xl p-4 text-center space-y-3">
              <div className="bg-white p-2 rounded-2xl inline-block mx-auto shadow-md">
                <img
                  src={renewQrSrc}
                  alt="Admin Renewal QR"
                  className="w-36 h-36 mx-auto object-contain"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono text-slate-300 block">
                  Pay to Admin UPI: <b className="text-emerald-400">{adminUpi}</b>
                </span>
                <span className="text-base font-black font-mono text-white block">
                  Amount: ₹{renewAmount}
                </span>
              </div>

              <div>
                <a
                  href={renewDeepLink}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🚀</span>
                  <span>Pay ₹{renewAmount} via PhonePe / GPay / Paytm</span>
                </a>
              </div>
            </div>

            {renewErrorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {renewErrorMsg}
              </div>
            )}

            {renewSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs">
                {renewSuccessMsg}
              </div>
            )}

            {/* UTR Form */}
            <form onSubmit={handleSubmitRenewal} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  12-Digit UPI Transaction / UTR Number
                </label>
                <input
                  required
                  type="text"
                  maxLength={16}
                  placeholder="Enter 12-digit UPI Ref No."
                  value={renewUtr}
                  onChange={(e) => setRenewUtr(e.target.value)}
                  className="w-full bg-[#070b18] border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-mono focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={submittingRenew || renewUtr.trim().length < 4}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-2"
              >
                {submittingRenew ? 'Submitting & Verifying...' : 'Confirm & I Have Paid ➔'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}