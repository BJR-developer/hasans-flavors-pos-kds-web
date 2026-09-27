'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth';
import {
  fetchDishesFromDB,
  updateDishInDB,
  createDishInDB,
  deleteDishFromDB,
  deleteDishesFromDB,
  updateDishesStockInDB,
  fetchOrdersFromDB,
  createOrderInDB,
  updateOrderStatusInDB,
  updateOrderPaymentInDB,
  addItemsToOrderInDB,
  updateOrderItemsInDB,
  applyDiscountToOrderInDB,
  fetchTablesFromDB,
  updateTableStatusInDB,
  transferOrderTableInDB,
  createTableInDB,
  updateTableInDB,
  deleteTableFromDB,
  releaseTableInDB,
  createCategoryInDB,
  updateCategoryInDB,
  deleteCategoryInDB,
  fetchAddonsFromDB,
  createAddonInDB,
  updateAddonInDB,
  deleteAddonInDB,
  toggleAddonStockInDB,
} from '@/lib/api';
import { fetchActiveShift } from '@/lib/shiftApi';
import { Category, Dish, Order, OrderStatus, PaymentMethod, PaymentStatus, TableSession, CartItem, AddonOption } from '@/types';

export interface PaymentCollector {
  cashierId?: string;
  cashierName?: string;
  shiftId?: string;
  role?: string;
}

// Who is taking this sale/payment right now, and in which open shift.
async function resolveCollector(): Promise<PaymentCollector> {
  const user = useAuthStore.getState().user;
  if (!user) return {};
  const shift = user.role === 'cashier' || user.role === 'owner' ? await fetchActiveShift(user.id) : null;
  return {
    cashierId: user.id,
    cashierName: user.name || user.email,
    shiftId: shift?.id,
    role: user.role,
  };
}

const NO_SHIFT_MESSAGE = 'Start your shift first (top bar → Start Shift) before taking orders or payments.';

export const QUERY_KEYS = {
  orders: ['orders'] as const,
  dishes: ['dishes'] as const,
  categories: ['categories'] as const,
  tables: ['tables'] as const,
  dailyStats: ['dailyStats'] as const,
  addons: ['addons'] as const,
};

// 1. Orders Query - 100% Live from Supabase
export function useOrders() {
  return useQuery<Order[]>({
    queryKey: QUERY_KEYS.orders,
    queryFn: async (): Promise<Order[]> => {
      try {
        const orders = await fetchOrdersFromDB();
        return orders;
      } catch (e) {
        console.error('Error fetching orders from Supabase:', e);
        return [];
      }
    },
    refetchInterval: 5000,
  });
}

// 2. Dishes Query - live from Supabase
export function useDishes() {
  return useQuery<Dish[]>({
    queryKey: QUERY_KEYS.dishes,
    queryFn: async (): Promise<Dish[]> => {
      try {
        const dishes = await fetchDishesFromDB();
        return dishes;
      } catch (e) {
        console.error('Error fetching dishes from Supabase:', e);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}


// 3. Categories Query - 100% Live from Supabase
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: QUERY_KEYS.categories,
    queryFn: async (): Promise<Category[]> => {
      try {
        const { data, error } = await supabase.from('categories').select('*').order('sort_order');
        if (!error && data && data.length > 0) {
          return data.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            icon: c.icon || 'restaurant',
            count: 0,
            imageUrl: c.image_url,
          }));
        }
      } catch (e) {
        console.error('Error fetching categories from Supabase:', e);
      }
      return [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

// 4. Tables Query - 100% Live from Supabase
export function useTableSessions() {
  return useQuery<TableSession[]>({
    queryKey: QUERY_KEYS.tables,
    queryFn: async (): Promise<TableSession[]> => {
      try {
        const tables = await fetchTablesFromDB();
        return tables;
      } catch (e) {
        console.error('Error fetching tables from Supabase:', e);
        return [];
      }
    },
    refetchInterval: 5000,
  });
}

// --- MUTATIONS (Direct Supabase Queries) ---

// Create Order
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => {
      const id = `order_${Date.now()}`;
      const now = new Date();

      // Daily sequential order number: #1, #2 ... #10, #11, #38
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      let nextSeq = 1;
      try {
        const { data: todayOrders } = await supabase
          .from('orders')
          .select('order_number')
          .gte('created_at', todayStart.toISOString());

        if (todayOrders && todayOrders.length > 0) {
          let maxSeq = 0;
          for (const o of todayOrders) {
            const match = (o.order_number || '').match(/#?(\d+)/);
            if (match) {
              const n = parseInt(match[1], 10);
              if (n > maxSeq && n < 10000) {
                maxSeq = n;
              }
            }
          }
          nextSeq = maxSeq > 0 ? maxSeq + 1 : todayOrders.length + 1;
        }
      } catch (err) {
        console.warn('Could not calculate daily order seq from DB:', err);
      }

      const orderNumber = `#${nextSeq}`;

      const collector = await resolveCollector();
      const cashierId = orderData.cashierId || collector.cashierId;
      const cashierName = orderData.cashierName || collector.cashierName;

      if (!cashierId) {
        throw new Error(
          'Could not identify the logged-in cashier for this sale. Please refresh the page and sign in again before taking payment.'
        );
      }
      if (collector.role === 'cashier' && !collector.shiftId) {
        throw new Error(NO_SHIFT_MESSAGE);
      }

      const initialPaid = Number(orderData.amountPaid || 0);
      const fullOrder: Order = {
        ...orderData,
        id,
        orderNumber,
        cashierId,
        cashierName,
        shiftId: collector.shiftId,
        paymentHistory:
          initialPaid > 0
            ? [
                {
                  id: `pay_${Date.now()}`,
                  amount: initialPaid,
                  method: orderData.paymentMethod,
                  timestamp: now.toISOString(),
                  note: 'Paid at order',
                  cashierId,
                  cashierName,
                  shiftId: collector.shiftId,
                },
              ]
            : [],
        createdAt: now.toISOString(),
      };

      return createOrderInDB(fullOrder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tables });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyStats });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dishes });
    },
  });
}

