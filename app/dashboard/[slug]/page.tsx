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
  const [activeTab, setActiveTab] = useState<'queue' | 'pricing' | 'standee'>('standee');
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('https://scantoprint.in');

  // Pricing State
  const [pricing, setPricing] = useState({
    bwSingle: 2,
    bwDouble: 3,
    colorSingle: 10,
    colorDouble: 18,
  });
  const [savingRates, setSavingRates] = useState(false);
  const [ratesSaved, setRatesSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
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

  const handleDownloadSoftware = () => {
    const { data } = supabase.storage.from('software').getPublicUrl('ScanToPrint.exe');
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
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

  const isOnline = Boolean(
    shop.is_online &&
    shop.last_seen &&
    (Date.now() - new Date(shop.last_seen).getTime()) / 1000 < 25
  );

  const isActive = isOnline && shop.agent_status === 'active';

  const shopTitle = shop.business_name || shop.name || 'Store';
  const shopInitial = shopTitle.trim().charAt(0).toUpperCase() || 'S';

  // Sahi exact link
  const uploadPageUrl = `${baseUrl}/shop/${shop.slug}`;
  const displayPrintLink = `scantoprint.in/shop/${shop.slug}`;
  const qrImageSource = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(uploadPageUrl)}`;

  const todayRevenue = orders
    .filter((o) => o.payment_status === 'paid' || o.payment_status === 'completed')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const waitingInQueue = orders.filter(
    (o) => o.print_status !== 'completed' && o.print_status !== 'printed'
  ).length;

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
      <header className="border-b border-slate-800/80 bg-[#090d1c]/90 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-600/30">
            {shopInitial}
          </div>
          <div>
            <h1 className="font-bold text-base text-white leading-tight">{shopTitle}</h1>
            <p className="text-[11px] text-slate-400">
              Counter Link: <a href={uploadPageUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 font-mono underline">{displayPrintLink}</a>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSoftware}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/40 shadow-sm transition-all cursor-pointer"
          >
            <span>⬇</span>
            <span>Download PC Software</span>
          </button>

          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              SYSTEM CONNECTED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              SYSTEM NOT CONNECTED
            </span>
          )}

          {isActive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm mr-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ACTIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm mr-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              INACTIVE
            </span>
          )}

          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'queue'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Live Queue
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'pricing'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Pricing Rates
          </button>
          <button
            onClick={() => setActiveTab('standee')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'standee'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Store Standee
          </button>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all ml-1"
          >
            Sign Out
          </button>
        </div>
      </header>

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

        {/* TAB 2: PRICING RATES */}
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
                    STP
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
                  <div className="text-sm font-bold text-white tracking-wider">scantoprint.in</div>
                  {/* YAHAN AB DIRECT SAHI LINK DIKHEGA */}
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
    </div>
  );
}