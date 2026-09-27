'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Banknote, Smartphone, AlertTriangle, PlayCircle, LogOut, Lock } from 'lucide-react';
import { Order } from '@/types';
import { useAuthStore } from '@/lib/auth';
import { useActiveShift, useShifts } from '@/hooks/useShiftData';
import { collectPayments, paymentsForShift, shiftMoney, formatPeso, METHOD_LABELS } from '@/lib/money';
import { PageShell, PageHeader, Card, CardTitle, StatTile, EmptyState, Button } from '@/components/ui';
import { StartShiftModal } from './StartShiftModal';
import { ShiftHandoverModal } from './ShiftHandoverModal';
import { shiftReviewBadge, VarianceText } from './ShiftDetailPanel';

export function MyShiftView({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: activeShift, isLoading } = useActiveShift(user?.id);
  const { data: shifts = [] } = useShifts();
  const [startOpen, setStartOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const allPayments = useMemo(() => collectPayments(orders), [orders]);
  const money = useMemo(() => (activeShift ? shiftMoney(activeShift, allPayments) : null), [activeShift, allPayments]);
  const shiftPayments = useMemo(
    () => (activeShift ? paymentsForShift(activeShift, allPayments).sort((a, b) => b.timestamp.localeCompare(a.timestamp)) : []),
    [activeShift, allPayments]
  );

  const unpaid = useMemo(() => {
    if (!activeShift || !user) return [];
    const start = new Date(activeShift.startTime).getTime();
    return orders.filter(
      (o) =>
        o.status !== 'draft' &&
        o.status !== 'cancelled' &&
        o.cashierId === user.id &&
        new Date(o.createdAt).getTime() >= start &&
        Number(o.total || 0) - Number(o.amountPaid || 0) > 0.5
    );
  }, [orders, activeShift, user]);

  const pastShifts = useMemo(
    () => shifts.filter((s) => s.cashierId === user?.id && s.status === 'closed').slice(0, 14),
    [shifts, user]
  );

  const fmt = (iso: string) => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <PageShell>
      <PageHeader
        title="My Shift"
        subtitle={user ? `Cash and sales you collected, ${user.name || user.email}` : undefined}
        onBack={() => router.back()}
        actions={
          activeShift ? (
            <Button variant="dark" onClick={() => setCloseOpen(true)}>
              <LogOut className="w-4 h-4" /> Close shift
            </Button>
          ) : (
            <Button variant="success" onClick={() => setStartOpen(true)}>
              <PlayCircle className="w-4 h-4" /> Start shift
            </Button>
          )
        }
      />

      {isLoading ? null : !activeShift || !money ? (
        <Card>
          <EmptyState title="You have no open shift" hint="Press Start shift and count your starting float before taking orders." icon={Wallet} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile
              tone="dark"
              label="Should be in drawer"
              value={formatPeso(money.expectedCash)}
              hint={
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Float {formatPeso(money.openingCash)} + cash {formatPeso(money.cashCollected)}
                </span>
              }
              icon={Wallet}
            />
            <StatTile label="Cash collected" value={formatPeso(money.cashCollected)} hint={`${money.summary.byMethod.cash.count} payments`} icon={Banknote} />
            <StatTile label="Digital collected" value={formatPeso(money.digitalCollected)} hint="GCash, card, QR" icon={Smartphone} />
            <StatTile
              tone={unpaid.length > 0 ? 'amber' : 'default'}
              label="My unpaid orders"
              value={unpaid.length}
              hint={formatPeso(unpaid.reduce((s, o) => s + Number(o.total || 0) - Number(o.amountPaid || 0), 0))}
              icon={AlertTriangle}
            />
          </div>

          <p className="text-sm text-muted -mt-3">Shift started {fmt(activeShift.startTime)}</p>

          <Card padded={false}>
            <div className="p-5 pb-0">
              <CardTitle title={`Payments I collected (${shiftPayments.length})`} hint="Only money you took during this shift." />
            </div>
            {shiftPayments.length === 0 ? (
              <EmptyState title="No payments yet this shift" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-muted border-y border-line bg-neutral-50">
                    <th className="px-5 py-3">Order</th>
                    <th className="px-3 py-3">Time</th>
                    <th className="px-3 py-3">Method</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shiftPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-3 font-bold text-ink">
                        {p.orderNumber} <span className="font-normal text-muted">{p.customerName}</span>
                      </td>
                      <td className="px-3 py-3 text-ink-soft">{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-3 py-3 text-ink-soft">{METHOD_LABELS[p.method]}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold">{formatPeso(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      <Card padded={false}>
        <div className="p-5 pb-0">
          <CardTitle title="My past shifts" hint="What you counted, and the owner's review." />
        </div>
        {pastShifts.length === 0 ? (
          <EmptyState title="No closed shifts yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wide text-muted border-y border-line bg-neutral-50">
                <th className="px-5 py-3">Shift</th>
                <th className="px-3 py-3 text-right">Expected</th>
                <th className="px-3 py-3 text-right">Counted</th>
                <th className="px-3 py-3">Difference</th>
                <th className="px-5 py-3">Owner review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pastShifts.map((s) => {
                const m = shiftMoney(s, allPayments);
                return (
                  <tr key={s.id}>
                    <td className="px-5 py-3 text-ink-soft whitespace-nowrap">
                      {fmt(s.startTime)} – {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{formatPeso(m.expectedCash)}</td>
                    <td className="px-3 py-3 text-right font-mono">{m.countedCash !== undefined ? formatPeso(m.countedCash) : '—'}</td>
                    <td className="px-3 py-3 whitespace-nowrap"><VarianceText value={m.variance} /></td>
                    <td className="px-5 py-3">
                      {shiftReviewBadge(s)}
                      {s.reviewNote && <span className="block text-xs text-muted mt-1">{s.reviewNote}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <StartShiftModal isOpen={startOpen} onClose={() => setStartOpen(false)} />
      {activeShift && (
        <ShiftHandoverModal isOpen={closeOpen} onClose={() => setCloseOpen(false)} shift={activeShift} orders={orders} />
      )}
    </PageShell>
  );
}
