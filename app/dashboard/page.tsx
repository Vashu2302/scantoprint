'use client';

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';

export default function ShopOwnerDashboard() {
  const [shop, setShop] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'pricing' | 'standee'>('queue');

  // 4-Tier Pricing Controls
  const [rates, setRates] = useState({
    bwSingle: 2.0,
    bwDouble: 3.0,
    colorSingle: 5.0,
    colorDouble: 8.0,
  });
  const [savingRates, setSavingRates] = useState<boolean>(false);

  // Standee QR Ref
  const qrCardRef = useRef<HTMLDivElement | null>(null);

  // Load shop details & jobs
  useEffect(() => {
    async function loadData() {
      const cookies = document.cookie.split('; ');
      const authCookie = cookies.find((c) => c.startsWith('stp_auth_token='));
      let email = '';

      if (authCookie) {
        const val = authCookie.split('=')[1];
        if (val && val.startsWith('shop_')) {
          email = decodeURIComponent(val.replace('shop_', ''));
        }
      }

      let shopData = null;
      if (email) {
        const { data } = await supabase.from('shops').select('*').eq('email', email).single();
        shopData = data;
      }

      if (!shopData) {
        const { data } = await supabase
          .from('shops')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        shopData = data;
      }

      if (shopData) {
        setShop(shopData);
        setRates({
          bwSingle: shopData.bw_single_rate || shopData.bw_rate || 2.0,
          bwDouble: shopData.bw_double_rate || 3.0,
          colorSingle: shopData.color_single_rate || shopData.color_rate || 5.0,
          colorDouble: shopData.color_double_rate || 8.0,
        });

        const { data: jobsData } = await supabase
          .from('print_jobs')
          .select('*')
          .eq('shop_id', shopData.id)
          .order('created_at', { ascending: false });

        if (jobsData) setJobs(jobsData);
      }
      setLoading(false);
    }

    loadData();

    // Realtime Listener for new Incoming Print Jobs
    const channel = supabase
      .channel('realtime:shop_jobs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'print_jobs' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setJobs((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setJobs((prev) =>
              prev.map((j) => (j.id === payload.new.id ? payload.new : j))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update Pricing
  const handleSaveRates = async () => {
    if (!shop) return;
    setSavingRates(true);
    const { error } = await supabase
      .from('shops')
      .update({
        bw_single_rate: rates.bwSingle,
        bw_double_rate: rates.bwDouble,
        color_single_rate: rates.colorSingle,
        color_double_rate: rates.colorDouble,
      })
      .eq('id', shop.id);

    if (!error) {
      alert('Pricing rates saved successfully!');
    } else {
      alert('Error updating rates: ' + error.message);
    }
    setSavingRates(false);
  };

  // Generate Standee QR with bigger dimensions
  useEffect(() => {
    if (activeTab === 'standee' && shop) {
      const win = window as any;
      setTimeout(() => {
        if (qrCardRef.current && win.QRCode) {
          qrCardRef.current.innerHTML = '';
          const targetUrl = `https://${shop.slug || 'balod'}.scantoprint.in`;
          new win.QRCode(qrCardRef.current, {
            text: targetUrl,
            width: 240,
            height: 240,
          });
        }
      }, 100);
    }
  }, [activeTab, shop]);

  const updateJobStatus = async (id: string, status: string) => {
    await supabase.from('print_jobs').update({ status }).eq('id', id);
  };

  const handleLogout = () => {
    document.cookie = 'stp_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 text-xs">
        Loading Shop Dashboard...
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayJobs = jobs.filter((j) => j.created_at && j.created_at.startsWith(todayStr));
  const todayRevenue = todayJobs.reduce((sum, j) => sum + (Number(j.total_amount || j.amount) || 0), 0);
  const pendingJobs = jobs.filter((j) => j.status === 'in_queue' || j.status === 'queued').length;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-4 md:p-8 selection:bg-indigo-500 selection:text-white">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" />

      {/* Header Bar */}
      <header className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/30">
            {shop?.name ? shop.name.charAt(0) : 'S'}
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white leading-tight">{shop?.name || 'Store Dashboard'}</h1>
            <p className="text-xs text-slate-400">
              Counter Link: <span className="text-indigo-400 font-mono">{shop?.slug}.scantoprint.in</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'queue' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400'
            }`}
          >
            Live Queue
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pricing' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400'
            }`}
          >
            Pricing Rates
          </button>
          <button
            onClick={() => setActiveTab('standee')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'standee' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400'
            }`}
          >
            Store Standee
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Overview Stat Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 no-print">
        <div className="p-5 rounded-2xl bg-[#0f172a]/80 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400">Today&apos;s Revenue</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">₹{todayRevenue.toFixed(2)}</div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0f172a]/80 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400">Total Jobs</div>
          <div className="text-2xl font-black text-white font-mono mt-1">{jobs.length}</div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0f172a]/80 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400">Waiting in Queue</div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">{pendingJobs}</div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0f172a]/80 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400">UPI Receiver</div>
          <div className="text-xs font-bold font-mono text-indigo-400 mt-2 truncate">{shop?.upi_id}</div>
        </div>
      </div>

      {/* Main Body Switch */}
      <main className="max-w-6xl mx-auto">
        {/* TAB 1: LIVE QUEUE */}
        {activeTab === 'queue' && (
          <div className="rounded-2xl bg-[#0f172a]/80 border border-slate-800 overflow-hidden shadow-2xl no-print">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Incoming Spooler Stream
              </h2>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-4">File</th>
                  <th className="p-4">Settings</th>
                  <th className="p-4">Copies</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                      No documents waiting. Incoming prints will appear here automatically.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-4 font-sans font-semibold text-white truncate max-w-xs">
                        {job.file_name}
                      </td>
                      <td className="p-4 text-slate-400">
                        {job.color_mode?.toUpperCase()} • {job.side_mode || job.sides || 'single'}
                      </td>
                      <td className="p-4 text-slate-300">{job.copies || 1}</td>
                      <td className="p-4 text-emerald-400 font-bold">₹{job.total_amount || job.amount}</td>
                      <td className="p-4 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            job.status === 'completed' || job.status === 'printed'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-sans space-x-2">
                        {job.status !== 'completed' && job.status !== 'printed' && (
                          <button
                            onClick={() => updateJobStatus(job.id, 'completed')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold"
                          >
                            Mark Done
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: PRICING SETTINGS */}
        {activeTab === 'pricing' && (
          <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800 space-y-6 max-w-2xl no-print">
            <div>
              <h2 className="text-base font-extrabold text-white">Counter Print Charges</h2>
              <p className="text-xs text-slate-400">These rates apply directly to customers uploading at your counter</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400">B&amp;W Single-Sided (₹)</label>
                <input
                  type="number"
                  value={rates.bwSingle}
                  onChange={(e) => setRates({ ...rates, bwSingle: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400">B&amp;W Double-Sided (₹)</label>
                <input
                  type="number"
                  value={rates.bwDouble}
                  onChange={(e) => setRates({ ...rates, bwDouble: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400">Color Single-Sided (₹)</label>
                <input
                  type="number"
                  value={rates.colorSingle}
                  onChange={(e) => setRates({ ...rates, colorSingle: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400">Color Double-Sided (₹)</label>
                <input
                  type="number"
                  value={rates.colorDouble}
                  onChange={(e) => setRates({ ...rates, colorDouble: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleSaveRates}
              disabled={savingRates}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              {savingRates ? 'Saving Rates...' : 'Save New Rates'}
            </button>
          </div>
        )}

        {/* TAB 3: COUNTER QR STANDEE */}
        {activeTab === 'standee' && (
          <div className="flex flex-col items-center justify-center p-4 md:p-8 space-y-6">
            <style jsx global>{`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 0;
                }
                body {
                  background: #ffffff !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                body * {
                  visibility: hidden;
                }
                .no-print {
                  display: none !important;
                }
                #printable-standee, #printable-standee * {
                  visibility: visible;
                }
                #printable-standee {
                  position: fixed !important;
                  left: 50% !important;
                  top: 50% !important;
                  transform: translate(-50%, -50%) !important;
                  width: 380px !important;
                  border: 3.5px solid #4f46e5 !important;
                  box-shadow: none !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            `}</style>

            {/* Standee Poster Card */}
            <div
              id="printable-standee"
              className="w-full max-w-sm bg-white text-slate-900 rounded-[2.5rem] border-4 border-indigo-600 shadow-2xl overflow-hidden relative"
            >
              {/* Top Indigo Brand Header */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white text-center relative">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-xl mb-2 shadow-inner">
                  STP
                </div>
                <div className="text-[10px] uppercase font-black tracking-widest text-indigo-200">
                  ScanToPrint Partner Store
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                  {shop?.name || 'Vashu Prints'}
                </h2>
                <p className="text-xs text-indigo-100/80 font-medium mt-0.5">
                  Direct Wireless Print Counter
                </p>
              </div>

              {/* QR Code in Center (Enlarged) */}
              <div className="p-8 flex flex-col items-center justify-center bg-white space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-5 py-2 rounded-full border border-indigo-100 shadow-sm">
                  📱 Scan Me to Print
                </span>

                <div className="p-4 bg-white rounded-3xl border-2 border-indigo-100 shadow-xl shadow-indigo-100/60 flex items-center justify-center">
                  <div ref={qrCardRef} className="p-1" />
                </div>

                <p className="text-xs text-slate-500 font-bold">
                  Scan with Camera or Any UPI App
                </p>
              </div>

              {/* Large Website Advertisement Banner */}
              <div className="p-6 bg-slate-950 text-white text-center border-t border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">
                  Powered &amp; Secured by
                </div>
                <div className="text-xl font-black text-indigo-400 tracking-wider font-mono mt-1">
                  scantoprint.in
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono font-medium">
                  {shop?.slug}.scantoprint.in
                </div>
              </div>
            </div>

            {/* Print Trigger Button */}
            <button
              onClick={() => window.print()}
              className="no-print px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <span>🖨️ Print Standee Poster (Ctrl + P)</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}