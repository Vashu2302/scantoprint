'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ShopDashboard() {
  const [shop, setShop] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShopData() {
      // 1. Get logged-in shop identifier from cookie
      const cookies = document.cookie.split('; ');
      const authCookie = cookies.find((c) => c.startsWith('stp_auth_token='));
      let email = '';

      if (authCookie) {
        const val = authCookie.split('=')[1];
        if (val.startsWith('shop_')) {
          email = decodeURIComponent(val.replace('shop_', ''));
        }
      }

      // 2. Fetch Shop Details from Supabase
      let currentShop = null;
      if (email) {
        const { data } = await supabase
          .from('shops')
          .select('*')
          .eq('email', email)
          .single();
        currentShop = data;
      }

      // Fallback: Agar cookie se email na mile toh latest active shop le lo
      if (!currentShop) {
        const { data } = await supabase
          .from('shops')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        currentShop = data;
      }

      if (currentShop) {
        setShop(currentShop);

        // 3. Fetch Real Print Jobs for this specific shop
        const { data: jobData } = await supabase
          .from('print_jobs')
          .select('*')
          .eq('shop_id', currentShop.id)
          .order('created_at', { ascending: false });

        if (jobData) {
          setJobs(jobData);
        }
      }

      setLoading(false);
    }

    loadShopData();
  }, []);

  const handleLogout = () => {
    document.cookie = 'stp_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 text-sm">
        Loading Shop Dashboard...
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-white p-4">
        <h2 className="text-xl font-bold mb-2">No Shop Found</h2>
        <p className="text-xs text-slate-400 mb-4">Please login with a valid registered shop email.</p>
        <button onClick={handleLogout} className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold">
          Back to Login
        </button>
      </div>
    );
  }

  // Calculate live stats
  const totalPrints = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === 'printed' || j.status === 'completed').length;
  const pendingJobs = jobs.filter((j) => j.status === 'queued' || j.status === 'processing').length;
  const totalRevenue = jobs.reduce((sum, j) => sum + (Number(j.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Store Dashboard
            </span>
            <h1 className="text-2xl font-black text-white">{shop.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Portal URL:{' '}
              <a
                href={`/shop/${shop.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline font-mono"
              >
                {shop.slug}.scantoprint.in (/shop/{shop.slug})
              </a>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open(`/shop/${shop.slug}`, '_blank')}
              className="px-4 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold hover:bg-indigo-600/30 transition-all"
            >
              Open Shop QR Page
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0e1626] border border-slate-800 p-5 rounded-2xl">
            <div className="text-slate-400 text-xs font-medium">Total Print Jobs</div>
            <div className="text-2xl font-black text-white mt-2">{totalPrints}</div>
          </div>

          <div className="bg-[#0e1626] border border-slate-800 p-5 rounded-2xl">
            <div className="text-slate-400 text-xs font-medium">Completed Prints</div>
            <div className="text-2xl font-black text-emerald-400 mt-2">{completedJobs}</div>
          </div>

          <div className="bg-[#0e1626] border border-slate-800 p-5 rounded-2xl">
            <div className="text-slate-400 text-xs font-medium">Pending Queue</div>
            <div className="text-2xl font-black text-amber-400 mt-2">{pendingJobs}</div>
          </div>

          <div className="bg-[#0e1626] border border-slate-800 p-5 rounded-2xl">
            <div className="text-slate-400 text-xs font-medium">Shop UPI ID</div>
            <div className="text-sm font-bold font-mono text-indigo-400 mt-2 truncate">
              {shop.upi_id}
            </div>
          </div>
        </div>

        {/* Live Print Queue */}
        <div className="bg-[#0e1626] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Print Jobs ({shop.name})
            </h2>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">File Name</th>
                <th className="p-4">Pages / Copies</th>
                <th className="p-4">Color Mode</th>
                <th className="p-4">Status</th>
                <th className="p-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No print jobs yet for {shop.name}. Customers can scan your QR code to print directly.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-900/40">
                    <td className="p-4 font-semibold text-white truncate max-w-xs">{job.file_name}</td>
                    <td className="p-4 text-slate-300">{job.page_count} pgs × {job.copies} copies</td>
                    <td className="p-4 uppercase text-slate-400 font-medium">{job.color_mode}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          job.status === 'printed' || job.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono">
                      {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}