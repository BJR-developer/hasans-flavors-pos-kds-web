import { supabase } from './supabase';
import { Shift } from '@/types';

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
  reviewStatus: row.review_status || 'pending',
  reviewNote: row.review_note || undefined,
  reviewedBy: row.reviewed_by || undefined,
  reviewedAt: row.reviewed_at || undefined,
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
  if (!cashierId) return null;
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('status', 'open')
    .eq('cashier_id', cashierId)
    .order('start_time', { ascending: false })
    .limit(1);
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
  closedBy?: string;
}): Promise<Shift> {
  const payload = {
    closed_by: params.closedBy || null,
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

/**
 * Owner review of a closed shift handover.
 */
export async function reviewShift(params: {
  shiftId: string;
  status: 'approved' | 'flagged' | 'pending';
  note?: string;
  reviewerId: string;
}): Promise<Shift> {
  const { data, error } = await supabase
    .from('shifts')
    .update({
      review_status: params.status,
      review_note: params.note?.trim() || null,
      reviewed_by: params.reviewerId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.shiftId)
    .select()
    .single();

  if (error) throw error;
  return mapShiftFromDB(data);
}
