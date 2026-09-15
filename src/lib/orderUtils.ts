/**
 * Order utility functions to distinguish order origin and status
 */

export interface MinimalOrderRef {
  id?: string;
  notes?: string | null;
  specialNotes?: string | null;
}

/**
 * Checks if an order was placed from the mobile app (customer mobile ordering).
 * - Mobile customer orders have IDs starting with 'ord_mob_' or 'ord_' or 'ord-'
 * - Web Cashier POS orders have IDs starting with 'order_'
 * - Any counter POS orders with notes containing 'Counter POS' are not mobile customer orders
 */
export function isMobileOrder(order?: MinimalOrderRef | null): boolean {
  if (!order || !order.id) return false;

  // Explicit mobile app prefix
  if (order.id.startsWith('ord_mob_')) return true;

  // Web Cashier POS orders use 'order_' prefix
  if (order.id.startsWith('order_')) return false;

  // Orders created at staff counter POS
  const notes = order.notes || order.specialNotes || '';
  if (notes.includes('Counter POS')) return false;

  // Standard mobile app orders prefix ('ord_' or 'ord-')
  if (order.id.startsWith('ord_') || order.id.startsWith('ord-')) return true;

  return false;
}