// Update Order Status (Kitchen KDS Bump / Complete / Cancel)
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, tableNumber }: { orderId: string; status: OrderStatus; tableNumber?: string }) => {
      if (status === 'completed') {
        // Completing a served order means the customer has paid: collect any balance now,
        // attributed to whoever pressed Complete and their open shift.
        const collector = await resolveCollector();
        if (collector.role === 'cashier' && !collector.shiftId) {
          throw new Error(NO_SHIFT_MESSAGE);
        }
        return updateOrderPaymentInDB(orderId, { paymentStatus: 'paid', closeOrder: true, collector });
      }
      return updateOrderStatusInDB(orderId, status, tableNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tables });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyStats });
    },
  });
}

// Update Order Payment
export function useUpdateOrderPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      paymentStatus,
      paymentMethod,
      amountPaid,
      paymentHistory,
      closeOrder,
      tax,
      total,
    }: {
      orderId: string;
      paymentStatus: PaymentStatus;
      paymentMethod?: PaymentMethod;
      amountPaid?: number;
      paymentHistory?: any[];
      cashTendered?: number;
      changeDue?: number;
      closeOrder?: boolean;
      tax?: number;
      total?: number;
    }) => {
      const collector = await resolveCollector();
      const takesMoney = paymentStatus === 'paid' || paymentStatus === 'partially_paid';
      if (takesMoney && collector.role === 'cashier' && !collector.shiftId) {
        throw new Error(NO_SHIFT_MESSAGE);
      }
      return updateOrderPaymentInDB(orderId, {
        paymentStatus,
        paymentMethod,
        amountPaid,
        paymentHistory,
        closeOrder,
        tax,
        total,
        collector,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tables });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyStats });
    },
  });
}

// Add Items to an Existing Order
export function useAddItemsToOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, items }: { orderId: string; items: CartItem[] }) => {
      return addItemsToOrderInDB(orderId, items);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyStats });
    },
  });
}

// Full Update Items for an Existing Order (add/remove/modify in POS)
export function useUpdateOrderItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, items }: { orderId: string; items: CartItem[] }) => {
      return updateOrderItemsInDB(orderId, items);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyStats });
    },
  });
}

// Apply Discount to an Existing Order
export function useApplyDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, discount }: { orderId: string; discount: number }) => {
      return applyDiscountToOrderInDB(orderId, discount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyStats });
    },
  });
}

// Toggle Kitchen Item Checklist
export function useToggleItemInKitchen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, cartItemId }: { orderId: string; cartItemId: string }) => {
      const { data: orderData } = await supabase.from('orders').select('items').eq('id', orderId).single();
      if (!orderData) return;

      const items = (orderData.items as any[]) || [];
      const updatedItems = items.map((item) => {
        if (item.cartItemId === cartItemId) {
          return { ...item, completedInKitchen: !item.completedInKitchen };
        }
        return item;
      });

      const { error } = await supabase.from('orders').update({ items: updatedItems }).eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
    },
  });
}

// Update Estimated Cooking / Delivery Minutes for an Order
export function useUpdateOrderEstimatedMinutes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, estimatedMinutes }: { orderId: string; estimatedMinutes: number }) => {
      const { error } = await supabase
        .from('orders')
        .update({
          estimated_minutes: estimatedMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
    },
  });
}

