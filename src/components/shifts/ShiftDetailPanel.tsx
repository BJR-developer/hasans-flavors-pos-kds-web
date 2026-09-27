'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle2, Flag, Pencil, LogOut, AlertTriangle } from 'lucide-react';
import { Order, Shift } from '@/types';
import { useAuthStore } from '@/lib/auth';
import { useReviewShift, useUpdateShiftOpeningCash } from '@/hooks/useShiftData';
import { CollectedPayment, paymentsForShift, shiftMoney, formatPeso, METHOD_LABELS, MoneyMethod } from '@/lib/money';
import { Badge, Button } from '@/components/ui';
import { ShiftHandoverModal } from './ShiftHandoverModal';

export function shiftReviewBadge(shift: Shift) {
  if (shift.status === 'open') return <Badge tone="green">● Open</Badge>;
  if (shift.reviewStatus === 'approved') return <Badge tone="green">Approved</Badge>;
  if (shift.reviewStatus === 'flagged') return <Badge tone="red">Flagged</Badge>;
  return <Badge tone="amber">Needs review</Badge>;
}

export function VarianceText({ value }: { value?: number }) {
  if (value === undefined) return <span className="text-muted">—</span>;
  if (Math.abs(value) < 0.01) return <span className="font-bold text-emerald-700">₱0 exact</span>;
  return (
    <span className={`font-bold ${value < 0 ? 'text-rose-700' : 'text-blue-700'}`}>
      {value < 0 ? `−${formatPeso(Math.abs(value))} short` : `+${formatPeso(value)} over`}
    </span>
  );
}

