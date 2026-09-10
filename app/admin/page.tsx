'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminOverviewPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [totalLifetimePrints, setTotalLifetimePrints] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Upload .exe states
  const [isUploadingExe, setIsUploadingExe] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shopToDelete, setShopToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = sessionStorage.getItem('stp_admin_auth');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
        fetchDashboardData();
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const shopsChannel = supabase
      .channel('admin_realtime_shops')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shops' },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel('admin_realtime_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    const interval = setInterval(fetchDashboardData, 5000);

    return () => {
      supabase.removeChannel(shopsChannel);
      supabase.removeChannel(ordersChannel);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setVerifying(true);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPass }),
      });

      const data = await res.json();

      if (data.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('stp_admin_auth', 'true');
        }
        setIsAuthenticated(true);
        fetchDashboardData();
      } else {
        setErrorMsg(data.error || 'Invalid Master Key');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to verification server');
    } finally {
      setVerifying(false);
    }
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('stp_admin_auth');
    }
    setIsAuthenticated(false);
    setAdminPass('');
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: shopsData } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    if (shopsData) setShops(shopsData);

    const { data: ordersData } = await supabase
      .from('orders')
      .select('pages, copies, print_status')
      .eq('print_status', 'completed');

    if (ordersData) {
      const totalSheets = ordersData.reduce(
        (sum, ord) => sum + (Number(ord.pages || 1) * Number(ord.copies || 1)),
        0
      );
      setTotalLifetimePrints(totalSheets);
    }

    setLoading(false);
  };

  // Upload .exe to Supabase Storage (Bucket: software)
  const handleExeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingExe(true);
    setUploadSuccessMsg('');

    try {
      const { error } = await supabase.storage
        .from('software')
        .upload('ScanToPrint.exe', file, {
          upsert: true, // Hamesha nayi file se overwrite/update karega
          contentType: 'application/vnd.microsoft.portable-executable',
        });

      if (error) throw error;

      setUploadSuccessMsg('✓ New ScanToPrint.exe uploaded successfully!');
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploadingExe(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmDeleteShop = async () => {
    if (!shopToDelete) return;
    setIsDeleting(true);

    try {
      await supabase.from('orders').delete().eq('shop_id', shopToDelete.id);
      const { error } = await supabase.from('shops').delete().eq('id', shopToDelete.id);

      if (error) throw error;

      setShops((prev) => prev.filter((s) => s.id !== shopToDelete.id));
      setShopToDelete(null);
    } catch (err: any) {
      alert(`Failed to delete shop: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const isShopActive = (shop: any) => {
    if (!shop.last_seen || !shop.is_online) return false;
    const diff = (Date.now() - new Date(shop.last_seen).getTime()) / 1000;
    return diff < 25 && shop.agent_status === 'active';
  };

  const activeShopsCount = shops.filter((s) => isShopActive(s)).length;
  const inactiveShopsCount = shops.length - activeShopsCount;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm bg-[#0e1626] border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto text-xl">
            🔒
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Control Panel</h1>
          <p className="text-xs text-slate-400">Enter server master password to access registered counters.</p>

          {errorMsg && (
            <div className="p-2.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              required
              placeholder="Master Password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-center text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              disabled={verifying}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold text-xs tracking-wide transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              {verifying ? 'Verifying with Server...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-6 sm:p-10 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header with Upload .exe Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">ADMIN CONTROL</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
              ScanToPrint Master Hub
            </h1>
            {uploadSuccessMsg && (
              <span className="text-xs text-emerald-400 font-medium block mt-1">
                {uploadSuccessMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Hidden File Input for .exe */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".exe"
              onChange={handleExeUpload}
              className="hidden"
            />

            {/* UPLOAD .EXE BUTTON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingExe}
              className="text-xs font-bold text-white px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 border border-indigo-500/30 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center gap-2"
            >
              <span>📤</span>
              <span>{isUploadingExe ? 'Uploading Software...' : 'Upload PC Agent (.exe)'}</span>
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="text-xs font-medium text-slate-400 hover:text-rose-400 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* TOP STATS METRIC GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0e1626] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Active Shops</span>
            <div className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{activeShopsCount}</span>
            </div>
            <span className="text-[11px] text-slate-400">Desktop Agents Online & Spooling</span>
          </div>

          <div className="bg-[#0e1626] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Inactive Shops</span>
            <div className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>{inactiveShopsCount}</span>
            </div>
            <span className="text-[11px] text-slate-400">Disconnected or Agent Paused</span>
          </div>

          {/* LIFETIME PRINTS TILL NOW */}
          <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Lifetime Prints Till Now</span>
            <div className="text-2xl font-black text-indigo-200 mt-1 font-mono">
              {totalLifetimePrints.toLocaleString()} <span className="text-sm font-sans font-normal text-indigo-300">Sheets</span>
            </div>
            <span className="text-[11px] text-indigo-300/80">Aggregated across all registered partner stores</span>
          </div>
        </div>

        {/* Registered Shops Master Table */}
        <div className="bg-[#0e1626]/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Registered Partner Counters</h2>
            <button
              onClick={fetchDashboardData}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer font-mono"
            >
              ↻ Refresh Sync
            </button>
          </div>

          {loading && shops.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-mono">Fetching database records...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="p-4">Shop Name</th>
                    <th className="p-4">Agent Status</th>
                    <th className="p-4">Subdomain / View</th>
                    <th className="p-4">UPI ID</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Password</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {shops.map((shop) => {
                    const active = isShopActive(shop);
                    return (
                      <tr key={shop.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 font-sans font-semibold text-white">
                          {shop.business_name || shop.name}
                        </td>
                        <td className="p-4 font-sans">
                          {active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/admin/shops/${shop.slug}`}
                            className="text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center gap-1"
                          >
                            <span>{shop.slug}</span>
                            <span className="text-[11px]">↗</span>
                          </Link>
                        </td>
                        <td className="p-4 text-emerald-400">
                          {shop.upi_id || 'Not Set'}
                        </td>
                        <td className="p-4 text-slate-300">
                          {shop.phone}
                        </td>
                        <td className="p-4 text-rose-400 font-bold bg-rose-500/5 px-2 py-0.5 rounded inline-block mt-3">
                          {shop.plain_password}
                        </td>
                        <td className="p-4 text-right font-sans">
                          <button
                            onClick={() => setShopToDelete(shop)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Delete</span>
                            <span>🗑️</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {shopToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0e1626] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-xl mx-auto">
              ⚠️
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-white">Delete Print Shop?</h2>
              <p className="text-xs text-slate-400">
                Are you sure you want to permanently delete{' '}
                <span className="text-white font-bold font-mono">
                  {shopToDelete.business_name || shopToDelete.name}
                </span>{' '}
                (<span className="font-mono text-indigo-400">{shopToDelete.slug}</span>)?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShopToDelete(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteShop}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}