// Toggle Dish Stock (Available / Out of Stock)
export function useToggleDishStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dishId: string) => {
      const { data } = await supabase.from('dishes').select('in_stock').eq('id', dishId).single();
      const currentStock = data?.in_stock ?? true;
      return updateDishInDB(dishId, { inStock: !currentStock });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dishes });
    },
  });
}

// Update Dish Price
export function useUpdateDishPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dishId, price }: { dishId: string; price: number }) => {
      return updateDishInDB(dishId, { price });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dishes });
    },
  });
}

// Transfer / Change Table for an Active Order
export function useTransferOrderTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      fromTable,
      toTable,
    }: {
      orderId: string;
      fromTable?: string;
      toTable: string;
    }) => {
      return transferOrderTableInDB(orderId, fromTable, toTable);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tables });
    },
  });
}

// Add New Dining Table
export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tableNumber,
      capacity,
    }: {
      tableNumber: string;
      capacity?: number;
    }) => {
      return createTableInDB({ tableNumber, capacity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tables });
    },
  });
}

// Update Existing Dining Table
export function useUpdateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { tableNumber?: string; capacity?: number };
    }) => {
      return updateTableInDB(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tables });
    },
  });
}

// Delete Dining Table
export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tableNumber }: { id: string; tableNumber: string }) => {
      return deleteTableFromDB(id, tableNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tables });
    },
  });
}

// Release Dining Table (Reset to Available)
export function useReleaseTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tableNumber: string) => {
      return releaseTableInDB(tableNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tables });
    },
  });
}

// Create New Category
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      imageUrl,
      icon,
    }: {
      name: string;
      imageUrl?: string;
      icon?: string;
    }) => {
      return createCategoryInDB({ name, imageUrl, icon });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
    },
  });
}

// Update Existing Category
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; imageUrl?: string; icon?: string };
    }) => {
      return updateCategoryInDB(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dishes });
    },
  });
}

// Delete Category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return deleteCategoryInDB(id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
    },
  });
}

// 6. ADD-ONS HOOKS (100% Live from Supabase)
export function useAddons() {
  return useQuery<AddonOption[]>({
    queryKey: QUERY_KEYS.addons,
    queryFn: async (): Promise<AddonOption[]> => {
      try {
        const data = await fetchAddonsFromDB();
        return data;
      } catch (e) {
        console.error('Error fetching addons from Supabase:', e);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Create New Add-on
export function useCreateAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      price,
      imageUrl,
      inStock,
      stockQuantity,
    }: {
      name: string;
      price: number;
      imageUrl?: string;
      inStock?: boolean;
      stockQuantity?: number;
    }) => {
      return createAddonInDB({ name, price, imageUrl, inStock, stockQuantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.addons });
    },
  });
}

// Update Existing Add-on
export function useUpdateAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; price?: number; imageUrl?: string; inStock?: boolean; stockQuantity?: number };
    }) => {
      return updateAddonInDB(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.addons });
    },
  });
}

// Delete Add-on
export function useDeleteAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteAddonInDB(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.addons });
    },
  });
}

// Toggle Add-on Stock Availability
export function useToggleAddonStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, inStock }: { id: string; inStock: boolean }) => {
      return toggleAddonStockInDB(id, inStock);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.addons });
    },
  });
}

// Update Dish Stock Quantity
export function useUpdateDishStockQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dishId, quantity }: { dishId: string; quantity: number }) => {
      const stockQty = Math.max(0, quantity);
      return updateDishInDB(dishId, {
        stockQuantity: stockQty,
        inStock: stockQty > 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dishes });
    },
  });
}

// Update Add-on Stock Quantity
export function useUpdateAddonStockQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const stockQty = Math.max(0, quantity);
      return updateAddonInDB(id, {
        stockQuantity: stockQty,
        inStock: stockQty > 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.addons });
    },
  });
}

// Add New Dish
export function useAddDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dishData: Omit<Dish, 'id' | 'slug' | 'formattedPrice' | 'rating' | 'reviewCount'>) => {
      return createDishInDB(dishData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dishes });
    },
  });
}

// Update Existing Dish
export function useUpdateDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dishId, data }: { dishId: string; data: Partial<Dish> }) => {
      return updateDishInDB(dishId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dishes });
    },
  });
}

// Delete Dish
export function useDeleteDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dishId: string) => {
      return deleteDishFromDB(dishId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dishes });
    },
  });
}

// Bulk Delete Dishes
export function useBulkDeleteDishes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dishIds: string[]) => {
      return deleteDishesFromDB(dishIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dishes });
    },
  });
}

// Bulk Update Dish Stock (Mark Available / Out of Stock)
export function useBulkUpdateDishStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dishIds, inStock }: { dishIds: string[]; inStock: boolean }) => {
      return updateDishesStockInDB(dishIds, inStock);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dishes });
    },
  });
}
