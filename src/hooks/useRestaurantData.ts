'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStoredOrders,
  getStoredDishes,
  getTableSessions,
  getDailyStats,
  createOrder as apiCreateOrder,
  updateOrderStatus as apiUpdateOrderStatus,
  updateOrderPayment as apiUpdateOrderPayment,
  toggleDishStock as apiToggleDishStock,
  toggleItemInKitchen as apiToggleItemInKitchen,
  updateDishPrice as apiUpdateDishPrice,
  addDish as apiAddDish,
  updateDish as apiUpdateDish,
  deleteDish as apiDeleteDish,
  resetStoreData as apiResetStoreData,
} from '@/lib/store';
import categoriesData from '@/data/categories.json';
import { Category, Dish, Order, OrderStatus, PaymentMethod, PaymentStatus } from '@/types';

export const QUERY_KEYS = {
  orders: ['orders'] as const,
  dishes: ['dishes'] as const,
  categories: ['categories'] as const,
  tables: ['tables'] as const,
  dailyStats: ['dailyStats'] as const,
};

// 1. Orders Query
export function useOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.orders,
    queryFn: async (): Promise<Order[]> => {
      return getStoredOrders();
    },
    refetchInterval: 3000, // Background poll every 3 seconds for live kitchen updates
  });
}

// 2. Dishes Query
export function useDishes() {
  return useQuery({
    queryKey: QUERY_KEYS.dishes,
    queryFn: async (): Promise<Dish[]> => {
      return getStoredDishes();
    },
  });
}

// 3. Categories Query
export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: async (): Promise<Category[]> => {
      return categoriesData as Category[];
    },
  });
}

// 4. Tables Sessions Query
export function useTableSessions() {
  return useQuery({
    queryKey: QUERY_KEYS.tables,
    queryFn: async () => {
      return getTableSessions();
    },
    refetchInterval: 5000,
  });
}

// 5. Daily Stats Query
export function useDailyStats() {
  return useQuery({
    queryKey: QUERY_KEYS.dailyStats,
    queryFn: async () => {
      return getDailyStats();
    },
    refetchInterval: 5000,
  });
}

// --- MUTATIONS ---

// Create Order
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => {
      return apiCreateOrder(orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tables });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyStats });
    },
  });
}

// Update Order Status (Kitchen / Fulfillment)
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      return apiUpdateOrderStatus(orderId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tables });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyStats });
    },
  });
}

// Update Payment Status
export function useUpdateOrderPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      paymentStatus,
      paymentMethod,
      cashTendered,
      changeDue,
    }: {
      orderId: string;
      paymentStatus: PaymentStatus;
      paymentMethod?: PaymentMethod;
      cashTendered?: number;
      changeDue?: number;
    }) => {
      return apiUpdateOrderPayment(orderId, paymentStatus, paymentMethod, cashTendered, changeDue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tables });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyStats });
    },
  });
}

// Toggle Item in Kitchen checklist
export function useToggleItemInKitchen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, cartItemId }: { orderId: string; cartItemId: string }) => {
      return apiToggleItemInKitchen(orderId, cartItemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });
    },
  });
}

// Toggle Dish Stock (86 Out of Stock)
export function useToggleDishStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dishId: string) => {
      return apiToggleDishStock(dishId);
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
      return apiUpdateDishPrice(dishId, price);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dishes });
    },
  });
}

// Add New Dish
export function useAddDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dishData: Omit<Dish, 'id' | 'slug' | 'formattedPrice' | 'rating' | 'reviewCount'>) => {
      return apiAddDish(dishData);
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
      return apiUpdateDish(dishId, data);
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
      return apiDeleteDish(dishId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dishes });
    },
  });
}

// Reset Demo Data
export function useResetStoreData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiResetStoreData();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
