'use client';

import React, { useState, useEffect } from 'react';

export default function InteractiveWorkflow() {
  // 4-step auto-looping animation ticker (1: Scan -> 2: Upload -> 3: Pay -> 4: Print)
  const [animStep, setAnimStep] = useState<number>(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimStep((prev) => (prev >= 4 ? 1 : prev + 1));
    }, 2500); // changes every 2.5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-16">
      {/* ------------------------------------------------------------- */}
      {/* 1. PURE CODE SVG/CSS ANIMATION STAGE (PHONE -> SPOOL -> PRINT) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-b from-[#0e1628] to-[#070b18] border border-indigo-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Live Zero-Touch Demo
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Watch How Fast A Document Prints (Zero-Touch)
          </h3>
          <p className="text-xs text-slate-400">
            Automated loop running via client SVG & CSS spooling engine.
          </p>
        </div>

        {/* Animated Visual Canvas */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-6 max-w-3xl mx-auto relative">
          
          {/* A. MOBILE PHONE MOCKUP */}
          <div className="w-56 h-[320px] bg-slate-900 rounded-[2.5rem] p-3 border-4 border-slate-700 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            {/* Speaker & Camera Notch */}
            <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900"></div>
            </div>

            {/* Dynamic Phone Screen Content */}
            <div className="flex-1 bg-[#060813] rounded-2xl p-3 flex flex-col items-center justify-center text-center relative overflow-hidden border border-slate-800">
              
              {animStep === 1 && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="relative w-24 h-24 mx-auto border-2 border-dashed border-indigo-500 rounded-xl p-2 flex items-center justify-center">
                    {/* Laser scanning beam */}
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce"></div>
                    <span className="text-3xl">📱</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Step 1</span>
                    <p className="text-xs font-bold text-white">Scanning QR Code...</p>
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
                    <p className="text-xs font-bold text-white">UPI Payment Done</p>
                    <p className="text-[10px] text-slate-400 font-mono">₹2.00 Transferred</p>
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
                    <p className="text-xs font-bold text-white">Signal Dispatched!</p>
                    <p className="text-[9px] text-slate-500 font-mono">Zero Retention Safe</p>
                  </div>
                </div>
              )}
            </div>

            {/* Home Indicator */}
            <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-2"></div>
          </div>

          {/* B. CONNECTING PULSING CLOUD BEAM */}
          <div className="flex flex-col items-center justify-center gap-1.5 py-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
              Cloud Relay (0.2s)
            </div>
            <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 animate-pulse"></div>
            <span className="text-[11px] text-slate-500 font-mono">Encrypted Queue</span>
          </div>

          {/* C. DESKTOP PRINTER SPOOLER MOCKUP */}
          <div className="w-64 bg-[#0a0f1d] border-2 border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 text-center relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${animStep === 4 ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`}></span>
                <span className="text-[10px] font-mono text-slate-300">Counter Printer</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-slate-800 text-emerald-400 px-2 py-0.5 rounded">
                USB ONLINE
              </span>
            </div>

            {/* Printer Graphic */}
            <div className="relative w-36 h-20 mx-auto bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center shadow-inner">
              <span className="text-3xl">🖨️</span>

              {/* Animated Paper Slithering Out */}
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
              <p className="text-xs font-bold text-white">Windows Agent Sync</p>
              <p className="text-[10px] text-slate-400">
                {animStep === 4 ? '🖨️ Physical Print Executed!' : 'Waiting for paid spool job...'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. FOUR SCREENS FROM SCAN TO PRINT (PHONE APP STEPS UI)        */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Four Screens From Scan To Print
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Clean, mobile-first interface designed for customers of all ages. No WhatsApp or USB flash drives needed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* SCREEN 1 */}
          <div className="bg-[#0b1021] border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-indigo-500/50 transition-all">
            <div className="w-full h-56 bg-[#070b14] rounded-2xl border border-slate-800 p-3 flex flex-col justify-between items-center text-center">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Screen 01</span>
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
          <div className="bg-[#0b1021] border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-indigo-500/50 transition-all">
            <div className="w-full h-56 bg-[#070b14] rounded-2xl border border-slate-800 p-3 flex flex-col justify-between items-center text-center">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Screen 02</span>
              <div className="w-16 h-16 rounded-xl bg-indigo-950/60 border border-indigo-700/40 flex items-center justify-center text-2xl">
                📂
              </div>
              <div className="w-full bg-slate-900 p-2 rounded-lg border border-slate-800 text-[10px] text-slate-400">
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
          <div className="bg-[#0b1021] border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-indigo-500/50 transition-all">
            <div className="w-full h-56 bg-[#070b14] rounded-2xl border border-slate-800 p-3 flex flex-col justify-between items-center text-center">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Screen 03</span>
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
          <div className="bg-[#0b1021] border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-indigo-500/50 transition-all">
            <div className="w-full h-56 bg-[#070b14] rounded-2xl border border-slate-800 p-3 flex flex-col justify-between items-center text-center">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Screen 04</span>
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-xl text-emerald-400">
                🖨️
              </div>
              <div className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Printing at Counter!
              </div>
            </div>
            <div className="text-left w-full space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">04 • Instant Fulfillment</span>
              <h4 className="text-sm font-bold text-white">Zero-Touch Print</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                As UPI confirms, desktop agent spits paper immediately and shreds the file.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}