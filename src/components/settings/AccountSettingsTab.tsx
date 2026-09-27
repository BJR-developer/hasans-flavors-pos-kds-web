'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  ShieldCheck,
  Phone,
  LogOut,
  Calendar,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { OwnerPasswordResetModal } from './OwnerPasswordResetModal';

export function AccountSettingsTab() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [isResetOpen, setIsResetOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  if (!user) {
    return (
      <div className="p-8 text-center text-neutral-500 bg-white rounded-2xl border border-neutral-200">
        <p className="text-sm">No active user profile found. Please sign in.</p>
      </div>
    );
  }

  // Get user initials for avatar
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-neutral-100">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-xl font-black shadow-xs shrink-0">
            {initials}
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-extrabold text-neutral-900 tracking-tight">
                {user.name}
              </h2>
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  user.role === 'owner'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : user.role === 'cashier'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {user.role}
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Active Session
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Staff Member at Hasan&apos;s Flavors Restaurant &amp; Operations
            </p>
          </div>
        </div>

        {/* Detailed Profile Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
          {/* Full Name */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-semibold">
              <User className="w-3.5 h-3.5 text-neutral-600" />
              <span>Full Name</span>
            </div>
            <div className="text-sm font-bold text-neutral-900 font-sans">
              {user.name}
            </div>
          </div>

          {/* Email Address */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-semibold">
              <Mail className="w-3.5 h-3.5 text-neutral-600" />
              <span>Email Address</span>
            </div>
            <div className="text-sm font-bold text-neutral-900 font-mono">
              {user.email}
            </div>
          </div>

          {/* Role & Permissions */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-600" />
              <span>Portal Role</span>
            </div>
            <div className="text-sm font-bold text-neutral-900 capitalize">
              {user.role} Access
            </div>
          </div>

          {/* Contact Phone */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-semibold">
              <Phone className="w-3.5 h-3.5 text-neutral-600" />
              <span>Contact Number</span>
            </div>
            <div className="text-sm font-medium text-neutral-800 font-mono">
              {user.phone || 'Not configured'}
            </div>
          </div>
        </div>
      </div>

      {/* Security & Session Actions Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-neutral-900">
            Account Security &amp; Session
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage your credentials and active portal session
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={() => setIsResetOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Reset My Password (Instant)</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Account</span>
          </button>
        </div>
      </div>

      {user && (
        <OwnerPasswordResetModal
          isOpen={isResetOpen}
          onClose={() => setIsResetOpen(false)}
          targetUserEmail={user.email}
          targetUserName={user.name}
        />
      )}
    </motion.div>
  );
}
