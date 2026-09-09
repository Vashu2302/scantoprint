'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function UploadContent() {
  const searchParams = useSearchParams();
  const shopId = searchParams.get('shop_id');

  const [shop, setShop] = useState<any>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(1);
  const [copies, setCopies] = useState(1);
  const [colorMode, setColorMode] = useState<'bw' | 'color'>('bw');
  const [uploading, setUploading] = useState(false);
  const [jobSuccess, setJobSuccess] = useState(false);

  useEffect(() => {
    async function getShop() {
      if (!shopId) {
        // Fallback: Agar shop_id URL me na ho toh first active shop fetch karo
        const { data } = await supabase.from('shops').select('*').limit(1).single();
        setShop(data);
      } else {
        const { data } = await supabase.from('shops').select('*').eq('id', shopId).single();
        setShop(data);
      }
      setLoadingShop(false);
    }
    getShop();
  }, [shopId]);

  // Rates from shop settings or default standard rates
  const bwPrice = shop?.bw_rate || 2;
  const colorPrice = shop?.color_rate || 10;
  const perPagePrice = colorMode === 'bw' ? bwPrice : colorPrice;
  const totalCost = pages * copies * perPagePrice;

  const handleUploadAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !shop) return;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `prints/${fileName}`;

      // Upload file to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('print-files')
        .upload(filePath, file);

      if (storageError) throw storageError;

      const { data: publicUrlData } = supabase.storage
        .from('print-files')
        .getPublicUrl(filePath);

      // Insert Print Job
      const { error: insertError } = await supabase.from('print_jobs').insert([
        {
          shop_id: shop.id,
          file_name: file.name,
          file_url: publicUrlData.publicUrl,
          page_count: pages,
          copies: copies,
          color_mode: colorMode,
          amount: totalCost,
          status: 'queued',
        },
      ]);

      if (insertError) throw insertError;
      setJobSuccess(true);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loadingShop) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 text-xs">
        Loading Print Counter...
      </div>
    );
  }

  if (jobSuccess) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0e1626] border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
            ✓
          </div>
          <h2 className="text-xl font-bold">Document Queued Successfully!</h2>
          <p className="text-xs text-slate-400">
            Your document has been sent directly to <b className="text-white">{shop?.name}</b> printer spooler.
          </p>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-left text-xs space-y-1 font-mono">
            <div>Amount: ₹{totalCost}</div>
            <div>Pages: {pages} × {copies} copies ({colorMode.toUpperCase()})</div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-indigo-600 rounded-xl text-xs font-bold"
          >
            Upload Another Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-lg bg-[#0e1626] border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full">
            Print Counter
          </span>
          <h1 className="text-2xl font-black text-white">{shop?.name}</h1>
          <p className="text-xs text-slate-400">Direct Auto-Spooler Document Station</p>
        </div>

        <form onSubmit={handleUploadAndPay} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Select Document (PDF / Image)
            </label>
            <input
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer bg-slate-900/80 p-2 rounded-xl border border-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Pages in File</label>
              <input
                type="number"
                min="1"
                value={pages}
                onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Copies</label>
              <input
                type="number"
                min="1"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-400 uppercase tracking-wider block mb-2">Print Color</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setColorMode('bw')}
                className={`py-2.5 rounded-xl font-bold border transition-all ${
                  colorMode === 'bw'
                    ? 'border-indigo-500 bg-indigo-600/20 text-white'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400'
                }`}
              >
                Black & White (₹{bwPrice}/page)
              </button>
              <button
                type="button"
                onClick={() => setColorMode('color')}
                className={`py-2.5 rounded-xl font-bold border transition-all ${
                  colorMode === 'color'
                    ? 'border-indigo-500 bg-indigo-600/20 text-white'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400'
                }`}
              >
                Color (₹{colorPrice}/page)
              </button>
            </div>
          </div>

          {/* Pricing Box & Shop UPI Details */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Total Printable Amount:</span>
              <span className="text-emerald-400 font-bold font-mono text-base">₹{totalCost}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-800/80">
              <span className="text-slate-400">Direct Store UPI:</span>
              <span className="text-indigo-400 font-mono font-bold">{shop?.upi_id}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-xs"
          >
            {uploading ? 'Uploading & Sending to Spooler...' : `Proceed to Print & Pay ₹${totalCost}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 text-xs">Loading...</div>}>
      <UploadContent />
    </Suspense>
  );
}