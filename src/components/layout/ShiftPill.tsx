'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, X, Lock, PlayCircle, LogOut, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { useActiveShift } from '@/hooks/useShiftData';
import { useOrders } from '@/hooks/useRestaurantData';
import { useNow } from '@/hooks/useNow';
import { collectPayments, shiftMoney, formatPeso, METHOD_LABELS, MoneyMethod } from '@/lib/money';
import { StartShiftModal } from '@/components/shifts/StartShiftModal';
import { ShiftHandoverModal } from '@/components/shifts/ShiftHandoverModal';

const STALE_SHIFT_HOURS = 12;

export function ShiftPill() {
  const { user } = useAuthStore();
  const { data: activeShift, isLoading } = useActiveShift(user?.id);
  const { data: orders = [] } = useOrders();
  const now = useNow();

  const [panelOpen, setPanelOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const money = useMemo(
    () => (activeShift ? shiftMoney(activeShift, collectPayments(orders)) : null),
    [activeShift, orders]
  );

  const unpaidMine = useMemo(() => {
    if (!activeShift || !user) return { count: 0, amount: 0 };
    const start = new Date(activeShift.startTime).getTime();
    const list = orders.filter(
      (o) =>
        o.status !== 'draft' &&
        o.status !== 'cancelled' &&
        o.cashierId === user.id &&
        new Date(o.createdAt).getTime() >= start &&
        Number(o.total || 0) - Number(o.amountPaid || 0) > 0.5
    );
    return {
      count: list.length,
      amount: list.reduce((s, o) => s + Number(o.total || 0) - Number(o.amountPaid || 0), 0),
    };
  }, [orders, activeShift, user]);

  if (!user || user.role !== 'cashier' || isLoading) return null;

  if (!activeShift) {
    return (
      <>
        <button
          type="button"
          onClick={() => setStartOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shrink-0 shadow-xs"
        >
          <PlayCircle className="w-4 h-4" />
          Start Shift
        </button>
        <StartShiftModal isOpen={startOpen} onClose={() => setStartOpen(false)} />
      </>
    );
  }

  const hoursOpen = (now - new Date(activeShift.startTime).getTime()) / 3_600_000;
  const isStale = hoursOpen > STALE_SHIFT_HOURS;
  const startLabel = new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        title="My shift: drawer cash and close shift"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold shrink-0 transition-colors ${
          isStale
            ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
            : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isStale ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
        <span className="hidden lg:inline text-neutral-500 font-normal">
          {isStale ? `Shift open ${Math.floor(hoursOpen)}h` : `Shift since ${startLabel}`}
        </span>
        <Wallet className="w-4 h-4 text-neutral-400 lg:hidden" />
        <span className="font-bold">{formatPeso(money?.expectedCash || 0)}</span>
        <span className="hidden md:inline text-neutral-400 font-normal">in drawer</span>
      </button>

      <AnimatePresence>
        {panelOpen && money && (
          <div className="fixed inset-0 z-[100] flex items-start justify-end p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
              className="fixed inset-0 bg-black/40"
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="relative z-10 mt-12 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900">My shift</h3>
                  <p className="text-xs text-neutral-500">
                    Started {new Date(activeShift.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button type="button" onClick={() => setPanelOpen(false)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {isStale && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    This shift has been open for {Math.floor(hoursOpen)} hours. Close it and start a new one.
                  </div>
                )}

                <div className="rounded-xl bg-neutral-900 text-white p-4">
                  <span className="text-xs text-neutral-400 font-semibold">Should be in drawer now</span>
                  <p className="text-3xl font-black mt-0.5">{formatPeso(money.expectedCash)}</p>
                  <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Float {formatPeso(money.openingCash)} + cash {formatPeso(money.cashCollected)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-bold text-neutral-900">Collected this shift</span>
                    <span className="font-black">{formatPeso(money.summary.collected)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['cash', 'gcash', 'card', 'inr_qr'] as MoneyMethod[]).map((m) => (
                      <div key={m} className="px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                        <span className="text-xs text-neutral-500">{METHOD_LABELS[m]}</span>
                        <span className="text-sm font-bold text-neutral-900">{formatPeso(money.summary.byMethod[m].amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {unpaidMine.count > 0 && (
                  <div className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-amber-50 text-amber-900">
                    <span>{unpaidMine.count} of my orders unpaid</span>
                    <span className="font-bold">{formatPeso(unpaidMine.amount)}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href="/shifts"
                    onClick={() => setPanelOpen(false)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    Details <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setPanelOpen(false);
                      setCloseOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-sm font-bold"
                  >
                    <LogOut className="w-4 h-4" />
                    Close shift
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ShiftHandoverModal isOpen={closeOpen} onClose={() => setCloseOpen(false)} shift={activeShift} orders={orders} />
    </>
  );
}
