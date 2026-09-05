import { Dish, Order, OrderStatus, PaymentMethod, PaymentStatus, TableSession, DailyStats } from '@/types';
import menuData from '@/data/menu.json';
import { INITIAL_ORDERS } from '@/data/mockOrders';
import { TABLES } from '@/data/options';
import { playOrderChime } from './audio';

const STORAGE_KEY_ORDERS = 'hasan_pos_orders_v1';
const STORAGE_KEY_DISHES = 'hasan_pos_dishes_v1';

// In-memory cache fallback for SSR and hydration
let cachedOrders: Order[] = [...INITIAL_ORDERS];
let cachedDishes: Dish[] = menuData as Dish[];

function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Load orders from localStorage or fallback
 */
export function getStoredOrders(): Order[] {
  if (!isClient()) return cachedOrders;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (raw) {
      cachedOrders = JSON.parse(raw);
      return cachedOrders;
    }
  } catch (err) {
    console.warn('Error reading orders from localStorage', err);
  }
  // Initialize with initial orders
  setStoredOrders(INITIAL_ORDERS);
  return INITIAL_ORDERS;
}

/**
 * Save orders to localStorage and memory
 */
export function setStoredOrders(orders: Order[]): void {
  cachedOrders = orders;
  if (!isClient()) return;
  try {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  } catch (err) {
    console.error('Error saving orders to localStorage', err);
  }
}

/**
 * Create a new order (from POS or Table)
 */
export function createOrder(data: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): Order {
  const currentOrders = getStoredOrders();
  const nextNumber = 8820 + currentOrders.length + 1;
  const newOrder: Order = {
    ...data,
    id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    orderNumber: `#HF-${nextNumber}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [newOrder, ...currentOrders];
  setStoredOrders(updated);

  // Play audio chime for new kitchen ticket
  playOrderChime();

  return newOrder;
}

/**
 * Update order kitchen status
 */
export function updateOrderStatus(orderId: string, status: OrderStatus): Order | null {
  const current = getStoredOrders();
  let updatedOrder: Order | null = null;

  const nextOrders = current.map((o) => {
    if (o.id === orderId) {
      updatedOrder = { ...o, status };
      return updatedOrder;
    }
    return o;
  });

  if (updatedOrder) {
    setStoredOrders(nextOrders);
  }
  return updatedOrder;
}

/**
 * Update order payment status
 */
export function updateOrderPayment(
  orderId: string,
  paymentStatus: PaymentStatus,
  paymentMethod?: PaymentMethod,
  cashTendered?: number,
  changeDue?: number
): Order | null {
  const current = getStoredOrders();
  let updatedOrder: Order | null = null;

  const nextOrders = current.map((o) => {
    if (o.id === orderId) {
      updatedOrder = {
        ...o,
        paymentStatus,
        paymentMethod: paymentMethod || o.paymentMethod,
        cashTendered: cashTendered !== undefined ? cashTendered : o.cashTendered,
        changeDue: changeDue !== undefined ? changeDue : o.changeDue,
      };
      return updatedOrder;
    }
    return o;
  });

  if (updatedOrder) {
    setStoredOrders(nextOrders);
  }
  return updatedOrder;
}

/**
 * Toggle individual item completion in kitchen display
 */
export function toggleItemInKitchen(orderId: string, cartItemId: string): Order | null {
  const current = getStoredOrders();
  let updatedOrder: Order | null = null;

  const nextOrders = current.map((o) => {
    if (o.id === orderId) {
      const nextItems = o.items.map((it) => {
        if (it.cartItemId === cartItemId) {
          return { ...it, completedInKitchen: !it.completedInKitchen };
        }
        return it;
      });
      updatedOrder = { ...o, items: nextItems };
      return updatedOrder;
    }
    return o;
  });

  if (updatedOrder) {
    setStoredOrders(nextOrders);
  }
  return updatedOrder;
}

/**
 * Get all dishes with inventory stock status
 */
export function getStoredDishes(): Dish[] {
  if (!isClient()) return cachedDishes;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISHES);
    if (raw) {
      cachedDishes = JSON.parse(raw);
      return cachedDishes;
    }
  } catch (err) {
    console.warn('Error reading dishes from localStorage', err);
  }
  setStoredDishes(menuData as Dish[]);
  return menuData as Dish[];
}

export function setStoredDishes(dishes: Dish[]): void {
  cachedDishes = dishes;
  if (!isClient()) return;
  try {
    localStorage.setItem(STORAGE_KEY_DISHES, JSON.stringify(dishes));
  } catch (err) {
    console.error('Error saving dishes to localStorage', err);
  }
}

/**
 * Toggle dish stock (86 item)
 */
export function toggleDishStock(dishId: string): Dish[] {
  const dishes = getStoredDishes();
  const updated = dishes.map((d) => (d.id === dishId ? { ...d, inStock: !d.inStock } : d));
  setStoredDishes(updated);
  return updated;
}

/**
 * Update dish price
 */
export function updateDishPrice(dishId: string, newPrice: number): Dish[] {
  const dishes = getStoredDishes();
  const updated = dishes.map((d) =>
    d.id === dishId ? { ...d, price: newPrice, formattedPrice: `₱${newPrice.toLocaleString()}` } : d
  );
  setStoredDishes(updated);
  return updated;
}

/**
 * Get active tables
 */
export function getTableSessions(): TableSession[] {
  const orders = getStoredOrders();
  const activeOrders = orders.filter((o) => o.type === 'dine_in' && o.status !== 'completed' && o.status !== 'cancelled');

  return TABLES.map((tableName) => {
    const activeOrder = activeOrders.find((o) => o.tableNumber === tableName);
    if (activeOrder) {
      return {
        tableNumber: tableName,
        guestCount: 2,
        status: activeOrder.paymentStatus === 'unpaid' ? 'occupied' : 'billing',
        activeOrderId: activeOrder.id,
        joinedAt: activeOrder.createdAt,
      };
    }
    return {
      tableNumber: tableName,
      guestCount: 0,
      status: 'available',
    };
  });
}

/**
 * Calculate live daily statistics
 */
export function getDailyStats(): DailyStats {
  const orders = getStoredOrders();
  const todayRevenue = orders
    .filter((o) => o.paymentStatus === 'paid' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const activeTables = getTableSessions().filter((t) => t.status !== 'available').length;

  // Aggregate top selling items
  const itemMap: Record<string, { name: string; sold: number; revenue: number }> = {};
  orders.forEach((o) => {
    if (o.status === 'cancelled') return;
    o.items.forEach((item) => {
      const key = item.dish.name;
      if (!itemMap[key]) {
        itemMap[key] = { name: key, sold: 0, revenue: 0 };
      }
      itemMap[key].sold += item.quantity;
      itemMap[key].revenue += item.totalPrice;
    });
  });

  const topSellingItems = Object.values(itemMap)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  return {
    todayRevenue,
    orderCount: orders.length,
    activeTables,
    avgPrepTimeMinutes: 18,
    topSellingItems,
  };
}

/**
 * Reset store to mock defaults
 */
export function resetStoreData(): void {
  setStoredOrders(INITIAL_ORDERS);
  setStoredDishes(menuData as Dish[]);
}
