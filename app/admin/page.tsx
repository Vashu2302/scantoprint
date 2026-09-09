'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Shop {
  id: string;
  name: string;
  owner: string;
  phone: string;
  status: 'Active' | 'Inactive';
  monthlyPrints: number;
  revenue: number;
  plan: string;
}

export default function SuperAdminDashboard() {
  const [shops] = useState<Shop[]>([
    {
      id: 'shop-01',
      name: 'Balod Central Xerox & Cyber',
      owner: 'Ramesh Sharma',
      phone: '+91 98765 43210',
      status: 'Active',
      monthlyPrints: 1420,
      revenue: 4260,
      plan: 'Commercial (₹999)',
    },
    {
      id: 'shop-02',
      name: 'Campus Fast Print Corner',
      owner: 'Amit Patel',
      phone: '+91 91234 56789',
      status: 'Active',
      monthlyPrints: 890,
      revenue: 2670,
      plan: 'Starter (₹499)',
    },
    {
      id: 'shop-03',
      name: 'Station Road Digital Copies',
      owner: 'Vikas Sahu',
      phone: '+91 99887 76655',
      status: 'Inactive',
      monthlyPrints: 0,
      revenue: 0,
      plan: 'Starter (₹499)',
    },
  ]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Admin Topbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090d16]/80 border-b border-slate-800/80 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black text-lg text-white shadow-md shadow-indigo-600/30">
            S
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white">ScanToPrint</span>
            <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Super Admin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Logout
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="p-6 rounded-3xl bg-[#0f172a]/70 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Stores</span>
            <div className="text-3xl font-black text-white mt-2">12</div>
            <p className="text-xs text-emerald-400 mt-2 font-medium">↑ 10 Active subscriptions</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0f172a]/70 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Prints Routed</span>
            <div className="text-3xl font-black text-white mt-2">24,580</div>
            <p className="text-xs text-indigo-400 mt-2 font-medium">Across all network shops</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0f172a]/70 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform SaaS ARR</span>
            <div className="text-3xl font-black text-white mt-2">₹1,18,800</div>
            <p className="text-xs text-emerald-400 mt-2 font-medium">Annualized recurring</p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0f172a]/70 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Network Volume</span>
            <div className="text-3xl font-black text-white mt-2">₹73,740</div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Processed this month</p>
          </div>
        </div>

        {/* Shops Directory Table */}
        <div className="rounded-3xl bg-[#0f172a]/70 border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Registered Print Stores</h2>
              <p className="text-xs text-slate-400 mt-1">Manage shopkeeper licenses, print volumes, and live portals</p>
            </div>
            <button className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30">
              + Onboard New Shop
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Shop Details</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Subscription</th>
                  <th className="px-6 py-4">Prints this month</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {shops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{shop.name}</div>
                      <div className="text-xs text-slate-500">ID: {shop.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-200">{shop.owner}</div>
                      <div className="text-xs text-slate-500">{shop.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
                        {shop.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-200">{shop.monthlyPrints.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          shop.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {shop.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href="/dashboard"
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                      >
                        View Portal →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}