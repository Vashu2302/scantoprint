'use client';

import React, { useEffect, useState } from 'react';
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

  // Dynamic Admin UPI Manager
  const [adminUpi, setAdminUpi] = useState('');
  const [isSavingUpi, setIsSavingUpi] = useState(false);
  const [upiStatusMsg, setUpiStatusMsg] = useState('');

  // Dynamic Google Drive Agent URL State
  const [agentDriveUrl, setAgentDriveUrl] = useState('');
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [urlStatusMsg, setUrlStatusMsg] = useState('');

  // Check login state on mount
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('stp_admin_auth');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
      fetchAdminData();
      fetchPlatformSettings();
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
        fetchPlatformSettings();
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

  // Fetch platform settings (Admin UPI + Drive Link)
  const fetchPlatformSettings = async () => {
    try {
      const { data: upiData } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'admin_upi_id')
        .single();

      if (upiData?.value) {
        setAdminUpi(upiData.value);
      } else {
        setAdminUpi('9826000000@ybl');
      }

      const { data: driveData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'agent_download_url')
        .single();

      if (driveData?.value) {
        setAgentDriveUrl(driveData.value);
      } else {
        setAgentDriveUrl('https://drive.google.com/uc?export=download&id=18JXGyDe3bhBaJKgnAlqSey-4kGmrtc_j');
      }
    } catch {
      setAdminUpi('9826000000@ybl');
      setAgentDriveUrl('https://drive.google.com/uc?export=download&id=18JXGyDe3bhBaJKgnAlqSey-4kGmrtc_j');
    }
  };

  // Save Admin UPI ID
  const handleSaveAdminUpi = async () => {
    if (!adminUpi.trim()) {
      alert('Please enter a valid UPI ID.');
      return;
    }

    setIsSavingUpi(true);
    setUpiStatusMsg('');

    try {
      const { error } = await supabase
        .from('app_config')
        .upsert(
          { key: 'admin_upi_id', value: adminUpi.trim() },
          { onConflict: 'key' }
        );

      if (error) throw error;

      setUpiStatusMsg('✓ Admin Receiver UPI updated! All plan checkouts will now use this UPI.');
      setTimeout(() => setUpiStatusMsg(''), 4000);
    } catch (err: any) {
      alert('Failed to update Admin UPI: ' + err.message);
    } finally {
      setIsSavingUpi(false);
    }
  };

  // Save new Google Drive link
  const handleSaveAgentUrl = async () => {
    if (!agentDriveUrl.trim()) {
      alert('Please enter a valid URL.');
      return;
    }

    setIsSavingUrl(true);
    setUrlStatusMsg('');

    try {
      let finalUrl = agentDriveUrl.trim();
      if (finalUrl.includes('/file/d/')) {
        const fileId = finalUrl.split('/file/d/')[1].split('/')[0];
        finalUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        setAgentDriveUrl(finalUrl);
      }

      const { error } = await supabase
        .from('app_settings')
        .upsert(
          { key: 'agent_download_url', value: finalUrl },
          { onConflict: 'key' }
        );

      if (error) throw error;

      setUrlStatusMsg('✓ Agent download URL updated and synced across all shops!');
      setTimeout(() => setUrlStatusMsg(''), 4000);
    } catch (err: any) {
      alert('Failed to update URL: ' + err.message);
    } finally {
      setIsSavingUrl(false);
    }
  };

  // =========================================================================
  // UTR SUBSCRIPTION VERIFICATION ACTIONS
  // =========================================================================
  const handleApproveUtr = async (shop: any) => {
    if (!confirm(`Confirm payment received for "${shop.business_name || shop.name}" (UTR: ${shop.payment_utr})?`)) return;

    const { error } = await supabase
      .from('shops')
      .update({
        payment_verified: true,
        subscription_status: 'active',
        is_paused: false
      })
      .eq('id', shop.id);

    if (!error) {
      setShops((prev) =>
        prev.map((s) => (s.id === shop.id ? { ...s, payment_verified: true, is_paused: false } : s))
      );
    } else {
      alert('Approval failed: ' + error.message);
    }
  };

  const handleRejectUtr = async (shop: any) => {
    if (!confirm(`REJECT payment for "${shop.business_name || shop.name}"? This will pause their shop immediately.`)) return;

    const { error } = await supabase
      .from('shops')
      .update({
        payment_verified: false,
        subscription_status: 'suspended',
        is_paused: true,
        agent_status: 'paused'
      })
      .eq('id', shop.id);

    if (!error) {
      setShops((prev) =>
        prev.map((s) => (s.id === shop.id ? { ...s, is_paused: true, subscription_status: 'suspended' } : s))
      );
    } else {
      alert('Rejection failed: ' + error.message);
    }
  };

  // Toggle Pause/Resume Subscription (Hard Lock)
  const handleToggleShopPause = async (shop: any) => {
    const willPause = !shop.is_paused;
    const confirmMsg = willPause
      ? `Are you sure you want to PAUSE store "${shop.business_name || shop.name}"? Their agent and customer portal will be hard-locked immediately.`
      : `Resume subscription for store "${shop.business_name || shop.name}"?`;

    if (!confirm(confirmMsg)) return;

    const updatePayload: any = {
      is_paused: willPause,
      agent_status: willPause ? 'paused' : 'active',
      subscription_status: willPause ? 'suspended' : 'active'
    };

    const { error } = await supabase
      .from('shops')
      .update(updatePayload)
      .eq('id', shop.id);

    if (!error) {
      setShops((prev) =>
        prev.map((s) => (s.id === shop.id ? { ...s, ...updatePayload } : s))
      );
    } else {
      alert('Failed to update status: ' + error.message);
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
      !s.is_paused &&
      s.last_seen &&
      (Date.now() - new Date(s.last_seen).getTime()) / 1000 < 25
    );
  }).length;

  // Filter pending verification shops
  const pendingUtrShops = shops.filter((s) => s.payment_utr && s.payment_verified !== true);

  const filteredShops = shops.filter(
    (s) =>
      s.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery) ||
      s.payment_utr?.includes(searchQuery)
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
              Live Fleet Control, Subscription UTR Verification & Merchant Directory
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAdminLogout}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* PENDING UTR SUBSCRIPTION VERIFICATIONS ALERT BOX                          */}
        {/* ========================================================================= */}
        {pendingUtrShops.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-lg">⚠️</span>
                <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                  Pending Subscription Verifications ({pendingUtrShops.length} Need Review)
                </h2>
              </div>
              <span className="text-[11px] text-amber-200/70 font-sans">
                Match these 12-digit UTR numbers in your PhonePe / GPay bank statement.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingUtrShops.map((ps) => (
                <div key={ps.id} className="bg-[#070b18] border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-xs">{ps.business_name || ps.name}</h3>
                      <p className="text-[10px] text-slate-400">{ps.owner_name} • {ps.phone}</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {ps.plan_type || 'STANDARD'}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Submitted UTR Ref</span>
                    <span className="font-mono text-xs font-black text-amber-400 select-all block tracking-widest">
                      {ps.payment_utr}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleApproveUtr(ps)}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg transition-all shadow cursor-pointer"
                    >
                      ✓ Verify & Approve
                    </button>
                    <button
                      onClick={() => handleRejectUtr(ps)}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROW: DYNAMIC ADMIN UPI & DRIVE LINK */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* ADMIN RECEIVER UPI */}
          <div className="bg-[#0b1021] border border-emerald-500/30 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-sm">💰 Platform Admin Receiver UPI</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                  Live Receiver
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Money paid by new shopkeepers for Standard/Premium plans lands directly in this UPI.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <input
                type="text"
                placeholder="e.g. yourname@okaxis or 9826xxxxxx@ybl"
                value={adminUpi}
                onChange={(e) => setAdminUpi(e.target.value)}
                className="flex-1 bg-[#070b18] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSaveAdminUpi}
                disabled={isSavingUpi}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/30 cursor-pointer whitespace-nowrap"
              >
                {isSavingUpi ? 'Saving...' : 'Save UPI'}
              </button>
            </div>

            {upiStatusMsg && (
              <p className="text-xs text-emerald-400 font-semibold pt-1">{upiStatusMsg}</p>
            )}
          </div>

          {/* GOOGLE DRIVE AGENT DOWNLOAD LINK */}
          <div className="bg-[#0b1021] border border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 font-bold text-sm">📦 Spooler Package URL (.exe)</span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
                  Google Drive Direct
                </span>
              </div>
              {agentDriveUrl && (
                <a
                  href={agentDriveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline font-mono"
                >
                  Test Link ↗
                </a>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              When updating `.exe`, upload to Drive and paste the link here.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <input
                type="text"
                placeholder="Paste Google Drive Direct/Share Link..."
                value={agentDriveUrl}
                onChange={(e) => setAgentDriveUrl(e.target.value)}
                className="flex-1 bg-[#070b18] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                onClick={handleSaveAgentUrl}
                disabled={isSavingUrl}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer whitespace-nowrap"
              >
                {isSavingUrl ? 'Saving...' : 'Save Link'}
              </button>
            </div>

            {urlStatusMsg && (
              <p className="text-xs text-emerald-400 font-semibold pt-1">{urlStatusMsg}</p>
            )}
          </div>

        </div>

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
              placeholder="Search by store name, slug, phone or UTR..."
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
                  <th className="p-3.5">Plan & UTR Verification</th>
                  <th className="p-3.5">Counter Telemetry</th>
                  <th className="p-3.5">Credentials</th>
                  <th className="p-3.5">Subscription Lock</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredShops.map((s) => {
                  const isStoreOnline = Boolean(
                    s.is_online &&
                    !s.is_paused &&
                    s.last_seen &&
                    (Date.now() - new Date(s.last_seen).getTime()) / 1000 < 25
                  );

                  const subEnd = s.subscription_end ? new Date(s.subscription_end) : new Date();
                  const isExpired = subEnd.getTime() < Date.now();
                  const daysLeft = isExpired
                    ? 0
                    : Math.ceil((subEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const planType = (s.plan_type || 'trial').toUpperCase();
                  const isPaused = Boolean(s.is_paused);
                  const isUtrVerified = s.payment_verified === true;

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                      {/* Store details */}
                      <td className="p-3.5">
                        <button
                          onClick={() => router.push(`/admin/shops/${s.slug}`)}
                          className="font-bold text-white text-sm hover:text-indigo-400 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{s.business_name || s.name}</span>
                          <span className="text-[10px] text-indigo-400 font-mono">⚡ 360°</span>
                        </button>
                        <div className="text-slate-400 text-[11px] mt-0.5">Owner: {s.owner_name || 'N/A'}</div>
                        <a
                          href={`/shop/${s.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-slate-500 hover:text-slate-300 hover:underline inline-block mt-0.5"
                        >
                          (Customer QR Page ↗)
                        </a>
                      </td>

                      {/* Plan & UTR Verification Status */}
                      <td className="p-3.5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                              planType === 'PREMIUM'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : planType === 'STANDARD'
                                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {planType}
                            </span>
                            {isPaused ? (
                              <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                                PAUSED
                              </span>
                            ) : isExpired ? (
                              <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded animate-pulse">
                                EXPIRED
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                {daysLeft}D LEFT
                              </span>
                            )}
                          </div>

                          {/* UTR Verification Tag & Action */}
                          {s.payment_utr ? (
                            <div className="space-y-1">
                              <div className="text-[10px] font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800 flex items-center justify-between gap-1">
                                <span className="text-slate-500">UTR:</span>
                                <span className="font-bold text-amber-400 select-all">{s.payment_utr}</span>
                              </div>
                              {isUtrVerified ? (
                                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 block w-fit">
                                  ✓ UTR VERIFIED
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5 pt-0.5">
                                  <button
                                    onClick={() => handleApproveUtr(s)}
                                    className="text-[10px] bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold transition-all cursor-pointer"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectUtr(s)}
                                    className="text-[10px] bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-bold transition-all cursor-pointer"
                                  >
                                    ✕ Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono block">No UTR (Trial)</span>
                          )}
                        </div>
                      </td>

                      {/* Online Status */}
                      <td className="p-3.5">
                        {isPaused ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            ⏸️ DISABLED
                          </span>
                        ) : isStoreOnline ? (
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

                      {/* Credentials */}
                      <td className="p-3.5 font-mono text-[11px]">
                        <div className="text-slate-300">ID: {s.phone}</div>
                        <div className="text-rose-400 font-bold">Pass: {s.plain_password}</div>
                      </td>

                      {/* Pause / Resume Toggle */}
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleShopPause(s)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow ${
                            isPaused
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-amber-600 hover:bg-amber-500 text-white'
                          }`}
                        >
                          <span>{isPaused ? '▶️' : '⏸️'}</span>
                          <span>{isPaused ? 'Resume Shop' : 'Pause Shop'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => router.push(`/admin/shops/${s.slug}`)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-md shadow-indigo-600/30"
                        >
                          Inspect 360° ⚡
                        </button>
                        <button
                          onClick={() => handleDeleteShop(s.id, s.business_name || s.name)}
                          className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-all"
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