'use client';

import React, { useState, useEffect } from 'react';

interface StepTooltip {
  title: string;
  badge: string;
  highlight: string;
  details: string[];
}

const CUSTOMER_STEPS: Array<{
  id: number;
  stepNum: string;
  badge: string;
  title: string;
  desc: string;
  icon: string;
  previewType: 'qr' | 'file' | 'pricing' | 'done';
  tooltip: StepTooltip;
}> = [
  {
    id: 1,
    stepNum: 'Step 01',
    badge: '01 • Scan The QR',
    title: 'Direct URL Intake',
    desc: 'Opens shop portal instantly in mobile browser without installing any app.',
    icon: '📱',
    previewType: 'qr',
    tooltip: {
      title: 'Dynamic QR Standee Intake',
      badge: 'Scan & Open',
      highlight: 'No App Required',
      details: [
        'Customer uses phone camera or Google Lens.',
        'Opens dedicated shop web portal instantly.',
        'Auto-connects to your store printer queue.',
      ],
    },
  },
  {
    id: 2,
    stepNum: 'Step 02',
    badge: '02 • Upload File',
    title: 'PDF / Image Upload',
    desc: 'High-speed document upload with strict 25MB limits and instant validation.',
    icon: '📂',
    previewType: 'file',
    tooltip: {
      title: 'High-Speed Secure Upload',
      badge: '25MB Hard Cap',
      highlight: 'Zero Data Retention',
      details: [
        'Uploads PDFs, JPG, PNG & document scans.',
        'Auto page count & dimension extraction.',
        'Client encrypted transmission to cloud queue.',
      ],
    },
  },
  {
    id: 3,
    stepNum: 'Step 03',
    badge: '03 • Configure Specs',
    title: 'Print Preferences',
    desc: 'Customers choose copies, color, and duplex with automated real-time price calculation.',
    icon: '⚙️',
    previewType: 'pricing',
    tooltip: {
      title: 'Preference & Price Engine',
      badge: 'Live Billing',
      highlight: 'Direct UPI Routing',
      details: [
        'Choose Color / B&W, Duplex & Copies count.',
        'Real-time price calculation per store rates.',
        'Customer UPI payment routes direct to your bank.',
      ],
    },
  },
  {
    id: 4,
    stepNum: 'Step 04',
    badge: '04 • Instant Fulfillment',
    title: 'Instant Auto-Print',
    desc: 'Once payment is confirmed, the desktop spooler outputs print immediately.',
    icon: '🖨️',
    previewType: 'done',
    tooltip: {
      title: 'Instant Desktop Auto-Print',
      badge: '1-Click Spool',
      highlight: 'Auto-Wiped Privacy',
      details: [
        'Windows background agent catches print signal.',
        'Pushes file silently to your default USB printer.',
        'Memory shredded permanently after physical output.',
      ],
    },
  },
];

const SHOPKEEPER_STEPS: Array<{
  id: number;
  stepNum: string;
  badge: string;
  title: string;
  desc: string;
  icon: string;
  previewType: 'register' | 'standee' | 'agent' | 'ready';
  tooltip: StepTooltip;
}> = [
  {
    id: 101,
    stepNum: 'Setup 01',
    badge: '01 • Register Shop',
    title: 'Create Account',
    desc: 'Enter store details, set your personal UPI ID, and choose your preferred tier or trial.',
    icon: '📝',
    previewType: 'register',
    tooltip: {
      title: 'Instant Merchant Onboarding',
      badge: 'Setup Under 2 Mins',
      highlight: '7-Day Free Trial',
      details: [
        'Fill owner name, shop name, mobile & UPI handle.',
        'Immediate generation of your shop portal URL.',
        'No hardware lock-in or technical hurdles.',
      ],
    },
  },
  {
    id: 102,
    stepNum: 'Setup 02',
    badge: '02 • Get Standee',
    title: 'Download Counter QR',
    desc: 'Download your high-resolution customized QR standee straight from your dashboard.',
    icon: '🪧',
    previewType: 'standee',
    tooltip: {
      title: 'Store Standee & QR Generator',
      badge: 'Ready to Print',
      highlight: 'Custom Branded Standee',
      details: [
        'Download high-resolution ready-to-print standee PDF.',
        'Pre-embedded with your custom dynamic QR code.',
        'Place it directly on your store counter for customers.',
      ],
    },
  },
  {
    id: 103,
    stepNum: 'Setup 03',
    badge: '03 • Connect PC',
    title: 'Run Windows Agent',
    desc: 'Run the lightweight desktop background spooler and connect with your shop API key.',
    icon: '💻',
    previewType: 'agent',
    tooltip: {
      title: 'Windows Desktop Spooler Sync',
      badge: 'Lightweight .EXE',
      highlight: 'Plug & Play USB',
      details: [
        'Download the small Windows background agent.',
        'Enter your shop secret key once to pair your PC.',
        'Binds silently with any HP, Canon, Epson or Brother printer.',
      ],
    },
  },
  {
    id: 104,
    stepNum: 'Setup 04',
    badge: '04 • Counter Live',
    title: 'Full Automation',
    desc: 'Customers scan, pay, and documents print automatically with zero pen-drive hassle.',
    icon: '⚡',
    previewType: 'ready',
    tooltip: {
      title: 'Counter Live & Automated',
      badge: 'Zero Manual Work',
      highlight: 'Earn More Daily',
      details: [
        'Customers scan standee, pay via UPI, and prints roll out.',
        'No pen-drive viruses or WhatsApp chaos at counter.',
        'Full live telemetry, page quota tracking & order ledger.',
      ],
    },
  },
];

