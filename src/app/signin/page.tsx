'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Utensils, ChefHat, BarChart3, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '@/lib/auth';
import { UserRole } from '@/types';

export default function SignInPage() {
  const router = useRouter();
  const { login, quickLogin } = useAuth();

  const [email, setEmail] = useState('staff@hasan.com');
  const [password, setPassword] = useState('••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('staff');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const res = login(email);
    if (res.role === 'owner') {
      router.push('/analytics');
    } else if (res.role === 'kds') {
      router.push('/kds');
    } else {
      router.push('/pos');
    }
  };

  const handleQuickRole = (role: UserRole) => {
    setSelectedRole(role);
    const acc = DEMO_ACCOUNTS[role];
    setEmail(acc.email);
    setPassword('spice1234');
    quickLogin(role);

    if (role === 'owner') {
      router.push('/analytics');
    } else if (role === 'kds') {
      router.push('/kds');
    } else {
      router.push('/pos');
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4 bg-[#FAF9F8]">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5E5E5] p-6 sm:p-8 shadow-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#BA1A20] text-white mx-auto flex items-center justify-center font-black text-lg tracking-wider shadow-xs">
            HF
          </div>
          <h1 className="text-xl font-black text-[#1F1F1F] tracking-tight">
            Hasan&apos;s Flavors Operations
          </h1>
          <p className="text-xs text-[#737373]">
            Select your staff role or sign in to access register, kitchen, and reports
          </p>
        </div>

        {/* 1-Click Fast Role Sign-In Chips */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-[#737373] uppercase tracking-wider text-center">
            Quick 1-Tap Access
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickRole('staff')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                selectedRole === 'staff'
                  ? 'border-[#BA1A20] bg-[#FFF2F0] text-[#BA1A20] shadow-xs'
                  : 'border-[#E5E5E5] bg-white text-[#525252] hover:bg-[#F5F5F5]'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span className="text-xs font-bold leading-tight">Cashier</span>
              <span className="text-[9px] opacity-75">POS</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickRole('kds')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                selectedRole === 'kds'
                  ? 'border-[#BA1A20] bg-[#FFF2F0] text-[#BA1A20] shadow-xs'
                  : 'border-[#E5E5E5] bg-white text-[#525252] hover:bg-[#F5F5F5]'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span className="text-xs font-bold leading-tight">Kitchen</span>
              <span className="text-[9px] opacity-75">KDS</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickRole('owner')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                selectedRole === 'owner'
                  ? 'border-[#BA1A20] bg-[#FFF2F0] text-[#BA1A20] shadow-xs'
                  : 'border-[#E5E5E5] bg-white text-[#525252] hover:bg-[#F5F5F5]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs font-bold leading-tight">Owner</span>
              <span className="text-[9px] opacity-75">Analytics</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E5E5E5]" />
          <span className="text-[10px] uppercase font-bold text-[#A3A3A3]">or sign in with email</span>
          <div className="flex-1 h-px bg-[#E5E5E5]" />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A3A3A3] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@hasan.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A3A3A3] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>Sign In to Terminal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-[10px] text-center text-[#A3A3A3]">
          Hasan&apos;s Flavors Zabihah Halal Cuisine • Internal Staff Portal
        </p>
      </div>
    </div>
  );
}
