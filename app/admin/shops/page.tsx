'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminProtectionWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Default master pin for security: "admin123" (aap change kar sakte hain)
  const MASTER_ADMIN_PASS = 'admin123';

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey === MASTER_ADMIN_PASS) {
      setIsAuthenticated(true);
      fetchShops();
    } else {
      setErrorMsg('Unauthorized: Invalid Master Admin Key');
    }
  };

  const fetchShops = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setShops(data);
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-[#0e1626] border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center text-xl font-bold">
            🔒
          </div>
          <h1 className="text-xl font-bold text-white">Super Admin Access</h1>
          <p className="text-xs text-slate-400">Restricted area. Enter master admin password to continue.</p>

          {errorMsg && (
            <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-3">
            <input
              type="password"
              placeholder="Master Admin Key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-center text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-6 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin Control Center</h1>
            <p className="text-xs text-slate-400 mt-1">All registered print shops and live credentials.</p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-4 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
          >
            Lock Admin
          </button>
        </div>

        <div className="bg-[#0e1626] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading database records...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="p-4">Business & Owner</th>
                    <th className="p-4">Login (Phone)</th>
                    <th className="p-4">Password</th>
                    <th className="p-4">UPI ID</th>
                    <th className="p-4">Subdomain</th>
                    <th className="p-4">Agent API Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {shops.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30">
                      <td className="p-4 font-sans">
                        <div className="font-semibold text-white text-sm">{s.business_name || s.name}</div>
                        <div className="text-xs text-slate-400">{s.owner_name} ({s.email})</div>
                      </td>
                      <td className="p-4 text-blue-400">{s.phone}</td>
                      <td className="p-4 text-rose-400 font-bold bg-rose-500/5 px-2 rounded">
                        {s.plain_password}
                      </td>
                      <td className="p-4 text-emerald-400">{s.upi_id || 'N/A'}</td>
                      <td className="p-4 text-slate-300">{s.slug}</td>
                      <td className="p-4 text-amber-400">{s.api_key}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}