export function ShiftDetailPanel({
  shift,
  payments,
  orders,
  onClose,
}: {
  shift: Shift;
  payments: CollectedPayment[];
  orders: Order[];
  onClose: () => void;
}) {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner';
  const reviewMutation = useReviewShift();
  const floatMutation = useUpdateShiftOpeningCash();

  const money = useMemo(() => shiftMoney(shift, payments), [shift, payments]);
  const shiftPayments = useMemo(
    () => paymentsForShift(shift, payments).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [shift, payments]
  );

  const [reviewNote, setReviewNote] = useState(shift.reviewNote || '');
  const [editingFloat, setEditingFloat] = useState(false);
  const [floatValue, setFloatValue] = useState(String(shift.openingCash));
  const [floatReason, setFloatReason] = useState('');
  const [closeOpen, setCloseOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'still open';

  const review = async (status: 'approved' | 'flagged') => {
    if (!user) return;
    setError(null);
    if (status === 'flagged' && !reviewNote.trim()) {
      setError('Add a note saying what is wrong before flagging.');
      return;
    }
    try {
      await reviewMutation.mutateAsync({ shiftId: shift.id, status, note: reviewNote, reviewerId: user.id });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save review.');
    }
  };

  const saveFloat = async () => {
    if (!user) return;
    const v = parseFloat(floatValue);
    if (isNaN(v) || v < 0 || !floatReason.trim()) {
      setError('Enter a valid amount and a reason for the correction.');
      return;
    }
    try {
      await floatMutation.mutateAsync({
        shiftId: shift.id,
        newOpeningCash: v,
        changedBy: user.name || user.email,
        reason: floatReason.trim(),
      });
      setEditingFloat(false);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not update float.');
    }
  };

  const methods: MoneyMethod[] = ['cash', 'gcash', 'card', 'inr_qr'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="fixed inset-0 bg-black/40" />
        <motion.aside
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="relative z-10 w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto"
        >
          <div className="sticky top-0 bg-white border-b border-line px-5 py-4 flex items-start justify-between z-10">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-ink">{shift.cashierName}</h3>
                {shiftReviewBadge(shift)}
              </div>
              <p className="text-sm text-muted">
                {fmt(shift.startTime)} → {fmt(shift.endTime)}
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-muted hover:bg-neutral-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-semibold">{error}</div>
            )}

            {/* Drawer reconciliation */}
            <div className="rounded-2xl border border-line overflow-hidden">
              <div className="px-4 py-2.5 bg-neutral-50 text-xs font-bold uppercase tracking-wide text-muted">Cash drawer</div>
              <div className="p-4 space-y-2 text-sm">
                <Line
                  label={
                    <span className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Starting float
                    </span>
                  }
                  value={formatPeso(money.openingCash)}
                  action={
                    isOwner && !editingFloat ? (
                      <button type="button" onClick={() => setEditingFloat(true)} className="text-xs font-semibold text-brand hover:underline flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> Correct
                      </button>
                    ) : null
                  }
                />
                {editingFloat && (
                  <div className="p-3 rounded-xl bg-neutral-50 border border-line space-y-2">
                    <input type="number" min="0" value={floatValue} onChange={(e) => setFloatValue(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-line text-sm font-bold" />
                    <input type="text" value={floatReason} onChange={(e) => setFloatReason(e.target.value)} placeholder="Reason for correction" className="w-full px-3 py-2 rounded-lg border border-line text-sm" />
                    <div className="flex gap-2">
                      <Button size="sm" variant="dark" onClick={saveFloat} disabled={floatMutation.isPending}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingFloat(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
                <Line label={`+ Cash collected (${money.summary.byMethod.cash.count})`} value={formatPeso(money.cashCollected)} />
                <div className="pt-2 border-t border-dashed border-line">
                  <Line label="= Expected in drawer" value={formatPeso(money.expectedCash)} strong />
                </div>
                <Line label="Counted by cashier" value={money.countedCash !== undefined ? formatPeso(money.countedCash) : '—'} />
                <Line label="Difference" value={<VarianceText value={money.variance} />} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {methods.map((m) => (
                <div key={m} className="px-3 py-2.5 rounded-xl bg-neutral-50 border border-line flex items-center justify-between">
                  <span className="text-sm text-muted">{METHOD_LABELS[m]}</span>
                  <span className="text-sm font-bold text-ink">{formatPeso(money.summary.byMethod[m].amount)}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted -mt-2">
              Total collected: <strong className="text-ink">{formatPeso(money.summary.collected)}</strong> from {money.summary.orderCount} orders
            </p>

            {shift.notes && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
                <span className="font-bold block mb-0.5">Cashier note</span>
                {shift.notes}
              </div>
            )}

            {(shift.initialFloatEdits || []).length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-ink mb-2">Float changes</h4>
                <div className="space-y-1.5">
                  {(shift.initialFloatEdits || []).map((e, i) => (
                    <div key={i} className="text-sm px-3 py-2 rounded-lg bg-neutral-50 border border-line flex justify-between gap-2">
                      <span>
                        {formatPeso(e.previousAmount)} → {formatPeso(e.newAmount)} <span className="text-muted">by {e.changedBy}</span>
                      </span>
                      <span className="text-muted italic truncate">{e.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold text-ink mb-2">Payments collected ({shiftPayments.length})</h4>
              {shiftPayments.length === 0 ? (
                <p className="text-sm text-muted">No payments in this shift.</p>
              ) : (
                <div className="rounded-xl border border-line divide-y divide-line">
                  {shiftPayments.map((p) => (
                    <div key={p.id} className="px-3 py-2 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-bold text-ink">{p.orderNumber}</span>{' '}
                        <span className="text-muted">
                          · {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {METHOD_LABELS[p.method]}
                        </span>
                      </div>
                      <span className="font-bold font-mono">{formatPeso(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Owner actions */}
            {isOwner && shift.status === 'open' && (
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 space-y-2">
                <p className="text-sm text-amber-900 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  This shift is still open. If the cashier forgot to close it, count the drawer and close it here.
                </p>
                <Button variant="dark" onClick={() => setCloseOpen(true)}>
                  <LogOut className="w-4 h-4" /> Close shift for {shift.cashierName}
                </Button>
              </div>
            )}

            {isOwner && shift.status === 'closed' && (
              <div className="p-4 rounded-2xl border border-line space-y-3">
                <h4 className="text-sm font-bold text-ink">Owner review</h4>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={2}
                  placeholder="Optional note (required when flagging)"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-line bg-neutral-50 focus:bg-white focus:outline-none focus:border-ink"
                />
                <div className="flex gap-2">
                  <Button variant="success" onClick={() => review('approved')} disabled={reviewMutation.isPending}>
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </Button>
                  <Button variant="danger" onClick={() => review('flagged')} disabled={reviewMutation.isPending}>
                    <Flag className="w-4 h-4" /> Flag problem
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.aside>
      </div>
      {closeOpen && (
        <ShiftHandoverModal isOpen={closeOpen} onClose={() => setCloseOpen(false)} shift={shift} orders={orders} onClosed={onClose} />
      )}
    </AnimatePresence>
  );
}

function Line({ label, value, strong, action }: { label: React.ReactNode; value: React.ReactNode; strong?: boolean; action?: React.ReactNode }) {
  return (
    <div className={`flex items-center justify-between gap-2 ${strong ? 'text-base font-black text-ink' : 'text-ink-soft'}`}>
      <span className="flex items-center gap-2">
        {label}
        {action}
      </span>
      <span className="font-mono font-bold">{value}</span>
    </div>
  );
}
