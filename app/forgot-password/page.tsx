'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    document.title = 'Forgot Password • ScanToPrint';
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setMsg({ type: 'success', text: 'OTP sent successfully! Please check your inbox or spam folder.' });
      setStep('otp');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Passwords do not match!' });
      return;
    }

    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setMsg({ type: 'success', text: 'Password reset successful! Redirecting to login...' });
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Invalid or expired OTP.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0e1626]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reset Password</h1>
          <p className="text-xs text-slate-400 mt-1">
            {step === 'email'
              ? 'Enter your registered merchant email address to get an OTP.'
              : `Enter the 6-digit OTP sent to ${email}`}
          </p>
        </div>

        {msg && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium border ${
              msg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {msg.text}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Registered Email
              </label>
              <input
                required
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#070b14]/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25 cursor-pointer disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Sending OTP...' : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                6-Digit OTP
              </label>
              <input
                required
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-[#070b14]/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#070b14]/80 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 select-none cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showConfirmPassword ? 'text' : 'password'}
                  minLength={6}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#070b14]/80 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 select-none cursor-pointer"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.trim().length !== 6 || !newPassword}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/25 cursor-pointer disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        <div className="flex items-center justify-between pt-2 text-xs">
          <Link href="/login" className="text-slate-400 hover:text-slate-200">
            ← Back to Login
          </Link>
          {step === 'otp' && (
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setOtp('');
                setMsg(null);
              }}
              className="text-indigo-400 hover:underline cursor-pointer"
            >
              Change Email
            </button>
          )}
        </div>
      </div>
    </main>
  );
}