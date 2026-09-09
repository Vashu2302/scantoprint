'use client';

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';

export default function CustomerUploadPortal() {
  const [libsReady, setLibsReady] = useState(false);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [filesList, setFilesList] = useState<any[]>([]);
  const [colorMode, setColorMode] = useState<'bw' | 'color'>('bw');
  const [sideMode, setSideMode] = useState<'single' | 'double'>('single');
  const [pagesPerSheet, setPagesPerSheet] = useState<number>(1);
  const [pageRangeType, setPageRangeType] = useState<string>('all');
  const [customRange, setCustomRange] = useState<string>('');
  const [paperSize, setPaperSize] = useState<string>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [copies, setCopies] = useState<number>(1);
  const [currentSheetIndex, setCurrentSheetIndex] = useState<number>(0);
  const [totalSheets, setTotalSheets] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);

  // Live order status tracking
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('pending'); // pending, in_queue, printing, completed

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isAppendRef = useRef<boolean>(false);

  const rates = {
    bwSingle: 2.0,
    bwDouble: 3.0,
    colorSingle: 5.0,
    colorDouble: 8.0,
  };

  const getMasterPages = () => {
    const list: any[] = [];
    filesList.forEach((fileObj) => {
      for (let i = 1; i <= fileObj.pageCount; i++) {
        list.push({ fileObj, pageNum: i });
      }
    });
    return list;
  };

  const masterPages = getMasterPages();

  const getParsedPages = () => {
    if (pageRangeType === 'custom' && customRange.trim()) {
      const maxPages = masterPages.length;
      const pages = new Set<number>();
      customRange.split(',').forEach((part) => {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map((n) => parseInt(n.trim()));
          if (start && end) {
            for (let i = start; i <= Math.min(end, maxPages); i++) {
              if (i > 0) pages.add(i);
            }
          }
        } else {
          const p = parseInt(part.trim());
          if (p && p > 0 && p <= maxPages) pages.add(p);
        }
      });
      return Array.from(pages).map((idx) => masterPages[idx - 1]).filter(Boolean);
    }
    return [...masterPages];
  };

  const parsedPages = getParsedPages();

  const computedTotalSheets = Math.max(1, Math.ceil(parsedPages.length / pagesPerSheet));
  const displaySheets = sideMode === 'double' ? Math.ceil(computedTotalSheets / 2) : computedTotalSheets;

  let ratePerSheet = colorMode === 'bw'
    ? (sideMode === 'single' ? rates.bwSingle : rates.bwDouble)
    : (sideMode === 'single' ? rates.colorSingle : rates.colorDouble);

  if (paperSize === 'A3') ratePerSheet += 5;
  if (paperSize === 'Legal') ratePerSheet += 2;

  const totalCost = filesList.length > 0 ? (displaySheets * ratePerSheet * copies).toFixed(2) : '0';

  useEffect(() => {
    setTotalSheets(computedTotalSheets);
    if (currentSheetIndex >= computedTotalSheets) {
      setCurrentSheetIndex(Math.max(0, computedTotalSheets - 1));
    }
  }, [computedTotalSheets]);

  // Real-time tracking of current job status
  useEffect(() => {
    if (!activeJobId) return;

    const channel = supabase
      .channel(`job-status:${activeJobId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'print_jobs', filter: `id=eq.${activeJobId}` },
        (payload) => {
          const newStatus = payload.new.status;
          setJobStatus(newStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeJobId]);

  // Live Canvas Preview Engine
  useEffect(() => {
    if (!canvasRef.current || filesList.length === 0 || !libsReady) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let paperW = 595;
    let paperH = 842;
    if (paperSize === 'A3') { paperW = 842; paperH = 1191; }
    if (paperSize === 'Legal') { paperW = 612; paperH = 1008; }

    if (orientation === 'landscape') {
      canvas.width = paperH;
      canvas.height = paperW;
    } else {
      canvas.width = paperW;
      canvas.height = paperH;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const startIdx = currentSheetIndex * pagesPerSheet;
    const currentPages = parsedPages.slice(startIdx, startIdx + pagesPerSheet);

    let cols = 1;
    let rows = 1;
    if (pagesPerSheet === 2) { cols = 1; rows = 2; }
    if (pagesPerSheet === 4) { cols = 2; rows = 2; }
    if (pagesPerSheet === 8) { cols = 2; rows = 4; }

    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    const renderAllCells = async () => {
      for (let i = 0; i < currentPages.length; i++) {
        const pageItem = currentPages[i];
        const cX = (i % cols) * cellW;
        const cY = Math.floor(i / cols) * cellH;

        if (pageItem.fileObj.type === 'pdf') {
          const page = await pageItem.fileObj.pdfDoc.getPage(pageItem.pageNum);
          const vp = page.getViewport({ scale: 1.0, rotation: rotationAngle });
          const scale = Math.min((cellW - 24) / vp.width, (cellH - 24) / vp.height);
          const scaledVp = page.getViewport({ scale, rotation: rotationAngle });

          const offX = cX + (cellW - scaledVp.width) / 2;
          const offY = cY + (cellH - scaledVp.height) / 2;

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = scaledVp.width;
          tempCanvas.height = scaledVp.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            await page.render({ canvasContext: tempCtx, viewport: scaledVp }).promise;
            ctx.drawImage(tempCanvas, offX, offY);
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(offX, offY, scaledVp.width, scaledVp.height);
          }
        } else if (pageItem.fileObj.type === 'image') {
          const img = pageItem.fileObj.imgObj;
          ctx.save();
          ctx.translate(cX + cellW / 2, cY + cellH / 2);
          ctx.rotate((rotationAngle * Math.PI) / 180);

          let imgW = img.width;
          let imgH = img.height;
          if (rotationAngle === 90 || rotationAngle === 270) {
            const temp = imgW;
            imgW = imgH;
            imgH = temp;
          }

          const scale = Math.min((cellW - 24) / imgW, (cellH - 24) / imgH);
          const drawW = img.width * scale;
          const drawH = img.height * scale;

          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();

          ctx.strokeStyle = '#e2e8f0';
          ctx.strokeRect(cX + 12, cY + 12, cellW - 24, cellH - 24);
        }
      }

      if (colorMode === 'bw') {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let j = 0; j < data.length; j += 4) {
          const avg = (data[j] + data[j + 1] + data[j + 2]) / 3;
          data[j] = avg;
          data[j + 1] = avg;
          data[j + 2] = avg;
        }
        ctx.putImageData(imgData, 0, 0);
      }
    };

    renderAllCells();
  }, [
    filesList,
    libsReady,
    colorMode,
    pagesPerSheet,
    currentSheetIndex,
    rotationAngle,
    orientation,
    paperSize,
    customRange,
    pageRangeType,
  ]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = Array.from(e.target.files || []);
    const win = window as any;
    if (!inputFiles.length || !win.pdfjsLib) return;

    setIsProcessing(true);
    const updatedRaw = isAppendRef.current ? [...rawFiles, ...inputFiles] : [...inputFiles];
    const updated = isAppendRef.current ? [...filesList] : [];

    setRawFiles(updatedRaw);

    for (const file of inputFiles) {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await win.pdfjsLib.getDocument(arrayBuffer).promise;
        updated.push({
          name: file.name,
          type: 'pdf',
          pdfDoc,
          pageCount: pdfDoc.numPages,
        });
      } else if (file.type.startsWith('image/')) {
        const imgObj = await new Promise<HTMLImageElement>((res) => {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const img = new Image();
            img.onload = () => res(img);
            img.src = evt.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
        updated.push({
          name: file.name,
          type: 'image',
          imgObj,
          pageCount: 1,
        });
      }
    }

    setFilesList(updated);
    setIsProcessing(false);
    setCurrentSheetIndex(0);
  };

  const removeFile = (idx: number) => {
    const updated = filesList.filter((_, i) => i !== idx);
    const updatedRaw = rawFiles.filter((_, i) => i !== idx);
    setFilesList(updated);
    setRawFiles(updatedRaw);
    if (updated.length === 0) setShowQr(false);
  };

  const handleRotate = () => {
    setRotationAngle((prev) => (prev + 90) % 360);
  };

  // Upload to Storage Bucket and Register Job
  const triggerPayment = async () => {
    if (rawFiles.length === 0) return;
    setIsProcessing(true);

    try {
      const primaryFile = rawFiles[0];
      const fileExt = primaryFile.name.split('.').pop();
      const storageFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // 1. Upload File to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('print-files')
        .upload(storageFileName, primaryFile);

      if (uploadError) throw uploadError;

      // 2. Insert into database with file_path
      const { data, error: dbError } = await supabase
        .from('print_jobs')
        .insert([
          {
            shop_id: 'shop-01',
            file_name: filesList.map((f) => f.name).join(', '),
            file_path: storageFileName,
            color_mode: colorMode,
            side_mode: sideMode,
            pages_per_sheet: pagesPerSheet,
            copies: copies,
            total_amount: parseFloat(totalCost),
            status: 'in_queue',
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      setActiveJobId(data.id);
      setJobStatus('in_queue');
      setShowQr(true);

      setTimeout(() => {
        const win = window as any;
        if (qrRef.current && win.QRCode) {
          qrRef.current.innerHTML = '';
          const upiString = `upi://pay?pa=bhupeshdewangan444@okhdfcbank&pn=Bhupesh%20Dewangan&am=${totalCost}&cu=INR`;
          new win.QRCode(qrRef.current, {
            text: upiString,
            width: 170,
            height: 170,
          });
        }
      }, 100);
    } catch (err: any) {
      console.error(err);
      alert('Error initiating upload & print order: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-4 md:p-8 selection:bg-indigo-500 selection:text-white">
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"
        onLoad={() => {
          const win = window as any;
          if (win.pdfjsLib) {
            win.pdfjsLib.GlobalWorkerOptions.workerSrc =
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
            setLibsReady(true);
          }
        }}
      />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" />

      {/* Header */}
      <header className="max-w-6xl mx-auto mb-6 flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/30">
            S
          </div>
          <div>
            <h1 className="font-extrabold text-base text-white leading-tight">Balod Central Xerox & Cyber</h1>
            <p className="text-[11px] text-emerald-400 font-medium">● Secure Privacy Print Engine</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
          Encrypted Spool
        </span>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/pdf, image/jpeg, image/png, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL */}
        <div className="lg:col-span-5 p-6 rounded-[2rem] bg-[#0f172a]/80 border border-slate-800/90 shadow-2xl backdrop-blur-xl space-y-5">
          <h2 className="text-base font-extrabold text-white text-center pb-2 border-b border-slate-800">
            Print Settings
          </h2>

          {/* Upload Trigger */}
          <div
            onClick={() => {
              isAppendRef.current = false;
              fileInputRef.current?.click();
            }}
            className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-500 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-950/50 transition-all text-center"
          >
            <span className="text-2xl mb-1">📄</span>
            <span className="text-xs font-bold text-slate-200">Click to Upload Document / Image</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Auto-purged after printing</span>
          </div>

          <button
            type="button"
            onClick={() => {
              isAppendRef.current = true;
              fileInputRef.current?.click();
            }}
            className="w-full py-2.5 rounded-xl border border-dashed border-indigo-500/60 bg-indigo-950/20 text-indigo-400 hover:bg-indigo-950/40 font-bold text-xs transition-all"
          >
            + Add Another File
          </button>

          {filesList.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {filesList.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                  <span className="truncate max-w-[200px] text-slate-200 font-medium">📄 {f.name} ({f.pageCount} pgs)</span>
                  <button onClick={() => removeFile(i)} className="text-rose-400 font-bold hover:text-rose-300">✖</button>
                </div>
              ))}
            </div>
          )}

          {/* Color Mode */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Color Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setColorMode('bw')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  colorMode === 'bw'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950/70 border border-slate-800 text-slate-400'
                }`}
              >
                B & W (₹2)
              </button>
              <button
                type="button"
                onClick={() => setColorMode('color')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  colorMode === 'color'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950/70 border border-slate-800 text-slate-400'
                }`}
              >
                Color (₹5)
              </button>
            </div>
          </div>

          {/* Side Mode */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Printing Side</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSideMode('single')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  sideMode === 'single'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950/70 border border-slate-800 text-slate-400'
                }`}
              >
                Single-Sided
              </button>
              <button
                type="button"
                onClick={() => setSideMode('double')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  sideMode === 'double'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950/70 border border-slate-800 text-slate-400'
                }`}
              >
                Double-Sided
              </button>
            </div>
          </div>

          {/* Layout & N-Up */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Pages Per Sheet (Collate Layout)
            </label>
            <select
              value={pagesPerSheet}
              onChange={(e) => setPagesPerSheet(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200"
            >
              <option value={1}>1 Page per Sheet (Normal)</option>
              <option value={2}>2 Pages per Sheet (2-in-1)</option>
              <option value={4}>4 Pages per Sheet (4-in-1)</option>
              <option value={8}>8 Pages per Sheet (8-in-1)</option>
            </select>
          </div>

          {/* Page Range */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Page Range</label>
            <select
              value={pageRangeType}
              onChange={(e) => setPageRangeType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200"
            >
              <option value="all">All Pages</option>
              <option value="custom">Custom Range (e.g. 1-5, 8)</option>
            </select>
            {pageRangeType === 'custom' && (
              <input
                type="text"
                value={customRange}
                onChange={(e) => setCustomRange(e.target.value)}
                placeholder="e.g. 1-3, 5, 7"
                className="w-full mt-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white"
              />
            )}
          </div>

          {/* Size & Orientation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Paper Size</label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200"
              >
                <option value="A4">A4 Standard</option>
                <option value="A3">A3 (+₹5/sheet)</option>
                <option value="Legal">Legal (+₹2/sheet)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Orientation</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRotate}
            className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
          >
            ↻ Rotate Content ({rotationAngle}°)
          </button>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Number of Copies</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCopies(Math.max(1, copies - 1))}
                className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-700 font-bold"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold font-mono"
              />
              <button
                type="button"
                onClick={() => setCopies(copies + 1)}
                className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-700 font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Total Pages:</span>
              <span className="font-mono text-white font-bold">{masterPages.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Sheets to Print:</span>
              <span className="font-mono text-white font-bold">{displaySheets * copies}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800/80">
              <span>Total Cost:</span>
              <span className="text-emerald-400 text-lg font-mono">₹{totalCost}</span>
            </div>
          </div>

          {/* Pay Action */}
          <button
            type="button"
            disabled={filesList.length === 0 || isProcessing || !!activeJobId}
            onClick={triggerPayment}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-sm text-white shadow-lg transition-all"
          >
            {isProcessing ? 'Encrypting & Uploading...' : 'Confirm and Pay'}
          </button>

          {/* Dynamic Live Status & QR Container */}
          {showQr && (
            <div className="p-5 rounded-2xl bg-white text-slate-900 shadow-2xl space-y-4 animate-fade-in text-center">
              {jobStatus === 'completed' ? (
                <div className="space-y-3 py-2">
                  <div className="h-14 w-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-black">
                    ✓
                  </div>
                  <h3 className="text-base font-black text-slate-900">Print Completed!</h3>
                  <p className="text-xs text-slate-600">Please collect your sheets from the tray.</p>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                    🛡️ Notice: Your document has been permanently deleted from our servers for your privacy.
                  </div>
                  <button
                    onClick={() => {
                      setRawFiles([]);
                      setFilesList([]);
                      setActiveJobId(null);
                      setShowQr(false);
                      setJobStatus('pending');
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
                  >
                    Print Another Document
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Scan to Pay via UPI</p>
                  <div ref={qrRef} className="my-2 flex justify-center p-2 border rounded-xl" />
                  <p className="text-sm font-extrabold text-indigo-700">Amount: ₹{totalCost}</p>

                  {/* Live Queue Progress Indicator */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span>Status:</span>
                      <span className="text-indigo-600 uppercase tracking-wider text-[11px]">
                        {jobStatus === 'in_queue' && '⏳ In Queue (Waiting)'}
                        {jobStatus === 'printing' && '⚙️ Printing in Progress...'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Spooler will auto-dispatch once payment reaches the counter.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: LIVE PREVIEW */}
        <div className="lg:col-span-7 p-6 rounded-[2rem] bg-[#0f172a]/80 border border-slate-800/90 shadow-2xl backdrop-blur-xl flex flex-col items-center min-h-[580px]">
          <h2 className="text-base font-extrabold text-white mb-6">Live Print Preview</h2>

          {filesList.length === 0 ? (
            <div className="flex-1 w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl p-10 text-center">
              <span className="text-4xl mb-3 opacity-40">📄</span>
              <p className="text-xs text-slate-500 font-medium">Upload a file to see live sheet preview</p>
            </div>
          ) : (
            <div className="flex-1 w-full flex flex-col items-center justify-center p-2">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[460px] rounded-lg shadow-2xl border border-slate-700 bg-white"
              />

              {totalSheets > 1 && (
                <div className="flex items-center gap-4 mt-6">
                  <button
                    type="button"
                    disabled={currentSheetIndex === 0}
                    onClick={() => setCurrentSheetIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold disabled:opacity-30"
                  >
                    ◀ Prev
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    Sheet {currentSheetIndex + 1} of {totalSheets}
                  </span>
                  <button
                    type="button"
                    disabled={currentSheetIndex >= totalSheets - 1}
                    onClick={() => setCurrentSheetIndex((prev) => Math.min(totalSheets - 1, prev + 1))}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold disabled:opacity-30"
                  >
                    Next ▶
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}