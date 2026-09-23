'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  FileText, 
  CreditCard, 
  Printer, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Wifi, 
  Lock, 
  Sparkles,
  ArrowRight,
  HardDrive,
  FileCheck2,
  Clock,
  Radio
} from 'lucide-react';

interface StepTooltip {
  title: string;
  badge: string;
  highlight: string;
  details: string[];
}

interface StepItem {
  id: number;
  stepNum: string;
  badge: string;
  title: string;
  desc: string;
  icon: string;
  previewType: 'qr' | 'file' | 'pricing' | 'done' | 'register' | 'standee' | 'agent' | 'ready';
  tooltip: StepTooltip;
}

const CUSTOMER_STEPS: StepItem[] = [
  {
    id: 1,
    stepNum: 'Step 01',
    badge: '01 • Scan Standee',
    title: 'Instant QR Intake',
    desc: 'Customer scans the counter QR using their default camera or Google Lens without installing any app.',
    icon: '📱',
    previewType: 'qr',
    tooltip: {
      title: 'Zero-App Web Intake',
      badge: 'Zero Friction',
      highlight: 'Works On Any Phone',
      details: [
        'Instant web browser portal redirect.',
        'Zero registration or app download needed.',
        'Auto-paired with shop counter printer id.',
      ],
    },
  },
  {
    id: 2,
    stepNum: 'Step 02',
    badge: '02 • Upload Document',
    title: 'Drag & Drop PDF/Docs',
    desc: 'Uploads PDFs, photos, or documents up to 25MB with auto page counter and instant validation.',
    icon: '📂',
    previewType: 'file',
    tooltip: {
      title: 'Secure Document Parser',
      badge: '25MB Hard Cap',
      highlight: 'Memory-Only Buffer',
      details: [
        'Instant client-side PDF page calculation.',
        'Supports PDF, DOCX, JPG, PNG & Scans.',
        'End-to-end 256-bit SSL encrypted stream.',
      ],
    },
  },
  {
    id: 3,
    stepNum: 'Step 03',
    badge: '03 • Configure & Pay',
    title: 'UPI Direct Settlement',
    desc: 'Choose B&W or Color, set copies, and pay directly via GPay/PhonePe straight into the shopkeeper bank.',
    icon: '💳',
    previewType: 'pricing',
    tooltip: {
      title: 'Dynamic UPI Routing',
      badge: 'Zero Middleman Fee',
      highlight: 'Direct Shop UPI',
      details: [
        'Customer pays directly to shop UPI VPA.',
        'Automatic receipt & transaction binding.',
        'Instant webhook triggers local spool release.',
      ],
    },
  },
  {
    id: 4,
    stepNum: 'Step 04',
    badge: '04 • Instant Auto-Print',
    title: 'Hands-Free Physical Output',
    desc: 'Counter printer instantly ejects prints while source files are auto-shredded for complete privacy.',
    icon: '🖨️',
    previewType: 'done',
    tooltip: {
      title: 'Physical Print & Wipe Engine',
      badge: '100% Privacy',
      highlight: 'Zero Data Retention',
      details: [
        'Desktop spooler outputs directly to USB/LAN.',
        'No WhatsApp queue or pen-drive virus risk.',
        'Storage shredded instantly after paper ejection.',
      ],
    },
  },
];

