'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ShopInspector360AdminPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [shop, setShop] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      setLoading(true);

      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .single();

      if (shopData) {
        setShop(shopData);
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('shop_id', shopData.id)
          .order('created_at', { ascending: false });

        if (ordersData) setOrders(ordersData);
      }

      setLoading(false);
    }

    loadData();

    const shopChan = supabase
      .channel(`inspect_shop_${slug}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'shops' },
        (payload: any) => {
          if (payload.new && payload.new.slug === slug) setShop(payload.new);
        }
      )
      .subscribe();

    const ordersChan = supabase
      .channel(`inspect_orders_${slug}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async () => {
          if (!shop?.id) return;
          const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('shop_id', shop.id)
            .order('created_at', { ascending: false });
          if (data) setOrders(data);
        }
      )
      .subscribe();

    const poll = setInterval(loadData, 4000);

    return () => {
      supabase.removeChannel(shopChan);
      supabase.removeChannel(ordersChan);
      clearInterval(poll);
    };
  }, [slug, shop?.id]);

  const copySpoolerKey = () => {
    if (!shop?.api_key) return;
    navigator.clipboard.writeText(shop.api_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleOpenMerchantDashboard = () => {
    if (!shop) return;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('current_shop', JSON.stringify(shop));
      localStorage.setItem('stp_shop_session', JSON.stringify(shop));
      window.open(`/dashboard/${shop.slug}`, '_blank');
    }
  };

  if (loading && !shop) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center font-sans">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-rose-400">Shop Not Found</h2>
          <button
            onClick={() => router.push('/admin')}
            className="mt-4 px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold cursor-pointer"
          >
            ← Back to Admin
          </button>
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

  const totalRev = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.amount || 0), 0);

  const totalPrints = orders
    .filter((o) => o.print_status === 'completed')
    .reduce((sum, o) => sum + (Number(o.pages || 1) * Number(o.copies || 1)), 0);

  const waitingCount = orders.filter(
    (o) => o.print_status === 'queued' || o.print_status === 'in_queue'
  ).length;

  const shopTitle = shop.business_name || shop.name || 'Store';
  const customerUploadLink = `/shop/${shop.slug}`;
  const counterQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
    typeof window !== 'undefined'
      ? `${window.location.origin}/shop/${shop.slug}`
      : `https://scantoprint.in/shop/${shop.slug}`
  )}`;

  return (
    <div className="min-h-screen bg-[#060813] text-slate-200 font-sans p-4 sm:p-8 space-y-6">
      {/* PRINT CSS: यह एडमिन पेज की बाकी सब चीजें छुपा देगा और सिर्फ पोस्टर को कलरफुल प्रिंट करेगा */}
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
          /* एडमिन पेज के बाकी सारे सेक्शन हाइड करें */
          .admin-no-print,
          header,
          button {
            display: none !important;
          }
          /* सिर्फ स्टैंडी कार्ड को सिंगल पेज पर सेंटर करें */
          #admin-standee-print-container {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            min-height: 90vh !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
          #admin-printable-standee {
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            transform: scale(1.05);
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TOP NAVBAR (PRINT MEIN HIDE) */}
        <div className="admin-no-print flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
            >
              ← Admin Dashboard
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {shopTitle}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  360° Control
                </span>
              </div>
              <a
                href={customerUploadLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:underline font-mono inline-flex items-center gap-1"
              >
                <span>{shop.slug}.scantoprint.in</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          {/* RIGHT ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                SYSTEM CONNECTED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-md">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                SYSTEM NOT CONNECTED
              </span>
            )}

            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-md">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                INACTIVE
              </span>
            )}

            <button
              onClick={handleOpenMerchantDashboard}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open Merchant Dashboard</span>
              <span>⚡</span>
            </button>
          </div>
        </div>

        {/* 360 DETAILS & COUNTER QR GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Shop Information & Price Tags (PRINT MEIN HIDE) */}
          <div className="admin-no-print lg:col-span-7 bg-[#0b1021] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-3">
              Store Credentials & Spooler Telemetry
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#070b18] p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Owner Name</span>
                <span className="text-white font-semibold text-sm">{shop.owner_name || 'N/A'}</span>
              </div>

              <div className="bg-[#070b18] p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Login Phone ID</span>
                <span className="text-white font-mono text-sm">{shop.phone}</span>
              </div>

              <div className="bg-[#070b18] p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Merchant Password</span>
                <span className="text-rose-400 font-mono font-bold text-sm bg-rose-500/10 px-2 py-0.5 rounded inline-block mt-0.5">
                  {shop.plain_password}
                </span>
              </div>

              <div className="bg-[#070b18] p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Receiver UPI ID</span>
                <span className="text-emerald-400 font-mono font-bold text-sm">
                  {shop.upi_id || 'Not Set'}
                </span>
              </div>
            </div>

            {/* Desktop Spooler Agent Key */}
            <div className="bg-[#070b18] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Desktop Spooler Agent Key
              </span>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs text-indigo-300 font-mono truncate">
                  {shop.api_key || 'No API Key Generated'}
                </code>
                <button
                  type="button"
                  onClick={copySpoolerKey}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer shrink-0 transition-all"
                >
                  {copiedKey ? '✓ Copied' : 'Copy Key'}
                </button>
              </div>
            </div>

            {/* Live Price Tags Section */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                Active Printing Rate Card
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                <div className="bg-[#070b18] p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-sans">B&W Single</span>
                  <span className="text-white font-bold">₹{Number(shop.bw_single ?? 2)}</span>
                </div>
                <div className="bg-[#070b18] p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-sans">B&W Double</span>
                  <span className="text-white font-bold">₹{Number(shop.bw_double ?? 3)}</span>
                </div>
                <div className="bg-[#070b18] p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-sans">Color Single</span>
                  <span className="text-emerald-400 font-bold">₹{Number(shop.color_single ?? 10)}</span>
                </div>
                <div className="bg-[#070b18] p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-sans">Color Double</span>
                  <span className="text-emerald-400 font-bold">₹{Number(shop.color_double ?? 18)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: BLUE POSTER STANDEE QR CARD (PRINT KE TIME ONLY YEH DIKHEGA) */}
          <div className="lg:col-span-5 flex flex-col items-center w-full">
            
            <div id="admin-standee-print-container" className="w-full flex justify-center">
              {/* Standee Frame */}
              <div 
                id="admin-printable-standee"
                style={{
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
                className="w-full max-w-sm rounded-[32px] p-6 shadow-2xl text-center space-y-4 text-white relative overflow-hidden bg-gradient-to-b from-[#2563eb] via-[#1d4ed8] to-[#1e40af] border border-blue-400/30"
              >
                {/* STP Capsule */}
                <div className="inline-flex items-center justify-center px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black tracking-widest text-white border border-white/20 uppercase">
                  STP
                </div>

                {/* Header Title */}
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold tracking-widest text-blue-100 uppercase opacity-90 block">
                    ScanToPrint Partner Store
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {shopTitle}
                  </h2>
                  <p className="text-[11px] text-blue-100/80">
                    Direct Wireless Print Counter
                  </p>
                </div>

                {/* White Inner Card with QR */}
                <div className="bg-white rounded-3xl p-5 shadow-2xl text-slate-900 space-y-2">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block flex items-center justify-center gap-1.5">
                    <span>📱</span>
                    <span>SCAN ME TO PRINT</span>
                  </span>
                  
                  <div className="flex justify-center p-1">
                    <img
                      src={counterQrUrl}
                      alt="Store Counter QR"
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                    />
                  </div>

                  <span className="text-[10px] text-slate-500 block font-medium">
                    Scan with Camera or Any UPI App
                  </span>
                </div>

                {/* Standee Footer */}
                <div className="space-y-0.5 pt-1">
                  <span className="text-[9px] uppercase tracking-wider text-blue-200/80 block font-medium">
                    POWERED & SECURED BY
                  </span>
                  <span className="text-sm font-black tracking-tight text-white block">
                    scantoprint.in
                  </span>
                  <span className="text-[10px] font-mono text-blue-200 block">
                    {shop.slug}.scantoprint.in
                  </span>
                </div>
              </div>
            </div>

            {/* Print Button (PRINT MEIN HIDE) */}
            <div className="admin-no-print w-full max-w-sm mt-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-600/30 cursor-pointer border border-blue-400/30 flex items-center justify-center gap-2"
              >
                <span>🖨️</span>
                <span>PRINT STANDEE POSTER (CTRL + P)</span>
              </button>
            </div>

          </div>

        </div>

        {/* METRICS ROW (PRINT MEIN HIDE) */}
        <div className="admin-no-print grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Store Revenue</span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">₹{totalRev.toFixed(2)}</div>
            <span className="text-[11px] text-slate-500">Collected from successful print orders</span>
          </div>

          <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Sheets Printed</span>
            <div className="text-2xl font-black font-mono text-blue-400 mt-1">{totalPrints} Sheets</div>
            <span className="text-[11px] text-slate-500">Lifetime completed physical prints</span>
          </div>

          <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400">Waiting in Queue</span>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">{waitingCount} Jobs</div>
            <span className="text-[11px] text-slate-500">Currently awaiting spooler dispatch</span>
          </div>
        </div>

        {/* ORDERS & SPOOL STREAM (PRINT MEIN HIDE) */}
        <div className="admin-no-print bg-[#0b1021] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Live Counter Spooler Stream
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Total {orders.length} jobs logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#070b18] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="p-3">File Name</th>
                  <th className="p-3">Pages / Copies</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Print Status</th>
                  <th className="p-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                      No print jobs received for this counter yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/20">
                      <td className="p-3 font-sans text-white font-semibold">{ord.file_name}</td>
                      <td className="p-3 text-slate-300">{ord.pages} pgs × {ord.copies} cop</td>
                      <td className="p-3 text-emerald-400 font-bold">₹{ord.amount}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.print_status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {ord.print_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-400 font-sans text-[11px]">
                        {new Date(ord.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}