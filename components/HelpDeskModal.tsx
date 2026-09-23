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
    question: 'Desktop Spooler या Printer कनेक्ट नहीं हो रहा है?',
    answer: [
      '1. सुनिश्चित करें कि आपका प्रिंटर USB या Wi-Fi से ऑन और पीसी से कनेक्टेड है।',
      '2. ScanToPrint Desktop Spooler (.exe) ऐप को अपने कंप्यूटर पर "Run as Administrator" करें।',
      '3. Spooler में अपनी सही Shop Slug और Desktop API Key डालकर "Connect" दबाएँ।',
      '4. यदि स्टेटस "Connected" नहीं आ रहा है, तो Spooler को Restart करें और Windows Firewall चेक करें।'
    ]
  },
  {
    id: 'print-not-coming',
    category: 'Spooler & Printing',
    question: 'ग्राहक ने पेमेंट कर दी पर प्रिंट नहीं निकल रहा?',
    answer: [
      '1. अपने डैशबोर्ड में चेक करें कि क्या प्रिंटर का स्टेटस "Online" (हरा बिंदु) दिख रहा है।',
      '2. प्रिंटर में पेपर और स्याही (Ink) की मात्रा चेक करें।',
      '3. Windows के "Printers & Scanners" में जाकर डिफॉल्ट प्रिंटर चेक करें। Spooler हमेशा डिफ़ॉल्ट प्रिंटर पर जॉब भेजता है।',
      '4. अगर प्रिंटर "Paused" या "Offline" है, तो उसे रिस्टार्ट करें।'
    ]
  },
  {
    id: 'login-password-issue',
    category: 'Account & Login',
    question: 'लॉगिन नहीं हो रहा या पासवर्ड भूल गए हैं?',
    answer: [
      '1. लॉगिन पेज पर अपना 10-अंकों का रजिस्टर्ड मोबाइल नंबर या ईमेल आईडी सही दर्ज करें।',
      '2. यदि पासवर्ड याद नहीं है, तो लॉगिन बॉक्स में दिए गए "Forgot Password?" पर क्लिक करें।',
      '3. आपके ईमेल पर 6-डिजिट का सुरक्षित OTP आएगा, जिसे दर्ज करके आप नया पासवर्ड सेट कर सकते हैं।'
    ]
  },
  {
    id: 'plan-renewal-utr',
    category: 'Payments & Plans',
    question: 'प्लान रिन्यूअल या टॉप-अप का UTR अप्रूव नहीं हुआ?',
    answer: [
      '1. भुगतान करने के बाद अपने GPay/PhonePe से 12-अंकों का UTR/Ref नंबर ठीक से सबमिट करें।',
      '2. व्यवस्थापक (Admin) द्वारा बैंक स्टेटमेंट चेक करके इसे 15 से 30 मिनट में अप्रूव कर दिया जाता है।',
      '3. अप्रूव होते ही आपके डैशबोर्ड में तुरंत +28 दिन या पेज कोटा अपडेट हो जाएगा।'
    ]
  },
  {
    id: 'agent-commission-payout',
    category: 'Agent & Commission',
    question: 'एजेंट कमीशन या UPI Payout कैसे मिलेगा?',
    answer: [
      '1. जब भी कोई दुकानदार आपके प्रोमो कोड से जुड़ेगा, आपके वॉलेट में कमीशन तुरंत क्रेडिट हो जाएगा।',
      '2. एजेंट डैशबोर्ड में "Request Payout" पर क्लिक करें।',
      '3. एडमिन द्वारा आपके दिए गए UPI ID पर भुगतान भेजकर 12-डिजिट का UTR नंबर सिस्टम में अपडेट कर दिया जाता है।'
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
      {/* Floating Help Desk Button */}
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

      {/* Help Modal Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1021] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-[#070b18] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/30">
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">ScanToPrint Help Desk</h3>
                  <p className="text-[11px] text-slate-400">Instant answers to common store issues</p>
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

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4">
              {selectedFaq ? (
                /* FAQ Detail View */
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

                  {/* Feedback: Is this helpful? */}
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

                    {/* Thank You Note */}
                    {feedback === 'yes' && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-medium text-center">
                        ✓ Glad we could help! Your counter is ready to print.
                      </div>
                    )}

                    {/* Fallback to Support Email if Not Helpful */}
                    {feedback === 'no' && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs space-y-2">
                        <p className="font-semibold text-amber-300">
                          We&apos;re sorry this didn&apos;t resolve your issue!
                        </p>
                        <p className="text-slate-300 leading-relaxed">
                          Please email your issue or printer error screenshot directly to our technical desk:
                        </p>
                        <div className="pt-1">
                          <a
                            href="mailto:scantoprint.support@gmail.com?subject=Need Help with ScanToPrint"
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-[11px] transition-all"
                          >
                            ✉️ Email Us: scantoprint.support@gmail.com
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Question List View */
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

                  {/* Direct Contact Footer */}
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