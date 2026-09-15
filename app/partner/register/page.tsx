'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PartnerRegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [upiId, setUpiId] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const generateReferralCode = (name: string): string => {
    const cleanName = name.trim().replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5) || 'STP';
    const randomSuffix = Math.floor(100 + Math.random() * 900); // 3-digit random
    return `${cleanName}${randomSuffix}`;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName || !phone || !email || !password || !upiId) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (phone.trim().length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!upiId.includes('@')) {
      setErrorMsg('Please enter a valid UPI ID (e.g. yourname@okaxis / number@paytm).');
      return;
    }

    setLoading(true);

    try {
      // 1. Check if phone already registered
      const { data: existingPartner } = await supabase
        .from('partners')
        .select('id')
        .eq('phone', phone.trim())
        .maybeSingle();

      if (existingPartner) {
        throw new Error('This phone number is already registered as a partner. Please Login.');
      }

      // 2. Generate Unique Referral Code
      let uniqueCode = generateReferralCode(fullName);
      let isCodeUnique = false;
      let attempts = 0;

      while (!isCodeUnique && attempts < 5) {
        const { data: codeCheck } = await supabase
          .from('partners')
          .select('id')
          .eq('referral_code', uniqueCode)
          .maybeSingle();

        if (!codeCheck) {
          isCodeUnique = true;
        } else {
          uniqueCode = generateReferralCode(fullName);
          attempts++;
        }
      }

      // 3. Insert Partner Record
      const { data: newPartner, error: insertError } = await supabase
        .from('partners')
        .insert([
          {
            full_name: fullName.trim(),
            phone: phone.trim(),
            email: email.trim().toLowerCase(),
            password: password.trim(),
            upi_id: upiId.trim(),
            referral_code: uniqueCode,
            total_earned: 0,
            wallet_balance: 0,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Save Session locally and redirect to dashboard
      if (typeof window !== 'undefined') {
        localStorage.setItem('stp_partner_id', newPartner.id);
        localStorage.setItem('stp_partner_data', JSON.stringify(newPartner));
      }

      router.push('/partner/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2">
          <img src="/icon.svg" alt="ScanToPrint" className="h-9 w-9 rounded-xl object-contain" />
          <span className="text-xl font-extrabold text-white tracking-tight">
            ScanToPrint<span className="text-indigo-400"> Partner</span>
          </span>
        </Link>
        <h2 className="text-2xl font-black text-white pt-2">Join Campus & Partner Network</h2>
        <p className="text-xs text-slate-400">
          Onboard print shops, give them 20% OFF, and earn ₹100 - ₹150 instant cash per store.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#0b1021] border border-slate-800/90 py-8 px-6 sm:px-8 rounded-3xl shadow-2xl space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Akash Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#070b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Mobile (User ID)
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#070b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Set Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#070b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="akash@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#070b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                Your UPI ID (For Direct Payouts)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 9876543210@paytm or name@okaxis"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-[#070b18] border border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Your commission will be sent directly to this UPI address on payout request.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer pt-3"
            >
              {loading ? 'Creating Partner Account...' : 'Generate My Partner Code 🚀'}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-400 border-t border-slate-800/80">
            Already a registered partner?{' '}
            <Link href="/partner/login" className="text-indigo-400 hover:text-indigo-300 font-bold underline">
              Partner Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}