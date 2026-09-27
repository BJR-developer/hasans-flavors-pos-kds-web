'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogIn, Shield, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';

export default function SignInPage() {
  const router = useRouter();
  const { signInWithPassword, isLoading, error } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'forgot_password'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

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
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4 bg-canvas">
      <div className="w-full max-w-md bg-white border border-line rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
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
          <h1 className="text-xl font-black text-ink tracking-tight">Hasan&apos;s Flavors</h1>
          <p className="text-xs text-muted">
            {mode === 'signin'
              ? 'Internal Operations Portal'
              : 'Password Recovery'}
          </p>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {(localError || error) && (
            <div className="p-3 rounded-lg bg-brand-soft border border-[#FFDAD6] text-xs text-brand font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          {mode === 'signin' ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Username or Email</label>
                <input
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-canvas text-ink focus:bg-white focus:outline-none focus:border-ink"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-ink">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setLocalError(null);
                    }}
                    className="text-xs font-semibold text-[#FC8019] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-line bg-canvas text-ink focus:bg-white focus:outline-none focus:border-ink"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-ink hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{submitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
              </button>
            </>
          ) : (
            <>
              <div className="p-4 rounded-lg bg-canvas border border-line text-xs text-ink space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span>Forgot your password?</span>
                </div>
                <p className="text-muted leading-relaxed">
                  Ask the restaurant owner to reset it. The owner can set a new password for any staff
                  account from <span className="font-semibold text-ink">Settings → Staff</span>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setLocalError(null);
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-muted hover:text-ink flex items-center justify-center gap-1.5 transition-colors"
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
