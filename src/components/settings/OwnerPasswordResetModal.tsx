'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, X, AlertCircle, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useResetStaffPassword } from '@/hooks/useStaffData';

interface OwnerPasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserEmail: string;
  targetUserName?: string;
  onSuccess?: () => void;
}

export function OwnerPasswordResetModal({
  isOpen,
  onClose,
  targetUserEmail,
  targetUserName,
  onSuccess,
}: OwnerPasswordResetModalProps) {
  const resetPasswordMutation = useResetStaffPassword();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      const res = await resetPasswordMutation.mutateAsync({
        usernameOrEmail: targetUserEmail,
        newPassword,
      });

      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1300);
      } else {
        setErrorMsg(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error updating password.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Direct Password Reset
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Immediate reset without email verification
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-neutral-900">
                Password Reset Successfully
              </h4>
              <p className="text-xs text-neutral-500">
                New password is now active for {targetUserEmail}. No email verification link required.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Target Account Info */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-0.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Target Account
                </span>
                <span className="text-xs font-bold text-neutral-900">
                  {targetUserName ? `${targetUserName} (${targetUserEmail})` : targetUserEmail}
                </span>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
                    required
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
                />
              </div>

              {/* Notice */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-800">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  This immediately overwrites the password in Supabase. The staff member can sign in right away with this new password.
                </span>
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {resetPasswordMutation.isPending ? 'Updating...' : 'Set Password Immediately'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
