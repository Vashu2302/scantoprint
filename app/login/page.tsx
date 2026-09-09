'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Standard demo authentication check
    setTimeout(() => {
      if (
        (email === 'admin@balodprint.com' || email === 'shop-01' || email === 'admin') &&
        password === 'admin123'
      ) {
        router.push('/dashboard');
      } else {
        setError('Galat credentials! Email: admin@balodprint.com aur Password: admin123 use karein.');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md p-8 rounded-[2rem] bg-[#0f172a]/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-600/30 mb-3">
            S
          </div>
          <h1 className="text-xl font-extrabold text-white">Shopkeeper Login</h1>
          <p className="text-xs text-slate-400 mt-1">ScanToPrint Central Dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Email ya Shop ID
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@balodprint.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            Demo credentials: <br />
            <b className="text-slate-200">Email:</b> admin@balodprint.com | <b className="text-slate-200">Pass:</b> admin123
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-bold text-sm text-white transition-all shadow-lg shadow-indigo-600/30"
          >
            {loading ? 'Verifying...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}