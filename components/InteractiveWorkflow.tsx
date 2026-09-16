'use client';

import React, { useState, useEffect } from 'react';

interface StepTooltip {
  title: string;
  badge: string;
  highlight: string;
  details: string[];
}

const CUSTOMER_TOOLTIPS: Record<number, StepTooltip> = {
  1: {
    title: 'Dynamic QR Standee Intake',
    badge: 'Scan & Open',
    highlight: 'No App Required',
    details: [
      'Customer uses any mobile camera or Google Lens.',
      'Opens dedicated shop web portal instantly.',
      'Auto-connects to your store printer queue.',
    ],
  },
  2: {
    title: 'High-Speed Secure Upload',
    badge: '25MB Hard Cap',
    highlight: 'Zero Data Retention',
    details: [
      'Uploads PDFs, JPG, PNG & document scans.',
      'Auto page count & dimension extraction.',
      'Client encrypted transmission to cloud queue.',
    ],
  },
  3: {
    title: 'Preference & Price Engine',
    badge: 'Live Billing',
    highlight: 'Direct UPI Routing',
    details: [
      'Choose Color / B&W, Duplex & Copies count.',
      'Real-time price calculation per store rates.',
      'Customer UPI payment routes direct to your bank.',
    ],
  },
  4: {
    title: 'Instant Desktop Auto-Print',
    badge: '1-Click Spool',
    highlight: 'Auto-Wiped Privacy',
    details: [
      'Windows background agent catches print signal.',
      'Pushes file silently to your default USB printer.',
      'Memory shredded permanently after physical output.',
    ],
  },
};

const SHOPKEEPER_TOOLTIPS: Record<number, StepTooltip> = {
  1: {
    title: 'Instant Merchant Onboarding',
    badge: 'Setup Under 2 Mins',
    highlight: '7-Day Free Trial',
    details: [
      'Fill owner name, shop name, mobile & UPI handle.',
      'Immediate generation of your shop portal URL.',
      'No hardware lock-in or technical hurdles.',
    ],
  },
  2: {
    title: 'Store Standee & QR Generator',
    badge: 'Ready to Print',
    highlight: 'Custom Branded Standee',
    details: [
      'Download high-resolution ready-to-print standee PDF.',
      'Pre-embedded with your custom dynamic QR code.',
      'Place it directly on your store counter for customers.',
    ],
  },
  3: {
    title: 'Windows Desktop Spooler Sync',
    badge: 'Lightweight .EXE',
    highlight: 'Plug & Play USB',
    details: [
      'Download the small Windows background agent.',
      'Enter your shop secret key once to pair your PC.',
      'Binds silently with any HP, Canon, Epson or Brother printer.',
    ],
  },
  4: {
    title: 'Counter Live & Automated',
    badge: 'Zero Manual Work',
    highlight: 'Earn More Daily',
    details: [
      'Customers scan standee, pay via UPI, and prints roll out.',
      'No pen-drive viruses or WhatsApp chaos at counter.',
      'Full live telemetry, page quota tracking & order ledger.',
    ],
  },
};

