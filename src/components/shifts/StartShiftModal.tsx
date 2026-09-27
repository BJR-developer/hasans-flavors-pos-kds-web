'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import { useStartShift } from '@/hooks/useShiftData';
import { useAuthStore } from '@/lib/auth';

interface StartShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStarted?: () => void;
}

export function StartShiftModal({ isOpen, onClose, onStarted }: StartShiftModalProps) {
  const { user } = useAuthStore();
  const startShiftMutation = useStartShift();

  const [openingCash, setOpeningCash] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const floatVal = parseFloat(openingCash);
    if (openingCash.trim() === '' || isNaN(floatVal) || floatVal < 0) {
      setErrorMsg('Count the cash in the drawer and enter the amount (₱0 or more).');
      return;
    }
    try {
      await startShiftMutation.mutateAsync({
        cashierId: user.id,
        cashierName: user.name || user.email,
        openingCash: floatVal,
      });
      onStarted?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setErrorMsg(
        msg.includes('shifts_one_open_per_cashier')
          ? 'You already have an open shift. Close it before starting a new one.'
          : msg || 'Failed to start shift. Please try again.'
      );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">Start my shift</h3>
                <p className="text-xs text-neutral-500">Signed in as {user.name || user.email}</p>
              </div>
            </div>
            <button onClick={onClose} type="button" className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-900">Starting cash in drawer (float)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">₱</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  inputMode="decimal"
                  autoFocus
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full pl-8 pr-3.5 py-3 text-lg font-black rounded-xl border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex gap-2">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Count carefully. The float is locked once the shift starts. Only the owner can correct it.</span>
            </div>

            <button
              type="submit"
              disabled={startShiftMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50"
            >
              {startShiftMutation.isPending ? 'Starting…' : 'Start shift'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
