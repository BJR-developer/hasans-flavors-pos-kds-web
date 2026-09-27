'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Wallet, Receipt, TrendingUp, AlertTriangle, ClipboardCheck, ArrowRight, Package, Clock, Utensils } from 'lucide-react';
import { useOrders, useDishes, useTableSessions } from '@/hooks/useRestaurantData';
import { useShifts } from '@/hooks/useShiftData';
import { useStaffUsers } from '@/hooks/useStaffData';
import { useNow } from '@/hooks/useNow';
import {
  collectPayments,
  filterPayments,
  summarizePayments,
  shiftMoney,
  openBalances,
  isCountableOrder,
  formatPeso,
  METHOD_LABELS,
  MoneyMethod,
} from '@/lib/money';
import {
  PageShell,
  PageHeader,
  Card,
  CardTitle,
  StatTile,
  Badge,
  EmptyState,
  DatePresetBar,
  DatePreset,
  presetRange,
  toDateInput,
} from '@/components/ui';

const LOW_STOCK = 5;
const STALE_SHIFT_HOURS = 12;

export function AnalyticsOverview() {
  const now = useNow();
  const { data: orders = [] } = useOrders();
  const { data: dishes = [] } = useDishes();
  const { data: tables = [] } = useTableSessions();
  const { data: shifts = [] } = useShifts();
  const { data: staff = [] } = useStaffUsers();

  const [preset, setPreset] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState(() => toDateInput(Date.now()));
  const [customTo, setCustomTo] = useState(() => toDateInput(Date.now()));
  const range = useMemo(() => presetRange(preset, customFrom, customTo), [preset, customFrom, customTo]);

  const allPayments = useMemo(() => collectPayments(orders), [orders]);
  const rangePayments = useMemo(() => filterPayments(allPayments, { from: range.from, to: range.to }), [allPayments, range]);
  const summary = useMemo(() => summarizePayments(rangePayments), [rangePayments]);

  const rangeOrders = useMemo(
    () =>
      orders.filter((o) => {
        const ts = new Date(o.createdAt).getTime();
        return isCountableOrder(o) && ts >= range.from && ts <= range.to;
      }),
    [orders, range]
  );
  const open = useMemo(() => openBalances(rangeOrders), [rangeOrders]);

  const rangeShifts = useMemo(
    () =>
      shifts
        .filter((s) => {
          const start = new Date(s.startTime).getTime();
          const end = s.endTime ? new Date(s.endTime).getTime() : now;
          return start <= range.to && end >= range.from;
        })
        .map((s) => ({ shift: s, money: shiftMoney(s, allPayments) })),
    [shifts, range, allPayments, now]
  );
  const shortTotal = rangeShifts.reduce((s, r) => s + Math.min(0, r.money.variance ?? 0), 0);

  // Alerts
  const alerts = useMemo(() => {
    const list: { tone: 'red' | 'amber'; text: string; href: string }[] = [];
    shifts
      .filter((s) => s.status === 'open' && (now - new Date(s.startTime).getTime()) / 3_600_000 > STALE_SHIFT_HOURS)
      .forEach((s) =>
        list.push({
          tone: 'amber',
          text: `${s.cashierName}'s shift has been open ${Math.floor((now - new Date(s.startTime).getTime()) / 3_600_000)}h and was never closed`,
          href: '/shifts',
        })
      );
    rangeShifts
      .filter((r) => (r.money.variance ?? 0) < -0.01 && r.shift.reviewStatus !== 'approved')
      .forEach((r) =>
        list.push({
          tone: 'red',
          text: `${r.shift.cashierName}'s drawer was ${formatPeso(Math.abs(r.money.variance || 0))} short`,
          href: '/shifts',
        })
      );
    const outOfStock = dishes.filter((d) => !d.inStock).length;
    const low = dishes.filter((d) => d.inStock && (d.stockQuantity ?? Infinity) <= LOW_STOCK);
    if (outOfStock > 0) list.push({ tone: 'red', text: `${outOfStock} dish${outOfStock > 1 ? 'es are' : ' is'} out of stock`, href: '/inventory' });
    if (low.length > 0)
      list.push({
        tone: 'amber',
        text: `Low stock: ${low.slice(0, 3).map((d) => `${d.name} (${d.stockQuantity})`).join(', ')}${low.length > 3 ? ` +${low.length - 3} more` : ''}`,
        href: '/inventory',
      });
    const liveTables = new Set(
      orders
        .filter((o) => isCountableOrder(o) && o.status !== 'completed' && o.type === 'dine_in' && o.tableNumber)
        .map((o) => o.tableNumber)
    );
    const stuck = tables.filter((t) => t.status !== 'available' && !liveTables.has(t.tableNumber));
    if (stuck.length > 0)
      list.push({
        tone: 'amber',
        text: `${stuck.map((t) => t.tableNumber).join(', ')} marked occupied with no open order`,
        href: '/tables',
      });
    return list;
  }, [shifts, rangeShifts, dishes, tables, orders, now]);

  // Per cashier
  const cashierRows = useMemo(() => {
    return staff
      .filter((s) => s.role === 'cashier')
      .map((c) => {
        const own = rangeShifts.filter((r) => r.shift.cashierId === c.id);
        const collected = summarizePayments(rangePayments.filter((p) => p.cashierId === c.id)).collected;
        const openShift = shifts.find((s) => s.cashierId === c.id && s.status === 'open');
        const variance = own.reduce((s, r) => s + (r.money.variance ?? 0), 0);
        const hasClosed = own.some((r) => r.money.variance !== undefined);
        return { cashier: c, shifts: own.length, collected, openShift, variance: hasClosed ? variance : undefined };
      });
  }, [staff, rangeShifts, rangePayments, shifts]);

  // Best sellers
  const bestSellers = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    rangeOrders.forEach((o) =>
      (o.items || []).forEach((it) => {
        const name = it.dish?.name || 'Item';
        const cur = map.get(name) || { name, qty: 0, revenue: 0 };
        cur.qty += Number(it.quantity || 1);
        cur.revenue += Number(it.totalPrice || 0);
        map.set(name, cur);
      })
    );
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [rangeOrders]);

  // Collected by hour (single day) or by day
  const isSingleDay = range.to - range.from <= 24 * 3_600_000;
  const buckets = useMemo(() => {
    const map = new Map<string, number>();
    rangePayments.forEach((p) => {
      const d = new Date(p.timestamp);
      const key = isSingleDay
        ? `${String(d.getHours()).padStart(2, '0')}:00`
        : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      map.set(key, (map.get(key) || 0) + p.amount);
    });
    const entries = Array.from(map.entries());
    if (isSingleDay) entries.sort((a, b) => a[0].localeCompare(b[0]));
    return entries;
  }, [rangePayments, isSingleDay]);
  const maxBucket = Math.max(1, ...buckets.map(([, v]) => v));

  const methods: MoneyMethod[] = ['cash', 'gcash', 'card', 'inr_qr'];

  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        subtitle={range.label}
        actions={
          <Link href="/shifts" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-ink text-white text-sm font-bold hover:bg-black">
            Cash & Shifts <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <DatePresetBar
        preset={preset}
        onPreset={setPreset}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFrom={setCustomFrom}
        onCustomTo={setCustomTo}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatTile tone="dark" label="Money collected" value={formatPeso(summary.collected)} hint={`Cash ${formatPeso(summary.byMethod.cash.amount)}`} icon={Wallet} />
        <StatTile label="Orders" value={rangeOrders.length} hint={`${summary.orderCount} paid`} icon={Receipt} />
        <StatTile
          label="Average paid order"
          value={formatPeso(summary.orderCount ? summary.collected / summary.orderCount : 0)}
          icon={TrendingUp}
        />
        <StatTile tone={open.count ? 'amber' : 'default'} label="Not paid yet" value={formatPeso(open.amount)} hint={`${open.count} open orders`} icon={AlertTriangle} />
        <StatTile
          tone={shortTotal < 0 ? 'red' : 'green'}
          label="Drawer shortages"
          value={shortTotal < 0 ? `−${formatPeso(Math.abs(shortTotal))}` : formatPeso(0)}
          hint={`${rangeShifts.length} shifts`}
          icon={ClipboardCheck}
        />
      </div>

      {alerts.length > 0 && (
        <Card>
          <CardTitle title="Needs your attention" />
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <Link
                key={i}
                href={a.href}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-semibold border ${
                  a.tone === 'red' ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                } hover:brightness-95`}
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {a.text}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card padded={false} className="xl:col-span-2">
          <div className="p-5 pb-0">
            <CardTitle
              title="Cashiers"
              hint="Money each cashier collected and how their drawer balanced"
              right={<Link href="/shifts" className="text-sm font-semibold text-brand hover:underline">All shifts</Link>}
            />
          </div>
          {cashierRows.length === 0 ? (
            <EmptyState title="No cashier accounts yet" hint="Create one in Staff." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-muted border-y border-line bg-neutral-50">
                  <th className="px-5 py-3">Cashier</th>
                  <th className="px-3 py-3">Now</th>
                  <th className="px-3 py-3 text-right">Shifts</th>
                  <th className="px-3 py-3 text-right">Collected</th>
                  <th className="px-5 py-3 text-right">Drawer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {cashierRows.map((r) => (
                  <tr key={r.cashier.id}>
                    <td className="px-5 py-3 font-bold text-ink">{r.cashier.fullName}</td>
                    <td className="px-3 py-3">
                      {r.openShift ? (
                        <Badge tone="green">
                          <Clock className="w-3 h-3" /> On shift since{' '}
                          {new Date(r.openShift.startTime).toLocaleString([], {
                            ...(new Date(r.openShift.startTime).toDateString() !== new Date(now).toDateString()
                              ? { month: 'short', day: 'numeric' }
                              : {}),
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Badge>
                      ) : (
                        <Badge>Off</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">{r.shifts}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold">{formatPeso(r.collected)}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {r.variance === undefined ? (
                        <span className="text-muted">—</span>
                      ) : Math.abs(r.variance) < 0.01 ? (
                        <span className="font-bold text-emerald-700">Balanced</span>
                      ) : (
                        <span className={`font-bold ${r.variance < 0 ? 'text-rose-700' : 'text-blue-700'}`}>
                          {r.variance < 0 ? `−${formatPeso(Math.abs(r.variance))} short` : `+${formatPeso(r.variance)} over`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <CardTitle title="How customers paid" />
          <div className="space-y-3">
            {methods.map((m) => {
              const v = summary.byMethod[m].amount;
              const pct = summary.collected ? (v / summary.collected) * 100 : 0;
              return (
                <div key={m}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-ink-soft">{METHOD_LABELS[m]}</span>
                    <span className="font-bold text-ink">{formatPeso(v)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div className="h-full bg-ink rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardTitle title={isSingleDay ? 'Money collected by hour' : 'Money collected by day'} />
          {buckets.length === 0 ? (
            <EmptyState title="No payments in this period" />
          ) : (
            <div className="flex items-end gap-2 h-44 overflow-x-auto pb-1">
              {buckets.map(([label, v]) => (
                <div key={label} className="flex flex-col items-center justify-end h-full min-w-[40px] flex-1">
                  <span className="text-xs font-bold text-ink mb-1">{formatPeso(v)}</span>
                  <div className="w-full max-w-[36px] rounded-t-lg bg-brand" style={{ height: `${Math.max(4, (v / maxBucket) * 100)}%` }} />
                  <span className="text-xs text-muted mt-1 whitespace-nowrap">{label}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle title="Best sellers" right={<Link href="/inventory" className="text-sm font-semibold text-brand hover:underline"><Package className="w-4 h-4 inline" /> Stock</Link>} />
          {bestSellers.length === 0 ? (
            <EmptyState title="No sales yet" icon={Utensils} />
          ) : (
            <ol className="space-y-2">
              {bestSellers.map((b, i) => (
                <li key={b.name} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-neutral-100 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="truncate font-semibold text-ink">{b.name}</span>
                  </span>
                  <span className="text-muted whitespace-nowrap">
                    <strong className="text-ink">{b.qty}</strong> · {formatPeso(b.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