const SHOPKEEPER_STEPS: StepItem[] = [
  {
    id: 101,
    stepNum: 'Setup 01',
    badge: '01 • Register Store',
    title: 'Create Free Account',
    desc: 'Enter store name, mobile number, and your personal UPI ID in under 60 seconds.',
    icon: '📝',
    previewType: 'register',
    tooltip: {
      title: 'Self-Serve Merchant Onboarding',
      badge: 'Instant Setup',
      highlight: 'Zero Hardware Cost',
      details: [
        'Generate custom branded shop portal URL.',
        'Set custom price per B&W and Color page.',
        'Link personal UPI handle for 100% direct payouts.',
      ],
    },
  },
  {
    id: 102,
    stepNum: 'Setup 02',
    badge: '02 • Download Standee',
    title: 'Print Counter QR',
    desc: 'Get your customized ready-to-print acrylic standee graphic straight from the dashboard.',
    icon: '🪧',
    previewType: 'standee',
    tooltip: {
      title: 'Branded Standee Generator',
      badge: 'Ready To Print',
      highlight: 'High-Res Vector',
      details: [
        'Includes store branding and automated QR.',
        'Available in A4, A5, and Acrylic table-stand formats.',
        'Permanent dynamic link that never expires.',
      ],
    },
  },
  {
    id: 103,
    stepNum: 'Setup 03',
    badge: '03 • Connect Counter PC',
    title: 'Run Desktop Spooler',
    desc: 'Run the lightweight Windows agent (.bat or .exe) to securely bind your HP, Canon, Epson or Brother printer.',
    icon: '💻',
    previewType: 'agent',
    tooltip: {
      title: 'Lightweight Desktop Agent',
      badge: 'Native Windows',
      highlight: 'Runs On Startup',
      details: [
        'Auto-detects default connected USB & Wi-Fi printers.',
        'Silent background tray icon with low CPU usage.',
        'Instant web-socket push for sub-second response.',
      ],
    },
  },
  {
    id: 104,
    stepNum: 'Setup 04',
    badge: '04 • Fully Automated',
    title: 'Sit Back & Profit',
    desc: 'Customers scan, upload, and collect paper prints automatically while cash arrives in your bank.',
    icon: '⚡',
    previewType: 'ready',
    tooltip: {
      title: 'Touchless Counter Automation',
      badge: 'Zero Manual Work',
      highlight: 'Save 4+ Hours Daily',
      details: [
        'Eliminates WhatsApp congestion and Bluetooth pairing.',
        'Guaranteed zero malware or infected USB drives.',
        'Complete accounting ledger and page tracking.',
      ],
    },
  },
];

