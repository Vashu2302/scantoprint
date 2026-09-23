'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function LegalPage() {
  useEffect(() => {
    document.title = 'Legal, Privacy Policy & Terms • ScanToPrint';
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
            Official Compliance & Disclaimers
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight pt-2">
            Privacy Policy, Terms & Refund Terms
          </h1>
          <p className="text-xs text-slate-400">
            Effective Date: March 2026 • Governing Law: Republic of India
          </p>
        </div>

        {/* 1. Privacy Policy */}
        <section className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <h2 className="text-lg font-bold text-white tracking-tight">1. Privacy Policy & Zero Data Retention</h2>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed space-y-3">
            <p>
              ScanToPrint (<strong className="text-white">scantoprint.in</strong>) treats customer privacy and confidential documents with extreme security:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>
                <strong className="text-slate-200">Zero Data Retention:</strong> All customer documents (PDFs, images, identity records) are stored temporarily solely for the purpose of transmitting them to the partner shop&apos;s physical printer spooler. Once the document is fed to the print queue, the cloud file is automatically wiped.
              </li>
              <li>
                <strong className="text-slate-200">No Content Inspection:</strong> We do not index, analyze, sell, or disclose the contents of any uploaded customer files.
              </li>
              <li>
                <strong className="text-slate-200">Payment Security:</strong> Customer UPI transactions are processed peer-to-peer directly between the customer and the shop owner&apos;s verified UPI handle. ScanToPrint does not hold, deduct, or escrow customer retail print funds.
              </li>
            </ul>
          </div>
        </section>

        {/* 2. Terms of Service */}
        <section className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-xl">📜</span>
            <h2 className="text-lg font-bold text-white tracking-tight">2. Terms of Service & Liability Disclaimer</h2>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed space-y-3">
            <p>
              By accessing our web portal or using the desktop print agent, both merchant operators and retail customers agree to the following terms:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>
                <strong className="text-slate-200">Technology Intermediary Only:</strong> ScanToPrint functions purely as an automated spooling SaaS platform connecting local printers to a cloud queue. We are not a publisher, printer, or physical counter operator.
              </li>
              <li>
                <strong className="text-slate-200">Illegal & Forged Documents:</strong> Users are strictly prohibited from uploading counterfeit currency, forged official stamps, prohibited literature, or infringing copyrighted materials. The sole legal liability for printed materials lies with the individual customer and the registered shop owner.
              </li>
              <li>
                <strong className="text-slate-200">Hardware Failures:</strong> ScanToPrint is not liable for shop-side printer paper jams, empty ink/toner cartridges, or local Windows power outages.
              </li>
            </ul>
          </div>
        </section>

        {/* 3. Refund & Cancellation */}
        <section className="bg-[#0b1021] border border-slate-800/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-xl">💳</span>
            <h2 className="text-lg font-bold text-white tracking-tight">3. Subscription & Refund Policy</h2>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed space-y-3">
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>
                <strong className="text-slate-200">Free Trial:</strong> We offer a 7-day full access trial for print shops to test the hardware agent before paying any SaaS subscription fees.
              </li>
              <li>
                <strong className="text-slate-200">B2B SaaS Plans:</strong> Standard and Premium subscription fees (monthly or yearly) are non-refundable once activated, as server spooling resources and agent keys are provisioned immediately.
              </li>
              <li>
                <strong className="text-slate-200">Retail Print Disputes:</strong> Any retail payment disputes regarding photocopy quality, paper thickness, or failed prints must be resolved directly with the on-premise shopkeeper.
              </li>
            </ul>
          </div>
        </section>

        <div className="text-center pt-6 border-t border-slate-800/80 text-xs text-slate-500">
          Have legal questions or compliance inquiries? Reach out to scantoprint.support.com.
        </div>
      </main>
    </div>
  );
}