'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogIn, Shield, Store, BarChart3 } from 'lucide-react';
import { useAuthStore, UserRole } from '@/lib/auth';

export default function SignInPage() {
  const router = useRouter();
  const { signInWithPassword, quickSwitchRole, isLoading, error } = useAuthStore();

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

  const handleQuickRole = async (role: UserRole) => {
    await quickSwitchRole(role);
    if (role === 'owner') {
      router.push('/analytics');
    } else {
      router.push('/pos');
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4 bg-[#FAFAFA]">
      <div className="w-full max-w-md bg-white border border-[#E5E5E5] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Brand Header with Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto relative w-16 h-16 rounded-xl overflow-hidden bg-[#FFF2F0] border border-[#FFDAD6] flex items-center justify-center shadow-2xs">
            <Image
              src="/logo.png"
              alt="Hasan's Flavors Logo"
              fill
              sizes="64px"
              priority
              className="object-cover"
            />
          </div>
          <h1 className="text-xl font-black text-[#1F1F1F] tracking-tight">Hasan&apos;s Flavors</h1>
          <p className="text-xs text-[#737373]">
            Internal Operations Portal • Supabase Cloud Database Connected
          </p>
        </div>

        {/* 1-Tap Quick Access Buttons with Strict Role Guidance */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
            Instant Role Switching
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickRole('cashier')}
              className="p-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] hover:bg-white hover:border-[#BA1A20] transition-all text-left group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F1F1F] group-hover:text-[#BA1A20]">
                <Store className="w-4 h-4 text-[#BA1A20]" />
                <span>Cashier</span>
              </div>
              <p className="text-[10px] text-[#737373] mt-1 leading-tight">
                POS Register, Kitchen KDS, Stock &amp; Orders
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickRole('owner')}
              className="p-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] hover:bg-white hover:border-[#B45309] transition-all text-left group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F1F1F] group-hover:text-[#B45309]">
                <BarChart3 className="w-4 h-4 text-[#B45309]" />
                <span>Owner</span>
              </div>
              <p className="text-[10px] text-[#737373] mt-1 leading-tight">
                Executive Owner Dashboard &amp; Analytics Only
              </p>
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#E5E5E5]"></div>
          <span className="flex-shrink mx-3 text-[11px] font-semibold text-[#A3A3A3] uppercase">
            Or Sign In With Account
          </span>
          <div className="flex-grow border-t border-[#E5E5E5]"></div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {(localError || error) && (
            <div className="p-3 rounded-lg bg-[#FFF2F0] border border-[#FFDAD6] text-xs text-[#BA1A20] font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0" />
              <span>{localError || error}</span>
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

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1F1F1F]">Password</label>
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
            className="w-full py-2.5 px-4 rounded-lg bg-[#1F1F1F] hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{submitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
          </button>
        </form>

        <div className="text-center text-[10px] text-[#A3A3A3] leading-normal pt-2 border-t border-[#F5F5F5]">
          Connected to Supabase Project: <code className="font-mono text-[#525252]">wplbfxyudyndgzkucbia</code>
        </div>
      </div>
    </div>
  );
}
