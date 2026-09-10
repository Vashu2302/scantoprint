'use client';

import React, { useState } from 'react';

export default function RegisterMerchantPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({
    ownerName: '',
    businessName: '',
    mobile: '',
    upiId: '',
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/shops/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed. Please check details.');
      }

      // Session save karein
      if (typeof window !== 'undefined') {
        localStorage.setItem('stp_merchant_token', data.shop.api_key);
        localStorage.setItem('stp_merchant_shop', JSON.stringify(data.shop));
        // Hard refresh redirect - Login page bilkul bypass hoga
        window.location.replace(`/dashboard/${data.shop.slug}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0e1626] border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Create merchant account
          </h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Enter your details. You will directly enter your store dashboard.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Owner name
            </label>
            <input
              required
              name="ownerName"
              type="text"
              placeholder="Your full name"
              value={form.ownerName}
              onChange={handleChange}
              className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Business name
            </label>
            <input
              required
              name="businessName"
              type="text"
              placeholder="Your shop or business name"
              value={form.businessName}
              onChange={handleChange}
              className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Mobile number (Login ID)
            </label>
            <input
              required
              name="mobile"
              type="tel"
              maxLength={10}
              placeholder="10-digit business mobile"
              value={form.mobile}
              onChange={handleChange}
              className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              UPI ID (For Customer Payments)
            </label>
            <input
              required
              name="upiId"
              type="text"
              placeholder="e.g. 9826xxxxxx@ybl / shopname@okaxis"
              value={form.upiId}
              onChange={handleChange}
              className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email address
            </label>
            <input
              required
              name="email"
              type="email"
              placeholder="you@yourshop.com"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Create password
            </label>
            <input
              required
              name="password"
              type="password"
              minLength={6}
              placeholder="8+ characters"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'Opening Your Dashboard...' : 'Create your account'}
          </button>
        </form>
      </div>
    </main>
  );
}