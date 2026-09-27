import { Order, PaymentMethod, Shift } from '@/types';

// Single source of truth for every money number shown in the app.
//   Sales      = money actually collected (payments), counted when and by whom it was collected.
//   Open       = balance still owed on live orders (not yet collected).
//   Drawer     = shift opening float + cash that shift's cashier collected during the shift.

export type MoneyMethod = PaymentMethod | 'other';

export interface CollectedPayment {
  id: string;
  orderId: string;
  orderNumber: string;
  orderType: Order['type'];
  customerName: string;
  amount: number;
  method: MoneyMethod;
  timestamp: string;
  cashierId?: string;
  cashierName?: string;
  shiftId?: string;
  isMobileOrder: boolean;
}

export interface MethodTotals {
  amount: number;
  count: number;
}

export interface MoneySummary {
  collected: number;
  paymentCount: number;
  orderCount: number;
  byMethod: Record<MoneyMethod, MethodTotals>;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const formatPeso = (n: number) =>
  `₱${round2(n).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

export function normalizeMethod(method?: string): MoneyMethod {
  const m = (method || '').toLowerCase();
  if (m === 'cash' || m === 'gcash' || m === 'card') return m;
  if (m === 'inr_qr' || m === 'inr' || m === 'upi') return 'inr_qr';
  return 'other';
}

export const METHOD_LABELS: Record<MoneyMethod, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  card: 'Card',
  inr_qr: 'INR / QR',
  other: 'Other',
};

export function isCountableOrder(o: Order): boolean {
  return o.status !== 'draft' && o.status !== 'cancelled';
}

function isMobileOrderId(id: string): boolean {
  return id.startsWith('ord_mob_') || id.startsWith('ord_') || id.startsWith('ord-');
}

/**
 * Every payment actually received for an order. Uses payment_history when present;
 * money recorded on the order but missing from history (older records) is added as one
 * entry attributed to the order's cashier.
 */
export function paymentsFromOrder(o: Order): CollectedPayment[] {
  if (!isCountableOrder(o)) return [];
  const amountPaid = Number(o.amountPaid || 0);
  if (amountPaid <= 0) return [];

  const base = {
    orderId: o.id,
    orderNumber: o.orderNumber,
    orderType: o.type,
    customerName: o.customerName,
    isMobileOrder: !o.id.startsWith('order_') && isMobileOrderId(o.id),
  };

  const history = (o.paymentHistory || []).filter((p) => Number(p.amount) > 0);
  const historyTotal = history.reduce((s, p) => s + Number(p.amount), 0);

  if (history.length === 0 || historyTotal > amountPaid + 0.5) {
    return [
      {
        ...base,
        id: `${o.id}_paid`,
        amount: amountPaid,
        method: normalizeMethod(history[0]?.method || o.paymentMethod),
        timestamp: history[history.length - 1]?.timestamp || o.createdAt,
        cashierId: history[0]?.cashierId || o.cashierId,
        cashierName: history[0]?.cashierName || o.cashierName,
        shiftId: history[0]?.shiftId || o.shiftId,
      },
    ];
  }

  const payments: CollectedPayment[] = history.map((p, i) => ({
    ...base,
    id: p.id || `${o.id}_${i}`,
    amount: Number(p.amount),
    method: normalizeMethod(p.method || o.paymentMethod),
    timestamp: p.timestamp || o.createdAt,
    cashierId: p.cashierId || o.cashierId,
    cashierName: p.cashierName || o.cashierName,
    shiftId: p.shiftId || o.shiftId,
  }));

  const remainder = round2(amountPaid - historyTotal);
  if (remainder > 0.5) {
    payments.push({
      ...base,
      id: `${o.id}_remainder`,
      amount: remainder,
      method: normalizeMethod(o.paymentMethod),
      timestamp: o.updatedAt || o.createdAt,
      cashierId: o.cashierId,
      cashierName: o.cashierName,
      shiftId: o.shiftId,
    });
  }
  return payments;
}

export function collectPayments(orders: Order[]): CollectedPayment[] {
  return orders.flatMap(paymentsFromOrder);
}

export function filterPayments(
  payments: CollectedPayment[],
  opts: { from?: number; to?: number; cashierId?: string }
): CollectedPayment[] {
  return payments.filter((p) => {
    const ts = new Date(p.timestamp).getTime();
    if (opts.from !== undefined && ts < opts.from) return false;
    if (opts.to !== undefined && ts > opts.to) return false;
    if (opts.cashierId && p.cashierId !== opts.cashierId) return false;
    return true;
  });
}

export function summarizePayments(payments: CollectedPayment[]): MoneySummary {
  const byMethod: Record<MoneyMethod, MethodTotals> = {
    cash: { amount: 0, count: 0 },
    gcash: { amount: 0, count: 0 },
    card: { amount: 0, count: 0 },
    inr_qr: { amount: 0, count: 0 },
    other: { amount: 0, count: 0 },
  };
  let collected = 0;
  const orderIds = new Set<string>();
  for (const p of payments) {
    collected += p.amount;
    byMethod[p.method].amount += p.amount;
    byMethod[p.method].count += 1;
    orderIds.add(p.orderId);
  }
  for (const k of Object.keys(byMethod) as MoneyMethod[]) {
    byMethod[k].amount = round2(byMethod[k].amount);
  }
  return {
    collected: round2(collected),
    paymentCount: payments.length,
    orderCount: orderIds.size,
    byMethod,
  };
}

/** Payments that belong to a shift: tagged with its id, or (older data) collected by its cashier during its window. */
export function paymentsForShift(shift: Shift, payments: CollectedPayment[]): CollectedPayment[] {
  const start = new Date(shift.startTime).getTime();
  const end = shift.endTime ? new Date(shift.endTime).getTime() : Date.now();
  return payments.filter((p) => {
    if (p.shiftId) return p.shiftId === shift.id;
    if (!shift.cashierId || p.cashierId !== shift.cashierId) return false;
    const ts = new Date(p.timestamp).getTime();
    return ts >= start && ts <= end;
  });
}

export interface ShiftMoney {
  summary: MoneySummary;
  openingCash: number;
  cashCollected: number;
  digitalCollected: number;
  expectedCash: number;
  countedCash?: number;
  variance?: number;
}

export function shiftMoney(shift: Shift, allPayments: CollectedPayment[]): ShiftMoney {
  const summary = summarizePayments(paymentsForShift(shift, allPayments));
  const cashCollected = summary.byMethod.cash.amount;
  const expectedCash = round2(shift.openingCash + cashCollected);
  const isClosed = shift.status === 'closed' && shift.closingCash !== undefined;
  return {
    summary,
    openingCash: shift.openingCash,
    cashCollected,
    digitalCollected: round2(summary.collected - cashCollected),
    expectedCash,
    countedCash: isClosed ? shift.closingCash : undefined,
    variance: isClosed ? round2((shift.closingCash || 0) - expectedCash) : undefined,
  };
}

export interface OpenBalance {
  amount: number;
  count: number;
  orders: Order[];
}

/** Live orders that still have money owed. */
export function openBalances(orders: Order[]): OpenBalance {
  const open = orders.filter(
    (o) => isCountableOrder(o) && Number(o.total || 0) - Number(o.amountPaid || 0) > 0.5
  );
  return {
    amount: round2(open.reduce((s, o) => s + (Number(o.total || 0) - Number(o.amountPaid || 0)), 0)),
    count: open.length,
    orders: open,
  };
}

export function itemsSold(orders: Order[]): number {
  return orders.reduce(
    (sum, o) => sum + (o.items || []).reduce((q, it) => q + Number(it.quantity || 1), 0),
    0
  );
}

export function startOfLocalDay(d = new Date()): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function endOfLocalDay(d = new Date()): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
}
