'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'shop' | 'admin'>('shop');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Super Admin static credentials
    if (role === 'admin') {
      if (email === 'admin@scantoprint.in' && password === 'Admin@12345') {
        document.cookie = 'stp_auth_token=super_admin_session; path=/; max-age=86400';
        router.push('/admin');
        return;
      } else {
        setError('Invalid Super Admin credentials!');
        setLoading(false);
        return;
      }
    }

    // Shopkeeper Login check
    if (role === 'shop') {
      if (email.includes('@') && password.length >= 6) {
        document.cookie = `stp_auth_token=shop_${email}; path=/; max-age=86400`;
        router.push('/dashboard');
        return;
      } else {
        setError('Invalid shop credentials (Password must be 6+ chars)');
        setLoading(false);
        return;
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0e1626] border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-indigo-600 items-center justify-center text-xl font-black text-white shadow-lg shadow-indigo-500/30 mb-2">
            S
          </div>
          <h1 className="text-2xl font-black text-white">Sign In to ScanToPrint</h1>
          <p className="text-xs text-slate-400">Access your store dashboard or super admin portal</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setRole('shop')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              role === 'shop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Shop Owner
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              role === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Super Admin
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'admin' ? 'admin@scantoprint.in' : 'shop@example.com'}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30"
          >
            {loading ? 'Authenticating...' : `Login as ${role === 'admin' ? 'Super Admin' : 'Shop Owner'}`}
          </button>
        </form>
      </div>
    </div>
  );
}