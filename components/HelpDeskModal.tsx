'use client';

import React, { useState } from 'react';

interface FaqItem {
  id: string;
  category: 'Spooler & Printing' | 'Account & Login' | 'Payments & Plans' | 'Agent & Commission';
  question: string;
  answer: string[];
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'printer-not-connecting',
    category: 'Spooler & Printing',
    question: 'Desktop Spooler or Printer is not connecting?',
    answer: [
      '1. Ensure your physical printer is powered ON and connected via USB or local Wi-Fi.',
      '2. Launch ScanToPrint Desktop Spooler (.exe) on your PC by right-clicking and selecting "Run as Administrator".',
      '3. Verify that your Store Slug and Desktop API Key are correctly entered, then click "Connect".',
      '4. If the status remains offline, restart the spooler app and ensure Windows Firewall is not blocking outgoing traffic.'
    ]
  },
  {
    id: 'print-not-coming',
    category: 'Spooler & Printing',
    question: 'Customer paid successfully but document is not printing?',
    answer: [
      '1. Check your live dashboard to confirm if the printer shows an "Online" status (green dot indicator).',
      '2. Verify hardware essentials: ensure paper tray is stocked and ink/toner levels are sufficient.',
      '3. Open Windows "Printers & Scanners" and ensure your counter printer is set as the Default Printer.',
      '4. Open the Windows Print Queue to ensure no pending or stuck jobs are paused.'
    ]
  },
  {
    id: 'login-password-issue',
    category: 'Account & Login',
    question: 'Unable to login or forgot your store password?',
    answer: [
      '1. On the login page, enter your registered 10-digit mobile number or store email address accurately.',
      '2. If you do not remember your password, click the "Forgot Password?" link.',
      '3. Enter your email to receive a secure 6-digit numeric OTP instantly, then set your new password.'
    ]
  },
  {
    id: 'plan-renewal-utr',
    category: 'Payments & Plans',
    question: 'Plan renewal or quota top-up UTR is pending approval?',
    answer: [
      '1. After completing UPI payment, submit the exact 12-digit UTR / Transaction Reference number from GPay or PhonePe.',
      '2. Admin verifies bank transaction statements within 15 to 30 minutes during business hours.',
      '3. Upon approval, your account instantly receives +28 days validity extension or additional page quotas.'
    ]
  },
  {
    id: 'agent-commission-payout',
    category: 'Agent & Commission',
    question: 'How do referral commissions and UPI payouts work?',
    answer: [
      '1. When a new print shop registers using your promo code, commission is credited to your wallet balance.',
      '2. In the Partner Portal, enter your withdrawal amount (minimum ₹100) and click "Submit Request".',
      '3. Admin settles funds directly to your saved UPI ID with reference UTR number updated in history.'
    ]
  }
];

export default function HelpDeskModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FaqItem | null>(null);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = FAQ_DATA.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetSelection = () => {
    setSelectedFaq(null);
    setFeedback(null);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          resetSelection();
        }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-2xl shadow-indigo-600/50 transition-all hover:scale-105 cursor-pointer border border-indigo-400/30"
      >
        <span className="text-base">💬</span>
        <span>Need Help?</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1021] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header with Website Logo */}
            <div className="p-5 border-b border-slate-800 bg-[#070b18] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center p-1.5 shrink-0">
                  <img
                    src="/icon.svg"
                    alt="ScanToPrint Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">ScanToPrint Help Desk</h3>
                  <p className="text-[11px] text-slate-400">Instant answers to counter &amp; spooler issues</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {selectedFaq ? (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={resetSelection}
                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    ← Back to all questions
                  </button>

                  <div className="bg-[#070b18] border border-slate-800 rounded-2xl p-4 space-y-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      {selectedFaq.category}
                    </span>
                    <h4 className="font-bold text-white text-sm leading-snug">
                      {selectedFaq.question}
                    </h4>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
                    {selectedFaq.answer.map((step, idx) => (
                      <p key={idx}>{step}</p>
                    ))}
                  </div>

                  <div className="border-t border-slate-800 pt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Did this solve your problem?</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFeedback('yes')}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            feedback === 'yes'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          👍 Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedback('no')}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            feedback === 'no'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                              : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          👎 No
                        </button>
                      </div>
                    </div>

                    {feedback === 'yes' && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-medium text-center">
                        ✓ Glad we could help! Your counter is ready to print.
                      </div>
                    )}

                    {feedback === 'no' && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs space-y-2">
                        <p className="font-semibold text-amber-300">
                          Need further assistance?
                        </p>
                        <p className="text-slate-300 leading-relaxed">
                          Please email your issue or printer error screenshot directly to our technical team:
                        </p>
                        <div className="pt-1">
                          <a
                            href="mailto:scantoprint.support@gmail.com?subject=Merchant Support Assistance"
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-[11px] transition-all"
                          >
                            ✉️ Email: scantoprint.support@gmail.com
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Search issues (printer, login, payment)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#070b18] border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />

                  <div className="space-y-2">
                    {filteredFaqs.map((faq) => (
                      <button
                        key={faq.id}
                        type="button"
                        onClick={() => setSelectedFaq(faq)}
                        className="w-full text-left p-3.5 bg-[#070b18] hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 rounded-xl transition-all flex items-center justify-between gap-3 group cursor-pointer"
                      >
                        <div>
                          <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">
                            {faq.category}
                          </span>
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                            {faq.question}
                          </span>
                        </div>
                        <span className="text-slate-500 group-hover:text-indigo-400 text-sm transition-colors">
                          ➔
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-center">
                    <p className="text-[11px] text-slate-400">
                      Need custom assistance? Write to{' '}
                      <a
                        href="mailto:scantoprint.support@gmail.com"
                        className="text-indigo-400 hover:underline font-mono"
                      >
                        scantoprint.support@gmail.com
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}