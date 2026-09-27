'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Printer, ArrowRight, Receipt, AlertTriangle } from 'lucide-react';
import { Shift, Order } from '@/types';
import { useCloseShift } from '@/hooks/useShiftData';
import { useAuthStore } from '@/lib/auth';
import {
  collectPayments,
  shiftMoney,
  paymentsForShift,
  itemsSold,
  formatPeso,
  METHOD_LABELS,
  MoneyMethod,
} from '@/lib/money';

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift;
  orders: Order[];
  onClosed?: () => void;
}

const DIGITAL_METHODS: MoneyMethod[] = ['gcash', 'card', 'inr_qr', 'other'];

export function ShiftHandoverModal({ isOpen, onClose, shift, orders, onClosed }: ShiftHandoverModalProps) {
  const { user } = useAuthStore();
  const closeShiftMutation = useCloseShift();

  const { money, shiftOrders, unpaidOrders } = useMemo(() => {
    const payments = collectPayments(orders);
    const mine = paymentsForShift(shift, payments);
    const orderIds = new Set(mine.map((p) => p.orderId));
    const start = new Date(shift.startTime).getTime();
    const unpaid = orders.filter(
      (o) =>
        o.status !== 'draft' &&
        o.status !== 'cancelled' &&
        o.cashierId === shift.cashierId &&
        new Date(o.createdAt).getTime() >= start &&
        Number(o.total || 0) - Number(o.amountPaid || 0) > 0.5
    );
    return {
      money: shiftMoney(shift, payments),
      shiftOrders: orders.filter((o) => orderIds.has(o.id)),
      unpaidOrders: unpaid,
    };
  }, [shift, orders]);

  const [countedCash, setCountedCash] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const hasCount = countedCash.trim() !== '';
  const numCounted = parseFloat(countedCash) || 0;
  const difference = Math.round((numCounted - money.expectedCash) * 100) / 100;
  const closingForSomeoneElse = user?.id !== shift.cashierId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!hasCount) {
      setErrorMsg('Count the cash in the drawer and enter the total.');
      return;
    }
    if (difference !== 0 && !notes.trim()) {
      setErrorMsg('The drawer does not match. Add a note explaining the difference.');
      return;
    }

    try {
      await closeShiftMutation.mutateAsync({
        shiftId: shift.id,
        closingCash: numCounted,
        expectedCash: money.expectedCash,
        cashDifference: difference,
        totalOrders: money.summary.orderCount,
        totalItemsSold: itemsSold(shiftOrders),
        grossSales: money.summary.collected,
        cashSales: money.cashCollected,
        cardSales: money.summary.byMethod.card.amount,
        onlineSales: Math.round((money.digitalCollected - money.summary.byMethod.card.amount) * 100) / 100,
        totalDiscount: shiftOrders.reduce((s, o) => s + Number(o.discount || 0), 0),
        notes: notes.trim() || undefined,
        closedBy: user?.id,
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClosed?.();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to close the shift.');
    }
  };

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-6"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  {closingForSomeoneElse ? `Close shift for ${shift.cashierName}` : 'Close my shift'}
                </h3>
                <p className="text-xs text-neutral-500">
                  {fmtDate(shift.startTime)}, {fmtTime(shift.startTime)} – now
                </p>
              </div>
            </div>
            <button onClick={onClose} type="button" className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSuccess ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-neutral-900">Shift closed and sent to the owner</h4>
              <p className="text-sm text-neutral-500">The owner will review the cash count.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {unpaidOrders.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>{unpaidOrders.length} order{unpaidOrders.length > 1 ? 's' : ''} still unpaid</strong> (
                    {formatPeso(unpaidOrders.reduce((s, o) => s + Number(o.total || 0) - Number(o.amountPaid || 0), 0))}
                    ). Settle them first, or hand them over in the note.
                  </span>
                </div>
              )}

              {/* Step 1: what the system expects */}
              <div className="rounded-2xl border border-neutral-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-neutral-50 text-xs font-bold uppercase tracking-wide text-neutral-500">
                  Expected cash in drawer
                </div>
                <div className="p-4 space-y-2 text-sm">
                  <Row label="Starting float" value={formatPeso(money.openingCash)} />
                  <Row label={`+ Cash collected (${money.summary.byMethod.cash.count})`} value={formatPeso(money.cashCollected)} tone="green" />
                  <div className="pt-2 mt-1 border-t border-dashed border-neutral-200">
                    <Row label="= Should be in drawer" value={formatPeso(money.expectedCash)} strong />
                  </div>
                </div>
              </div>

              {/* Digital (not in drawer) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DIGITAL_METHODS.filter((m) => m !== 'other' || money.summary.byMethod.other.amount > 0).map((m) => (
                  <div key={m} className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                    <span className="text-xs font-semibold text-neutral-500 block">{METHOD_LABELS[m]}</span>
                    <span className="text-sm font-black text-neutral-900">{formatPeso(money.summary.byMethod[m].amount)}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-500 -mt-3">
                Digital payments go to the bank/e-wallet, not the drawer. Total collected this shift:{' '}
                <strong className="text-neutral-900">{formatPeso(money.summary.collected)}</strong>
              </p>

              {/* Step 2: count */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-neutral-900">Cash you counted in the drawer</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">₱</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    inputMode="decimal"
                    autoFocus
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    placeholder="Count bills and coins"
                    className="w-full pl-8 pr-3.5 py-3 text-lg font-black rounded-xl border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono"
                  />
                </div>
                {hasCount && (
                  <div
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold ${
                      difference === 0
                        ? 'bg-emerald-50 text-emerald-800'
                        : difference > 0
                        ? 'bg-blue-50 text-blue-800'
                        : 'bg-rose-50 text-rose-800'
                    }`}
                  >
                    <span>{difference === 0 ? 'Drawer matches' : difference > 0 ? 'Drawer is over' : 'Drawer is short'}</span>
                    <span className="font-mono">
                      {difference === 0 ? formatPeso(0) : `${difference > 0 ? '+' : '−'}${formatPeso(Math.abs(difference))}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-neutral-900">
                  Note for the owner {hasCount && difference !== 0 && <span className="text-rose-600">(required)</span>}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 9–5 shift done. ₱20 short, gave change twice by mistake."
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-semibold"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={closeShiftMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-sm font-bold disabled:opacity-50"
                  >
                    {closeShiftMutation.isPending ? 'Closing…' : 'Close shift'}
                    <ArrowRight className="w-4 h-4" />
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

function Row({ label, value, tone, strong }: { label: string; value: string; tone?: 'green'; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'text-base font-black text-neutral-900' : 'text-neutral-600'}`}>
      <span>{label}</span>
      <span className={`font-mono font-bold ${tone === 'green' ? 'text-emerald-700' : ''}`}>{value}</span>
    </div>
  );
}
