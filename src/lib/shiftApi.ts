import { supabase } from './supabase';
import { Shift, Order } from '@/types';

export const mapShiftFromDB = (row: any): Shift => ({
  id: row.id,
  cashierId: row.cashier_id || undefined,
  cashierName: row.cashier_name || 'Staff Member',
  startTime: row.start_time,
  endTime: row.end_time || undefined,
  openingCash: Number(row.opening_cash || 0),
  closingCash: row.closing_cash !== null && row.closing_cash !== undefined ? Number(row.closing_cash) : undefined,
  expectedCash: Number(row.expected_cash || 0),
  cashDifference: Number(row.cash_difference || 0),
  totalOrders: Number(row.total_orders || 0),
  totalItemsSold: Number(row.total_items_sold || 0),
  grossSales: Number(row.gross_sales || 0),
  cashSales: Number(row.cash_sales || 0),
  cardSales: Number(row.card_sales || 0),
  onlineSales: Number(row.online_sales || 0),
  totalDiscount: Number(row.total_discount || 0),
  status: row.status as 'open' | 'closed',
  notes: row.notes || undefined,
  initialFloatEdits: Array.isArray(row.initial_float_edits) ? row.initial_float_edits : [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Fetch all shifts recorded in the system, sorted newest to oldest.
 */
export async function fetchShifts(): Promise<Shift[]> {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching shifts:', error);
    throw error;
  }

  return (data || []).map(mapShiftFromDB);
}

/**
 * Fetch the currently active open shift for a cashier or the register.
 */
export async function fetchActiveShift(cashierId?: string): Promise<Shift | null> {
  let query = supabase
    .from('shifts')
    .select('*')
    .eq('status', 'open')
    .order('start_time', { ascending: false })
    .limit(1);

  if (cashierId) {
    query = query.eq('cashier_id', cashierId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching active shift:', error);
    return null;
  }

  if (data && data.length > 0) {
    return mapShiftFromDB(data[0]);
  }
  return null;
}

/**
 * Start/open a new cashier shift with starting cash float.
 */
export async function startShift(params: {
  cashierId?: string;
  cashierName: string;
  openingCash: number;
}): Promise<Shift> {
  const payload = {
    cashier_id: params.cashierId || null,
    cashier_name: params.cashierName.trim() || 'Staff Cashier',
    opening_cash: params.openingCash || 0,
    start_time: new Date().toISOString(),
    status: 'open',
  };

  const { data, error } = await supabase
    .from('shifts')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error starting shift:', error);
    throw error;
  }

  return mapShiftFromDB(data);
}

/**
 * Calculate live shift metrics based on orders placed during a time window.
 */
export function calculateShiftMetrics(params: {
  startTime: string;
  endTime?: string;
  cashierId?: string;
  cashierName?: string;
  openingCash?: number;
  orders: Order[];
}) {
  const { startTime, endTime, cashierId, cashierName, openingCash = 0, orders } = params;
  const startTs = new Date(startTime).getTime();
  const endTs = endTime ? new Date(endTime).getTime() : Date.now();

  const matchingOrders = orders.filter((order) => {
    if (order.status === 'draft' || order.status === 'cancelled') return false;
    const orderTs = new Date(order.createdAt).getTime();
    if (orderTs < startTs || orderTs > endTs) return false;

    // If specific cashier filter is provided, match order cashier
    if (cashierId && order.cashierId && order.cashierId !== cashierId) {
      return false;
    }
    if (cashierName && cashierName !== 'All Staff' && order.cashierName && order.cashierName.toLowerCase() !== cashierName.toLowerCase()) {
      return false;
    }

    return true;
  });

  let totalOrders = 0;
  let totalItemsSold = 0;
  let grossSales = 0;
  let cashSales = 0;
  let cardSales = 0;
  let onlineSales = 0;
  let totalDiscount = 0;

  matchingOrders.forEach((order) => {
    totalOrders += 1;
    grossSales += Number(order.total || 0);
    totalDiscount += Number(order.discount || 0);

    // Count individual items/products sold in this order
    (order.items || []).forEach((item) => {
      totalItemsSold += Number(item.quantity || 1);
    });

    const method = (order.paymentMethod || '').toLowerCase();
    const paid = Number(order.amountPaid || order.total || 0);

    if (method === 'cash') {
      cashSales += paid;
    } else if (method === 'card') {
      cardSales += paid;
    } else {
      onlineSales += paid;
    }
  });

  const expectedCash = openingCash + cashSales;

  return {
    matchingOrders,
    totalOrders,
    totalItemsSold,
    grossSales: Math.round(grossSales * 100) / 100,
    cashSales: Math.round(cashSales * 100) / 100,
    cardSales: Math.round(cardSales * 100) / 100,
    onlineSales: Math.round(onlineSales * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    openingCash,
    expectedCash: Math.round(expectedCash * 100) / 100,
  };
}

/**
 * Close/end an open shift with final cash drawer count and calculations.
 */
export async function closeShift(params: {
  shiftId: string;
  closingCash: number;
  expectedCash: number;
  cashDifference: number;
  totalOrders: number;
  totalItemsSold?: number;
  grossSales: number;
  cashSales: number;
  cardSales: number;
  onlineSales: number;
  totalDiscount: number;
  notes?: string;
}): Promise<Shift> {
  const payload = {
    end_time: new Date().toISOString(),
    status: 'closed',
    closing_cash: params.closingCash,
    expected_cash: params.expectedCash,
    cash_difference: params.cashDifference,
    total_orders: params.totalOrders,
    total_items_sold: params.totalItemsSold || 0,
    gross_sales: params.grossSales,
    cash_sales: params.cashSales,
    card_sales: params.cardSales,
    online_sales: params.onlineSales,
    total_discount: params.totalDiscount,
    notes: params.notes || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('shifts')
    .update(payload)
    .eq('id', params.shiftId)
    .select()
    .single();

  if (error) {
    console.error('Error closing shift:', error);
    throw error;
  }

  return mapShiftFromDB(data);
}

/**
 * Update the initial drawer / opening cash for a shift, with audit logging.
 */
export async function updateShiftOpeningCash(params: {
  shiftId: string;
  newOpeningCash: number;
  changedBy: string;
  reason?: string;
}): Promise<Shift> {
  const { data: existing } = await supabase
    .from('shifts')
    .select('opening_cash, initial_float_edits')
    .eq('id', params.shiftId)
    .single();

  const prev = Number(existing?.opening_cash || 0);
  const edits = Array.isArray(existing?.initial_float_edits) ? [...existing.initial_float_edits] : [];
  edits.push({
    previousAmount: prev,
    newAmount: params.newOpeningCash,
    changedBy: params.changedBy,
    changedAt: new Date().toISOString(),
    reason: params.reason || 'Manual drawer adjustment',
  });

  const { data, error } = await supabase
    .from('shifts')
    .update({
      opening_cash: params.newOpeningCash,
      initial_float_edits: edits,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.shiftId)
    .select()
    .single();

  if (error) {
    console.error('Error updating shift initial drawer:', error);
    throw error;
  }

  return mapShiftFromDB(data);
}