export default function InteractiveWorkflow() {
  const [animStep, setAnimStep] = useState<number>(1);

  // Floating Info Box State
  const [activeTooltip, setActiveTooltip] = useState<StepTooltip | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimStep((prev) => (prev >= 4 ? 1 : prev + 1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleMouseEnter = (tooltip: StepTooltip, e: React.MouseEvent) => {
    setActiveTooltip(tooltip);
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setActiveTooltip(null);
  };

  return (
    <div className="space-y-20 relative">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. ANIMATED LIVE DEMO STAGE (PHONE -> CLOUD RELAY -> PRINTER) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-b from-[#0e1628]/90 to-[#070b18]/90 border border-indigo-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Live Spool Engine
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Watch How Fast A Document Prints
          </h3>
          <p className="text-xs text-slate-400">
            Automated workflow from mobile QR scan to physical paper output.
          </p>
        </div>

        {/* Animated Visual Canvas */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-6 max-w-3xl mx-auto relative">
          
          {/* Phone Mockup */}
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
                    <p className="text-[9px] text-slate-500 font-mono">Auto-Wiped Privacy</p>
                  </div>
                </div>
              )}
            </div>

            <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-2"></div>
          </div>

          {/* Pulsing Beam */}
          <div className="flex flex-col items-center justify-center gap-1.5 py-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
              Cloud Spool (0.2s)
            </div>
            <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 animate-pulse"></div>
            <span className="text-[11px] text-slate-500 font-mono">Encrypted Queue</span>
          </div>

          {/* Desktop Printer Spooler */}
          <div className="w-64 bg-[#0a0f1d] border-2 border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 text-center relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${animStep === 4 ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`}></span>
                <span className="text-[10px] font-mono text-slate-300">Counter Printer</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-slate-800 text-emerald-400 px-2 py-0.5 rounded">
                ONLINE
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
      {/* 2. SECTION A: THE CUSTOMER EXPERIENCE (4 STEPS)               */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-wider">
            <span>📱</span>
            <span>Customer Perspective</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            The Customer Journey • 4 Simple Steps to Print
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Clean, zero-install mobile web flow. Hover your mouse over any card to view detailed specifications.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CUSTOMER_STEPS.map((step) => (
            <div
              key={step.id}
              onMouseEnter={(e) => handleMouseEnter(step.tooltip, e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="bg-[#0b1021]/80 backdrop-blur-sm border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-indigo-500/80 hover:bg-[#0e1628] transition-all cursor-pointer group"
            >
              <div className="w-full h-52 bg-[#070b14] rounded-2xl border border-slate-800 p-3 flex flex-col justify-between items-center text-center group-hover:scale-[1.02] transition-transform">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">{step.stepNum}</span>
                
                {step.previewType === 'qr' && (
                  <div className="p-3 bg-white rounded-xl shadow-md">
                    <span className="text-3xl">🏁</span>
                  </div>
                )}
                {step.previewType === 'file' && (
                  <div className="w-full space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-950/80 border border-indigo-700/40 flex items-center justify-center text-2xl">
                      📂
                    </div>
                    <div className="w-full bg-slate-900 p-1.5 rounded border border-slate-800 text-[9px] text-slate-400 font-mono truncate">
                      Document.pdf (1.2 MB)
                    </div>
                  </div>
                )}
                {step.previewType === 'pricing' && (
                  <div className="space-y-1.5 w-full text-left font-mono text-[9px]">
                    <div className="bg-slate-900 p-1.5 rounded flex justify-between text-slate-300">
                      <span>Color:</span>
                      <span className="text-white font-bold">B&W</span>
                    </div>
                    <div className="bg-slate-900 p-1.5 rounded flex justify-between text-slate-300">
                      <span>Sides:</span>
                      <span className="text-white font-bold">Double</span>
                    </div>
                    <div className="bg-slate-900 p-1.5 rounded flex justify-between text-emerald-400 font-bold">
                      <span>Total:</span>
                      <span>₹4.00</span>
                    </div>
                  </div>
                )}
                {step.previewType === 'done' && (
                  <div className="space-y-1.5">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-xl text-emerald-400">
                      🖨️
                    </div>
                    <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 block">
                      Printing!
                    </span>
                  </div>
                )}

                <p className="text-[10px] font-bold text-slate-300">{step.badge}</p>
              </div>

              <div className="text-left w-full space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{step.stepNum}</span>
                <h4 className="text-sm font-bold text-white">{step.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. SECTION B: THE SHOPKEEPER EXPERIENCE (4 STEPS)             */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-6 pt-4 border-t border-slate-800/80">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
            <span>🏪</span>
            <span>Shopkeeper Perspective</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Shopkeeper Setup Guide • Automate Counter in 4 Steps
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Fast 2-minute onboarding. Connect your store PC and USB printer with zero technical complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SHOPKEEPER_STEPS.map((step) => (
            <div
              key={step.id}
              onMouseEnter={(e) => handleMouseEnter(step.tooltip, e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="bg-[#0b1021]/80 backdrop-blur-sm border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-emerald-500/80 hover:bg-[#0e1628] transition-all cursor-pointer group"
            >
              <div className="w-full h-52 bg-[#070b14] rounded-2xl border border-slate-800 p-3 flex flex-col justify-between items-center text-center group-hover:scale-[1.02] transition-transform">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">{step.stepNum}</span>

                {step.previewType === 'register' && (
                  <div className="w-full space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-950/80 border border-indigo-700/40 flex items-center justify-center text-2xl">
                      📝
                    </div>
                    <div className="w-full bg-slate-900 p-1.5 rounded border border-slate-800 text-[9px] text-slate-300 font-mono truncate">
                      scantoprint.in/register
                    </div>
                  </div>
                )}
                {step.previewType === 'standee' && (
                  <div className="w-full space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-950/80 border border-emerald-700/40 flex items-center justify-center text-2xl">
                      🪧
                    </div>
                    <div className="w-full bg-slate-900 p-1.5 rounded border border-slate-800 text-[9px] text-emerald-400 font-mono truncate">
                      Standee_QR.pdf ✓
                    </div>
                  </div>
                )}
                {step.previewType === 'agent' && (
                  <div className="w-full space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-950/80 border border-cyan-700/40 flex items-center justify-center text-2xl">
                      💻
                    </div>
                    <div className="w-full bg-slate-900 p-1.5 rounded border border-slate-800 text-[9px] text-cyan-300 font-mono truncate">
                      STP_Agent.exe (Active)
                    </div>
                  </div>
                )}
                {step.previewType === 'ready' && (
                  <div className="space-y-1.5">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-xl text-emerald-400">
                      ⚡
                    </div>
                    <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 block">
                      Counter Ready!
                    </span>
                  </div>
                )}

                <p className="text-[10px] font-bold text-slate-300">{step.badge}</p>
              </div>

              <div className="text-left w-full space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{step.stepNum}</span>
                <h4 className="text-sm font-bold text-white">{step.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FLOATING HOVER INFO POPUP (ATTACHED TO CURSOR)                */}
      {/* ------------------------------------------------------------- */}
      {activeTooltip && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(cursorPos.x + 16, typeof window !== 'undefined' ? window.innerWidth - 300 : cursorPos.x + 16),
            top: Math.min(cursorPos.y + 16, typeof window !== 'undefined' ? window.innerHeight - 200 : cursorPos.y + 16),
            pointerEvents: 'none',
            zIndex: 99999,
          }}
          className="w-72 bg-[#080d1a]/95 backdrop-blur-2xl border border-indigo-500/50 rounded-2xl p-4 shadow-2xl shadow-indigo-600/40 text-left transition-transform duration-75 ease-out"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
              {activeTooltip.badge}
            </span>
            <span className="text-[9px] font-bold text-emerald-400">
              {activeTooltip.highlight}
            </span>
          </div>
          <h5 className="text-xs font-black text-white mb-2">
            {activeTooltip.title}
          </h5>
          <ul className="space-y-1.5 text-[11px] text-slate-300">
            {activeTooltip.details.map((point, idx) => (
              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                <span className="text-indigo-400 text-xs">▹</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}