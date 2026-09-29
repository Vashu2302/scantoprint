import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-indigo-600 selection:text-white">
      <div className="max-w-md w-full text-center space-y-6 bg-[#0b1021] border border-slate-800/90 p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-widest">
          <span>⚠️</span>
          <span>404 • Page Not Found</span>
        </div>

        {/* Icon & Heading */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl mx-auto shadow-inner">
            📄
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Lost at the Counter?
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page or print counter you are looking for does not exist, has been moved, or the store link is incorrect.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            href="/"
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 text-center flex items-center justify-center"
          >
            ← Back Home
          </Link>
          <Link
            href="/login"
            className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs uppercase tracking-wider transition-all text-center flex items-center justify-center"
          >
            Store Login ➔
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-800/80">
          <p className="text-[10px] text-slate-500 font-mono">
            Powered by scantoprint.in • Instant Wireless Printing
          </p>
        </div>
      </div>
    </div>
  );
}