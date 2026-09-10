'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminSuperDashboard() {
  const router = useRouter();

  // Authentication & Data State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Shop & Platform Metrics
  const [shops, setShops] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Agent Upload State
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check login state on mount
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('stp_admin_auth');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(false);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: inputPassword }),
      });

      if (res.ok) {
        sessionStorage.setItem('stp_admin_auth', 'true');
        setIsAuthenticated(true);
        fetchAdminData();
      } else {
        setAuthError(true);
      }
    } catch {
      setAuthError(true);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('stp_admin_auth');
    setIsAuthenticated(false);
    setInputPassword('');
  };

  // Fetch shops & orders
  const fetchAdminData = async () => {
    setLoading(true);
    const { data: shopsData } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (shopsData) setShops(shopsData);
    if (ordersData) setOrders(ordersData);
    setLoading(false);
  };

  // Upload ScanToPrint.zip to Supabase 'software' bucket
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingZip(true);
    setUploadSuccessMsg('');

    try {
      const { error } = await supabase.storage
        .from('software')
        .upload('ScanToPrint.zip', file, {
          upsert: true,
          contentType: 'application/zip',
        });

      if (error) throw error;

      setUploadSuccessMsg('✓ New ScanToPrint.zip package uploaded successfully!');
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploadingZip(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteShop = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete store "${name}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase.from('shops').delete().eq('id', id);
    if (!error) {
      setShops((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert('Failed to delete shop: ' + error.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4 font-sans">
        <form
          onSubmit={handleAdminLogin}
          className="bg-[#0b1021] border border-slate-800 p-8 rounded-3xl w-full max-w-sm space-y-5 shadow-2xl"
        >
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/30">
              ⚡
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">Platform SuperAdmin</h1>
            <p className="text-xs text-slate-400">Master Authentication Required</p>
          </div>

          <div className="space-y-2">
            <input
              type="password"
              placeholder="Enter Master Password"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              className="w-full bg-[#070b18] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono transition-all"
              autoFocus
            />
            {authError && (
              <p className="text-rose-400 text-[11px] font-semibold">
                Invalid Master Authorization Key.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            Access Control Panel
          </button>
        </form>
      </div>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid' || o.payment_status === 'completed')
    .reduce((sum, o) => sum + Number(o.amount || 0), 0);

  const totalPrints = orders
    .filter((o) => o.print_status === 'completed')
    .reduce((sum, o) => sum + (Number(o.pages || 1) * Number(o.copies || 1)), 0);

  const activeShopsCount = shops.filter((s) => {
    return (
      s.is_online &&
      s.last_seen &&
      (Date.now() - new Date(s.last_seen).getTime()) / 1000 < 25
    );
  }).length;

  const filteredShops = shops.filter(
    (s) =>
      s.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#060813] text-slate-200 font-sans p-6 sm:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">ScanToPrint Central</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live Fleet Control, Merchant Directory & Deployment Hub
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".zip"
              onChange={handleZipUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingZip}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <span>📦</span>
              <span>{isUploadingZip ? 'Uploading Package...' : 'Upload PC Package (.zip)'}</span>
            </button>

            <button
              onClick={handleAdminLogout}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>

        {uploadSuccessMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold">
            {uploadSuccessMsg}
          </div>
        )}

        {/* Global Platform Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Registered Shops</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">{shops.length}</div>
          </div>
          <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Spooler Nodes</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{activeShopsCount} Online</div>
          </div>
          <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lifetime Platform Revenue</span>
            <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">₹{totalRevenue.toFixed(2)}</div>
          </div>
          <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sheets Printed</span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{totalPrints} Sheets</div>
          </div>
        </div>

        {/* Merchant Directory */}
        <div className="bg-[#0b1021] border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Registered Partner Counters</h2>
            <input
              type="text"
              placeholder="Search store by name, slug or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#070b18] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-full max-w-xs font-mono"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#070b18] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <th className="p-3.5">Store Details</th>
                  <th className="p-3.5">Subdomain / Link</th>
                  <th className="p-3.5">Spooler Telemetry</th>
                  <th className="p-3.5">Credentials</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredShops.map((s) => {
                  const isStoreOnline = Boolean(
                    s.is_online &&
                    s.last_seen &&
                    (Date.now() - new Date(s.last_seen).getTime()) / 1000 < 25
                  );
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm">{s.business_name || s.name}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">Owner: {s.owner_name || 'N/A'}</div>
                      </td>
                      <td className="p-3.5 font-mono text-indigo-400 text-[11px]">
                        <a
                          href={`/shop/${s.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          scantoprint.in/shop/{s.slug} ↗
                        </a>
                      </td>
                      <td className="p-3.5">
                        {isStoreOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            CONNECTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            OFFLINE
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-[11px]">
                        <div className="text-slate-300">ID: {s.phone}</div>
                        <div className="text-rose-400 font-bold">Pass: {s.plain_password}</div>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => router.push(`/admin/shops/${s.slug}`)}
                          className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Inspect 360°
                        </button>
                        <button
                          onClick={() => handleDeleteShop(s.id, s.business_name || s.name)}
                          className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}