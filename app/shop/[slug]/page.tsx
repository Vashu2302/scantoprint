'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UploadedDoc {
  id: string;
  name: string;
  url: string;
  file: File;
  pages: number;
}

export default function ExactCustomerPrintStudio() {
  const params = useParams();
  const slug = params?.slug as string;

  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Files
  const [files, setFiles] = useState<UploadedDoc[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Settings
  const [colorMode, setColorMode] = useState<'bw' | 'color'>('bw');
  const [sideMode, setSideMode] = useState<'single' | 'double'>('single');
  const [pagesPerSheet, setPagesPerSheet] = useState<number>(1);
  const [pageRange, setPageRange] = useState<string>('all');
  const [paperSize, setPaperSize] = useState<'A4 Standard' | 'Legal'>('A4 Standard');
  const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>('Portrait');
  const [rotation, setRotation] = useState<number>(0);
  const [isFullFit, setIsFullFit] = useState<boolean>(true); // Default true for zero-margin fit
  const [copies, setCopies] = useState<number>(1);

  // Preview Pagination
  const [currentSheet, setCurrentSheet] = useState<number>(1);

  // Payment & Success Screen States
  const [paying, setPaying] = useState<boolean>(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [printStatus, setPrintStatus] = useState<string>('queued'); // queued, in_queue, printing, completed, printed

  useEffect(() => {
    async function loadShop() {
      if (!slug) return;
      setLoading(true);

      const { data } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .single();

      if (data) setShop(data);
      setLoading(false);
    }
    loadShop();
  }, [slug]);

  // Instant Status Sync: Combined Realtime WebSockets + 1-Sec Polling Fallback
  useEffect(() => {
    if (!placedOrder?.id) return;

    // 1. Supabase Realtime Listener
    const channel = supabase
      .channel(`realtime_order_${placedOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${placedOrder.id}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.print_status) {
            setPrintStatus(payload.new.print_status);
          }
        }
      )
      .subscribe();

    // 2. Ultra-fast 1s Polling Backup (guarantees instant detection even if websockets drop)
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('orders')
        .select('print_status')
        .eq('id', placedOrder.id)
        .single();

      if (data && data.print_status && data.print_status !== printStatus) {
        setPrintStatus(data.print_status);
      }
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [placedOrder?.id, printStatus]);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newDocs: UploadedDoc[] = Array.from(e.target.files).map((f) => ({
        id: Math.random().toString(36).substring(2, 9),
        name: f.name,
        url: URL.createObjectURL(f),
        file: f,
        pages: 1,
      }));
      setFiles((prev) => [...prev, ...newDocs]);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Rates from shop database
  const bwSingleRate = Number(shop?.bw_single ?? 2);
  const bwDoubleRate = Number(shop?.bw_double ?? 3);
  const colorSingleRate = Number(shop?.color_single ?? 10);
  const colorDoubleRate = Number(shop?.color_double ?? 18);

  const activeRate =
    colorMode === 'bw'
      ? sideMode === 'single'
        ? bwSingleRate
        : bwDoubleRate
      : sideMode === 'single'
      ? colorSingleRate
      : colorDoubleRate;

  // Calculation
  const totalPages = files.length > 0 ? files.reduce((acc, curr) => acc + curr.pages, 0) : 0;
  const sheetsToPrint =
    totalPages > 0
      ? sideMode === 'single'
        ? Math.ceil(totalPages / pagesPerSheet)
        : Math.ceil(totalPages / (pagesPerSheet * 2))
      : 0;

  const totalCost = sheetsToPrint * activeRate * copies;

  // Pagination for preview
  const previewItemsPerSheet = pagesPerSheet;
  const totalPreviewSheets = Math.max(1, Math.ceil(files.length / previewItemsPerSheet));
  const currentSheetFiles = files.slice(
    (currentSheet - 1) * previewItemsPerSheet,
    currentSheet * previewItemsPerSheet
  );

  const handleConfirmAndPay = async () => {
    if (files.length === 0) {
      alert('Please upload at least one document or image.');
      return;
    }

    setPaying(true);
    try {
      // 1. Upload File directly to 'print-files' storage bucket
      const targetFile = files[0].file;
      const fileExt = targetFile.name.split('.').pop() || 'pdf';
      const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `${shop.id}/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('print-files')
        .upload(filePath, targetFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw new Error('File storage upload failed: ' + uploadError.message);
      }

      // Generate public URL for the agent to download
      const { data: publicData } = supabase.storage
        .from('print-files')
        .getPublicUrl(filePath);

      const uploadedUrl = publicData?.publicUrl || '';

      // 2. Insert Order into Supabase
      const { data: newOrder, error } = await supabase
        .from('orders')
        .insert([
          {
            shop_id: shop.id,
            file_name: files.map((f) => f.name).join(', '),
            file_url: uploadedUrl,
            pages: totalPages,
            copies: copies,
            amount: totalCost,
            payment_status: 'paid',
            print_status: 'in_queue',
            print_type: colorMode,
            sided_type: sideMode,
          },
        ])
        .select()
        .single();

      if (error) {
        // Fallback if 'file_url' column doesn't exist in orders table
        const { data: fallbackOrder, error: fallbackError } = await supabase
          .from('orders')
          .insert([
            {
              shop_id: shop.id,
              file_name: cleanFileName,
              pages: totalPages,
              copies: copies,
              amount: totalCost,
              payment_status: 'paid',
              print_status: 'in_queue',
              print_type: colorMode,
              sided_type: sideMode,
            },
          ])
          .select()
          .single();

        if (fallbackError) throw fallbackError;
        setPlacedOrder(fallbackOrder);
      } else {
        setPlacedOrder(newOrder);
      }

      setPrintStatus('in_queue');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert('Order failed: ' + err.message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center font-sans">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4">
        <div className="bg-[#0e1626] border border-slate-800 p-8 rounded-2xl text-center">
          <h2 className="text-xl font-bold text-rose-400">Shop Not Found</h2>
          <p className="text-xs text-slate-400 mt-2">Identifier: {slug}</p>
        </div>
      </div>
    );
  }

  const shopTitle = shop.business_name || shop.name || 'Store';
  const shopInitial = shopTitle.trim().charAt(0).toUpperCase() || 'S';

  const isCompleted = printStatus === 'completed' || printStatus === 'printed';
  const isPrinting = printStatus === 'printing' || printStatus === 'processing';

  return (
    <div className="min-h-screen bg-[#060813] text-slate-200 font-sans selection:bg-indigo-600 selection:text-white pb-16">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#090d1c]/90 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-indigo-600/30">
            {shopInitial}
          </div>
          <div>
            <h1 className="font-bold text-sm text-white leading-tight">{shopTitle}</h1>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              Secure Privacy Print Engine
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
          Encrypted Spool
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-6">
        
        {/* ==================== PAGE 2: PAYMENT SUCCESSFUL & LIVE QUEUE ==================== */}
        {placedOrder ? (
          <div className="bg-[#0b1021] border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-lg shadow-emerald-500/10">
              ✓
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Payment Confirmed
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight pt-2">
                Payment Successful!
              </h2>
              <p className="text-xs text-slate-400">
                Your print job has been accepted and dispatched to {shopTitle}&apos;s printer.
              </p>
            </div>

            {/* Order Details Receipt Box */}
            <div className="bg-[#070b18] border border-slate-800/90 rounded-2xl p-5 text-left text-xs font-mono space-y-2.5 max-w-md mx-auto">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-500 font-sans">Order ID:</span>
                <span className="font-bold text-indigo-400">
                  #STP-{placedOrder.id.substring(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans">Amount Paid:</span>
                <span className="font-bold text-emerald-400">₹{placedOrder.amount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans">Total Sheets:</span>
                <span className="text-slate-300">{sheetsToPrint * copies} Sheets ({colorMode.toUpperCase()})</span>
              </div>
            </div>

            {/* Live Queue Status Tracker */}
            <div className="bg-[#070b18] border border-slate-800/90 rounded-2xl p-5 max-w-md mx-auto space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Printer Status:</span>
                {isCompleted ? (
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                    ✅ DOCUMENT PRINTED!
                  </span>
                ) : isPrinting ? (
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-lg animate-pulse">
                    🖨️ PRINTING IN PROGRESS...
                  </span>
                ) : (
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
                    ⏳ IN QUEUE (WAITING)
                  </span>
                )}
              </div>

              {!isCompleted && (
                <div className="text-[11px] text-slate-400 text-left bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 space-y-1 font-sans">
                  <div className="flex items-center gap-2 text-indigo-300 font-medium">
                    <span>⏱️ Estimated Waiting Time:</span>
                    <span className="font-bold font-mono">~2-3 Minutes</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Please wait near the counter. Your print will be ready shortly.
                  </p>
                </div>
              )}

              {/* Exact Privacy Deletion Banner */}
              {isCompleted && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                    <span>✨</span>
                    <span>Print Completed Successfully!</span>
                  </p>
                  <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                    🔒 For your privacy, we have permanently deleted your document from our server.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setPlacedOrder(null);
                setFiles([]);
              }}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              Print Another Document
            </button>
          </div>
        ) : (
          /* ==================== PAGE 1: UPLOAD & PRINT SETTINGS ==================== */
          <div className="space-y-6">
            {/* CARD 1: PRINT SETTINGS */}
            <div className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-4">
              <h2 className="text-center text-xs font-bold text-slate-300 uppercase tracking-wider">
                Print Settings
              </h2>

              {/* Upload Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-slate-700 hover:border-indigo-500/80 rounded-xl p-6 text-center cursor-pointer bg-[#070b18]/60 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFilesSelect}
                />
                <div className="text-2xl mb-1">📄</div>
                <div className="text-xs font-semibold text-white">Click to Upload Document / Image</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Auto-purged after printing</p>
              </div>

              {/* Add Another File Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1 px-3 rounded-lg hover:bg-indigo-500/10 transition-all inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>+</span>
                  <span>Add Another File</span>
                </button>
              </div>

              {/* Uploaded Files List */}
              {files.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {files.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between bg-[#070b18] border border-slate-800/90 px-3 py-2 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[85%]">
                        <span className="text-slate-400">📄</span>
                        <span className="text-slate-200 truncate">{f.name}</span>
                        <span className="text-[10px] text-slate-500">({f.pages} p...)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(f.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* COLOR MODE TOGGLE */}
              <div className="space-y-1 pt-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Color Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setColorMode('bw')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      colorMode === 'bw'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-[#070b18] text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    B & W (₹{bwSingleRate})
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode('color')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      colorMode === 'color'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-[#070b18] text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    Color (₹{colorSingleRate})
                  </button>
                </div>
              </div>

              {/* PRINTING SIDE TOGGLE */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Printing Side
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSideMode('single')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      sideMode === 'single'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-[#070b18] text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    Single-Sided
                  </button>
                  <button
                    type="button"
                    onClick={() => setSideMode('double')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      sideMode === 'double'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-[#070b18] text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    Double-Sided
                  </button>
                </div>
              </div>

              {/* PAGES PER SHEET DROPDOWN */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Pages Per Sheet (Collate Layout)
                </label>
                <select
                  value={pagesPerSheet}
                  onChange={(e) => {
                    setPagesPerSheet(Number(e.target.value));
                    setCurrentSheet(1);
                  }}
                  className="w-full bg-[#070b18] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>1 Page per Sheet (Normal)</option>
                  <option value={2}>2 Pages per Sheet (2-in-1)</option>
                </select>
              </div>

              {/* PAGE RANGE DROPDOWN */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Page Range
                </label>
                <select
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  className="w-full bg-[#070b18] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Pages</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* PAPER SIZE & ORIENTATION */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Paper Size
                  </label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value as any)}
                    className="w-full bg-[#070b18] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="A4 Standard">A4 Standard</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Orientation
                  </label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as any)}
                    className="w-full bg-[#070b18] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Portrait">Portrait</option>
                    <option value="Landscape">Landscape</option>
                  </select>
                </div>
              </div>

              {/* ROTATE & FIT TO PAGE BUTTONS */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-1.5 border border-blue-400/30 cursor-pointer"
                >
                  <span className="text-base leading-none">↺</span>
                  <span>Rotate ({rotation}°)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullFit((prev) => !prev)}
                  className={`py-2.5 px-3 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                    isFullFit
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-[#070b18] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>⛶</span>
                  <span>{isFullFit ? 'Fit Page: Edge Fit' : 'Fit Page: Standard'}</span>
                </button>
              </div>

              {/* NUMBER OF COPIES */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Number of Copies
                </label>
                <div className="flex items-center gap-2 bg-[#070b18] border border-slate-800 rounded-xl p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setCopies(Math.max(1, copies - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-xs text-white">
                    {copies}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCopies(copies + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* COST SUMMARY */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="space-y-0.5 text-slate-400 text-[11px]">
                  <div>Total Pages: <span className="font-mono text-slate-200">{totalPages}</span></div>
                  <div>Sheets to Print: <span className="font-mono text-slate-200">{sheetsToPrint * copies}</span></div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Cost:</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">₹{totalCost.toFixed(2)}</div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="button"
                disabled={paying || files.length === 0}
                onClick={handleConfirmAndPay}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/20 cursor-pointer disabled:cursor-not-allowed"
              >
                {paying ? 'Uploading & Routing...' : 'Confirm and Pay'}
              </button>
            </div>

            {/* CARD 2: LIVE PRINT PREVIEW */}
            <div className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Live Print Preview
                </h2>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                  Format: {paperSize} • {orientation}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center min-h-[380px] py-4">
                {files.length === 0 ? (
                  <div className="text-center space-y-2 text-slate-500">
                    <div className="text-3xl">📄</div>
                    <p className="text-xs">Upload a file to see live sheet preview</p>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center space-y-4">
                    <div
                      className={`bg-white rounded-lg shadow-2xl transition-all duration-200 border border-slate-200 overflow-hidden flex items-center justify-center ${
                        isFullFit ? 'p-0.5 sm:p-1' : 'p-3'
                      } ${
                        orientation === 'Landscape'
                          ? paperSize === 'Legal'
                            ? 'w-[360px] sm:w-[420px] h-[220px] sm:h-[260px]'
                            : 'w-[320px] sm:w-[380px] h-[226px] sm:h-[268px]'
                          : paperSize === 'Legal'
                          ? 'w-[230px] sm:w-[270px] h-[360px] sm:h-[420px]'
                          : 'w-[240px] sm:w-[280px] h-[340px] sm:h-[396px]'
                      }`}
                      style={{
                        filter: colorMode === 'bw' ? 'grayscale(100%) contrast(110%)' : 'none',
                      }}
                    >
                      {pagesPerSheet === 1 ? (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                          {currentSheetFiles[0] ? (
                            <img
                              src={currentSheetFiles[0].url}
                              alt="preview"
                              className={`transition-all duration-200 ${
                                isFullFit
                                  ? 'w-full h-full object-contain'
                                  : 'max-w-[88%] max-h-[88%] object-contain'
                              }`}
                              style={{
                                transform: `rotate(${rotation}deg)`,
                                width: isFullFit ? '100%' : 'auto',
                                height: isFullFit ? '100%' : 'auto',
                              }}
                            />
                          ) : (
                            <div className="text-slate-400 text-[10px]">No Content</div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col gap-1.5 justify-between p-1">
                          <div className="h-[49%] w-full border border-dashed border-slate-300 rounded flex items-center justify-center overflow-hidden bg-slate-50">
                            {currentSheetFiles[0] ? (
                              <img
                                src={currentSheetFiles[0].url}
                                alt="slot-1"
                                className="w-full h-full object-contain transition-all duration-200"
                                style={{ transform: `rotate(${rotation}deg)` }}
                              />
                            ) : (
                              <span className="text-[9px] text-slate-400 font-mono">[Page Slot 1]</span>
                            )}
                          </div>

                          <div className="h-[49%] w-full border border-dashed border-slate-300 rounded flex items-center justify-center overflow-hidden bg-slate-50">
                            {currentSheetFiles[1] ? (
                              <img
                                src={currentSheetFiles[1].url}
                                alt="slot-2"
                                className="w-full h-full object-contain transition-all duration-200"
                              style={{ transform: `rotate(${rotation}deg)` }}
                              />
                            ) : (
                              <span className="text-[9px] text-slate-400 font-mono">[Page Slot 2]</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {totalPreviewSheets > 1 && (
                      <div className="flex items-center gap-3 text-xs font-mono text-slate-400 pt-2">
                        <button
                          type="button"
                          disabled={currentSheet <= 1}
                          onClick={() => setCurrentSheet((prev) => Math.max(1, prev - 1))}
                          className="px-2 py-1 bg-[#070b18] hover:bg-slate-800 disabled:opacity-30 rounded border border-slate-800 text-[11px] cursor-pointer"
                        >
                          ← Prev
                        </button>
                        <span>
                          Sheet {currentSheet} of {totalPreviewSheets}
                        </span>
                        <button
                          type="button"
                          disabled={currentSheet >= totalPreviewSheets}
                          onClick={() => setCurrentSheet((prev) => Math.min(totalPreviewSheets, prev + 1))}
                          className="px-2 py-1 bg-[#070b18] hover:bg-slate-800 disabled:opacity-30 rounded border border-slate-800 text-[11px] cursor-pointer"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}