export default function InteractiveWorkflow() {
  const [stage, setStage] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(3000); // 3 seconds per stage
  const [activeTooltip, setActiveTooltip] = useState<StepTooltip | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setStage((prev) => (prev >= 4 ? 1 : prev + 1));
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed]);

  const handleManualStage = (newStage: number) => {
    setStage(newStage);
  };

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
    <div className="space-y-24 relative select-none">

      {}
      <div className="relative rounded-[2.5rem] bg-gradient-to-b from-[#0a0f24] via-[#070b18] to-[#04060f] border border-cyan-500/30 p-6 sm:p-10 lg:p-12 shadow-[0_0_80px_-20px_rgba(6,182,212,0.15)] overflow-hidden">
        
        {/* Subtle Ambient Background Grids */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-25 pointer-events-none" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 relative z-10 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono font-bold uppercase tracking-widest shadow-inner">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Live Spool Architecture Demo
          </div>
          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            See How A Document Prints In Under <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">2 Seconds</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            From physical QR scan on a customer&apos;s mobile to encrypted zero-touch physical paper output on the counter.
          </p>
        </div>

        {/* Interactive Step Controller Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 max-w-2xl mx-auto mb-10 relative z-10 shadow-lg">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-cyan-500/30"
              title={isPlaying ? 'Pause Auto-Play' : 'Resume Auto-Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={() => setStage(1)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              title="Restart from Step 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step Selector Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {[
              { num: 1, label: 'Scan', icon: QrCode },
              { num: 2, label: 'Upload', icon: FileText },
              { num: 3, label: 'UPI Pay', icon: CreditCard },
              { num: 4, label: 'Print', icon: Printer },
            ].map((s) => {
              const Icon = s.icon;
              const active = stage === s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => handleManualStage(s.num)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                    active
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 scale-105'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.num}</span>
                </button>
              );
            })}
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <Clock className="w-3 h-3 text-cyan-400" />
            <button 
              onClick={() => setSpeed(speed === 2000 ? 3500 : 2000)}
              className="hover:text-cyan-300 transition-colors underline decoration-dotted"
            >
              {speed === 2000 ? '1.5x Speed' : 'Normal'}
            </button>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto py-2 relative z-10">

          {/* 1. Realistic Mobile Mockup (4 cols) */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-64 sm:w-72 h-[440px] bg-gradient-to-b from-slate-900 to-[#0b1021] rounded-[3rem] p-3.5 border-[5px] border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative flex flex-col justify-between overflow-hidden">
              
              {/* Speaker / Dynamic Island Notch */}
              <div className="w-24 h-4 bg-slate-950 rounded-full mx-auto flex items-center justify-center gap-2 z-20">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
                <div className="w-2.5 h-1 rounded-full bg-slate-900" />
              </div>

              {/* Mobile Screen Internal Surface */}
              <div className="flex-1 bg-[#050814] rounded-[2.2rem] p-4 flex flex-col justify-between text-center relative overflow-hidden border border-slate-800/80 mt-2">
                
                {/* Mobile Top Bar */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pb-2 border-b border-slate-800/60">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Wifi className="w-2.5 h-2.5" /> 5G
                  </span>
                  <span className="font-semibold text-slate-400">scantoprint.in/shop</span>
                  <span className="flex items-center gap-0.5 text-cyan-400">
                    <Lock className="w-2.5 h-2.5" /> SSL
                  </span>
                </div>

                {/* DYNAMIC SCREEN CONTENT ACCORDING TO STAGE */}
                <div className="flex-1 flex flex-col items-center justify-center py-2">
                  
                  {/* Step 1: Scanning QR Code */}
                  {stage === 1 && (
                    <div className="space-y-4 w-full animate-in fade-in zoom-in-95 duration-300">
                      <div className="relative w-36 h-36 mx-auto rounded-2xl bg-slate-950 border-2 border-dashed border-cyan-400/60 p-3 flex flex-col items-center justify-center shadow-inner overflow-hidden">
                        {/* Laser Scan Beam */}
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-[bounce_1.6s_ease-in-out_infinite]" />
                        
                        <div className="w-24 h-24 bg-white rounded-xl p-1.5 flex items-center justify-center shadow-md">
                          <QrCode className="w-full h-full text-slate-900" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                          Step 01 • Camera Lens
                        </span>
                        <h5 className="text-xs font-bold text-white">Scanning Standee QR</h5>
                        <p className="text-[10px] text-slate-400 font-mono">Auto-resolving store queue...</p>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Document Upload & Inspection */}
                  {stage === 2 && (
                    <div className="space-y-3.5 w-full animate-in fade-in zoom-in-95 duration-300">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-400/40 flex items-center justify-center shadow-lg shadow-indigo-500/10 relative">
                        <FileText className="w-8 h-8 text-indigo-400 animate-pulse" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full text-[9px] font-bold text-slate-950 flex items-center justify-center">
                          PDF
                        </span>
                      </div>
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-left space-y-1.5 font-mono text-[10px]">
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="truncate max-w-[110px]">Contract_Final.pdf</span>
                          <span className="text-cyan-400">1.8 MB</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Page Count:</span>
                          <span className="text-white font-bold">4 Pages (B&W)</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full w-full animate-[pulse_1s_infinite]" />
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                          Step 02 • Validating File
                        </span>
                        <p className="text-xs font-bold text-white mt-0.5">Ready for Print Spool</p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: UPI Payment Success */}
                  {stage === 3 && (
                    <div className="space-y-3.5 w-full animate-in fade-in zoom-in-95 duration-300">
                      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                        <CheckCircle2 className="w-9 h-9 text-emerald-400 animate-bounce" />
                      </div>
                      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 space-y-1">
                        <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-wide block">
                          UPI Payment Verified
                        </span>
                        <div className="text-base font-black text-white">₹8.00 Paid Direct</div>
                        <p className="text-[9px] text-slate-400 font-mono">To: Merchant VPA (Zero Fee)</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                          Step 03 • Authorizing
                        </span>
                        <p className="text-xs font-bold text-white mt-0.5">Spool Signal Unlocked ⚡</p>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Spool Dispatched */}
                  {stage === 4 && (
                    <div className="space-y-3.5 w-full animate-in fade-in zoom-in-95 duration-300">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Zap className="w-8 h-8 text-cyan-400 animate-pulse" />
                      </div>
                      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-2.5 text-center space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-cyan-400 text-xs font-mono font-bold">
                          <Radio className="w-3.5 h-3.5 animate-ping" />
                          <span>Signal Dispatched</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono">Job ID: #STP-8842</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                          Step 04 • Completed
                        </span>
                        <p className="text-xs font-bold text-white mt-0.5">Physical Print Ejected!</p>
                      </div>
                    </div>
                  )}

                </div>

                {/* Mobile Bottom Home Bar */}
                <div className="w-20 h-1 bg-slate-700 rounded-full mx-auto" />
              </div>

              {/* Physical Home Indicator */}
              <div className="w-28 h-1 bg-slate-600 rounded-full mx-auto mt-2" />
            </div>
          </div>

          {/* 2. Cloud Transit Pipeline & Telemetry (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-4 py-4">
            
            {/* Realtime Speed Telemetry Badge */}
            <div className="bg-[#0b1021]/90 border border-cyan-500/40 rounded-2xl p-4 w-full max-w-xs shadow-xl space-y-2 backdrop-blur-md">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  Cloud Queue
                </span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  0.18s Latency
                </span>
              </div>

              {/* Visual Animated Laser Beam Line */}
              <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden my-2">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    stage >= 3 
                      ? 'w-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-500 shadow-[0_0_12px_#22d3ee]' 
                      : 'w-1/3 bg-cyan-500/40 animate-pulse'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] font-mono text-slate-400">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">ENCRYPTION</span>
                  <span className="text-cyan-300 font-bold">256-bit TLS</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">STORAGE WIPE</span>
                  <span className="text-emerald-400 font-bold">Auto-Zeroize</span>
                </div>
              </div>
            </div>

            {/* Directional Flow Arrow */}
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <span>Encrypted Data Stream</span>
              <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
            </div>

          </div>

          {/* 3. 3D-Styled Counter Printer Spooler (4 cols) */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-72 bg-[#090e1f] border-2 border-slate-700/80 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-4 text-center relative overflow-visible">
              
              {/* Printer Header / Status Bar */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage === 4 ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`} />
                  <span className="text-xs font-mono text-slate-200 font-bold">Counter Spooler</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  USB LINKED
                </span>
              </div>

              {/* Realistic Printer Body */}
              <div className="relative w-48 h-32 mx-auto bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-2xl flex flex-col items-center justify-between p-3 shadow-inner">
                
                {/* Paper Feeding Tray (Top) */}
                <div className="w-32 h-2.5 bg-slate-950 rounded border border-slate-700/80" />

                {/* Printer Front Display & Status Light */}
                <div className="w-full flex items-center justify-between px-2 py-1 bg-slate-950/60 rounded border border-slate-800">
                  <div className="flex items-center gap-1 text-[9px] font-mono text-cyan-300">
                    <Printer className="w-3 h-3 text-cyan-400" />
                    <span>HP LaserJet Pro</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${stage === 4 ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                </div>

                {/* Paper Output Slot (Bottom) */}
                <div className="relative w-36 h-2 bg-black rounded border border-slate-700/60 overflow-visible">
                  
                  {/* PHYSICAL PAPER EJECTION ANIMATION */}
                  {stage === 4 ? (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-28 bg-white text-slate-900 rounded-b shadow-[0_15px_30px_rgba(0,0,0,0.6)] p-2 border border-slate-300 transform transition-all duration-700 animate-in slide-in-from-top-6 z-20 space-y-1">
                      {/* Realistic Printed Lines */}
                      <div className="w-full h-1 bg-slate-800 rounded" />
                      <div className="w-4/5 h-1 bg-slate-400 rounded" />
                      <div className="w-full h-1 bg-slate-300 rounded" />
                      <div className="w-3/4 h-1 bg-indigo-500 rounded" />
                      
                      {/* Printed Stamp */}
                      <div className="mt-1 pt-1 border-t border-dashed border-slate-300 flex items-center justify-between text-[7px] font-mono text-emerald-700 font-bold">
                        <span>PRINTED ✓</span>
                        <span>0.4s</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-1 bg-slate-800 rounded mx-auto" />
                  )}

                </div>
              </div>

              {/* Status Description */}
              <div className="pt-2">
                <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Windows Background Agent</span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  {stage === 4 ? (
                    <span className="text-emerald-400 font-bold animate-pulse">
                      Document printed & memory shredded!
                    </span>
                  ) : (
                    <span>Ready • Listening on local port</span>
                  )}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom Feature Micro-Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-10 border-t border-slate-800/80 max-w-4xl mx-auto text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero Driver Installation</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Direct UPI Settlement</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Auto-Wipe Privacy Guaranteed</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Compatible with any USB/WiFi Printer</span>
          </div>
        </div>

      </div>

      {}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-mono font-bold uppercase tracking-wider">
            <span>📱</span>
            <span>Customer Perspective</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            The Customer Journey • 4 Frictionless Steps
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Clean, zero-install mobile web flow. Hover over any card for architectural specifications.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CUSTOMER_STEPS.map((step) => (
            <div
              key={step.id}
              onMouseEnter={(e) => handleMouseEnter(step.tooltip, e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="bg-[#090e1f]/80 backdrop-blur-sm border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-cyan-500/60 hover:bg-[#0d152c] transition-all cursor-pointer group"
            >
              <div className="w-full h-52 bg-[#060914] rounded-2xl border border-slate-800/80 p-3 flex flex-col justify-between items-center text-center group-hover:scale-[1.02] transition-transform">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">{step.stepNum}</span>
                
                {step.previewType === 'qr' && (
                  <div className="p-3 bg-white rounded-2xl shadow-md group-hover:shadow-cyan-500/20">
                    <QrCode className="w-12 h-12 text-slate-900" />
                  </div>
                )}
                {step.previewType === 'file' && (
                  <div className="w-full space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-cyan-400" />
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
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 block">
                      Printing!
                    </span>
                  </div>
                )}

                <p className="text-[10px] font-bold text-slate-300">{step.badge}</p>
              </div>

              <div className="text-left w-full space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{step.stepNum}</span>
                <h4 className="text-sm font-bold text-white">{step.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="space-y-6 pt-4 border-t border-slate-800/80">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold uppercase tracking-wider">
            <span>🏪</span>
            <span>Shopkeeper Perspective</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Shopkeeper Setup Guide • Automate Counter In 2 Minutes
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Quick zero-config onboarding. Connect your counter PC and USB printer with zero technical headaches.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SHOPKEEPER_STEPS.map((step) => (
            <div
              key={step.id}
              onMouseEnter={(e) => handleMouseEnter(step.tooltip, e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="bg-[#090e1f]/80 backdrop-blur-sm border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col items-center space-y-4 hover:border-emerald-500/60 hover:bg-[#0d152c] transition-all cursor-pointer group"
            >
              <div className="w-full h-52 bg-[#060914] rounded-2xl border border-slate-800/80 p-3 flex flex-col justify-between items-center text-center group-hover:scale-[1.02] transition-transform">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">{step.stepNum}</span>

                {step.previewType === 'register' && (
                  <div className="w-full space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="w-full bg-slate-900 p-1.5 rounded border border-slate-800 text-[9px] text-slate-300 font-mono truncate">
                      scantoprint.in/register
                    </div>
                  </div>
                )}
                {step.previewType === 'standee' && (
                  <div className="w-full space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <FileCheck2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="w-full bg-slate-900 p-1.5 rounded border border-slate-800 text-[9px] text-emerald-400 font-mono truncate">
                      Standee_QR.pdf ✓
                    </div>
                  </div>
                )}
                {step.previewType === 'agent' && (
                  <div className="w-full space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                      <Printer className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="w-full bg-slate-900 p-1.5 rounded border border-slate-800 text-[9px] text-indigo-300 font-mono truncate">
                      ScanToPrint.exe (Active)
                    </div>
                  </div>
                )}
                {step.previewType === 'ready' && (
                  <div className="space-y-1.5">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                      <Zap className="w-6 h-6" />
                    </div>
                    <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 block">
                      Counter Live!
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

      {}
      {activeTooltip && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(cursorPos.x + 16, typeof window !== 'undefined' ? window.innerWidth - 300 : cursorPos.x + 16),
            top: Math.min(cursorPos.y + 16, typeof window !== 'undefined' ? window.innerHeight - 220 : cursorPos.y + 16),
            pointerEvents: 'none',
            zIndex: 99999,
          }}
          className="w-72 bg-[#070c1a]/95 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl p-4 shadow-2xl shadow-cyan-500/20 text-left transition-transform duration-75 ease-out"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
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
                <span className="text-cyan-400 text-xs">▹</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}