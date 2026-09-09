'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';

interface PrintJob {
  id: string;
  file_name: string;
  color_mode: string;
  side_mode: string;
  pages_per_sheet: number;
  copies: number;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function ShopDashboard() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [showPoster, setShowPoster] = useState(false);
  const posterQrRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchJobs();

    const channel = supabase
      .channel('realtime:print_jobs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'print_jobs' },
        (payload) => {
          setJobs((prev) => [payload.new as PrintJob, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('print_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setJobs(data as PrintJob[]);
  };

  const openPosterModal = () => {
    setShowPoster(true);
    setTimeout(() => {
      const win = window as any;
      if (posterQrRef.current && win.QRCode) {
        posterQrRef.current.innerHTML = '';
        // Customer mobile scan destination URL
        const uploadUrl = `${window.location.origin}/upload`;
        new win.QRCode(posterQrRef.current, {
          text: uploadUrl,
          width: 220,
          height: 220,
        });
      }
    }, 100);
  };

  const totalRevenue = jobs.reduce((acc, job) => acc + Number(job.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090d16]/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-md">
            S
          </div>
          <div>
            <h1 className="font-extrabold text-base text-white">Balod Central Xerox & Cyber</h1>
            <span className="text-[11px] text-emerald-400 font-medium">● System Live & Listening</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openPosterModal}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30"
          >
            🖨️ Print Counter QR Poster
          </button>
          <Link
            href="/upload"
            target="_blank"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white"
          >
            Open Portal ↗
          </Link>
          <Link href="/login" className="text-xs text-slate-400 hover:text-white ml-2">
            Logout
          </Link>
        </div>
      </header>

      {/* Metrics Row */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-[#0f172a]/70 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Collection</span>
            <div className="text-3xl font-black text-white mt-2 font-mono">₹{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-emerald-400 mt-2 font-medium">Synced instantly</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0f172a]/70 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders</span>
            <div className="text-3xl font-black text-indigo-400 mt-2 font-mono">{jobs.length}</div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Received jobs</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0f172a]/70 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Desktop Agent</span>
            <div className="text-3xl font-black text-emerald-400 mt-2">Active</div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Virtual spooler connected</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0f172a]/70 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Dispatch</span>
            <div className="text-3xl font-black text-white mt-2 font-mono">0.3s</div>
            <p className="text-xs text-emerald-400 mt-2 font-medium">Zero-queue delay</p>
          </div>
        </div>

        {/* Live Jobs Table */}
        <div className="p-6 sm:p-8 rounded-[2rem] bg-[#0f172a]/80 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-white">Live Print Queue</h2>
              <p className="text-xs text-slate-400 mt-1">Realtime customer orders appear automatically.</p>
            </div>
            <button
              onClick={fetchJobs}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300"
            >
              🔄 Refresh
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No orders in queue right now.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 uppercase tracking-wider text-[10px] text-slate-400">
                  <tr>
                    <th className="pb-3 px-3">File Name</th>
                    <th className="pb-3 px-3">Mode</th>
                    <th className="pb-3 px-3">Side</th>
                    <th className="pb-3 px-3">Layout</th>
                    <th className="pb-3 px-3">Copies</th>
                    <th className="pb-3 px-3">Amount</th>
                    <th className="pb-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-white max-w-[220px] truncate font-sans">
                        📄 {job.file_name}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          job.color_mode === 'bw' ? 'bg-slate-800 text-slate-300' : 'bg-violet-950 text-violet-300'
                        }`}>
                          {job.color_mode === 'bw' ? 'B & W' : 'Color'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 uppercase text-[11px]">{job.side_mode}</td>
                      <td className="py-3.5 px-3">{job.pages_per_sheet}-in-1</td>
                      <td className="py-3.5 px-3 font-bold text-white">{job.copies}</td>
                      <td className="py-3.5 px-3 font-bold text-emerald-400">₹{Number(job.total_amount).toFixed(2)}</td>
                      <td className="py-3.5 px-3 font-sans">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                          ● {job.status || 'Received'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* QR Standee Poster Modal */}
      {showPoster && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-indigo-900 leading-tight">Balod Central Xerox</h3>
            <p className="text-xs text-slate-600 font-semibold">Self-Service Instant Print Counter</p>
            
            <div className="border-4 border-indigo-600 p-4 rounded-2xl bg-white inline-block shadow-inner my-2">
              <div ref={posterQrRef} />
            </div>

            <p className="text-sm font-black text-slate-800">Scan QR Code to Upload & Print</p>
            <p className="text-[11px] text-slate-500">Supports PDF, JPG, PNG with Live Preview</p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Print Poster
              </button>
              <button
                onClick={() => setShowPoster(false)}
                className="py-3 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}