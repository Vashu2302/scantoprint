'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PartnerLoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phone || !password) {
      setErrorMsg('Please enter both mobile number and password.');
      return;
    }

    setLoading(true);

    try {
      const { data: partner, error } = await supabase
        .from('partners')
        .select('*')
        .eq('phone', phone.trim())
        .eq('password', password.trim())
        .maybeSingle();

      if (error || !partner) {
        throw new Error('Invalid mobile number or password. Please try again.');
      }

      if (!partner.is_active) {
        throw new Error('Your partner account is suspended. Please contact admin.');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('stp_partner_id', partner.id);
        localStorage.setItem('stp_partner_data', JSON.stringify(partner));
      }

      router.push('/partner/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
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
        <h2 className="text-2xl font-black text-white pt-2">Partner Dashboard Login</h2>
        <p className="text-xs text-slate-400">
          Track your onboarded shops, commission earnings, and request UPI payouts.
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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Registered Mobile Number
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="10-digit mobile"
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
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#070b18] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer pt-3"
            >
              {loading ? 'Verifying...' : 'Login to Dashboard →'}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-400 border-t border-slate-800/80">
            Want to become a partner?{' '}
            <Link href="/partner/register" className="text-indigo-400 hover:text-indigo-300 font-bold underline">
              Register here (Free)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}