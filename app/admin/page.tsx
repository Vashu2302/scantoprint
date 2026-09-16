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

  useEffect(() => {
    document.title = 'Central Admin Control • ScanToPrint';
  }, []);

  // Authentication & Data State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Top Master Tab: 'shops' | 'agents'
  const [adminView, setAdminView] = useState<'shops' | 'agents'>('shops');

  // Core Data
  const [shops, setShops] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [payoutsHistory, setPayoutsHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Partner Payout Requests
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [payoutUtrMap, setPayoutUtrMap] = useState<{ [id: string]: string }>({});
  const [settlingPayoutId, setSettlingPayoutId] = useState<string | null>(null);

  // Dynamic Settings
  const [adminUpi, setAdminUpi] = useState('');
  const [isSavingUpi, setIsSavingUpi] = useState(false);
  const [upiStatusMsg, setUpiStatusMsg] = useState('');

  const [agentDriveUrl, setAgentDriveUrl] = useState('');
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [urlStatusMsg, setUrlStatusMsg] = useState('');

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('stp_admin_auth');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
      fetchAdminData();
      fetchPlatformSettings();
      fetchPendingPayouts();
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
        fetchPendingPayouts();
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

  const fetchAdminData = async () => {
    setLoading(true);
    const { data: shopsData } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: partnersData } = await supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: allPayouts } = await supabase
      .from('partner_payouts')
      .select('*')
      .order('created_at', { ascending: false });

    if (shopsData) setShops(shopsData);
    if (partnersData) setPartners(partnersData);
    if (allPayouts) setPayoutsHistory(allPayouts);
    setLoading(false);
  };

  const fetchPendingPayouts = async () => {
    const { data: payoutsData } = await supabase
      .from('partner_payouts')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (payoutsData) setPendingPayouts(payoutsData);
  };

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

  // UTR Shop Approval & Partner Commission Auto-Credit + 28 Days Auto-Extension
  const handleApproveUtr = async (shop: any) => {
    const planType = (shop.plan_type || 'standard').toUpperCase();
    const expectedAmt = planType === 'PREMIUM' ? 249 : 149;

    if (!confirm(`Confirm payment of ₹${expectedAmt} received for "${shop.business_name || shop.name}" (UTR: ${shop.payment_utr})?\n\nThis will add +28 days to the store's subscription.`)) return;

    // Calculate Extended Subscription Date (+28 Days)
    const currentEnd = shop.subscription_end ? new Date(shop.subscription_end) : new Date();
    const baseDate = currentEnd.getTime() > Date.now() ? currentEnd : new Date();
    const newEndDate = new Date(baseDate.getTime() + 28 * 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from('shops')
      .update({
        payment_verified: true,
        subscription_status: 'active',
        is_paused: false,
        subscription_end: newEndDate.toISOString(),
      })
      .eq('id', shop.id);

    if (error) {
      alert('Approval failed: ' + error.message);
      return;
    }

    // Auto-credit Partner Commission if referred
    if (shop.referred_by_code && !shop.commission_credited) {
      const commission = planType === 'PREMIUM' ? 150 : 100;

      try {
        const { data: partner } = await supabase
          .from('partners')
          .select('id, wallet_balance, total_earned')
          .eq('referral_code', shop.referred_by_code.trim().toUpperCase())
          .maybeSingle();

        if (partner) {
          const newWallet = Number(partner.wallet_balance || 0) + commission;
          const newTotal = Number(partner.total_earned || 0) + commission;

          await supabase
            .from('partners')
            .update({ wallet_balance: newWallet, total_earned: newTotal })
            .eq('id', partner.id);

          await supabase
            .from('shops')
            .update({ commission_credited: true })
            .eq('id', shop.id);

          setPartners((prev) =>
            prev.map((p) =>
              p.id === partner.id
                ? { ...p, wallet_balance: newWallet, total_earned: newTotal }
                : p
            )
          );
        }
      } catch (e) {
        console.error('Commission credit error:', e);
      }
    }

    setShops((prev) =>
      prev.map((s) =>
        s.id === shop.id
          ? {
              ...s,
              payment_verified: true,
              is_paused: false,
              commission_credited: true,
              subscription_end: newEndDate.toISOString(),
            }
          : s
      )
    );
  };

  const handleRejectUtr = async (shop: any) => {
    if (!confirm(`REJECT payment for "${shop.business_name || shop.name}"? This will clear the submitted UTR.`)) return;

    const { error } = await supabase
      .from('shops')
      .update({
        payment_verified: false,
        payment_utr: null,
      })
      .eq('id', shop.id);

    if (!error) {
      setShops((prev) =>
        prev.map((s) => (s.id === shop.id ? { ...s, payment_utr: null, payment_verified: false } : s))
      );
    } else {
      alert('Rejection failed: ' + error.message);
    }
  };

  // Settle Payout
  const handleSettlePayout = async (payout: any) => {
    const utr = (payoutUtrMap[payout.id] || '').trim();
    if (utr.length < 4) {
      alert('Please enter a valid 12-digit settlement UTR / transaction ID.');
      return;
    }

    setSettlingPayoutId(payout.id);

    try {
      const { error } = await supabase
        .from('partner_payouts')
        .update({
          status: 'paid',
          utr_number: utr,
          paid_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

      if (error) throw error;

      setPendingPayouts((prev) => prev.filter((p) => p.id !== payout.id));
      fetchAdminData();
      alert(`✓ Payout of ₹${payout.amount} marked as paid to ${payout.partner_name}!`);
    } catch (err: any) {
      alert('Failed to settle payout: ' + err.message);
    } finally {
      setSettlingPayoutId(null);
    }
  };

  const handleTogglePartnerStatus = async (partner: any) => {
    const willActive = !partner.is_active;
    const { error } = await supabase
      .from('partners')
      .update({ is_active: willActive })
      .eq('id', partner.id);

    if (!error) {
      setPartners((prev) =>
        prev.map((p) => (p.id === partner.id ? { ...p, is_active: willActive } : p))
      );
    } else {
      alert('Status update failed: ' + error.message);
    }
  };

  const handleDeletePartner = async (partner: any) => {
    if (!confirm(`Delete partner "${partner.full_name}" (${partner.referral_code}) permanently?`)) return;

    const { error } = await supabase
      .from('partners')
      .delete()
      .eq('id', partner.id);

    if (!error) {
      setPartners((prev) => prev.filter((p) => p.id !== partner.id));
    } else {
      alert('Failed to delete partner: ' + error.message);
    }
  };

  const handleToggleShopPause = async (shop: any) => {
    const willPause = !shop.is_paused;
    const confirmMsg = willPause
      ? `Are you sure you want to PAUSE store "${shop.business_name || shop.name}"? Their agent and customer portal will be locked immediately.`
      : `Resume subscription for store "${shop.business_name || shop.name}"?`;

    if (!confirm(confirmMsg)) return;

    const updatePayload: any = {
      is_paused: willPause,
      agent_status: willPause ? 'paused' : 'active',
      subscription_status: willPause ? 'suspended' : 'active',
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

  // ==========================================
  // CALCULATIONS: SHOPS DOMAIN
  // ==========================================
  const getShopPlanCost = (planType?: string, billingCycle?: string, hasReferral?: boolean) => {
    const p = (planType || '').toLowerCase();
    const c = (billingCycle || '').toLowerCase();
    if (p === 'standard') {
      if (hasReferral) return c === 'yearly' ? 1199 : 119;
      return c === 'yearly' ? 1499 : 149;
    }
    if (p === 'premium') {
      if (hasReferral) return c === 'yearly' ? 1759 : 199;
      return c === 'yearly' ? 2199 : 249;
    }
    return 0;
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let lifetimeSaaSFees = 0;
  let currentMonthSaaSFees = 0;
  let activeStandardCount = 0;
  let activePremiumCount = 0;

  shops.forEach((s) => {
    const p = (s.plan_type || 'trial').toLowerCase();
    const cost = getShopPlanCost(p, s.billing_cycle, Boolean(s.referred_by_code));

    if (cost > 0 && (s.payment_utr || s.payment_verified)) {
      lifetimeSaaSFees += cost;

      const shopDate = s.created_at ? new Date(s.created_at) : null;
      if (shopDate && shopDate.getFullYear() === currentYear && shopDate.getMonth() === currentMonth) {
        currentMonthSaaSFees += cost;
      }
    }

    const isPaused = Boolean(s.is_paused);
    const subEnd = s.subscription_end ? new Date(s.subscription_end) : new Date();
    const isExpired = subEnd.getTime() < Date.now();

    if (!isPaused && !isExpired) {
      if (p === 'standard') activeStandardCount++;
      if (p === 'premium') activePremiumCount++;
    }
  });

  const activeShopsCount = shops.filter((s) => {
    return (
      s.is_online &&
      !s.is_paused &&
      s.last_seen &&
      (Date.now() - new Date(s.last_seen).getTime()) / 1000 < 25
    );
  }).length;

  const pendingUtrShops = shops.filter((s) => s.payment_utr && s.payment_verified !== true);

  // ==========================================
  // CALCULATIONS: AGENTS DOMAIN
  // ==========================================
  let totalPaidToAgentsLifetime = 0;
  let totalPaidToAgentsMonth = 0;

  payoutsHistory.forEach((ph) => {
    if (ph.status === 'paid') {
      const amt = Number(ph.amount || 0);
      totalPaidToAgentsLifetime += amt;

      const paidDate = ph.paid_at ? new Date(ph.paid_at) : null;
      if (paidDate && paidDate.getFullYear() === currentYear && paidDate.getMonth() === currentMonth) {
        totalPaidToAgentsMonth += amt;
      }
    }
  });

  const totalShopsAddedByAgents = shops.filter((s) => Boolean(s.referred_by_code)).length;

  // Filtered lists
  const filteredShops = shops.filter(
    (s) =>
      s.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery) ||
      s.payment_utr?.includes(searchQuery) ||
      s.referred_by_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPartners = partners.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.referral_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.upi_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#060813] text-slate-200 font-sans p-6 sm:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">ScanToPrint Central</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live Fleet Control, Partner Agents Network & Subscription Verification
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

        {/* 1. PENDING PARTNER PAYOUT NOTIFICATION (WITH INSTANT SCAN QR) */}
        {pendingPayouts.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-950/70 via-[#0b1021] to-[#070b18] border-2 border-indigo-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 text-xl">💸</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Partner UPI Payout Requests ({pendingPayouts.length} Pending)
                </h2>
              </div>
              <span className="text-[11px] text-indigo-300 font-sans hidden sm:inline">
                Scan QR directly with your PhonePe / GPay app to pay instantly!
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingPayouts.map((p) => {
                const partnerUpi = p.partner_upi;
                const payAmount = p.amount;
                const encodedName = encodeURIComponent(p.partner_name);
                const payoutUpiUri = `upi://pay?pa=${partnerUpi}&pn=${encodedName}&am=${payAmount}&cu=INR`;
                const payoutQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(payoutUpiUri)}`;

                return (
                  <div key={p.id} className="bg-[#070b18] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Agent</span>
                        <h3 className="font-bold text-white text-sm leading-tight">{p.partner_name}</h3>
                        <p className="text-[11px] font-mono text-emerald-400 font-bold select-all">{partnerUpi}</p>
                        <div className="pt-1">
                          <span className="text-lg font-black font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg inline-block">
                            ₹{payAmount}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-1.5 rounded-xl shadow text-center shrink-0">
                        <img
                          src={payoutQrUrl}
                          alt="Scan to Pay Partner"
                          className="w-20 h-20 object-contain rounded-md"
                        />
                        <span className="text-[8px] font-bold text-slate-700 uppercase tracking-tight block pt-0.5">
                          Scan to Pay
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <input
                        type="text"
                        placeholder="Enter 12-digit UTR from GPay"
                        value={payoutUtrMap[p.id] || ''}
                        onChange={(e) =>
                          setPayoutUtrMap({ ...payoutUtrMap, [p.id]: e.target.value })
                        }
                        className="w-full bg-[#0b1021] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => handleSettlePayout(p)}
                        disabled={settlingPayoutId === p.id}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer"
                      >
                        {settlingPayoutId === p.id ? 'Settling...' : '✓ Confirm & Mark Paid'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. PENDING SHOP UTR ALERT BOX (WITH EXACT AMOUNT, PLAN & ACTION CONTEXT) */}
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
                Match these 12-digit UTR numbers in your bank statement.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingUtrShops.map((ps) => {
                const planType = (ps.plan_type || 'standard').toUpperCase();
                const expectedAmt = planType === 'PREMIUM' ? 249 : 149;
                const isRenewal = Boolean(ps.subscription_end && new Date(ps.subscription_end).getTime() > 0);

                return (
                  <div key={ps.id} className="bg-[#070b18] border border-slate-800 rounded-xl p-4 space-y-3 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-xs">{ps.business_name || ps.name}</h3>
                        <p className="text-[10px] text-slate-400">{ps.owner_name} • {ps.phone}</p>
                        {ps.referred_by_code && (
                          <p className="text-[10px] text-indigo-400 font-mono mt-0.5">
                            Code: {ps.referred_by_code} (+₹{planType === 'PREMIUM' ? 150 : 100} Comm.)
                          </p>
                        )}
                      </div>
                      
                      {/* Price & Plan Tag */}
                      <div className="text-right">
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border inline-block ${
                          planType === 'PREMIUM'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {planType}
                        </span>
                        <div className="text-base font-black font-mono text-emerald-400 pt-0.5">
                          ₹{expectedAmt}
                        </div>
                      </div>
                    </div>

                    {/* Context Tag: Renewal or New Activation */}
                    <div className="flex items-center justify-between text-[10px] px-2.5 py-1 bg-slate-900/60 rounded border border-slate-800">
                      <span className="text-slate-400">Action:</span>
                      <span className="font-bold text-indigo-300">
                        {isRenewal ? 'Plan Renewal / Quota Top-Up (+28 Days)' : 'New Merchant Activation'}
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                        Submitted UTR Ref
                      </span>
                      <span className="font-mono text-xs font-black text-amber-400 select-all block tracking-widest">
                        {ps.payment_utr}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApproveUtr(ps)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg transition-all shadow cursor-pointer"
                      >
                        ✓ Verify & Approve (+28D)
                      </button>
                      <button
                        onClick={() => handleRejectUtr(ps)}
                        className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ROW: DYNAMIC ADMIN RECEIVER UPI & SPOOLER DRIVE LINK */}
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

          {/* SPOOLER PACKAGE URL */}
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

        {/* ========================================================================= */}
        {/* MAIN SECTION SWITCHER TABS (RIGHT BELOW THE 2 BOXES)                     */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-start gap-3 pt-2">
          <div className="bg-[#070b18] p-1.5 rounded-2xl border border-slate-800 flex items-center shadow-lg">
            <button
              type="button"
              onClick={() => {
                setAdminView('shops');
                setSearchQuery('');
              }}
              className={`py-2.5 px-6 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                adminView === 'shops'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏪</span>
              <span>Shops Control ({shops.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminView('agents');
                setSearchQuery('');
              }}
              className={`py-2.5 px-6 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                adminView === 'agents'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🤝</span>
              <span>Partner Agents ({partners.length})</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: SHOPS DOMAIN (METRICS + SHOPS DIRECTORY)                         */}
        {/* ========================================================================= */}
        {adminView === 'shops' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* 4 SHOPS METRIC CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0b1021] border border-emerald-500/30 rounded-2xl p-4 shadow-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  This Month&apos;s SaaS Revenue
                </span>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                  ₹{currentMonthSaaSFees.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  1st to {now.getDate()} {now.toLocaleString('default', { month: 'short' })}
                </p>
              </div>

              <div className="bg-[#0b1021] border border-indigo-500/30 rounded-2xl p-4 shadow-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Lifetime SaaS Revenue
                </span>
                <div className="text-2xl font-black font-mono text-indigo-400 mt-1">
                  ₹{lifetimeSaaSFees.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Total subscription fees collected
                </p>
              </div>

              <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-4 shadow-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active Paid Subscribers
                </span>
                <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                  {activeStandardCount + activePremiumCount} Shops
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  {activeStandardCount} Std • {activePremiumCount} Prem
                </p>
              </div>

              <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-4 shadow-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Fleet Network Status
                </span>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {activeShopsCount} / {shops.length}
                </div>
                <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Online Spoolers</span>
                </p>
              </div>
            </div>

            {/* SHOPS DIRECTORY TABLE */}
            <div className="bg-[#0b1021] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Registered Partner Counters Directory
                </h2>
                <input
                  type="text"
                  placeholder="Search shops by name, slug, phone, UTR or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#070b18] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-full sm:w-80 font-mono"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#070b18] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                      <th className="p-3.5">Store Details</th>
                      <th className="p-3.5">Plan & UTR Verification</th>
                      <th className="p-3.5">Referral Partner</th>
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

                              {s.payment_utr ? (
                                <div className="space-y-1">
                                  <div className="text-[10px] font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800 flex items-center justify-between gap-1">
                                    <span className="text-slate-500">UTR:</span>
                                    <span className="font-bold text-amber-400 select-all tracking-wider">{s.payment_utr}</span>
                                  </div>
                                  {isUtrVerified ? (
                                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 block w-fit">
                                      ✓ VERIFIED
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-1.5 pt-0.5">
                                      <button
                                        onClick={() => handleApproveUtr(s)}
                                        className="text-[10px] bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold transition-all cursor-pointer"
                                      >
                                        ✓ Approve (+28D)
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
                              ) : planType === 'TRIAL' ? (
                                <span className="text-[10px] text-slate-500 font-mono block">Free Trial Plan</span>
                              ) : (
                                <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-mono block w-fit">
                                  ⚠️ UTR Missing
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3.5">
                            {s.referred_by_code ? (
                              <div className="space-y-1">
                                <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded block w-fit">
                                  {s.referred_by_code}
                                </span>
                                {s.commission_credited ? (
                                  <span className="text-[10px] text-emerald-400 font-bold block">
                                    ✓ Commission Paid
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-amber-400 font-semibold block">
                                    ⏳ Pending Approval
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-[11px]">Direct Organic</span>
                            )}
                          </td>

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

                          <td className="p-3.5 font-mono text-[11px]">
                            <div className="text-slate-300">ID: {s.phone}</div>
                            <div className="text-rose-400 font-bold">Pass: {s.plain_password}</div>
                          </td>

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
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: AGENTS DOMAIN (DEDICATED AGENT STATS + AGENTS DIRECTORY)         */}
        {/* ========================================================================= */}
        {adminView === 'agents' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0b1021] border border-emerald-500/30 rounded-2xl p-4 shadow-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Paid to Agents (This Month)
                </span>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                  ₹{totalPaidToAgentsMonth.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Commission payouts settled this month
                </p>
              </div>

              <div className="bg-[#0b1021] border border-indigo-500/30 rounded-2xl p-4 shadow-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Lifetime Paid to Agents
                </span>
                <div className="text-2xl font-black font-mono text-indigo-400 mt-1">
                  ₹{totalPaidToAgentsLifetime.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  All-time agent commissions cleared
                </p>
              </div>

              <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-4 shadow-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Partner Agents
                </span>
                <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                  {partners.length} Agents
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  Active campus/field network
                </p>
              </div>

              <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-4 shadow-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Shops Added by Agents
                </span>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {totalShopsAddedByAgents} Shops
                </div>
                <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                  <span>🚀</span>
                  <span>Acquired via referral codes</span>
                </p>
              </div>
            </div>

            <div className="bg-[#0b1021] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Registered Referral Agents Directory
                </h2>
                <input
                  type="text"
                  placeholder="Search agents by name, phone, code or UPI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#070b18] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-full sm:w-80 font-mono"
                />
              </div>

              <div className="overflow-x-auto">
                {filteredPartners.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                    <div className="text-3xl">🤝</div>
                    <p>No partner agents registered yet.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#070b18] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                        <th className="p-3.5">Agent Details</th>
                        <th className="p-3.5">Promo Code</th>
                        <th className="p-3.5">Payout UPI ID</th>
                        <th className="p-3.5">Shops Onboarded</th>
                        <th className="p-3.5">Earnings & Balance</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredPartners.map((p) => {
                        const referredCount = shops.filter(
                          (s) => s.referred_by_code === p.referral_code
                        ).length;

                        return (
                          <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-white text-sm">{p.full_name}</div>
                              <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                                📞 {p.phone} • {p.email}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Joined: {new Date(p.created_at).toLocaleDateString()}
                              </div>
                            </td>

                            <td className="p-3.5">
                              <span className="font-mono text-sm font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-xl block w-fit select-all tracking-wider">
                                {p.referral_code}
                              </span>
                            </td>

                            <td className="p-3.5">
                              <div className="font-mono text-xs font-bold text-emerald-400 select-all bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg w-fit">
                                {p.upi_id}
                              </div>
                            </td>

                            <td className="p-3.5">
                              <div className="font-mono text-base font-black text-white">
                                {referredCount} <span className="text-[11px] font-normal text-slate-400">Stores</span>
                              </div>
                            </td>

                            <td className="p-3.5 space-y-1">
                              <div className="text-[11px] text-slate-400">
                                Lifetime: <span className="font-mono font-bold text-white">₹{p.total_earned || 0}</span>
                              </div>
                              <div className="text-[11px] text-emerald-400 font-bold">
                                Wallet: <span className="font-mono text-sm font-black">₹{p.wallet_balance || 0}</span>
                              </div>
                            </td>

                            <td className="p-3.5">
                              {p.is_active ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  ACTIVE
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  SUSPENDED
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => handleTogglePartnerStatus(p)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  p.is_active
                                    ? 'bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {p.is_active ? 'Suspend' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePartner(p)}
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
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}