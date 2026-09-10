'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function MerchantLoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed. Please verify credentials.');
      }

      // Store auth session
      if (typeof window !== 'undefined') {
        localStorage.setItem('stp_merchant_token', data.shop.api_key);
        localStorage.setItem('stp_merchant_shop', JSON.stringify(data.shop));
      }

      // Hard redirect to merchant dashboard
      window.location.href = `/dashboard/${data.slug}`;

    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to server');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0e1626]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Merchant Login</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your print orders, store QR standee, and spooler settings.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Mobile Number or Email
            </label>
            <input
              type="text"
              required
              placeholder="Enter 10-digit mobile or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-[#070b14]/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#070b14]/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25 cursor-pointer disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Verifying credentials...' : 'Login to Dashboard'}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link href="/register" className="text-xs text-indigo-400 hover:underline">
            Don&apos;t have an account? Register your shop
          </Link>
        </div>
      </div>
    </div>
  );
}