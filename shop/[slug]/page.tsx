'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DynamicShopPortal() {
  const params = useParams();
  const slug = params?.slug as string;

  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShop() {
      if (!slug) return;
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (!error && data) {
        setShop(data);
      }
      setLoading(false);
    }
    fetchShop();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 text-sm">
        Loading Shop Portal...
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-white p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Shop Not Found</h1>
        <p className="text-xs text-slate-400 mb-6">The shop URL you entered does not exist or is inactive.</p>
        <Link href="/" className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg bg-[#0e1626] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-center">
        <div className="inline-flex h-12 w-12 rounded-2xl bg-indigo-600 items-center justify-center text-xl font-black text-white shadow-lg shadow-indigo-500/30">
          {shop.name.charAt(0)}
        </div>
        <div>
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
            Verified Partner Shop
          </span>
          <h1 className="text-2xl font-black text-white mt-2">{shop.name}</h1>
          <p className="text-xs text-slate-400">Direct Auto-Printing Counter</p>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Owner:</span>
            <span className="text-white font-semibold">{shop.owner_name || 'Counter Operator'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Direct UPI:</span>
            <span className="text-emerald-400 font-mono font-semibold">{shop.upi_id}</span>
          </div>
        </div>

        <Link
          href={`/upload?shop_id=${shop.id}`}
          className="block w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-center"
        >
          Proceed to Upload Documents
        </Link>
      </div>
    </div>
  );
}