'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import HelpDeskModal from '@/components/HelpDeskModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PartnerPortalPage() {
  const [partner, setPartner] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Dashboard state
  const [referredShops, setReferredShops] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMsg, setPayoutMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  useEffect(() => {
    document.title = 'Partner Agent Portal • ScanToPrint';
    const saved = localStorage.getItem('stp_partner_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPartner(parsed);
        setIsLoggedIn(true);
        fetchPartnerDetails(parsed.id);
      } catch (e) {}
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const cleanPhone = phone.trim().replace(/\D/g, '');
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('phone', cleanPhone)
        .eq('plain_password', password.trim())
        .maybeSingle();

      if (error || !data) {
        throw new Error('Invalid mobile number or partner password.');
      }

      if (!data.is_active) {
        throw new Error('Your partner account has been suspended. Please contact admin.');
      }

      setPartner(data);
      setIsLoggedIn(true);
      localStorage.setItem('stp_partner_session', JSON.stringify(data));
      fetchPartnerDetails(data.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnerDetails = async (partnerId: string) => {
    const { data: currentPartner } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (currentPartner) {
      setPartner(currentPartner);
      localStorage.setItem('stp_partner_session', JSON.stringify(currentPartner));

      // Fetch shops onboarded by this partner
      const { data: shops } = await supabase
        .from('shops')
        .select('id, business_name, name, phone, plan_type, subscription_status, created_at, commission_credited')
        .eq('referred_by_code', currentPartner.referral_code)
        .order('created_at', { ascending: false });

      if (shops) setReferredShops(shops);

      // Fetch payout history
      const { data: pList } = await supabase
        .from('partner_payouts')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (pList) setPayouts(pList);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutMsg(null);

    const amount = Number(payoutAmount);
    if (!amount || amount < 100) {
      setPayoutMsg({ type: 'error', text: 'Minimum payout withdrawal request is ₹100.' });
      return;
    }

    if (amount > Number(partner.wallet_balance || 0)) {
      setPayoutMsg({ type: 'error', text: 'Withdrawal amount exceeds your current wallet balance.' });
      return;
    }

    setIsRequestingPayout(true);

    try {
      // Create pending payout request
      const { error: reqError } = await supabase.from('partner_payouts').insert([
        {
          partner_id: partner.id,
          partner_name: partner.full_name,
          partner_upi: partner.upi_id,
          amount: amount,
          status: 'pending',
        },
      ]);

      if (reqError) throw reqError;

      // Deduct balance from wallet
      const newWallet = Number(partner.wallet_balance || 0) - amount;
      await supabase
        .from('partners')
        .update({ wallet_balance: newWallet })
        .eq('id', partner.id);

      setPartner({ ...partner, wallet_balance: newWallet });
      setPayoutAmount('');
      setPayoutMsg({
        type: 'success',
        text: '✓ Payout request submitted! Admin will transfer funds to your UPI shortly.',
      });
      fetchPartnerDetails(partner.id);
    } catch (err: any) {
      setPayoutMsg({ type: 'error', text: err.message || 'Failed to submit payout request.' });
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('stp_partner_session');
    setIsLoggedIn(false);
    setPartner(null);
  };

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#060813] text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-[#0b1021] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/30">
              🤝
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Partner Agent Portal</h1>
            <p className="text-xs text-slate-400">Track referrals, check commissions & withdraw payouts</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Registered Mobile
              </label>
              <input
                type="text"
                required
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#070b18] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter your partner password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#070b18] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Access Partner Dashboard ➔'}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-500">
            Want to become a partner? Contact support at{' '}
            <a href="mailto:scantoprint.support@gmail.com" className="text-indigo-400 underline">
              scantoprint.support@gmail.com
            </a>
          </p>
        </div>

        <HelpDeskModal />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#060813] text-slate-200 font-sans p-6 sm:p-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-500/30">
              🤝
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">{partner?.full_name}</h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                  Active Agent
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                UPI: <span className="font-mono text-slate-300 font-bold">{partner?.upi_id}</span> • 📞 {partner?.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Promo Code Highlight Banner */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-[#0b1021] to-[#070b18] border border-indigo-500/30 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
              Your Exclusive Referral Code
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-widest select-all">
              {partner?.referral_code}
            </div>
            <p className="text-xs text-slate-400">
              Share this code with shopkeepers. Earn ₹100 for Standard & ₹150 for Premium plans!
            </p>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(partner?.referral_code || '');
              alert('Promo Code copied to clipboard!');
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            📋 Copy Code
          </button>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0b1021] border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Withdrawable Wallet Balance
            </span>
            <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
              ₹{partner?.wallet_balance || 0}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Ready for instant UPI payout</p>
          </div>

          <div className="bg-[#0b1021] border border-indigo-500/30 rounded-2xl p-5 shadow-lg">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Lifetime Earnings
            </span>
            <div className="text-3xl font-black font-mono text-indigo-400 mt-1">
              ₹{partner?.total_earned || 0}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Total commissions earned so far</p>
          </div>

          <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Shops Onboarded
            </span>
            <div className="text-3xl font-black font-mono text-white mt-1">
              {referredShops.length} Stores
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Registered using your code</p>
          </div>
        </div>

        {/* Payout Withdrawal Box */}
        <div className="bg-[#0b1021] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>💸</span>
            <span>Request UPI Payout</span>
          </h2>

          {payoutMsg && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${payoutMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'}`}>
              {payoutMsg.text}
            </div>
          )}

          <form onSubmit={handleRequestPayout} className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="number"
                placeholder="Enter amount (Min ₹100)"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="w-full bg-[#070b18] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isRequestingPayout || !payoutAmount}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/30 cursor-pointer whitespace-nowrap"
            >
              {isRequestingPayout ? 'Submitting...' : 'Submit Request ➔'}
            </button>
          </form>
          <p className="text-[11px] text-slate-500">
            Funds are transferred directly to your saved UPI: <span className="font-mono text-slate-300 font-semibold">{partner?.upi_id}</span>
          </p>
        </div>

        {/* Referred Shops List */}
        <div className="bg-[#0b1021] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Referred Shops Directory ({referredShops.length})
          </h2>

          {referredShops.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No shops have registered with your referral code yet. Share your code to start earning!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#070b18] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <th className="p-3">Store Name</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Active Plan</th>
                    <th className="p-3">Commission Status</th>
                    <th className="p-3">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {referredShops.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/20">
                      <td className="p-3 font-bold text-white">{s.business_name || s.name}</td>
                      <td className="p-3 font-mono text-slate-400">{s.phone}</td>
                      <td className="p-3">
                        <span className="uppercase text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                          {s.plan_type || 'trial'}
                        </span>
                      </td>
                      <td className="p-3">
                        {s.commission_credited ? (
                          <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                            ✓ Credited
                          </span>
                        ) : (
                          <span className="text-amber-400 text-[11px]">
                            Pending First Payment
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payout History List */}
        <div className="bg-[#0b1021] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Withdrawal Requests & Payout History
          </h2>

          {payouts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No withdrawal requests made yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#070b18] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <th className="p-3">Requested Amount</th>
                    <th className="p-3">Payout UPI</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Settlement UTR</th>
                    <th className="p-3">Requested On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/20">
                      <td className="p-3 font-mono font-bold text-emerald-400">₹{p.amount}</td>
                      <td className="p-3 font-mono text-slate-300">{p.partner_upi}</td>
                      <td className="p-3">
                        {p.status === 'paid' ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                            Paid
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase animate-pulse">
                            Pending Approval
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {p.utr_number ? (
                          <span className="text-white font-bold select-all">{p.utr_number}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Embedded Help Desk Modal */}
      <HelpDeskModal />
    </div>
  );
}