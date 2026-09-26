/**
 * Order utility functions to distinguish order origin, delivery address, and cooking notes
 */

export interface MinimalOrderRef {
  id?: string | number;
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
  if (!order || order.id === undefined || order.id === null) return false;
  const idStr = String(order.id);

  // Explicit mobile app prefix
  if (idStr.startsWith('ord_mob_')) return true;

  // Web Cashier POS orders use 'order_' prefix
  if (idStr.startsWith('order_')) return false;

  // Orders created at staff counter POS
  const notes = order.notes || order.specialNotes || '';
  if (notes.includes('Counter POS')) return false;

  // Standard mobile app orders prefix ('ord_' or 'ord-')
  if (idStr.startsWith('ord_') || idStr.startsWith('ord-')) return true;

  return false;
}

/**
 * Checks if an order is an unapproved mobile cash order that requires KDS approval.
 */
export function isCashOrderPendingReview(order?: {
  id?: string | number;
  notes?: string | null;
  specialNotes?: string | null;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
} | null): boolean {
  if (!order) return false;
  if (!isMobileOrder(order)) return false;
  const isCash = order.paymentMethod === 'cash';
  const isUnpaid = order.paymentStatus !== 'paid';
  const isPending = order.status === 'pending' || order.status === 'sent_to_kitchen';
  return isCash && isUnpaid && isPending;
}

/**
 * Formats delivery address and customer cooking instructions into the Supabase notes column.
 */
export function formatOrderNotes(deliveryAddress?: string, specialNotes?: string, type?: string): string | null {
  const addr = (deliveryAddress || '').trim();
  const notes = (specialNotes || '').trim();

  if (type === 'delivery') {
    if (addr && notes) {
      return `Address: ${addr} | Note: ${notes}`;
    }
    if (addr) {
      return `Address: ${addr}`;
    }
    if (notes) {
      return `Note: ${notes}`;
    }
    return null;
  }

  return notes || null;
}

/**
 * Parses raw notes from Supabase back into separate deliveryAddress and specialNotes.
 */
export function parseOrderNotes(rawNotes: string | null | undefined, type?: string): {
  deliveryAddress?: string;
  specialNotes?: string;
} {
  if (!rawNotes) return { deliveryAddress: undefined, specialNotes: undefined };
  const str = String(rawNotes).trim();
  if (!str) return { deliveryAddress: undefined, specialNotes: undefined };

  let deliveryAddress: string | undefined = undefined;
  let specialNotes: string | undefined = undefined;

  // Structured multi-field format
  if (str.includes('Address:') || str.includes('Note:')) {
    const addrMatch = str.match(/Address:\s*([^|]+)/i);
    const noteMatch = str.match(/Note:\s*([^|]+)/i);

    if (addrMatch) deliveryAddress = addrMatch[1].trim();
    if (noteMatch) specialNotes = noteMatch[1].trim();

    if (!deliveryAddress && type === 'delivery') {
      deliveryAddress = str.replace(/Note:\s*[^|]+/i, '').replace(/[|]/g, '').trim() || undefined;
    }
  } else if (type === 'delivery') {
    // If delivery type and no prefix, entire string is delivery address
    deliveryAddress = str;
  } else {
    // If dine-in or takeout, entire string is special cooking instruction
    specialNotes = str;
  }

  return { deliveryAddress, specialNotes };
}