export default function InteractiveWorkflow() {
  const [animStep, setAnimStep] = useState<number>(1);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'customer' | 'shopkeeper'>('customer');

  // Hover Tooltip States
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Auto-looping animation sequence (1 -> 2 -> 3 -> 4)
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimStep((prev) => (prev >= 4 ? 1 : prev + 1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent, cardIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredCard(cardIndex);
  };

  const handleMouseLeave = () => {
    setHoveredCard(null);
  };

  const currentTooltips = activeWorkflowTab === 'customer' ? CUSTOMER_TOOLTIPS : SHOPKEEPER_TOOLTIPS;

  return (
    <div className="space-y-16 relative">
      {/* ------------------------------------------------------------- */}
      {/* 1. ANIMATION STAGE (PHONE -> CLOUD RELAY -> DESKTOP PRINTER)   */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-b from-[#0e1628] to-[#070b18] border border-indigo-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Live Interactive Spool Demo
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Watch How Fast A Document Prints
          </h3>
          <p className="text-xs text-slate-400">
            Real-time simulated loop showing cloud intake to physical spool output.
          </p>
        </div>

        {/* Animated Visual Canvas */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-6 max-w-3xl mx-auto relative">
          {/* A. SMARTPHONE MOCKUP */}
          <div className="w-56 h-[320px] bg-slate-900 rounded-[2.5rem] p-3 border-4 border-slate-700 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900"></div>
            </div>

            <div className="flex-1 bg-[#060813] rounded-2xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden border border-slate-800">
              {animStep === 1 && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="relative w-24 h-24 mx-auto border-2 border-dashed border-indigo-500 rounded-xl p-2 flex items-center justify-center">
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce"></div>
                    <span className="text-3xl">📱</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Step 1</span>
                    <p className="text-xs font-bold text-white">Scanning Shop QR...</p>
                  </div>
                </div>
              )}

              {animStep === 2 && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-2xl animate-pulse">
                    📄
                  </div>
                  <div className="w-full space-y-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Step 2</span>
                    <p className="text-xs font-bold text-white">Uploading Document</p>
                    <div className="w-28 mx-auto bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-4/5 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}

              {animStep === 3 && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 font-bold text-xl">
                    ✓
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Step 3</span>
                    <p className="text-xs font-bold text-white">UPI Payment Received</p>
                    <p className="text-[10px] text-slate-400 font-mono">1-Click Confirmed</p>
                  </div>
                </div>
              )}

              {animStep === 4 && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl animate-spin">
                    ⚡
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Step 4</span>
                    <p className="text-xs font-bold text-white">Spool Signal Sent!</p>
                    <p className="text-[9px] text-slate-500 font-mono">Privacy Shredded</p>
                  </div>
                </div>
              )}
            </div>

            <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-2"></div>
          </div>

          {/* B. CLOUD PULSING BEAM */}
          <div className="flex flex-col items-center justify-center gap-1.5 py-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
              Cloud Spool (0.2s)
            </div>
            <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 animate-pulse"></div>
            <span className="text-[11px] text-slate-500 font-mono">Encrypted Queue</span>
          </div>

          {/* C. DESKTOP PRINTER SPOOLER */}
          <div className="w-64 bg-[#0a0f1d] border-2 border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 text-center relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${animStep === 4 ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`}></span>
                <span className="text-[10px] font-mono text-slate-300">Counter Printer</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-slate-800 text-emerald-400 px-2 py-0.5 rounded">
                READY
              </span>
            </div>

            <div className="relative w-36 h-20 mx-auto bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center shadow-inner">
              <span className="text-3xl">🖨️</span>

              {animStep === 4 ? (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-24 h-12 bg-white rounded shadow-2xl border border-slate-300 p-1 flex flex-col justify-around transition-all duration-700 transform translate-y-2">
                  <div className="w-full h-1 bg-slate-300 rounded"></div>
                  <div className="w-4/5 h-1 bg-indigo-400 rounded"></div>
                  <div className="w-full h-1 bg-slate-300 rounded"></div>
                </div>
              ) : (
                <div className="absolute bottom-1 w-20 h-1 bg-slate-900 rounded"></div>
              )}
            </div>

            <div className="pt-2">
              <p className="text-xs font-bold text-white">Local Windows Agent</p>
              <p className="text-[10px] text-slate-400">
                {animStep === 4 ? '🖨️ Document Printed!' : 'Standing by for order...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. DUAL WORKFLOW TABS: CUSTOMERS VS SHOPKEEPERS               */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 p-1 rounded-2xl bg-[#0b1021] border border-slate-800 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setActiveWorkflowTab('customer');
                setHoveredCard(null);
              }}
              className={`py-2 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeWorkflowTab === 'customer'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📱</span>
              <span>Customer Experience</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveWorkflowTab('shopkeeper');
                setHoveredCard(null);
              }}
              className={`py-2 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeWorkflowTab === 'shopkeeper'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏪</span>
              <span>Shopkeeper Setup Guide</span>
            </button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {activeWorkflowTab === 'customer'
              ? 'The Customer Journey • 4 Simple Steps to Print'
              : 'Shopkeeper Onboarding • Setup Your Counter in 4 Steps'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            {activeWorkflowTab === 'customer'
              ? 'Clean, zero-install mobile web flow. Hover over any step with your mouse for detailed insights.'
              : 'How store owners digitize their photocopy counters in less than 2 minutes.'}
          </p>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: CUSTOMER JOURNEY (4 CARDS)                         */}
        {/* ========================================================= */}
        {activeWorkflowTab === 'customer' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative animate-in fade-in duration-200">
            {/* SCREEN 1 */}
            <div
              onMouseMove={(e) => handleMouseMove(e, 1)}
              onMouseLeave={handleMouseLeave}
              className="bg-[#0b1021] border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-indigo-500/70 transition-all cursor-pointer relative group"
            >
              <div className="w-full h-56 bg-[#070b14] rounded-2xl border border-slate-800 p-3 flex flex-col justify-between items-center text-center group-hover:scale-[1.02] transition-transform">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Step 01</span>
                <div className="p-3 bg-white rounded-xl shadow-md">
                  <span className="text-3xl">🏁</span>
                </div>
                <p className="text-[11px] font-bold text-slate-200">Point phone camera at shop counter standee</p>
              </div>
              <div className="text-left w-full space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">01 • Scan The QR</span>
                <h4 className="text-sm font-bold text-white">Direct URL Intake</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Opens the specific shop portal instantly in mobile browser with zero app installation.
                </p>
              </div>
            </div>

            {/* SCREEN 2 */}
            <div
              onMouseMove={(e) => handleMouseMove(e, 2)}
              onMouseLeave={handleMouseLeave}
              className="bg-[#0b1021] border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-indigo-500/70 transition-all cursor-pointer relative group"
            >
              <div className="w-full h-56 bg-[#070b14] rounded-2xl border border-slate-800 p-3 flex flex-col justify-between items-center text-center group-hover:scale-[1.02] transition-transform">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Step 02</span>
                <div className="w-16 h-16 rounded-xl bg-indigo-950/60 border border-indigo-700/40 flex items-center justify-center text-2xl">
                  📂
                </div>
                <div className="w-full bg-slate-900 p-2 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono">
                  Aadhaar_Card.pdf (1.2 MB)
                </div>
              </div>
              <div className="text-left w-full space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">02 • Upload File</span>
                <h4 className="text-sm font-bold text-white">PDF / Image Upload</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  High-speed upload with strict 25MB limits and complete client-side privacy.
                </p>
              </div>
            </div>

            {/* SCREEN 3 */}
            <div
              onMouseMove={(e) => handleMouseMove(e, 3)}
              onMouseLeave={handleMouseLeave}
              className="bg-[#0b1021] border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-indigo-500/70 transition-all cursor-pointer relative group"
            >
              <div className="w-full h-56 bg-[#070b14] rounded-2xl border border-slate-800 p-3 flex flex-col justify-between items-center text-center group-hover:scale-[1.02] transition-transform">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Step 03</span>
                <div className="space-y-1.5 w-full text-left font-mono text-[9px]">
                  <div className="bg-slate-900 p-1.5 rounded flex justify-between text-slate-300">
                    <span>Color:</span>
                    <span className="text-white font-bold">Black & White</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded flex justify-between text-slate-300">
                    <span>Sides:</span>
                    <span className="text-white font-bold">Double-Sided</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded flex justify-between text-emerald-400 font-bold">
                    <span>Total:</span>
                    <span>₹4.00</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">Live Real-Time Pricing</p>
              </div>
              <div className="text-left w-full space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">03 • Configure Specs</span>
                <h4 className="text-sm font-bold text-white">Print Preferences</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Customers choose copies, orientation, and color modes with automated calculation.
                </p>
              </div>
            </div>

            {/* SCREEN 4 */}
            <div
              onMouseMove={(e) => handleMouseMove(e, 4)}
              onMouseLeave={handleMouseLeave}
              className="bg-[#0b1021] border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-indigo-500/70 transition-all cursor-pointer relative group"
            >
              <div className="w-full h-56 bg-[#070b14] rounded-2xl border border-slate-800 p-3 flex flex-col justify-between items-center text-center group-hover:scale-[1.02] transition-transform">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Step 04</span>
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-xl text-emerald-400">
                  🖨️
                </div>
                <div className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Printing at Counter!
                </div>
              </div>
              <div className="text-left w-full space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">04 • Instant Fulfillment</span>
                <h4 className="text-sm font-bold text-white">Instant Auto-Print</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Once payment is confirmed, the desktop agent spits paper immediately and shreds the file.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SHOPKEEPER ONBOARDING & SETUP (4 CARDS)           */}
        {/* ========================================================= */}
        {activeWorkflowTab === 'shopkeeper' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative animate-in fade-in duration-200">
            {/* SHOP STEP 1 */}
            <div
              onMouseMove={(e) => handleMouseMove(e, 1)}
              onMouseLeave={handleMouseLeave}
              className="bg-[#0b1021] border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-indigo-500/70 transition-all cursor-pointer relative group"
            >
              <div className="w-full h-56 bg-[#070b14] rounded-2xl border border-slate-800 p-3 flex flex-col justify-between items-center text-center group-hover:scale-[1.02] transition-transform">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Setup 01</span>
                <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-700/40 flex items-center justify-center text-2xl">
                  📝
                </div>
                <div className="w-full bg-slate-900 p-2 rounded-lg border border-slate-800 text-[10px] text-slate-300 font-mono">
                  scantoprint.in/register
                </div>
              </div>
              <div className="text-left w-full space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">01 • Register Shop</span>
                <h4 className="text-sm font-bold text-white">Create Account</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter store details, set your customer UPI ID, and choose your preferred plan or 7-day trial.
                </p>
              </div>
            </div>

            {/* SHOP STEP 2 */}
            <div
              onMouseMove={(e) => handleMouseMove(e, 2)}
              onMouseLeave={handleMouseLeave}
              className="bg-[#0b1021] border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-indigo-500/70 transition-all cursor-pointer relative group"
            >
              <div className="w-full h-56 bg-[#070b14] rounded-2xl border border-slate-800 p-3 flex flex-col justify-between items-center text-center group-hover:scale-[1.02] transition-transform">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Setup 02</span>
                <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-700/40 flex items-center justify-center text-2xl">
                  🪧
                </div>
                <div className="w-full bg-slate-900 p-2 rounded-lg border border-slate-800 text-[10px] text-emerald-400 font-mono">
                  Standee_QR.pdf (Downloaded)
                </div>
              </div>
              <div className="text-left w-full space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">02 • Get Standee</span>
                <h4 className="text-sm font-bold text-white">Download Counter QR</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Download and print your pre-generated QR standee from your merchant dashboard.
                </p>
              </div>
            </div>

            {/* SHOP STEP 3 */}
            <div
              onMouseMove={(e) => handleMouseMove(e, 3)}
              onMouseLeave={handleMouseLeave}
              className="bg-[#0b1021] border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-indigo-500/70 transition-all cursor-pointer relative group"
            >
              <div className="w-full h-56 bg-[#070b14] rounded-2xl border border-slate-800 p-3 flex flex-col justify-between items-center text-center group-hover:scale-[1.02] transition-transform">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Setup 03</span>
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-700/40 flex items-center justify-center text-2xl">
                  💻
                </div>
                <div className="w-full bg-slate-900 p-2 rounded-lg border border-slate-800 text-[10px] text-cyan-300 font-mono">
                  STP_Spooler.exe (Connected)
                </div>
              </div>
              <div className="text-left w-full space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">03 • Connect PC</span>
                <h4 className="text-sm font-bold text-white">Run Windows Agent</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Run the silent background spooler on your counter PC and connect with your shop API key.
                </p>
              </div>
            </div>

            {/* SHOP STEP 4 */}
            <div
              onMouseMove={(e) => handleMouseMove(e, 4)}
              onMouseLeave={handleMouseLeave}
              className="bg-[#0b1021] border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-indigo-500/70 transition-all cursor-pointer relative group"
            >
              <div className="w-full h-56 bg-[#070b14] rounded-2xl border border-slate-800 p-3 flex flex-col justify-between items-center text-center group-hover:scale-[1.02] transition-transform">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Setup 04</span>
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-xl text-emerald-400">
                  ⚡
                </div>
                <div className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Ready to Print!
                </div>
              </div>
              <div className="text-left w-full space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">04 • Counter Live</span>
                <h4 className="text-sm font-bold text-white">Full Automation</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Place standee on desk. Customer scans, uploads, pays via UPI, and prints output automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING CURSOR TOOLTIP / MICRO POPUP CARD */}
        {hoveredCard && currentTooltips[hoveredCard] && (
          <div
            style={{
              position: 'fixed',
              left: mousePos.x + 15,
              top: mousePos.y + 15,
              pointerEvents: 'none',
              zIndex: 9999,
            }}
            className="hidden md:block w-72 bg-[#080d1a]/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-4 shadow-2xl shadow-indigo-600/30 text-left animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                {currentTooltips[hoveredCard].badge}
              </span>
              <span className="text-[9px] font-bold text-emerald-400">
                {currentTooltips[hoveredCard].highlight}
              </span>
            </div>
            <h5 className="text-xs font-black text-white mb-2">
              {currentTooltips[hoveredCard].title}
            </h5>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              {currentTooltips[hoveredCard].details.map((point, idx) => (
                <li key={idx} className="flex items-start gap-1.5 leading-snug">
                  <span className="text-indigo-400 text-xs">▹</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}