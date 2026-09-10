'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070b14]/80 border-b border-slate-800/80 px-6 sm:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-indigo-600/30">
            S
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            ScanToPrint<span className="text-indigo-400">.in</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
          <a href="#workflow" className="hover:text-white transition-colors">How It Works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          <a href="#faq" className="hover:text-white transition-colors">Help & Support</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-bold px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/25"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center space-y-6">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
          <span className="text-white block">
            Automated Document Printing
          </span>
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            via Dynamic QR Codes
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Empower photocopy and print shop owners with zero-touch order processing. Instant UPI payments, and local desktop print auto-sync on scantoprint.in.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-extrabold text-sm text-white shadow-xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-2"
          >
            <span>Automate Your Business</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <a
            href="#workflow"
            className="px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 font-bold text-sm text-slate-300 transition-all"
          >
            See Workflow ↓
          </a>
        </div>
      </section>

      {/* 1. End-to-End Workflow */}
      <section id="workflow" className="max-w-6xl mx-auto px-6 py-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">End-to-End Workflow</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            How customers seamlessly print documents without manual staff handling.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-[#0e1626]/80 border border-slate-800/90 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-950/70 border border-indigo-700/40 flex items-center justify-center text-lg">
              📱
            </div>
            <h3 className="text-sm font-bold text-white">QR Code Scan</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Customers scan the unique dynamic QR code placed outside or inside the registered photocopy shop.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e1626]/80 border border-slate-800/90 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-950/70 border border-indigo-700/40 flex items-center justify-center text-lg">
              ⚙️
            </div>
            <h3 className="text-sm font-bold text-white">Upload & Configure</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Opens shop web portal. User uploads PDF/Image, selects A4/color/copies options, and sees instant pricing.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e1626]/80 border border-slate-800/90 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-950/70 border border-indigo-700/40 flex items-center justify-center text-lg">
              💳
            </div>
            <h3 className="text-sm font-bold text-white">Instant UPI Payment</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Customer completes payment via UPI app. System instantly validates and queues the transaction.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e1626]/80 border border-slate-800/90 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-950/70 border border-indigo-700/40 flex items-center justify-center text-lg">
              🖨️
            </div>
            <h3 className="text-sm font-bold text-white">Auto-Trigger Print</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Local desktop agent pulls file from cloud storage and pushes it silently to the connected printer.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Smart Cloud Features & Automation */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Smart Cloud Features & Automation</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Built for super admins and individual shop management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0e1626]/80 border border-slate-800/90 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg">
              📊
            </div>
            <h3 className="text-sm font-bold text-white">Super Admin Dashboard</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track aggregated monthly recurring revenues, active vs inactive shops, and easily onboard new print shops.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e1626]/80 border border-slate-800/90 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg">
              🏪
            </div>
            <h3 className="text-sm font-bold text-white">Individual Shop Portals</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sub-admin view for store owners featuring live orders tables, lifetime revenue stats, ratings, and downloadable store QR codes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e1626]/80 border border-slate-800/90 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg">
              ⚡
            </div>
            <h3 className="text-sm font-bold text-white">Direct UPI Routing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every shop configures its own UPI ID so customer payments route safely and instantly to the respective business owner.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Customer Reviews & Testimonials */}
      <section id="testimonials" className="max-w-6xl mx-auto px-6 py-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Customer Reviews & Testimonials</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Dynamic feedback from print shop operators utilizing zero-touch printing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#0e1626]/60 border border-slate-800 space-y-4">
            <div className="text-amber-400 text-sm">★★★★★</div>
            <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
              &ldquo;ScanToPrint eliminated the chaos of handling pendrives and manual WhatsApp transfers at our counter. The desktop agent handles everything instantly.&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">
                R
              </div>
              <div>
                <p className="text-xs font-bold text-white">Rajesh Xerox Point</p>
                <p className="text-[10px] text-slate-500">Shop Owner, Delhi</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0e1626]/60 border border-slate-800 space-y-4">
            <div className="text-amber-400 text-sm">★★★★★</div>
            <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
              &ldquo;The dashboard gives us full oversight of orders and revenue streams. An incredible engineering solution for cyber cafes.&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div>
                <p className="text-xs font-bold text-white">Rohit Sharma</p>
                <p className="text-[10px] text-slate-500">Cyber Franchise Manager</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Help & Support / FAQ */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-16 space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Help & Support Details</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Frequently asked questions regarding setup and system requirements.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#0e1626]/70 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white">How does the Desktop Agent work?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Shopkeepers download and run the background agent on their store PC. It connects securely to cloud storage, checks for newly paid documents, and prints them automatically.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e1626]/70 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white">How do I access my Dashboard?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click the &apos;Login&apos; button in the top-right corner, enter your credentials, and you will be redirected instantly to your control panel.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        © 2026 ScanToPrint.in. All rights reserved. Automated Cloud Printing System.
      </footer>
    </div>
  );
}