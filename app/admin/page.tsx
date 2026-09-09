'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [owner, setOwner] = useState('');
  const [email, setEmail] = useState('');
  const [upi, setUpi] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchShops = async () => {
    setLoading(true);
    const { data } = await supabase.from('shops').select('*').order('created_at', { ascending: false });
    if (data) setShops(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

    const { error } = await supabase.from('shops').insert([
      {
        name,
        slug: cleanSlug,
        owner_name: owner,
        email,
        upi_id: upi,
        phone,
        is_active: true,
      },
    ]);

    if (!error) {
      setName('');
      setSlug('');
      setOwner('');
      setEmail('');
      setUpi('');
      setPhone('');
      fetchShops();
    } else {
      alert('Error creating shop: ' + error.message);
    }
    setSaving(false);
  };

  const handleLogout = () => {
    document.cookie = 'stp_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Admin Control</span>
            <h1 className="text-2xl font-black text-white">Registered Print Shops</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Add Shop Form */}
        <form onSubmit={handleAddShop} className="bg-[#0e1626] border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white">Onboard New Xerox / Print Shop</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              required
              placeholder="Shop Name (e.g. Balod Xerox)"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
            />
            <input
              type="text"
              required
              placeholder="Slug / Subdomain (e.g. balod)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
            />
            <input
              type="text"
              placeholder="Owner Name"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
            />
            <input
              type="email"
              required
              placeholder="Shop Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
            />
            <input
              type="text"
              required
              placeholder="Shop UPI ID (e.g. shop@okaxis)"
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
          >
            {saving ? 'Registering...' : '+ Add Shop'}
          </button>
        </form>

        {/* Real Shops Table */}
        <div className="bg-[#0e1626] border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Shop Name</th>
                <th className="p-4">Subdomain / URL</th>
                <th className="p-4">UPI ID</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">Loading shops...</td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">No shops onboarded yet. Add your first shop above.</td>
                </tr>
              ) : (
                shops.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40">
                    <td className="p-4 font-bold text-white">{s.name}</td>
                    <td className="p-4 font-mono text-indigo-400">
                      <a href={`/shop/${s.slug}`} target="_blank" rel="noreferrer" className="underline">
                        {s.slug}.scantoprint.in (/shop/{s.slug})
                      </a>
                    </td>
                    <td className="p-4 font-mono text-emerald-400">{s.upi_id}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md font-bold text-[10px]">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}