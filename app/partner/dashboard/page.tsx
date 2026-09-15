'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PartnerDashboard() {
  const router = useRouter();

  const [partner, setPartner] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    document.title = 'Partner Dashboard • ScanToPrint';
    fetchPartnerData();
  }, []);

  const fetchPartnerData = async () => {
    if (typeof window === 'undefined') return;

    const partnerId = localStorage.getItem('stp_partner_id');
    if (!partnerId) {
      router.push('/partner/login');
      return;
    }

    setLoading(true);

    try {
      // 1. Fetch Partner Profile
      const { data: partnerData, error: pError } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (pError || !partnerData) {
        localStorage.removeItem('stp_partner_id');
        router.push('/partner/login');
        return;
      }
      setPartner(partnerData);

      // 2. Fetch Shops onboarded using this partner's code
      const { data: referredShops } = await supabase
        .from('shops')
        .select('*')
        .eq('referred_by_code', partnerData.referral_code)
        .order('created_at', { ascending: false });

      if (referredShops) {
        setShops(referredShops);
      }

      // 3. Fetch Payout History
      const { data: payoutHistory } = await supabase
        .from('partner_payouts')
        .select('*')
        .eq('partner_id', partnerData.id)
        .order('created_at', { ascending: false });

      if (payoutHistory) {
        setPayouts(payoutHistory);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!partner?.referral_code) return;
    navigator.clipboard.writeText(partner.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRequestPayout = async () => {
    if (!partner) return;
    setPayoutMsg(null);

    const balance = Number(partner.wallet_balance || 0);

    // Minimum withdrawal condition
    if (balance < 100) {
      setPayoutMsg({
        type: 'error',
        text: 'Minimum payout request is ₹100 (At least 1 active shop onboarded).',
      });
      return;
    }

    // Check if there is already a pending payout
    const hasPending = payouts.some((p) => p.status === 'pending');
    if (hasPending) {
      setPayoutMsg({
        type: 'error',
        text: 'You already have a pending payout request under verification.',
      });
      return;
    }

    setRequestingPayout(true);

    try {
      // 1. Create Payout Request
      const { error: reqError } = await supabase.from('partner_payouts').insert([
        {
          partner_id: partner.id,
          partner_name: partner.full_name,
          partner_upi: partner.upi_id,
          amount: balance,
          status: 'pending',
        },
      ]);

      if (reqError) throw reqError;

      // 2. Deduct wallet balance locally & in DB
      await supabase
        .from('partners')
        .update({ wallet_balance: 0 })
        .eq('id', partner.id);

      setPayoutMsg({
        type: 'success',
        text: `Payout request of ₹${balance} submitted successfully! You will receive payment on UPI: ${partner.upi_id}.`,
      });

      fetchPartnerData();
    } catch (err: any) {
      setPayoutMsg({
        type: 'error',
        text: err.message || 'Failed to submit payout request.',
      });
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stp_partner_id');
      localStorage.removeItem('stp_partner_data');
    }
    router.push('/partner/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-slate-400">Loading Partner Workspace...</span>
        </div>
      </div>
    );
  }

  const walletBalance = Number(partner?.wallet_balance || 0);
  const totalEarned = Number(partner?.total_earned || 0);

  return (
    <div className="min-h-screen bg-[#060813] text-slate-200 font-sans selection:bg-indigo-600 selection:text-white pb-16">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#090d1c]/90 px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img src="/icon.svg" alt="ScanToPrint Logo" className="w-8 h-8 rounded-xl object-contain shadow-md shadow-indigo-600/30" />
          <div>
            <h1 className="font-extrabold text-sm text-white leading-tight flex items-center gap-2">
              <span>{partner?.full_name}</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                Verified Partner
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">UPI: {partner?.upi_id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        
        {/* Referral Promo Code Card */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-[#0b1021] to-[#0e1626] border-2 border-indigo-500/40 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-lg">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Your Exclusive Promo Code
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white pt-1">
              Give 20% Discount, Earn Up to ₹150 / Store
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Share this code with photocopy and cyber cafe shopkeepers. When they register with your code, they get <b className="text-indigo-300">20% instant discount</b> on their first month, and you get direct commission.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#070b18] border border-indigo-500/40 p-2 rounded-2xl shadow-inner">
            <span className="font-mono text-xl sm:text-2xl font-black text-indigo-400 tracking-wider px-3 select-all">
              {partner?.referral_code}
            </span>
            <button
              onClick={handleCopyCode}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-5 shadow-lg space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
              Total Stores Onboarded
            </span>
            <div className="text-3xl font-black font-mono text-white pt-1">
              {shops.length}
            </div>
            <p className="text-[10px] text-slate-500">Shops registered with your code</p>
          </div>

          <div className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-5 shadow-lg space-y-1">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
              Lifetime Earnings
            </span>
            <div className="text-3xl font-black font-mono text-indigo-400 pt-1">
              ₹{totalEarned}
            </div>
            <p className="text-[10px] text-slate-500">Total verified commission earned</p>
          </div>

          <div className="bg-[#0b1021] border border-emerald-500/30 rounded-2xl p-5 shadow-lg space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 uppercase tracking-wider font-semibold block">
                Available Wallet Balance
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-3xl font-black font-mono text-emerald-400 pt-1">
              ₹{walletBalance}
            </div>
            <div className="pt-2">
              <button
                onClick={handleRequestPayout}
                disabled={requestingPayout || walletBalance < 100}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
              >
                {requestingPayout ? 'Processing...' : 'Request UPI Payout →'}
              </button>
            </div>
          </div>
        </div>

        {/* Payout Message Alert */}
        {payoutMsg && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
              payoutMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{payoutMsg.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{payoutMsg.text}</span>
            </div>
            <button onClick={() => setPayoutMsg(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Stores Table */}
        <div className="bg-[#0b1021] border border-slate-800/90 rounded-3xl overflow-hidden shadow-xl space-y-0">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Onboarded Shops & Commission Ledger
            </h3>
            <span className="text-xs font-mono text-slate-400">{shops.length} Shops</span>
          </div>

          {shops.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs space-y-2">
              <div className="text-3xl">🏪</div>
              <p>No shops onboarded yet.</p>
              <p className="text-[11px] text-slate-600">
                Share your promo code <b>{partner?.referral_code}</b> with local print shops to start earning!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-[#070b18]/60">
                    <th className="p-4">Shop Name</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {shops.map((s) => {
                    const plan = (s.plan_type || 'trial').toUpperCase();
                    const isPaidPlan = plan === 'STANDARD' || plan === 'PREMIUM';
                    const commissionAmount = plan === 'PREMIUM' ? 150 : plan === 'STANDARD' ? 100 : 0;

                    return (
                      <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 font-bold text-white">
                          {s.business_name || s.name || 'Store'}
                        </td>
                        <td className="p-4 text-slate-400 font-mono">
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              plan === 'PREMIUM'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : plan === 'STANDARD'
                                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {plan}
                          </span>
                        </td>
                        <td className="p-4">
                          {s.commission_credited ? (
                            <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                              <span>✓</span> Credited to Wallet
                            </span>
                          ) : isPaidPlan ? (
                            <span className="text-amber-400 text-[11px] font-semibold">
                              Pending Admin Approval
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">
                              On 7-Day Trial (Credit on Upgrade)
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-sm">
                          {commissionAmount > 0 ? (
                            <span className="text-emerald-400">+₹{commissionAmount}</span>
                          ) : (
                            <span className="text-slate-600">₹0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payout Withdrawal History */}
        {payouts.length > 0 && (
          <div className="bg-[#0b1021] border border-slate-800/90 rounded-3xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Payout Requests & UPI Settlement History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-[#070b18]/60">
                    <th className="p-4">Request Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Target UPI</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">UTR / Ref No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 text-slate-400 font-mono">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-mono font-bold text-white text-sm">₹{p.amount}</td>
                      <td className="p-4 font-mono text-slate-300">{p.partner_upi}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : p.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          }`}
                        >
                          {p.status === 'paid' ? 'Settled (Paid)' : p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-300">
                        {p.utr_number ? (
                          <span className="text-emerald-400 font-bold">{p.utr_number}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}