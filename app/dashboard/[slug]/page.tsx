'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TourAnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function VashuExactMerchantDashboard() {
  const params = useParams();
  const slug = params?.slug as string;

  const [shop, setShop] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'pricing' | 'standee'>('queue');
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('https://scantoprint.in');

  // Interactive In-Place Spotlight Tour
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState<number>(1);
  const [anchorRect, setAnchorRect] = useState<TourAnchorRect | null>(null);

  const [pricing, setPricing] = useState({
    bwSingle: 2,
    bwDouble: 3,
    colorSingle: 10,
    colorDouble: 18,
  });
  const [savingRates, setSavingRates] = useState(false);
  const [ratesSaved, setRatesSaved] = useState(false);

  // Renewal / Top-Up Modal State
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'topup' | 'plan'>('topup');
  const [selectedTopup, setSelectedTopup] = useState<{ pages: number; price: number }>({ pages: 100, price: 50 });
  const [selectedPlanTier, setSelectedPlanTier] = useState<'standard' | 'premium'>('standard');

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

      const tourFinished = localStorage.getItem(`stp_tour_done_${slug}`);
      if (!tourFinished) {
        setTourActive(true);
        setTourStep(1);
      }
    }
  }, [shop, slug]);

  // Position calculation for floating popups attached to target elements
  const updateTargetAnchor = (elementId: string) => {
    if (typeof window === 'undefined') return;
    const elem = document.getElementById(elementId);
    if (elem) {
      const rect = elem.getBoundingClientRect();
      setAnchorRect({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    }
  };

  useEffect(() => {
    if (!tourActive) {
      setAnchorRect(null);
      return;
    }

    const timer = setTimeout(() => {
      if (tourStep === 1) updateTargetAnchor('tour-standee-tab');
      if (tourStep === 2) updateTargetAnchor('tour-agent-key-box');
      if (tourStep === 3) updateTargetAnchor('tour-pricing-tab');
      if (tourStep === 4) updateTargetAnchor('tour-subscription-box');
    }, 150);

    const handleResize = () => {
      if (tourStep === 1) updateTargetAnchor('tour-standee-tab');
      if (tourStep === 2) updateTargetAnchor('tour-agent-key-box');
      if (tourStep === 3) updateTargetAnchor('tour-pricing-tab');
      if (tourStep === 4) updateTargetAnchor('tour-subscription-box');
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [tourActive, tourStep, activeTab]);

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
      } catch (e) {}
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
          setSelectedPlanTier('premium');
        } else {
          setSelectedPlanTier('standard');
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

  const handleSubmitPayment = async (e: React.FormEvent) => {
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
      const actionType = modalMode === 'topup' ? 'quota_topup' : 'plan_renew';
      const metaPages = modalMode === 'topup' ? selectedTopup.pages : (selectedPlanTier === 'premium' ? 999999 : 500);
      const metaPlan = modalMode === 'plan' ? selectedPlanTier : (shop.plan_type || 'standard');

      const { error } = await supabase
        .from('shops')
        .update({
          payment_utr: cleanUtr,
          payment_verified: false,
          pending_action_type: actionType,
          pending_action_pages: metaPages,
          pending_action_plan: metaPlan,
          pending_action_amount: payableAmount,
        })
        .eq('id', shop.id);

      if (error) throw error;

      setRenewSuccessMsg(
        modalMode === 'topup'
          ? `✓ UTR submitted for +${selectedTopup.pages} Pages Top-Up! Admin approval will add quota without altering days.`
          : `✓ UTR submitted for Plan Renewal! Admin approval will add +28 days without wasting remaining days.`
      );

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

  const handleFinishTour = () => {
    setTourActive(false);
    localStorage.setItem(`stp_tour_done_${slug}`, 'true');
    setActiveTab('queue');
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

  const payableAmount = modalMode === 'topup'
    ? selectedTopup.price
    : selectedPlanTier === 'premium' ? 249 : 149;

  const paymentNote = modalMode === 'topup'
    ? `STP TopUp ${selectedTopup.pages} Pages`
    : `STP ${selectedPlanTier.toUpperCase()} Plan`;

  const renewDeepLink = `upi://pay?pa=${adminUpi}&pn=ScanToPrint%20Platform&am=${payableAmount}&cu=INR&tn=${encodeURIComponent(paymentNote)}`;
  const renewQrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(renewDeepLink)}`;

  return (
    <div className="min-h-screen bg-[#060813] text-slate-200 font-sans selection:bg-indigo-600 selection:text-white pb-16 relative">
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { background-color: #ffffff !important; color: #000000 !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          header, nav, .no-print, button { display: none !important; }
          #printable-standee-container { display: flex !important; justify-content: center !important; align-items: center !important; width: 100% !important; min-height: 90vh !important; margin: 0 auto !important; padding: 0 !important; }
          #printable-standee { box-shadow: none !important; break-inside: avoid !important; page-break-inside: avoid !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; transform: scale(1.05); }
        }

        /* Subtle 15% Dimming during Tour (Crystal Clear Visibility) */
        .tour-dim-active {
          opacity: 0.82 !important;
          transition: opacity 0.2s ease-in-out;
        }

        /* Animated Golden Border for Highlighted Elements */
        .tour-golden-highlight {
          position: relative !important;
          z-index: 50 !important;
          border-color: #f59e0b !important;
          box-shadow: 0 0 0 2px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.45) !important;
          animation: pulseGoldenBorder 1.5s infinite alternate ease-in-out !important;
        }

        @keyframes pulseGoldenBorder {
          from {
            box-shadow: 0 0 0 2px #f59e0b, 0 0 12px rgba(245, 158, 11, 0.35);
          }
          to {
            box-shadow: 0 0 0 3px #fbbf24, 0 0 26px rgba(251, 191, 36, 0.75);
          }
        }
      `}</style>

      {/* ------------------------------------------------------------- */}
      {/* RESPONSIVE HEADER                                             */}
      {/* ------------------------------------------------------------- */}
      <header className="border-b border-slate-800/80 bg-[#090d1c]/95 sticky top-0 z-40 backdrop-blur-xl no-print">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-md shadow-indigo-600/30 shrink-0">
              {shopInitial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm sm:text-base text-white truncate leading-tight">{shopTitle}</h1>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border uppercase shrink-0 ${
                  planType === 'PREMIUM'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : planType === 'STANDARD'
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {planType}
                </span>
              </div>
              <a href={uploadPageUrl} target="_blank" rel="noreferrer" className="text-[10px] text-slate-400 hover:text-indigo-300 font-mono truncate block">
                scantoprint.in/shop/{shop.slug} ↗
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setTourStep(1);
                setTourActive(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
              title="Start Interactive Guide"
            >
              <span>❓</span>
              <span className="hidden sm:inline">Guide Tour</span>
            </button>

            <button
              onClick={handleSignOut}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Action Row */}
        <div className="px-4 sm:px-6 py-2 border-t border-slate-800/60 bg-[#070b18]/60 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border font-mono ${expiryColorClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${expiryDotClass}`}></span>
              <span>{isExpired ? 'EXPIRED' : `${daysRemaining}D LEFT`}</span>
            </span>

            {!isConnected ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span>OFFLINE</span>
              </span>
            ) : !isAgentActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>INACTIVE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>ACTIVE</span>
              </span>
            )}

            <button
              onClick={() => {
                setModalMode('topup');
                setIsRenewModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer whitespace-nowrap shadow-sm"
            >
              ⚡ Top-Up
            </button>

            <button
              onClick={() => {
                setModalMode('plan');
                setIsRenewModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer whitespace-nowrap shadow-sm"
            >
              🔄 Renew
            </button>

            <button
              id="tour-spooler-btn"
              onClick={handleDownloadSoftware}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
            >
              ⬇ PC Spooler (.zip)
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-[#0b1021] p-0.5 rounded-lg border border-slate-800 shrink-0">
            <button
              id="tour-queue-tab"
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                activeTab === 'queue' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Queue
            </button>

            <button
              id="tour-pricing-tab"
              onClick={() => {
                setActiveTab('pricing');
                if (tourActive && tourStep === 3) {
                  setTourStep(4);
                }
              }}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                activeTab === 'pricing' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              } ${tourActive && tourStep === 3 ? 'tour-golden-highlight' : ''}`}
            >
              Pricing Rates
            </button>

            <button
              id="tour-standee-tab"
              onClick={() => {
                setActiveTab('standee');
                if (tourActive && tourStep === 1) {
                  setTourStep(2);
                }
              }}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                activeTab === 'standee' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              } ${tourActive && tourStep === 1 ? 'tour-golden-highlight' : ''}`}
            >
              Store Standee
            </button>
          </div>
        </div>
      </header>

      {/* Main Canvas with Subtle Dimming during tour */}
      <main className={`max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-5 transition-all ${tourActive ? 'tour-dim-active' : ''}`}>
        
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
          <div className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-3.5 sm:p-4">
            <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Today&apos;s Revenue</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-1">₹{todayRevenue.toFixed(2)}</div>
          </div>
          <div className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-3.5 sm:p-4">
            <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Total Jobs</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1">{orders.length}</div>
          </div>
          <div className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-3.5 sm:p-4">
            <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider block font-medium">Waiting in Queue</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-amber-400 mt-1">{waitingInQueue}</div>
          </div>
          <div className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-3.5 sm:p-4">
            <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider block font-medium">UPI Receiver</span>
            <div className="text-xs font-mono text-indigo-300 truncate mt-1.5 font-medium" title={shop.upi_id}>
              {shop.upi_id || 'Not Configured'}
            </div>
          </div>
        </div>

        {/* Subscription & Quota Card (All-in-One Box) */}
        <div
          id="tour-subscription-box"
          className={`bg-gradient-to-r from-[#0b1021] via-[#0e1628] to-[#070b18] border rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4 no-print transition-all ${
            tourActive && tourStep === 4 ? 'tour-golden-highlight' : 'border-indigo-500/30'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg sm:text-xl text-indigo-400 shrink-0">
              💳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Active Subscription:</span>
                <span className={`text-xs font-mono font-black uppercase ${planType === 'PREMIUM' ? 'text-amber-400' : 'text-indigo-400'}`}>
                  {planType} TIER
                </span>
              </div>
              
              <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>Valid: <strong className="text-slate-200">{subEnd.toLocaleDateString()}</strong></span>
                <span>•</span>
                {planType === 'PREMIUM' ? (
                  <span className="font-bold text-amber-400 font-mono">Unlimited Pages</span>
                ) : (
                  <span className="font-bold font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    {pagesRemaining} / {totalPageLimit} Pages Left
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <span className={`text-xs sm:text-sm font-black font-mono ${
              isExpired || daysRemaining <= 3 ? 'text-rose-400' : daysRemaining <= 7 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {isExpired ? 'Expired' : `${daysRemaining} Days Left`}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setModalMode('topup');
                  setIsRenewModalOpen(true);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] uppercase rounded-xl transition-all shadow cursor-pointer"
              >
                + Top-Up
              </button>
              <button
                onClick={() => {
                  setModalMode('plan');
                  setIsRenewModalOpen(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] uppercase rounded-xl transition-all shadow cursor-pointer"
              >
                Renew
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Spooler Agent Key Box */}
        <div
          id="tour-agent-key-box"
          className={`bg-[#0b1021] border rounded-xl p-3 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs no-print transition-all ${
            tourActive && tourStep === 2 ? 'tour-golden-highlight' : 'border-slate-800/90'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-amber-400 font-bold shrink-0">⚡ Desktop Agent Key:</span>
            <span className="font-mono text-white bg-slate-900/80 px-2 py-1 rounded border border-slate-800 select-all truncate">
              {shop.api_key}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Enter this key once inside the Windows background spooler.</span>
        </div>

        {/* TAB 1: LIVE QUEUE */}
        {activeTab === 'queue' && (
          <div className="bg-[#0b1021] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl no-print">
            <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Incoming Spooler Stream</span>
              <span className="text-[10px] text-slate-500 font-mono">Auto-refreshes every 5s</span>
            </div>
            {orders.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs sm:text-sm">
                No orders in queue yet. New prints will automatically stream here.
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
                        <td className="p-3.5 font-medium text-white max-w-[200px] truncate" title={o.file_name}>
                          {o.file_name}
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono">
                          {o.print_type === 'color' ? 'Color' : 'BW'}
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">{o.copies || 1}</td>
                        <td className="p-3.5 font-mono text-emerald-400 font-bold">₹{o.amount}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            o.print_status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
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

        {/* TAB 2: PRICING RATES */}
        {activeTab === 'pricing' && (
          <div className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-5 sm:p-6 max-w-xl mx-auto shadow-xl space-y-4 no-print">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Counter Print Rates (₹)</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">These prices are applied automatically when customers upload files at your QR.</p>
            </div>

            {ratesSaved && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">
                ✓ Rates updated and synced instantly!
              </div>
            )}

            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">B&W Single-Sided</label>
                <input
                  type="number"
                  value={pricing.bwSingle}
                  onChange={(e) => setPricing({ ...pricing, bwSingle: Number(e.target.value) })}
                  className="w-full bg-[#070b18] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">B&W Double-Sided</label>
                <input
                  type="number"
                  value={pricing.bwDouble}
                  onChange={(e) => setPricing({ ...pricing, bwDouble: Number(e.target.value) })}
                  className="w-full bg-[#070b18] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Color Single-Sided</label>
                <input
                  type="number"
                  value={pricing.colorSingle}
                  onChange={(e) => setPricing({ ...pricing, colorSingle: Number(e.target.value) })}
                  className="w-full bg-[#070b18] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Color Double-Sided</label>
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
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
            >
              {savingRates ? 'Saving Rates...' : 'Save New Rates'}
            </button>
          </div>
        )}

        {/* TAB 3: STORE STANDEE */}
        {activeTab === 'standee' && (
          <div className="flex flex-col items-center justify-center pt-2 space-y-4">
            <div id="printable-standee-container" className="w-full flex justify-center">
              <div
                id="printable-standee"
                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
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

      {/* ------------------------------------------------------------- */}
      {/* ATTACHED CONTEXTUAL MICRO-POPUP (FLOATS EXACTLY BELOW TARGET) */}
      {/* ------------------------------------------------------------- */}
      {tourActive && anchorRect && (
        <div
          style={{
            position: 'absolute',
            top: `${anchorRect.top + anchorRect.height + 12}px`,
            left: `${Math.max(12, Math.min(anchorRect.left + anchorRect.width / 2 - 160, typeof window !== 'undefined' ? window.innerWidth - 340 : anchorRect.left))}px`,
            zIndex: 9999,
          }}
          className="w-80 sm:w-84 bg-[#0a0f1e] border-2 border-amber-400 rounded-2xl p-4 shadow-2xl shadow-amber-500/20 space-y-3 animate-in fade-in zoom-in-95 duration-150 no-print"
        >
          {/* Arrow pointing up to target */}
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0a0f1e] border-t-2 border-l-2 border-amber-400 rotate-45"></div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Step {tourStep} of 4
            </span>
            <button
              onClick={handleFinishTour}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Skip ✕
            </button>
          </div>

          {/* STEP 1 */}
          {tourStep === 1 && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>🪧</span>
                <span>Click Here: Print Store Standee</span>
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Click this button to see your store standee. Print and place this QR on your shop counter so customers can scan and print.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] text-amber-400 font-bold animate-pulse">
                  👆 Click glowing tab above
                </span>
                <button
                  onClick={() => {
                    setActiveTab('standee');
                    setTourStep(2);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl cursor-pointer"
                >
                  Next Step ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {tourStep === 2 && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>💻</span>
                <span>Connect Your PC &amp; Printer</span>
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                1. Click <strong>&apos;PC Spooler (.zip)&apos;</strong> to download app on your counter PC.<br />
                2. Run it and paste this Agent Key once.<br />
                Your printer is now connected.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setTourStep(1)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    setActiveTab('pricing');
                    setTourStep(3);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl cursor-pointer"
                >
                  Next Step ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {tourStep === 3 && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>🏷️</span>
                <span>Click Here: Set Your Print Prices</span>
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Click this button to set your rates. You can change prices for Black &amp; White and Color prints here. Click &apos;Save&apos; and your new rates will update everywhere instantly.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setTourStep(2)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    setActiveTab('queue');
                    setTourStep(4);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl cursor-pointer"
                >
                  Next Step ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {tourStep === 4 && (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>⚡</span>
                <span>Subscription &amp; Live Orders</span>
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                • Check remaining validity days here. Click &apos;Top-Up&apos; for extra pages or &apos;Renew&apos; to extend days.<br />
                • All customer prints will show here in Live Queue and print out automatically.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setTourStep(3)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  onClick={handleFinishTour}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Done! Start Using 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TWO-MODE MODAL: 1. TOP-UP (PAGES ONLY) VS 2. RENEW PLAN (+28D) */}
      {/* ------------------------------------------------------------- */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-[#0b1021] border border-indigo-500/40 rounded-3xl p-5 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            
            <button
              onClick={() => {
                setIsRenewModalOpen(false);
                setRenewErrorMsg('');
                setRenewSuccessMsg('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-base font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center p-1 rounded-2xl bg-[#070b18] border border-slate-800 shadow-inner">
                <button
                  type="button"
                  onClick={() => setModalMode('topup')}
                  className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    modalMode === 'topup'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>⚡</span>
                  <span>Top-Up Pages Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('plan')}
                  className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    modalMode === 'plan'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📦</span>
                  <span>Buy / Renew Plan</span>
                </button>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-black text-white">
                  {modalMode === 'topup' ? 'Add Extra Pages Quota' : 'Renew Subscription Plan (+28 Days)'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {modalMode === 'topup'
                    ? 'Top-up only adds pages. Your active validity days will NOT change.'
                    : 'Plan renewal adds +28 Days to your remaining validity (no days are wasted).'}
                </p>
              </div>
            </div>

            {/* Mode 1: Quota Top-Up */}
            {modalMode === 'topup' && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div
                  onClick={() => setSelectedTopup({ pages: 100, price: 50 })}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer text-center space-y-0.5 ${
                    selectedTopup.pages === 100
                      ? 'bg-emerald-950/60 border-emerald-500 shadow-sm'
                      : 'bg-[#070b18] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Starter</span>
                  <div className="text-sm font-black font-mono text-emerald-400">+100 Pgs</div>
                  <div className="text-[11px] font-bold text-white font-mono">₹50</div>
                </div>

                <div
                  onClick={() => setSelectedTopup({ pages: 250, price: 80 })}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer text-center space-y-0.5 ${
                    selectedTopup.pages === 250
                      ? 'bg-emerald-950/60 border-emerald-500 shadow-sm'
                      : 'bg-[#070b18] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[9px] font-bold text-emerald-400 uppercase block">Popular</span>
                  <div className="text-sm font-black font-mono text-emerald-400">+250 Pgs</div>
                  <div className="text-[11px] font-bold text-white font-mono">₹80</div>
                </div>

                <div
                  onClick={() => setSelectedTopup({ pages: 500, price: 100 })}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer text-center space-y-0.5 ${
                    selectedTopup.pages === 500
                      ? 'bg-emerald-950/60 border-emerald-500 shadow-sm'
                      : 'bg-[#070b18] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Saver</span>
                  <div className="text-sm font-black font-mono text-emerald-400">+500 Pgs</div>
                  <div className="text-[11px] font-bold text-white font-mono">₹100</div>
                </div>
              </div>
            )}

            {/* Mode 2: Buy / Renew Plan */}
            {modalMode === 'plan' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div
                  onClick={() => setSelectedPlanTier('standard')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-center space-y-0.5 ${
                    selectedPlanTier === 'standard'
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-sm'
                      : 'bg-[#070b18] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-bold text-indigo-400 uppercase block">Standard</span>
                  <div className="text-base font-black font-mono text-white">₹149</div>
                  <p className="text-[9px] text-slate-400">500 Pgs + 28 Days Added</p>
                </div>

                <div
                  onClick={() => setSelectedPlanTier('premium')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-center space-y-0.5 ${
                    selectedPlanTier === 'premium'
                      ? 'bg-amber-950/60 border-amber-500 shadow-sm'
                      : 'bg-[#070b18] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-bold text-amber-400 uppercase block">Premium</span>
                  <div className="text-base font-black font-mono text-white">₹249</div>
                  <p className="text-[9px] text-amber-300 font-bold">Unlimited + 28 Days</p>
                </div>
              </div>
            )}

            {/* Clean QR & Payment */}
            <div className="bg-[#070b18] border border-slate-800 rounded-2xl p-3.5 text-center space-y-2.5">
              <div className="bg-white p-2 rounded-xl inline-block mx-auto shadow">
                <img
                  src={renewQrSrc}
                  alt="Scan to Pay Admin"
                  className="w-36 h-36 mx-auto object-contain"
                />
              </div>

              <div className="space-y-0.5">
                <span className="text-sm sm:text-base font-black font-mono text-emerald-400 block">
                  Payable Amount: ₹{payableAmount}
                </span>
                <span className="text-[10px] text-slate-400">
                  {modalMode === 'topup'
                    ? `Adding +${selectedTopup.pages} Pages without altering validity`
                    : `+28 Days added on top of existing days`}
                </span>
              </div>

              <div>
                <a
                  href={renewDeepLink}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🚀</span>
                  <span>Pay ₹{payableAmount} via UPI App</span>
                </a>
              </div>
            </div>

            {renewErrorMsg && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {renewErrorMsg}
              </div>
            )}

            {renewSuccessMsg && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs">
                {renewSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  12-Digit UPI Ref / UTR No.
                </label>
                <input
                  required
                  type="text"
                  maxLength={16}
                  placeholder="Enter 12-digit UTR from GPay/PhonePe"
                  value={renewUtr}
                  onChange={(e) => setRenewUtr(e.target.value)}
                  className="w-full bg-[#070b18] border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-emerald-400 font-mono focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={submittingRenew || renewUtr.trim().length < 4}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {submittingRenew ? 'Submitting...' : 'Confirm & I Have Paid ➔'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}