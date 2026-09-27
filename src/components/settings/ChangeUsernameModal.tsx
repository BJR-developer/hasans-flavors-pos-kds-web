'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtSign, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useUpdateStaffUsername } from '@/hooks/useStaffData';
import { StaffUser } from '@/types';

interface ChangeUsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffUser;
  onSuccess?: () => void;
}

// This component is always mounted with a unique key per staff member (see parent),
// so state initializes fresh from props on each open.
export function ChangeUsernameModal({
  isOpen,
  onClose,
  staff,
  onSuccess,
}: ChangeUsernameModalProps) {
  const updateUsernameMutation = useUpdateStaffUsername();
  const [username, setUsername] = useState(staff.username || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const clean = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(clean)) {
      setError('Username must be 3–30 characters: lowercase letters, numbers, underscores only.');
      return;
    }

    const result = await updateUsernameMutation.mutateAsync({ userId: staff.id, username: clean });
    if (result.success) {
      setSuccess(`Username updated to @${result.username}`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } else {
      setError(result.message || 'Failed to update username');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 space-y-5"
          >
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                <AtSign className="w-5 h-5 text-neutral-700" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-neutral-900">Change Username</h2>
                <p className="text-xs text-neutral-500">{staff.fullName}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-800">New Username</label>
                <div className="relative">
                  <AtSign className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="e.g. john_cashier"
                    maxLength={30}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-neutral-300 rounded-xl bg-neutral-50 text-neutral-900 font-mono focus:outline-none focus:border-neutral-900 focus:bg-white"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-neutral-400">
                  3–30 characters, lowercase letters, numbers and underscores only
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-xs font-bold hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateUsernameMutation.isPending || !username.trim()}
                  className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updateUsernameMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  Save Username
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
