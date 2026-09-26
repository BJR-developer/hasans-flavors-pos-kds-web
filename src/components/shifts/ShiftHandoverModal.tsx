'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Printer,
  X,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Percent,
  Receipt,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Shift, Order } from '@/types';
import { calculateShiftMetrics } from '@/lib/shiftApi';
import { useCloseShift } from '@/hooks/useShiftData';

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift;
  orders: Order[];
  onClosed?: () => void;
}

export function ShiftHandoverModal({
  isOpen,
  onClose,
  shift,
  orders,
  onClosed,
}: ShiftHandoverModalProps) {
  const closeShiftMutation = useCloseShift();

  // Calculate live numbers
  const metrics = useMemo(() => {
    return calculateShiftMetrics({
      startTime: shift.startTime,
      endTime: shift.endTime,
      cashierId: shift.cashierId,
      cashierName: shift.cashierName,
      openingCash: shift.openingCash,
      orders,
    });
  }, [shift, orders]);

  const [countedCash, setCountedCash] = useState<string>(
    metrics.expectedCash.toString()
  );
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const numCounted = parseFloat(countedCash) || 0;
  const cashDifference = Math.round((numCounted - metrics.expectedCash) * 100) / 100;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await closeShiftMutation.mutateAsync({
        shiftId: shift.id,
        closingCash: numCounted,
        expectedCash: metrics.expectedCash,
        cashDifference,
        totalOrders: metrics.totalOrders,
        totalItemsSold: metrics.totalItemsSold,
        grossSales: metrics.grossSales,
        cashSales: metrics.cashSales,
        cardSales: metrics.cardSales,
        onlineSales: metrics.onlineSales,
        totalDiscount: metrics.totalDiscount,
        notes: notes.trim() || undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        if (onClosed) onClosed();
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit shift handover.');
    }
  };

  const handlePrintZReport = () => {
    window.print();
  };

  // Format date and time
  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Shift Handover &amp; Calculations
                </h3>
                <p className="text-[11px] text-neutral-500">
                  {shift.cashierName} &bull; {formatDate(shift.startTime)} ({formatTime(shift.startTime)} &ndash; Now)
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

          {/* Success Banner */}
          {isSuccess ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-neutral-900">
                Shift Handover Submitted to Owner
              </h4>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Shift report and financial calculations have been saved to the database. Register session is now closed.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Shift Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Orders */}
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Orders
                  </span>
                  <span className="text-lg font-black text-neutral-900 font-mono">
                    {metrics.totalOrders}
                  </span>
                </div>

                {/* Gross Sales */}
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Gross Sales
                  </span>
                  <span className="text-lg font-black text-neutral-900 font-mono">
                    ₱{metrics.grossSales.toLocaleString()}
                  </span>
                </div>

                {/* Cash Sales */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Cash Sales
                  </span>
                  <span className="text-lg font-black text-emerald-900 font-mono">
                    ₱{metrics.cashSales.toLocaleString()}
                  </span>
                </div>

                {/* Card / Digital */}
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                    Card / Digital
                  </span>
                  <span className="text-lg font-black text-blue-900 font-mono">
                    ₱{(metrics.cardSales + metrics.onlineSales).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Drawer Cash Reconciliation */}
              <div className="p-4 rounded-2xl bg-neutral-50/90 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800">
                    Cash Drawer Calculation
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    Float: ₱{metrics.openingCash.toLocaleString()}
                  </span>
                </div>

                {/* Formula Breakdown */}
                <div className="space-y-1.5 text-xs text-neutral-600 border-t border-b border-neutral-200/60 py-2.5">
                  <div className="flex justify-between">
                    <span>Starting Cash Float:</span>
                    <span className="font-mono font-bold">₱{metrics.openingCash.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>+ Cash Collected from Orders:</span>
                    <span className="font-mono font-bold text-emerald-700">+₱{metrics.cashSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-dashed border-neutral-200 font-bold text-neutral-900">
                    <span>= Expected Cash in Drawer:</span>
                    <span className="font-mono text-sm font-black text-neutral-900">
                      ₱{metrics.expectedCash.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Input Actual Counted Cash */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-neutral-800 flex items-center justify-between">
                    <span>Physical Cash Counted (₱)</span>
                    <span className="text-[10px] font-normal text-neutral-500">
                      Enter bills + coins in drawer
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-bold">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={countedCash}
                      onChange={(e) => setCountedCash(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full pl-8 pr-3.5 py-2 text-sm font-black rounded-xl border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono"
                    />
                  </div>
                </div>

                {/* Cash Variance Indicator */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="font-semibold text-neutral-600">Drawer Difference:</span>
                  <span
                    className={`font-mono font-black px-2 py-0.5 rounded-full text-xs ${
                      cashDifference === 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : cashDifference > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {cashDifference === 0
                      ? 'Balanced (₱0.00)'
                      : cashDifference > 0
                      ? `Over (+₱${cashDifference.toLocaleString()})`
                      : `Short (-₱${Math.abs(cashDifference).toLocaleString()})`}
                  </span>
                </div>
              </div>

              {/* Handover Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">
                  Handover Notes for Owner / Incoming Cashier
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 9 to 5 shift completed by Person-1. Drawer balanced, 15 tables served, keys given to next shift."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handlePrintZReport}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Shift Report</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={closeShiftMutation.isPending}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <span>{closeShiftMutation.isPending ? 'Submitting...' : 'Submit Shift to Owner'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
