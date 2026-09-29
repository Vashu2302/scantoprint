'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function LegalPage() {
  useEffect(() => {
    document.title = 'Legal, Privacy Policy, Terms & Refund Policy • ScanToPrint';
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans selection:bg-indigo-600 selection:text-white pb-20">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-[#070b14]/80 px-6 sm:px-12 py-4 flex items-center justify-between sticky top-0 backdrop-blur-xl z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="ScanToPrint Logo" className="w-8 h-8 rounded-lg object-contain" />
          <span className="font-extrabold text-base tracking-tight text-white">
            ScanToPrint<span className="text-indigo-400">.in</span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-lg"
        >
          ← Back to Home
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 pt-12 space-y-10">
        <div className="space-y-2 border-b border-slate-800/80 pb-6">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Official Compliance & Legal Standards
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight pt-2">
            Privacy Policy, Terms & Refund Framework
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: September 2026 • Platform: scantoprint.in • Governing Law: Republic of India
          </p>
        </div>

        {/* 1. Privacy Policy & Auto File Deletion */}
        <section className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <h2 className="text-lg font-bold text-white tracking-tight">1. Privacy Policy & Automated File Purge</h2>
          </div>
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
            <p>
              ScanToPrint (<strong className="text-white">scantoprint.in</strong>) operates with strict zero-knowledge document transmission standards:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>
                <strong className="text-slate-200">Instant File Deletion (Auto-Purge):</strong> All customer documents (PDFs, identity scans, images) uploaded through counter QR codes are stored only temporarily in encrypted storage solely to dispatch print commands to the physical desk printer. Once printing finishes or the job closes, files are automatically and permanently deleted from cloud servers.
              </li>
              <li>
                <strong className="text-slate-200">Zero Content Inspection:</strong> We never read, index, profile, monetize, or share customer documents with any third-party advertising or analytics networks.
              </li>
              <li>
                <strong className="text-slate-200">Direct Merchant Settlements:</strong> Customer print charges are transferred peer-to-peer directly into the store owner&apos;s verified UPI ID. ScanToPrint does not hold, escrow, or deduct commission from customer retail print payments.
              </li>
            </ul>
          </div>
        </section>

        {/* 2. Terms of Service */}
        <section className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-xl">📜</span>
            <h2 className="text-lg font-bold text-white tracking-tight">2. Terms of Service & Platform Intermediary Role</h2>
          </div>
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
            <p>
              By accessing the portal, dashboard, or running the desktop spooler software, users and merchants agree to the following terms:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>
                <strong className="text-slate-200">SaaS Technology Intermediary:</strong> ScanToPrint functions purely as an automated routing technology provider connecting browser upload queues to Windows printer spoolers. We do not operate physical printing counters.
              </li>
              <li>
                <strong className="text-slate-200">Prohibited Documents & Compliance:</strong> Users must not upload forged credentials, counterfeit banknotes, prohibited materials, or copyright-infringing content. The user and the respective printing merchant bear full legal responsibility for document content.
              </li>
              <li>
                <strong className="text-slate-200">Hardware & On-Premise Disclaimer:</strong> ScanToPrint is not responsible for physical printer hardware jams, empty ink or toner cartridges, paper shortages, or local power and internet failures.
              </li>
            </ul>
          </div>
        </section>

        {/* 3. Refund & Cancellation Policy */}
        <section className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-xl">💳</span>
            <h2 className="text-lg font-bold text-white tracking-tight">3. Refund, Top-Up & Cancellation Policy</h2>
          </div>
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>
                <strong className="text-slate-200">Free Trial Testing:</strong> A 7-day full feature trial is provided so store owners can test print workflows and printer connections thoroughly before purchasing a subscription.
              </li>
              <li>
                <strong className="text-slate-200">Strict Non-Refundable SaaS Policy:</strong> Once a subscription plan (Standard or Premium) or page quota top-up is activated via UTR verification, payments are strictly non-refundable. Because computing resources, agent API tokens, and server quotas activate instantly, refunds for change of mind or unused days cannot be issued.
              </li>
              <li>
                <strong className="text-slate-200">Cancellation & Expiry:</strong> Accounts do not auto-debit your bank. If you do not wish to continue, simply do not renew. Your subscription ends automatically without penalty or extra cancellation fees.
              </li>
              <li>
                <strong className="text-slate-200">Payment Glitch Resolution:</strong> If money was deducted via UPI but your plan or quota top-up was not credited due to a network delay, send your 12-digit UTR and payment screenshot to our support desk. Quotas are reconciled and activated within 24 to 48 hours.
              </li>
            </ul>
          </div>
        </section>

        {/* 4. Contact & Support Information */}
        <section className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-xl">📞</span>
            <h2 className="text-lg font-bold text-white tracking-tight">4. Contact & Grievance Support</h2>
          </div>
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
            <p>For technical support, billing inquiries, or legal clarifications, reach out directly:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 bg-[#070b18] border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Primary Support Email</span>
                <a href="mailto:support@scantoprint.in" className="font-mono text-indigo-400 font-bold hover:underline block">
                  support@scantoprint.in
                </a>
              </div>
              <div className="p-4 bg-[#070b18] border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Backup Help Desk</span>
                <a href="mailto:scantoprint.support@gmail.com" className="font-mono text-emerald-400 font-bold hover:underline block">
                  scantoprint.support@gmail.com
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="text-center pt-4 text-xs text-slate-500 font-mono">
          © 2026 ScanToPrint.in • Built for Fast, Secure Counter Printing
        </div>
      </main>
    </div>
  );
}