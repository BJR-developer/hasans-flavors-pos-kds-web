'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Banknote, X, AlertCircle, ArrowRight } from 'lucide-react';
import { useStartShift } from '@/hooks/useShiftData';
import { useAuthStore } from '@/lib/auth';

interface StartShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStarted?: () => void;
  cashierName?: string;
  cashierId?: string;
}

export function StartShiftModal({
  isOpen,
  onClose,
  onStarted,
  cashierName: initialCashierName,
  cashierId: initialCashierId,
}: StartShiftModalProps) {
  const { user } = useAuthStore();
  const startShiftMutation = useStartShift();

  const [openingCash, setOpeningCash] = useState<string>('1000');
  const [cashierName, setCashierName] = useState<string>(
    initialCashierName || user?.name || 'Person - 1'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const floatVal = parseFloat(openingCash);
    if (isNaN(floatVal) || floatVal < 0) {
      setErrorMsg('Please enter a valid starting cash float (₱0 or more).');
      return;
    }

    try {
      await startShiftMutation.mutateAsync({
        cashierId: initialCashierId || user?.id,
        cashierName: cashierName.trim() || initialCashierName || user?.name || 'Cashier',
        openingCash: floatVal,
      });

      if (onStarted) onStarted();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to start shift. Please try again.');
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
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Open Cashier Shift
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Record starting float and clock in register session
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Cashier Name / Identifier */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800">
                Cashier on Duty
              </label>
              <input
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                placeholder="e.g. Person - 1 / Alice"
                required
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900 font-medium"
              />
              <span className="text-[10px] text-neutral-400">
                Orders during this shift will be tagged with this staff name.
              </span>
            </div>

            {/* Starting Cash Float */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800">
                Opening Cash Drawer Float (₱)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-bold">
                  ₱
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full pl-8 pr-3.5 py-2.5 text-sm font-bold rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
                />
              </div>
              <span className="text-[10px] text-neutral-400">
                Count the physical cash in the drawer before taking the first order.
              </span>
            </div>

            {/* Quick Float Shortcuts */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-semibold text-neutral-500">Quick:</span>
              {[500, 1000, 2000, 3000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setOpeningCash(amt.toString())}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors"
                >
                  ₱{amt.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={startShiftMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <span>{startShiftMutation.isPending ? 'Opening Shift...' : 'Start Shift'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
