'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Banknote, Smartphone, AlertTriangle, ClipboardCheck, Globe, ChevronRight } from 'lucide-react';
import { Shift, Order } from '@/types';
import { useShifts } from '@/hooks/useShiftData';
import { useStaffUsers } from '@/hooks/useStaffData';
import { useNow } from '@/hooks/useNow';
import {
  collectPayments,
  filterPayments,
  summarizePayments,
  shiftMoney,
  formatPeso,
  openBalances,
} from '@/lib/money';
import {
  PageShell,
  PageHeader,
  Card,
  CardTitle,
  StatTile,
  EmptyState,
  DatePresetBar,
  DatePreset,
  presetRange,
  toDateInput,
} from '@/components/ui';
import { ShiftDetailPanel, shiftReviewBadge, VarianceText } from './ShiftDetailPanel';

export function OwnerCashAndShifts({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const now = useNow();
  const { data: shifts = [], isLoading } = useShifts();
  const { data: staff = [] } = useStaffUsers();

  const [preset, setPreset] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState(() => toDateInput(Date.now()));
  const [customTo, setCustomTo] = useState(() => toDateInput(Date.now()));
  const [cashierId, setCashierId] = useState('all');
  const [selected, setSelected] = useState<Shift | null>(null);

  const range = useMemo(() => presetRange(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const allPayments = useMemo(() => collectPayments(orders), [orders]);

  const cashiers = useMemo(() => staff.filter((s) => s.role === 'cashier'), [staff]);

  const rangePayments = useMemo(
    () => filterPayments(allPayments, { from: range.from, to: range.to, cashierId: cashierId === 'all' ? undefined : cashierId }),
    [allPayments, range, cashierId]
  );
  const summary = useMemo(() => summarizePayments(rangePayments), [rangePayments]);
  const online = useMemo(() => summarizePayments(rangePayments.filter((p) => !p.cashierId)), [rangePayments]);

  const open = useMemo(() => {
    const inRange = orders.filter((o) => {
      const ts = new Date(o.createdAt).getTime();
      if (ts < range.from || ts > range.to) return false;
      return cashierId === 'all' || o.cashierId === cashierId;
    });
    return openBalances(inRange);
  }, [orders, range, cashierId]);

  const rows = useMemo(() => {
    return shifts
      .filter((s) => {
        const start = new Date(s.startTime).getTime();
        const end = s.endTime ? new Date(s.endTime).getTime() : now;
        if (start > range.to || end < range.from) return false;
        return cashierId === 'all' || s.cashierId === cashierId;
      })
      .map((s) => ({ shift: s, money: shiftMoney(s, allPayments) }));
  }, [shifts, range, cashierId, allPayments, now]);

  const shortTotal = rows.reduce((sum, r) => sum + Math.min(0, r.money.variance ?? 0), 0);
  const needsReview = rows.filter((r) => r.shift.status === 'closed' && r.shift.reviewStatus !== 'approved').length;

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDay = (iso: string) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <PageShell>
      <PageHeader
        title="Cash & Shifts"
        subtitle="Money collected, each cashier's drawer, and shift handovers"
        onBack={() => router.back()}
      />

      <DatePresetBar
        preset={preset}
        onPreset={setPreset}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFrom={setCustomFrom}
        onCustomTo={setCustomTo}
      >
        <select
          value={cashierId}
          onChange={(e) => setCashierId(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-line bg-white font-semibold"
        >
          <option value="all">All cashiers</option>
          {cashiers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </select>
      </DatePresetBar>

      <p className="text-sm text-muted -mt-3">{range.label}</p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatTile tone="dark" label="Collected" value={formatPeso(summary.collected)} hint={`${summary.orderCount} orders paid`} icon={Wallet} />
        <StatTile label="Cash" value={formatPeso(summary.byMethod.cash.amount)} hint="Should be in drawers" icon={Banknote} />
        <StatTile
          label="Digital"
          value={formatPeso(summary.collected - summary.byMethod.cash.amount)}
          hint={`GCash ${formatPeso(summary.byMethod.gcash.amount)} · Card ${formatPeso(summary.byMethod.card.amount)}`}
          icon={Smartphone}
        />
        <StatTile
          tone={open.count > 0 ? 'amber' : 'default'}
          label="Not paid yet"
          value={formatPeso(open.amount)}
          hint={`${open.count} open orders`}
          icon={AlertTriangle}
        />
        <StatTile
          tone={shortTotal < 0 ? 'red' : 'green'}
          label="Drawer shortages"
          value={shortTotal < 0 ? `−${formatPeso(Math.abs(shortTotal))}` : formatPeso(0)}
          hint={`${needsReview} shift${needsReview === 1 ? '' : 's'} to review`}
          icon={ClipboardCheck}
        />
      </div>

      <Card padded={false}>
        <div className="p-5 pb-0">
          <CardTitle title="Shifts" hint="Click a shift to see every payment, the cash count, and approve or flag it." />
        </div>
        {isLoading ? (
          <EmptyState title="Loading shifts…" />
        ) : rows.length === 0 ? (
          <EmptyState title="No shifts in this period" hint="Shifts appear when cashiers press Start Shift." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-muted border-y border-line bg-neutral-50">
                  <th className="px-5 py-3">Cashier</th>
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3 text-right">Float</th>
                  <th className="px-3 py-3 text-right">Cash taken</th>
                  <th className="px-3 py-3 text-right">Expected</th>
                  <th className="px-3 py-3 text-right">Counted</th>
                  <th className="px-3 py-3">Difference</th>
                  <th className="px-3 py-3 text-right">All sales</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(({ shift, money }) => {
                  const hoursOpen = (now - new Date(shift.startTime).getTime()) / 3_600_000;
                  return (
                    <tr key={shift.id} onClick={() => setSelected(shift)} className="hover:bg-neutral-50 cursor-pointer">
                      <td className="px-5 py-3 font-bold text-ink whitespace-nowrap">{shift.cashierName}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-ink-soft">
                        {fmtDay(shift.startTime)} {fmtTime(shift.startTime)} – {shift.endTime ? fmtTime(shift.endTime) : 'now'}
                        {shift.status === 'open' && hoursOpen > 12 && (
                          <span className="block text-xs font-bold text-amber-700">Open {Math.floor(hoursOpen)}h — not closed</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-mono">{formatPeso(money.openingCash)}</td>
                      <td className="px-3 py-3 text-right font-mono">{formatPeso(money.cashCollected)}</td>
                      <td className="px-3 py-3 text-right font-mono font-bold">{formatPeso(money.expectedCash)}</td>
                      <td className="px-3 py-3 text-right font-mono">{money.countedCash !== undefined ? formatPeso(money.countedCash) : '—'}</td>
                      <td className="px-3 py-3 whitespace-nowrap"><VarianceText value={money.variance} /></td>
                      <td className="px-3 py-3 text-right font-mono">{formatPeso(money.summary.collected)}</td>
                      <td className="px-3 py-3">{shiftReviewBadge(shift)}</td>
                      <td className="px-3 py-3 text-muted"><ChevronRight className="w-4 h-4" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {online.collected > 0 && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Payments with no cashier</p>
                <p className="text-sm text-muted">Online app payments, or older records saved before cashier tracking. Not part of any drawer.</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-ink">{formatPeso(online.collected)}</p>
              <p className="text-xs text-muted">{online.orderCount} orders</p>
            </div>
          </div>
        </Card>
      )}

      {selected && (
        <ShiftDetailPanel
          shift={shifts.find((s) => s.id === selected.id) || selected}
          payments={allPayments}
          orders={orders}
          onClose={() => setSelected(null)}
        />
      )}
    </PageShell>
  );
}
