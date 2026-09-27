export interface MinimalShiftOrder {
  id?: string;
  orderNumber?: string;
  cashierId?: string;
  cashierName?: string;
  total?: number;
  amountPaid?: number;
  paymentMethod?: string;
  discount?: number;
  status?: string;
  createdAt: string;
}

/**
 * Strict username validation:
 * - Only letters (a-z, A-Z), numbers (0-9), and underscores (_)
 * - No spaces allowed
 * - No special symbols allowed
 * - Length between 3 and 30 characters
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || username.length === 0) {
    return { isValid: false, error: 'Username is required.' };
  }
  if (/\s/.test(username)) {
    return { isValid: false, error: 'Username cannot contain spaces. Use underscores (_) instead.' };
  }
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long.' };
  }
  if (username.length > 30) {
    return { isValid: false, error: 'Username cannot exceed 30 characters.' };
  }
  // Strictly alphanumeric + underscore
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, and underscores (no symbols or spaces).',
    };
  }
  return { isValid: true };
}

/**
 * Sanitizes input into a clean username format:
 * converts spaces and hyphens into underscores, strips symbols, and lowercases.
 */
export function sanitizeUsername(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30);
}

/**
 * Normalizes input so either a pure username (e.g. 'person1' or 'cashier1')
 * or a standard email ('cashier1@hasan.com') works seamlessly.
 */
export function normalizeStaffEmail(input: string): string {
  const trimmed = input.trim().toLowerCase().replace(/\s+/g, '');
  if (!trimmed.includes('@')) {
    return `${trimmed}@hasan.com`;
  }
  return trimmed;
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
  orders: MinimalShiftOrder[];
}) {
  const { startTime, endTime, cashierId, cashierName, openingCash = 0, orders } = params;
  const startTs = new Date(startTime).getTime();
  const endTs = endTime ? new Date(endTime).getTime() : Date.now();

  const matchingOrders = orders.filter((order) => {
    if (order.status === 'draft' || order.status === 'cancelled') return false;
    const orderTs = new Date(order.createdAt).getTime();
    if (orderTs < startTs || orderTs > endTs) return false;

    // If specific cashier filter is provided, match order cashier
    // (an order with no cashierId attached is never "this cashier's" order)
    if (cashierId && order.cashierId !== cashierId) {
      return false;
    }
    if (
      cashierName &&
      cashierName !== 'All Staff' &&
      cashierName !== 'all' &&
      order.cashierName &&
      order.cashierName.toLowerCase() !== cashierName.toLowerCase()
    ) {
      return false;
    }

    return true;
  });

  let totalOrders = 0;
  let grossSales = 0;
  let cashSales = 0;
  let cardSales = 0;
  let onlineSales = 0;
  let totalDiscount = 0;

  matchingOrders.forEach((order) => {
    totalOrders += 1;
    grossSales += Number(order.total || 0);
    totalDiscount += Number(order.discount || 0);

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
    grossSales: Math.round(grossSales * 100) / 100,
    cashSales: Math.round(cashSales * 100) / 100,
    cardSales: Math.round(cardSales * 100) / 100,
    onlineSales: Math.round(onlineSales * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    openingCash,
    expectedCash: Math.round(expectedCash * 100) / 100,
  };
}
