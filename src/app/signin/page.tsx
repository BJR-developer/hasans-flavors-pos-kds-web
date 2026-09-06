'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogIn, Shield, KeyRound, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuthStore, UserRole } from '@/lib/auth';

export default function SignInPage() {
  const router = useRouter();
  const { signInWithPassword, sendPasswordResetEmail, isLoading, error } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'forgot_password'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    if (mode === 'forgot_password') {
      if (!email.trim()) {
        setLocalError('Please enter your email address to receive password reset instructions.');
        return;
      }
      setSubmitting(true);
      const res = await sendPasswordResetEmail(email);
      setSubmitting(false);
      if (res.success) {
        setSuccessMsg(res.message || 'Password reset email sent. Please check your inbox.');
      } else {
        setLocalError(res.error || 'Failed to send password reset email.');
      }
      return;
    }

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    const res = await signInWithPassword(email, password);
    setSubmitting(false);

    if (res.success) {
      // Role redirection: Owner -> /analytics; Cashier -> /pos
      if (res.role === 'owner') {
        router.push('/analytics');
      } else {
        router.push('/pos');
      }
    } else {
      setLocalError(res.error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4 bg-[#FAFAFA]">
      <div className="w-full max-w-md bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Brand Header with Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto relative w-24 h-16 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Hasan's Flavors Logo"
              fill
              sizes="96px"
              priority
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-black text-[#1F1F1F] tracking-tight">Hasan&apos;s Flavors</h1>
          <p className="text-xs text-[#737373]">
            {mode === 'signin'
              ? 'Internal Operations Portal'
              : 'Password Recovery'}
          </p>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {(localError || error) && (
            <div className="p-3 rounded-lg bg-[#FFF2F0] border border-[#FFDAD6] text-xs text-[#BA1A20] font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1F1F1F]">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cashier@hasan.com or owner@hasan.com"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
            />
          </div>

          {mode === 'signin' ? (
            <>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1F1F1F]">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setLocalError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] font-semibold text-[#FC8019] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1F1F1F] hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{submitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#FC8019] hover:bg-[#E57212] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{submitting ? 'Sending Recovery Email...' : 'Send Password Reset Email'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setLocalError(null);
                  setSuccessMsg(null);
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-[#737373] hover:text-[#1F1F1F] flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
